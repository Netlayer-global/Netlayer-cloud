packer {
  required_version = ">= 1.10.0"
  required_plugins {
    qemu = {
      source  = "github.com/hashicorp/qemu"
      version = ">= 1.1.0"
    }
  }
}

variable "version" {
  type    = string
  default = "2026.05"
}

variable "memory_mb" {
  type    = number
  default = 2048
}

variable "cpus" {
  type    = number
  default = 2
}

variable "disk_size_mb" {
  type    = number
  default = 16384
}

variable "headless" {
  type    = bool
  default = true
}

# SSH credentials baked into the image. Cloud-init replaces these on first boot
# of every spawned VM, so they're only ever used during the build itself.
variable "ssh_username" {
  type    = string
  default = "netlayer"
}

variable "ssh_password" {
  type      = string
  default   = "build-only-do-not-use"
  sensitive = true
}
