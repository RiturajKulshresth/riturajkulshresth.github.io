"use client";

/**
 * The vault UI: a lock screen, then a two-pane reader over the decrypted
 * entries.
 *
 * The `blob` prop is ciphertext baked into the static export at build time, so
 * this component is the whole access-control story. Decryption happens entirely
 * in the browser via Web Crypto; the passphrase never travels anywhere.
 */
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Lock, LockOpen, Loader2, TriangleAlert } from "lucide-react";
import { decryptVault, WrongPassphraseError, type VaultBlob, type VaultEntry } from "../crypto";
import "../vault.css";

// Caching the passphrase for the tab means a refresh or a click back from
// another route doesn't force a re-type. sessionStorage (not localStorage) so
// it dies with the tab rather than persisting on disk.
const SESSION_KEY = "vault:passphrase";

function formatDate(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Vault({ blob }: { blob: VaultBlob }) {
  const [entries, setEntries] = useState<VaultEntry[] | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const unlock = useCallback(
    async (candidate: string, { fromCache = false } = {}) => {
      setBusy(true);
      setError(null);
      try {
        const decrypted = await decryptVault(blob, candidate);
        setEntries(decrypted);
        setActiveSlug(decrypted[0]?.slug ?? null);
        setPassphrase("");
        sessionStorage.setItem(SESSION_KEY, candidate);
      } catch (err) {
        if (err instanceof WrongPassphraseError) {
          // A stale cached passphrase means the vault was re-encrypted since
          // this tab last unlocked it; drop it and fall back to the prompt.
          sessionStorage.removeItem(SESSION_KEY);
          setError(fromCache ? "The vault has changed. Enter your passphrase again." : "Wrong passphrase.");
        } else {
          setError(err instanceof Error ? err.message : "Could not open the vault.");
        }
      } finally {
        setBusy(false);
      }
    },
    [blob]
  );

  // Web Crypto is unavailable outside a secure context, which would leave the
  // lock screen permanently broken with no explanation.
  const [insecureContext, setInsecureContext] = useState(false);

  useEffect(() => {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      setInsecureContext(true);
      return;
    }
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) void unlock(cached, { fromCache: true });
  }, [unlock]);

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setEntries(null);
    setActiveSlug(null);
    setPassphrase("");
    setError(null);
  };

  const active = entries?.find((e) => e.slug === activeSlug) ?? entries?.[0] ?? null;

  if (!entries) {
    return (
      <main id="main" className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)]">
              <Lock className="h-5 w-5 text-[color:var(--color-fg-muted)]" />
            </span>
            <div>
              <h1 className="text-lg font-medium tracking-tight text-[color:var(--color-fg)]">
                Private vault
              </h1>
              <p className="mt-1.5 text-sm text-[color:var(--color-fg-subtle)]">
                Encrypted. Enter the passphrase to decrypt it in your browser.
              </p>
            </div>
          </div>

          {insecureContext ? (
            <p className="flex items-start gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] p-3 text-sm text-[color:var(--color-fg-muted)]">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              This browser has no Web Crypto, which needs a secure context. Open
              the site over HTTPS or on localhost.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy && passphrase) void unlock(passphrase);
              }}
              className="flex flex-col gap-3"
            >
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoFocus
                autoComplete="current-password"
                placeholder="Passphrase"
                aria-label="Vault passphrase"
                aria-invalid={error ? true : undefined}
                className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[color:var(--color-fg)] outline-none transition placeholder:text-[color:var(--color-fg-subtle)] focus:border-[color:var(--color-accent-strong)]/60"
              />
              <button
                type="submit"
                disabled={busy || !passphrase}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--color-accent-strong)]/45 bg-[color:var(--color-accent)]/12 px-3.5 py-2.5 text-sm font-medium text-[color:var(--color-accent-strong)] transition enabled:hover:border-transparent enabled:hover:bg-[color:var(--color-accent)] enabled:hover:text-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Decrypting
                  </>
                ) : (
                  <>
                    <LockOpen className="h-3.5 w-3.5" />
                    Unlock
                  </>
                )}
              </button>
              {error && (
                <p role="alert" className="text-sm text-[color:var(--traffic-red)]">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </main>
    );
  }

  // Top padding clears the fixed back button rendered by the route page.
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-24">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-[color:var(--color-border)] pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-medium tracking-tight text-[color:var(--color-fg)]">
            <LockOpen className="h-4 w-4 text-[color:var(--color-accent-strong)]" />
            Private vault
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-subtle)]">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          type="button"
          onClick={lock}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]"
        >
          <Lock className="h-3.5 w-3.5" />
          Lock
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
        <nav aria-label="Vault entries">
          <ul className="flex flex-col gap-0.5">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <button
                  type="button"
                  onClick={() => setActiveSlug(entry.slug)}
                  aria-current={active?.slug === entry.slug ? "true" : undefined}
                  className={clsx(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition",
                    active?.slug === entry.slug
                      ? "bg-[color:var(--color-surface-hover)] font-medium text-[color:var(--color-fg)]"
                      : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-hover)] hover:text-[color:var(--color-fg)]"
                  )}
                >
                  <span className="block truncate">{entry.title}</span>
                  {entry.date && (
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-fg-subtle)]">
                      {formatDate(entry.date)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="min-w-0">
          {active ? (
            // The HTML was authored by us, rendered by `marked` at encrypt time,
            // and is only reachable after a successful authenticated decrypt.
            <article
              className="vault-prose"
              dangerouslySetInnerHTML={{ __html: active.html }}
            />
          ) : (
            <p className="text-sm text-[color:var(--color-fg-subtle)]">
              This vault is empty.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
