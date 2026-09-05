/**
 * Passphrase-protected vault route.
 *
 * `vault.json` is ciphertext produced by `npm run vault`, so shipping it in
 * the static export leaks nothing: the entries only become readable after the
 * client component decrypts them with a passphrase entered in the browser.
 *
 * Deliberately absent from `src/app/sitemap.ts`, and noindex below, so the
 * route is not advertised to crawlers.
 */
import type { Metadata } from "next";
import BackButton from "./_vault/components/back-button";
import Vault from "./_vault/components/vault";
import type { VaultBlob } from "./_vault/crypto";
import vaultBlob from "./_vault/vault.json";

export const metadata: Metadata = {
  title: "Private",
  description: "Passphrase-protected notes. Nothing to see here.",
  robots: { index: false, follow: false, nocache: true },
};

export default function VaultPage() {
  return (
    <>
      <BackButton />
      <Vault blob={vaultBlob as VaultBlob} />
    </>
  );
}
