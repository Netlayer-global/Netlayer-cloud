# NetLayer Cloud — Packer golden image pipeline

Builds the NetLayer base images that ship to every Proxmox node. Pre-installing
the cloud-init agent, qemu-guest-agent, and the platform's bootstrap scripts
cuts cold-boot deploy time from ~90s to ~30s — most of the saved time is the
package install we no longer have to do at provision time.

## Layout

```
packer/
  packer.pkr.hcl              shared variables + plugin block
  ubuntu-22-04.pkr.hcl        Ubuntu 22.04 LTS (cloud-init enabled)
  debian-12.pkr.hcl           Debian 12
  almalinux-9.pkr.hcl         AlmaLinux 9
  rocky-9.pkr.hcl             Rocky Linux 9
  windows-2022.pkr.hcl        Windows Server 2022
  scripts/
    bootstrap-linux.sh        Common Linux bootstrap (qemu-guest-agent, ssh hardening)
    cloud-init/
      user-data               cloud-init seed for first boot
      meta-data
  Makefile                    one-shot `make all` builds every image
```

## Build a single image

```bash
cd packer
packer init .
packer build ubuntu-22-04.pkr.hcl
```

The output is a `qcow2` file in `output-ubuntu-22-04/`. The post-processor
also computes a SHA-256 and writes a `manifest.json` next to the image.

## Build all images

```bash
make all
```

## Distribute to nodes

The `image-sync.sh` companion script (in `scripts/`) rsyncs the qcow2 files
to every node's `/var/lib/vz/template/iso/netlayer/` directory and updates
the `OsTemplate.proxmoxId` in the database via the admin API.

## Why this saves deploy time

Without golden images, every server deploy does:

1. Download base ISO (cached on first deploy, but still ~5–10s)
2. Boot installer
3. Run cloud-init from scratch — apt update, apt install qemu-guest-agent, configure SSH, etc.

The golden image collapses steps 1–3 into a single `qm clone` operation
(linked clone where supported). The result: `nl server create` returns with
a running, SSH-able VM in 30 seconds instead of 90+.
