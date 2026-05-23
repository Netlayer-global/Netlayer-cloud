#!/usr/bin/env sh
# One-shot Vault initialisation for development. Run inside the vault container:
#   docker exec -it nl-vault sh /init.sh
# Records the unseal keys + root token into /vault/file/init.json.
# DO NOT use this script in production — production uses auto-unseal via cloud KMS.

set -e

if [ -f /vault/file/init.json ]; then
  echo "Already initialised — skipping."
  exit 0
fi

vault operator init -format=json > /vault/file/init.json
chmod 600 /vault/file/init.json

# Unseal with the first 3 keys
KEYS=$(jq -r '.unseal_keys_b64[]' /vault/file/init.json)
i=0
for k in $KEYS; do
  vault operator unseal "$k"
  i=$((i+1))
  [ $i -ge 3 ] && break
done

ROOT=$(jq -r '.root_token' /vault/file/init.json)
echo "$ROOT" > /vault/file/root.token
chmod 600 /vault/file/root.token

vault login "$ROOT"

# Enable KV-v2 secrets engine + load policies
vault secrets enable -version=2 kv || true
vault policy write netlayer-api /vault/file/policies/netlayer-api.hcl 2>/dev/null || \
  vault policy write netlayer-api /init.policy.hcl 2>/dev/null || true

# Stub secrets for first run — operator overwrites these later
vault kv put kv/netlayer/jwt \
  access_secret="$(openssl rand -hex 32)" \
  refresh_secret="$(openssl rand -hex 32)"

echo "✓ Vault initialised. Root token saved to /vault/file/root.token"
