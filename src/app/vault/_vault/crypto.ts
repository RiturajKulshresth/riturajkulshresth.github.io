/**
 * Browser half of the vault. Mirrors `scripts/encrypt-vault.mjs`: same KDF,
 * same cipher, same blob shape, so the two files must stay in sync.
 *
 * Everything here runs on the native Web Crypto API, which means the vault
 * costs the client bundle nothing beyond this file.
 */

export type VaultBlob = {
  v: number;
  kdf: string;
  iterations: number;
  salt: string;
  iv: string;
  data: string;
};

export type VaultEntry = {
  slug: string;
  title: string;
  date: string;
  /** Pre-rendered by `marked` at encrypt time, so no parser ships to the client. */
  html: string;
};

/** Thrown when the passphrase is wrong, as distinct from a real failure. */
export class WrongPassphraseError extends Error {
  constructor() {
    super("Wrong passphrase");
    this.name = "WrongPassphraseError";
  }
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    // `salt` is typed as BufferSource; the cast keeps TS happy across the
    // Uint8Array<ArrayBufferLike> vs ArrayBuffer split in lib.dom.
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

/**
 * Derives the key and decrypts the blob. AES-GCM authenticates its ciphertext,
 * so a bad passphrase fails the integrity check rather than yielding garbage,
 * which is why no password hash needs to be stored alongside the vault.
 */
export async function decryptVault(
  blob: VaultBlob,
  passphrase: string
): Promise<VaultEntry[]> {
  const key = await deriveKey(passphrase, base64ToBytes(blob.salt), blob.iterations);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(blob.iv) as BufferSource },
      key,
      base64ToBytes(blob.data) as BufferSource
    );
  } catch {
    throw new WrongPassphraseError();
  }

  const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as {
    entries: VaultEntry[];
  };
  return parsed.entries;
}
