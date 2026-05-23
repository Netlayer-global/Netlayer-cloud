package resources

import (
	"context"
	"fmt"
	"time"

	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/planmodifier"
	"github.com/hashicorp/terraform-plugin-framework/resource/schema/stringplanmodifier"
	"github.com/hashicorp/terraform-plugin-framework/types"

	"github.com/netlayer-global/terraform-provider-netlayer/internal/provider"
)

// NewServerResource returns the netlayer_server resource. The provider
// registers it in provider.go::Resources().
func NewServerResource() resource.Resource {
	return &serverResource{}
}

type serverResource struct {
	client *provider.Client
}

type serverResourceModel struct {
	ID           types.String `tfsdk:"id"`
	Name         types.String `tfsdk:"name"`
	PlanID       types.String `tfsdk:"plan_id"`
	RegionID     types.String `tfsdk:"region_id"`
	OsTemplateID types.String `tfsdk:"os_template_id"`
	SSHKeyID     types.String `tfsdk:"ssh_key_id"`
	IPv4         types.String `tfsdk:"ipv4"`
	IPv6         types.String `tfsdk:"ipv6"`
	Hostname     types.String `tfsdk:"hostname"`
	Status       types.String `tfsdk:"status"`
}

type serverPayload struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Hostname   string  `json:"hostname"`
	IPv4       *string `json:"ipv4"`
	IPv6       *string `json:"ipv6"`
	Status     string  `json:"status"`
}

func (r *serverResource) Metadata(_ context.Context, req resource.MetadataRequest, resp *resource.MetadataResponse) {
	resp.TypeName = req.ProviderTypeName + "_server"
}

func (r *serverResource) Schema(_ context.Context, _ resource.SchemaRequest, resp *resource.SchemaResponse) {
	resp.Schema = schema.Schema{
		Description: "A NetLayer Cloud VPS — provisioned via the deploy workflow.",
		Attributes: map[string]schema.Attribute{
			"id": schema.StringAttribute{
				Computed:      true,
				PlanModifiers: []planmodifier.String{stringplanmodifier.UseStateForUnknown()},
			},
			"name":           schema.StringAttribute{Required: true},
			"plan_id":        schema.StringAttribute{Required: true},
			"region_id":      schema.StringAttribute{Required: true},
			"os_template_id": schema.StringAttribute{Required: true},
			"ssh_key_id":     schema.StringAttribute{Optional: true},
			"ipv4":           schema.StringAttribute{Computed: true},
			"ipv6":           schema.StringAttribute{Computed: true},
			"hostname":       schema.StringAttribute{Computed: true},
			"status":         schema.StringAttribute{Computed: true},
		},
	}
}

func (r *serverResource) Configure(_ context.Context, req resource.ConfigureRequest, resp *resource.ConfigureResponse) {
	if req.ProviderData == nil {
		return
	}
	c, ok := req.ProviderData.(*provider.Client)
	if !ok {
		resp.Diagnostics.AddError("provider data type mismatch", "expected *provider.Client")
		return
	}
	r.client = c
}

func (r *serverResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
	var plan serverResourceModel
	resp.Diagnostics.Append(req.Plan.Get(ctx, &plan)...)
	if resp.Diagnostics.HasError() {
		return
	}

	body := map[string]any{
		"name":         plan.Name.ValueString(),
		"planId":       plan.PlanID.ValueString(),
		"regionId":     plan.RegionID.ValueString(),
		"osTemplateId": plan.OsTemplateID.ValueString(),
	}
	if !plan.SSHKeyID.IsNull() && plan.SSHKeyID.ValueString() != "" {
		body["sshKeyId"] = plan.SSHKeyID.ValueString()
	}

	var created serverPayload
	if err := r.client.Do("POST", "/servers", body, &created); err != nil {
		resp.Diagnostics.AddError("create server", err.Error())
		return
	}

	// Poll until provisioned (or 5 min timeout).
	ctxDeadline, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	final, err := r.waitForReady(ctxDeadline, created.ID)
	if err != nil {
		resp.Diagnostics.AddError("server provision timeout", err.Error())
		return
	}

	plan.ID = types.StringValue(final.ID)
	plan.Hostname = types.StringValue(final.Hostname)
	plan.Status = types.StringValue(final.Status)
	plan.IPv4 = stringOrNull(final.IPv4)
	plan.IPv6 = stringOrNull(final.IPv6)

	resp.Diagnostics.Append(resp.State.Set(ctx, plan)...)
}

func (r *serverResource) Read(ctx context.Context, req resource.ReadRequest, resp *resource.ReadResponse) {
	var state serverResourceModel
	resp.Diagnostics.Append(req.State.Get(ctx, &state)...)
	if resp.Diagnostics.HasError() {
		return
	}

	var s serverPayload
	if err := r.client.Do("GET", fmt.Sprintf("/servers/%s", state.ID.ValueString()), nil, &s); err != nil {
		resp.Diagnostics.AddError("read server", err.Error())
		return
	}

	state.Hostname = types.StringValue(s.Hostname)
	state.Status = types.StringValue(s.Status)
	state.IPv4 = stringOrNull(s.IPv4)
	state.IPv6 = stringOrNull(s.IPv6)
	resp.Diagnostics.Append(resp.State.Set(ctx, state)...)
}

func (r *serverResource) Update(_ context.Context, _ resource.UpdateRequest, resp *resource.UpdateResponse) {
	// Round-10 scope: server in-place updates aren't supported. Add `Update` semantics
	// (rename/resize) once the backend exposes them.
	resp.Diagnostics.AddError("update not supported", "Updating an existing server is not yet supported. Recreate the resource.")
}

func (r *serverResource) Delete(_ context.Context, req resource.DeleteRequest, resp *resource.DeleteResponse) {
	var state serverResourceModel
	resp.Diagnostics.Append(req.State.Get(context.Background(), &state)...)
	if resp.Diagnostics.HasError() {
		return
	}
	if err := r.client.Do("DELETE", fmt.Sprintf("/servers/%s", state.ID.ValueString()), nil, nil); err != nil {
		resp.Diagnostics.AddError("delete server", err.Error())
	}
}

func (r *serverResource) waitForReady(ctx context.Context, id string) (*serverPayload, error) {
	for {
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("timed out waiting for server %s", id)
		case <-time.After(5 * time.Second):
		}
		var s serverPayload
		if err := r.client.Do("GET", fmt.Sprintf("/servers/%s", id), nil, &s); err != nil {
			return nil, err
		}
		if s.Status == "RUNNING" {
			return &s, nil
		}
		if s.Status == "ERROR" {
			return nil, fmt.Errorf("server %s entered ERROR state", id)
		}
	}
}

func stringOrNull(s *string) types.String {
	if s == nil {
		return types.StringNull()
	}
	return types.StringValue(*s)
}
