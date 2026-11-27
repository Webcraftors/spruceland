/** The acceptance RPC requires a 32-byte, lowercase hexadecimal bearer token. */
export function invitationToken(bytes: Uint8Array): string {
  if (bytes.length !== 32) throw new Error("Invitation tokens require 32 bytes");
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}