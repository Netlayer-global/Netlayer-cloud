source "qemu" "almalinux-9" {
  iso_url           = "https://repo.almalinux.org/almalinux/9/isos/x86_64/AlmaLinux-9-latest-x86_64-minimal.iso"
  iso_checksum      = "file:https://repo.almalinux.org/almalinux/9/isos/x86_64/CHECKSUM"
  output_directory  = "output-almalinux-9"
  shutdown_command  = "sudo -S shutdown -P now"
  vm_name           = "netlayer-almalinux-9-${var.version}.qcow2"
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
    "<tab><wait>",
    " inst.ks=http://{{.HTTPIP}}:{{.HTTPPort}}/ks.cfg<enter>"
  ]
}

build {
  name    = "netlayer-almalinux-9"
  sources = ["source.qemu.almalinux-9"]

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
    output         = "output-almalinux-9/manifest.json"
  }
}
