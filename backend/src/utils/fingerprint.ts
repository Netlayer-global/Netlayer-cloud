import crypto from 'crypto'

/**
 * Compute SSH key fingerprint (MD5 hex with colons).
 * Accepts a public key in OpenSSH format: "ssh-rsa AAAA... [comment]"
 */
export function sshFingerprint(publicKey: string): string {
  const parts = publicKey.trim().split(/\s+/)
  if (parts.length < 2) throw new Error('Invalid SSH public key')
  const keyData = Buffer.from(parts[1], 'base64')
  const hash = crypto.createHash('md5').update(keyData).digest('hex')
  return hash.match(/.{2}/g)!.join(':')
}
