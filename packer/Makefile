PACKER ?= packer

IMAGES = ubuntu-22-04 debian-12 almalinux-9 rocky-9 windows-2022

.PHONY: all init clean $(IMAGES)

all: $(IMAGES)

init:
	$(PACKER) init .

clean:
	rm -rf output-*

# Each image is a separate `packer build` invocation so the qcow2s can be
# distributed independently to nodes.
$(IMAGES): init
	$(PACKER) build $@.pkr.hcl
