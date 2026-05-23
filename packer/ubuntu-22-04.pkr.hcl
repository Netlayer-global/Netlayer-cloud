source "qemu" "ubuntu-22-04" {
  iso_url           = "https://releases.ubuntu.com/22.04/ubuntu-22.04.5-live-server-amd64.iso"
  iso_checksum      = "sha256:9bc6028870aef3f74f4e16b900008179e78b130e6b0b9a140635434a46aa98b0"
  output_directory  = "output-ubuntu-22-04"
  shutdown_command  = "sudo -S shutdown -P now"
  vm_name           = "netlayer-ubuntu-22-04-${var.version}.qcow2"
  format            = "qcow2"

  cpus              = var.cpus
  memory            = var.memory_mb
  disk_size         = var.disk_size_mb
  disk_interface    = "virtio"
  net_device        = "virtio-net"
  headless          = var.headless

  ssh_username      = var.ssh_username
  ssh_password      = var.ssh_password
  ssh_timeout       = "30m"

  # Boot from autoinstall cloud-init seed served over an HTTP directory
  http_directory    = "scripts/cloud-init"
  boot_wait         = "5s"
  boot_command      = [
    "c<wait>",
    "linux /casper/vmlinuz --- autoinstall ds=nocloud-net;s=http://{{.HTTPIP}}:{{.HTTPPort}}/<enter><wait>",
    "initrd /casper/initrd<enter><wait>",
    "boot<enter>"
  ]
}

build {
  name    = "netlayer-ubuntu-22-04"
  sources = ["source.qemu.ubuntu-22-04"]

  # Copy bootstrap script
  provisioner "file" {
    source      = "scripts/bootstrap-linux.sh"
    destination = "/tmp/bootstrap-linux.sh"
  }

  # Run it
  provisioner "shell" {
    execute_command = "echo '${var.ssh_password}' | sudo -S env {{ .Vars }} bash '{{ .Path }}'"
    inline          = [
      "chmod +x /tmp/bootstrap-linux.sh",
      "/tmp/bootstrap-linux.sh",
    ]
  }

  # Compute checksum + manifest
  post-processor "checksum" {
    checksum_types = ["sha256"]
    output         = "output-ubuntu-22-04/manifest.json"
  }
}
