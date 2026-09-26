/**
 * Derived document data for the Colophon render mode.
 *
 * The direction is built on the fiction of a printed technical specification,
 * and a specification does not assert its own counts - it derives them. Every
 * number that appears on the page (13 PLATES, 4 POSTS, 39 ITEMS, "06 CLAUSES")
 * is computed here from `@/lib/data`, so editing the portfolio content can
 * never leave a stale figure printed on the sheet.
 */
import {
  accolades,
  experience,
  projects,
  skillGroups,
  type Project,
} from "@/lib/data";

/* ─── Edition ──────────────────────────────────────────────────────
   The masthead and the trim strip both print one edition string, and they
   must match exactly. Evaluated once at module scope; because the site is a
   static export this resolves at build time, so the edition is the date the
   sheet was actually pressed. */
const pressDate = new Date();
export const EDITION = `${pressDate.getFullYear()}.${String(
  pressDate.getMonth() + 1
).padStart(2, "0")}`;

/* ─── Coordinates ──────────────────────────────────────────────────
   `profile.location` is "Hyderabad, India". The manifest sets location as
   coordinates instead, because a spec document gives a position, not a
   placename. Kept beside the derivations so the two never drift apart. */
export const COORDINATES = "17.3850 N, 78.4867 E";

/* ─── §03 · Plates ─────────────────────────────────────────────────── */

/**
 * Corporate logo assets. Three projects share `wbd.png` and a fourth uses
 * `deloitte.png`; in the plate's greyscale treatment those four are nearly
 * indistinguishable from one another, and they would be summoned by the first
 * four rows a visitor touches. Logos are therefore never plates - those rows
 * get a typographic plate instead, which is also the honest answer for
 * internal platform work that cannot be screenshotted.
 */
const LOGO_ASSETS = new Set(["/images/wbd.png", "/images/deloitte.png"]);

export type Plate = {
  project: Project;
  /** 1-based plate number, printed as `[ 07 ]`. */
  number: number;
  /**
   * Year of last impression. `project.year` holds human ranges
   * ("2026 - present", "2022 - 2024", "2021"), which can never hold a right
   * edge in tabular figures; the index prints this single four-digit year and
   * moves the full range into the plate metadata.
   */
  year: number;
  /**
   * `media` rows summon their preview asset into the fixed plate frame.
   * `typographic` rows set their own tags as a mono type block instead.
   */
  kind: "media" | "typographic";
};

/** Latest real year mentioned in a `year` string; "present" carries no digits. */
function yearOfLastImpression(year: string): number {
  const found = year.match(/\d{4}/g);
  if (!found) return 0;
  return Math.max(...found.map(Number));
}

/**
 * The 13 projects ordered by year of last impression, descending. The index
 * declares this sort order on the page - an index that declares its sort is
 * the genre; one that does not is a card grid with numbers on it. `sort` is
 * stable in V8, so ties keep their authored order from `data.ts`.
 */
export const plates: Plate[] = projects
  .map((project) => ({ project, year: yearOfLastImpression(project.year) }))
  .sort((a, b) => b.year - a.year)
  .map(({ project, year }, i) => ({
    project,
    year,
    number: i + 1,
    kind:
      project.preview && !LOGO_ASSETS.has(project.preview)
        ? ("media" as const)
        : ("typographic" as const),
  }));

/* ─── §02 · Posts ──────────────────────────────────────────────────── */

/**
 * Splits a real period into the two lines the sticky period column sets.
 * The source strings are irregular - "Nov 2024 - Present", "Summer 2021",
 * "Jul 2018 - Jun 2022" - and all of them have to fit one form, so a range
 * splits on its dash and a single term splits on its last space.
 */
export function periodLines(period: string): [string, string] {
  const range = period.split(/\s+-\s+/);
  if (range.length === 2) return [range[0].toUpperCase(), range[1].toUpperCase()];
  const lastSpace = period.lastIndexOf(" ");
  if (lastSpace === -1) return [period.toUpperCase(), ""];
  return [
    period.slice(0, lastSpace).toUpperCase(),
    period.slice(lastSpace + 1).toUpperCase(),
  ];
}

/** "06 CLAUSES" / "01 CLAUSE" - derived per post, never asserted. */
export function clauseCount(n: number): string {
  return `${String(n).padStart(2, "0")} ${n === 1 ? "CLAUSE" : "CLAUSES"}`;
}

/* ─── §04 · Specimen ───────────────────────────────────────────────── */

/**
 * Items currently load-bearing in production. The direction's colour law
 * reserves rubric red for structure, so this claim is carried by a hanging
 * dagger plus a screen-reader phrase rather than by hue - which also keeps it
 * out of WCAG 1.4.1 territory. At least two fall in every column.
 */
export const LOAD_BEARING = new Set([
  "Python",
  "JavaScript / TypeScript",
  "LangGraph",
  "AWS Bedrock",
  "FastAPI",
  "PostgreSQL",
  "AWS OpenSearch",
  "Okta OIDC",
  "Terraform",
  "Helm",
]);

/* ─── Sheet line ───────────────────────────────────────────────────── */

export const counts = {
  plates: projects.length,
  posts: experience.length,
  citations: accolades.length,
  items: skillGroups.reduce((sum, g) => sum + g.items.length, 0),
} as const;

/** The clause rail's entries. Order is the document's reading order. */
export const clauses = [
  { id: "masthead", key: "00", label: "MASTHEAD" },
  { id: "abstract", key: "01", label: "ABSTRACT" },
  { id: "posts", key: "02", label: "POSTS" },
  { id: "index", key: "03", label: "INDEX" },
  { id: "specimen", key: "04", label: "SPECIMEN" },
  { id: "citations", key: "05", label: "CITATIONS" },
  { id: "colophon", key: "06", label: "COLOPHON" },
  { id: "trim", key: "07", label: "TRIM" },
] as const;
