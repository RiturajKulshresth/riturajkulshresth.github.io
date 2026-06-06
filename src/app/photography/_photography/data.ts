/**
 * Photography data shim for this route. Re-exports from `@/lib/photography` so
 * the gallery can diverge its shape here without touching the shared lib.
 */
export { photos } from "@/lib/photography";
export type { Photo } from "@/lib/photography";
