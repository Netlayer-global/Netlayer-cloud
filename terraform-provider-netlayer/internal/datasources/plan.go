package datasources

import (
	"context"
	"fmt"

	"github.com/hashicorp/terraform-plugin-framework/datasource"
	"github.com/hashicorp/terraform-plugin-framework/datasource/schema"
	"github.com/hashicorp/terraform-plugin-framework/types"

	"github.com/netlayer-global/terraform-provider-netlayer/internal/provider"
)

func NewPlanDataSource() datasource.DataSource {
	return &planDataSource{}
}

type planDataSource struct {
	client *provider.Client
}

type planModel struct {
	ID           types.String  `tfsdk:"id"`
	Slug         types.String  `tfsdk:"slug"`
	Name         types.String  `tfsdk:"name"`
	CPU          types.Int64   `tfsdk:"cpu"`
	RamGB        types.Int64   `tfsdk:"ram_gb"`
	DiskGB       types.Int64   `tfsdk:"disk_gb"`
	BandwidthTB  types.Float64 `tfsdk:"bandwidth_tb"`
	PriceMonthly types.Float64 `tfsdk:"price_monthly"`
}

type planPayload struct {
	ID           string  `json:"id"`
	Slug         string  `json:"slug"`
	Name         string  `json:"name"`
	CPU          int64   `json:"cpu"`
	RamGB        int64   `json:"ramGB"`
	DiskGB       int64   `json:"diskGB"`
	BandwidthTB  float64 `json:"bandwidthTB"`
	PriceMonthly float64 `json:"priceMonthly"`
}

func (d *planDataSource) Metadata(_ context.Context, req datasource.MetadataRequest, resp *datasource.MetadataResponse) {
	resp.TypeName = req.ProviderTypeName + "_plan"
}

func (d *planDataSource) Schema(_ context.Context, _ datasource.SchemaRequest, resp *datasource.SchemaResponse) {
	resp.Schema = schema.Schema{
		Description: "Look up a NetLayer Cloud compute plan by its slug.",
		Attributes: map[string]schema.Attribute{
			"slug":          schema.StringAttribute{Required: true},
			"id":            schema.StringAttribute{Computed: true},
			"name":          schema.StringAttribute{Computed: true},
			"cpu":           schema.Int64Attribute{Computed: true},
			"ram_gb":        schema.Int64Attribute{Computed: true},
			"disk_gb":       schema.Int64Attribute{Computed: true},
			"bandwidth_tb":  schema.Float64Attribute{Computed: true},
			"price_monthly": schema.Float64Attribute{Computed: true},
		},
	}
}

func (d *planDataSource) Configure(_ context.Context, req datasource.ConfigureRequest, resp *datasource.ConfigureResponse) {
	if req.ProviderData == nil {
		return
	}
	c, ok := req.ProviderData.(*provider.Client)
	if !ok {
		resp.Diagnostics.AddError("provider data type mismatch", "expected *provider.Client")
		return
	}
	d.client = c
}

func (d *planDataSource) Read(ctx context.Context, req datasource.ReadRequest, resp *datasource.ReadResponse) {
	var data planModel
	resp.Diagnostics.Append(req.Config.Get(ctx, &data)...)
	if resp.Diagnostics.HasError() {
		return
	}

	var plans []planPayload
	if err := d.client.Do("GET", "/plans", nil, &plans); err != nil {
		resp.Diagnostics.AddError("list plans", err.Error())
		return
	}

	for _, p := range plans {
		if p.Slug == data.Slug.ValueString() {
			data.ID = types.StringValue(p.ID)
			data.Name = types.StringValue(p.Name)
			data.CPU = types.Int64Value(p.CPU)
			data.RamGB = types.Int64Value(p.RamGB)
			data.DiskGB = types.Int64Value(p.DiskGB)
			data.BandwidthTB = types.Float64Value(p.BandwidthTB)
			data.PriceMonthly = types.Float64Value(p.PriceMonthly)
			resp.Diagnostics.Append(resp.State.Set(ctx, &data)...)
			return
		}
	}

	resp.Diagnostics.AddError("plan not found", fmt.Sprintf("no plan with slug %q", data.Slug.ValueString()))
}
