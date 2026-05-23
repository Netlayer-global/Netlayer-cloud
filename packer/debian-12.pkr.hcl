source "qemu" "debian-12" {
  iso_url           = "https://cdimage.debian.org/debian-cd/12.7.0/amd64/iso-cd/debian-12.7.0-amd64-netinst.iso"
  iso_checksum      = "sha256:80580a7b53f7d4fb31bcf72ff58a8b2db7dac8b22e2b16834b9c5d5ec5a3dee0"
  output_directory  = "output-debian-12"
  shutdown_command  = "sudo -S shutdown -P now"
  vm_name           = "netlayer-debian-12-${var.version}.qcow2"
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

  http_directory    = "scripts/cloud-init"
  boot_wait         = "5s"
  boot_command      = [
    "<esc><wait>",
    "auto url=http://{{.HTTPIP}}:{{.HTTPPort}}/preseed.cfg<wait>",
    "<enter><wait>"
  ]
}

build {
  name    = "netlayer-debian-12"
  sources = ["source.qemu.debian-12"]

  provisioner "file" {
    source      = "scripts/bootstrap-linux.sh"
    destination = "/tmp/bootstrap-linux.sh"
  }
  provisioner "shell" {
    execute_command = "echo '${var.ssh_password}' | sudo -S env {{ .Vars }} bash '{{ .Path }}'"
    inline          = [
      "chmod +x /tmp/bootstrap-linux.sh",
      "/tmp/bootstrap-linux.sh",
    ]
  }

  post-processor "checksum" {
    checksum_types = ["sha256"]
    output         = "output-debian-12/manifest.json"
  }
}
