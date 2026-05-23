storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = "true"   # dev only — flip to false + add tls_cert_file in prod
}

api_addr = "http://0.0.0.0:8200"
ui = true

# In production replace with `storage "raft"` for HA + auto-unseal via cloud KMS.
# auto-unseal "awskms" {
#   region     = "us-east-1"
#   kms_key_id = "alias/netlayer-vault"
# }
