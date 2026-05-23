// Entrypoint for the NetLayer Terraform provider.
//
// Run `terraform init` in any project that references the provider; Terraform
// will discover this binary, hand it the protocol over stdin/stdout, and
// the framework dispatches to the resources defined in internal/resources.
package main

import (
	"context"
	"flag"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/providerserver"
	"github.com/netlayer-global/terraform-provider-netlayer/internal/provider"
)

const (
	providerAddress = "registry.terraform.io/netlayer-global/netlayer"
	providerVersion = "0.1.0"
)

func main() {
	var debug bool
	flag.BoolVar(&debug, "debug", false, "set to true to run the provider with support for debuggers")
	flag.Parse()

	opts := providerserver.ServeOpts{
		Address: providerAddress,
		Debug:   debug,
	}

	if err := providerserver.Serve(context.Background(), provider.New(providerVersion), opts); err != nil {
		log.Fatal(err.Error())
	}
}
