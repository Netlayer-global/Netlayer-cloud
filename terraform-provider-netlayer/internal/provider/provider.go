package provider

import (
	"context"
	"os"

	"github.com/hashicorp/terraform-plugin-framework/datasource"
	"github.com/hashicorp/terraform-plugin-framework/provider"
	"github.com/hashicorp/terraform-plugin-framework/provider/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/types"

	"github.com/netlayer-global/terraform-provider-netlayer/internal/datasources"
	"github.com/netlayer-global/terraform-provider-netlayer/internal/resources"
)

// New returns a fresh provider instance pinned to a version.
func New(version string) func() provider.Provider {
	return func() provider.Provider {
		return &netlayerProvider{version: version}
	}
}

type netlayerProvider struct {
	version string
}

type netlayerProviderModel struct {
	APIUrl types.String `tfsdk:"api_url"`
	APIKey types.String `tfsdk:"api_key"`
}

func (p *netlayerProvider) Metadata(_ context.Context, _ provider.MetadataRequest, resp *provider.MetadataResponse) {
	resp.TypeName = "netlayer"
	resp.Version = p.version
}

func (p *netlayerProvider) Schema(_ context.Context, _ provider.SchemaRequest, resp *provider.SchemaResponse) {
	resp.Schema = schema.Schema{
		Description: "Provider for NetLayer Cloud — manage servers, volumes, load balancers and more from Terraform.",
		Attributes: map[string]schema.Attribute{
			"api_url": schema.StringAttribute{
				Description: "Base URL of the NetLayer API. Defaults to NETLAYER_API_URL env var or https://api.netlayer.com.",
				Optional:    true,
			},
			"api_key": schema.StringAttribute{
				Description: "API key. Defaults to NETLAYER_API_KEY env var.",
				Optional:    true,
				Sensitive:   true,
			},
		},
	}
}

func (p *netlayerProvider) Configure(ctx context.Context, req provider.ConfigureRequest, resp *provider.ConfigureResponse) {
	var data netlayerProviderModel
	diags := req.Config.Get(ctx, &data)
	resp.Diagnostics.Append(diags...)
	if resp.Diagnostics.HasError() {
		return
	}

	apiURL := firstNonEmpty(data.APIUrl.ValueString(), os.Getenv("NETLAYER_API_URL"), "https://api.netlayer.com")
	apiKey := firstNonEmpty(data.APIKey.ValueString(), os.Getenv("NETLAYER_API_KEY"))

	if apiKey == "" {
		resp.Diagnostics.AddError(
			"Missing API key",
			"The NetLayer provider requires an api_key (or the NETLAYER_API_KEY env var).",
		)
		return
	}

	client := NewClient(apiURL, apiKey)
	resp.ResourceData = client
	resp.DataSourceData = client
}

func (p *netlayerProvider) Resources(_ context.Context) []func() resource.Resource {
	return []func() resource.Resource{
		resources.NewServerResource,
	}
}

func (p *netlayerProvider) DataSources(_ context.Context) []func() datasource.DataSource {
	return []func() datasource.DataSource{
		datasources.NewPlanDataSource,
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
