# Policy for the NetLayer API service token. Read-only against the secrets
# we expect it to fetch at boot.
path "kv/data/netlayer/database" {
  capabilities = ["read"]
}
path "kv/data/netlayer/jwt" {
  capabilities = ["read"]
}
path "kv/data/netlayer/integrations/*" {
  capabilities = ["read"]
}

# Allow the API to renew its own token + look up its TTL.
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
path "auth/token/renew-self" {
  capabilities = ["update"]
}
