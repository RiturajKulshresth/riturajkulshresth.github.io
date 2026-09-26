"use client";

/**
 * The route's entire imperative layer, in one component.
 *
 * WHY ONE COMPONENT: the direction's per-frame budget allows exactly ONE
 * requestAnimationFrame loop for the whole page, whose complete write set is
 * four direct `element.style.transform` assignments - three register ghosts and
 * the §04 specimen track. Splitting that across components would mean several
 * loops racing to write the same frame.
 *
 * WHY IMPERATIVE: every write below targets an element found by data attribute
 * and mutates a class, a transform or a text node. None of it goes through
 * React state, so scrolling never re-renders the 13 index rows, the 39 specimen
 * items or the 19 highlight clauses. The draft version of this direction wrote
 * `--clp-reg-x` on `.clp-root` once per frame; unregistered custom properties
 * inherit, so that single write invalidated style for the entire route subtree
 * at 60fps. Writing the three ghost nodes directly is O(1).
 *
 * NOTHING HERE GATES LAYOUT. The gate query returns false until mount, and the
 * site is a static export, so any layout that depended on JS would flash on
 * hydration under a 17vw LCP element. Both §03 placements and both §04 layouts
 * exist in the server-rendered HTML and are switched by the identical media
 * query in colophon.css. This component only ever starts and stops behaviours.
 */

import { useEffect } from "react";
import { useIsMobile } from "@/lib/hooks";

/**
 * The canonical kinetic gate. This string is duplicated verbatim in
 * colophon.css - if you change one, change both. `useIsMobile` is a generic
 * matchMedia hook despite its name; it reports whether the query matches and
 * stays in sync with viewport and orientation changes.
 */
const GATE =
  "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Peak register slip, as a fraction of the masthead's type size.
 *
 * The direction specified a flat 14px, which was calibrated against a 245px
 * masthead (~5.7% of its size). The masthead here sets at 417px on a 1440
 * viewport, where 14px is 3.4% - measurably present but visually nothing. A
 * proportional slip reads identically at every viewport, which is the same
 * reasoning that put the static fallback offset in `em`.
 */
const SLIP_RATIO_OF_TYPE = 0.05;
const SLIP_MIN = 10;
const SLIP_MAX = 30;
/** The plate slips diagonally: a sheet moves on a bearing, not along an axis. */
const SLIP_RATIO = 0.35;
/** How long the sheet holds out of register on arrival, before the snap. */
const HOLD_MS = 400;

export default function PressEngine() {
  const kinetic = useIsMobile(GATE);

  /* ─── Clause tracking ──────────────────────────────────────────────
     Navigation state, not motion, so this runs on every device and at every
     width - including under reduced motion, where the rail still has to say
     where you are. */
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-clp-clause]")
    );
    if (!sections.length) return;

    const railItems = new Map<string, HTMLElement>();
    document
      .querySelectorAll<HTMLElement>("[data-clp-rail-item]")
      .forEach((el) => {
        if (el.dataset.clpRailItem) railItems.set(el.dataset.clpRailItem, el);
      });
    const runhead = document.querySelector<HTMLElement>("[data-clp-runhead]");

    let current = "";
    const setCurrent = (id: string) => {
      if (id === current) return;
      current = id;
      railItems.forEach((el, key) => {
        if (key === id) el.setAttribute("aria-current", "location");
        else el.removeAttribute("aria-current");
      });
      if (runhead) {
        const section = sections.find((s) => s.dataset.clpClause === id);
        runhead.textContent = section?.dataset.clpLabel ?? "";
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        // Track whichever clause occupies the upper-middle of the screen,
        // rather than whichever edge barely intersects.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target as HTMLElement | undefined;
        if (top?.dataset.clpClause) setCurrent(top.dataset.clpClause);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* ─── §02 inking ───────────────────────────────────────────────────
     Fires once per post and never reverses - a printed page does not un-print
     itself. Runs ungated: below the gate the duration tokens collapse, so the
     post simply arrives already inked. */
  useEffect(() => {
    const posts = Array.from(
      document.querySelectorAll<HTMLElement>("[data-clp-post]")
    );
    if (!posts.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("clp-post-active");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    posts.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  /* ─── Arrivals ─────────────────────────────────────────────────────
     The hidden pre-reveal state is declared in CSS behind the same gate query,
     so it is correct from first paint and needs no JS to be legible. This
     observer only ever resolves elements to their final state. */
  useEffect(() => {
    if (!kinetic) return;

    const options: IntersectionObserverInit = {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    };

    /* Grouped reveals. A ruled table has to ink row by row as ONE unit: if
       each row waited for its own intersection, a five-row table sitting
       across the fold would show its first row inked and the rest blank, which
       reads as a bug rather than as an arrival. The group is observed, and all
       its rows resolve together on their existing stagger delays. */
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-clp-reveal-group]")
    );
    const groupIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target
          .querySelectorAll<HTMLElement>(".clp-reveal")
          .forEach((el) => el.classList.add("clp-revealed"));
        groupIo.unobserve(e.target);
      }
    }, options);
    groups.forEach((g) => groupIo.observe(g));

    /* Everything else reveals on its own intersection. Members of a group are
       excluded so the two observers can't fight over the same element. */
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(".clp-reveal:not(.clp-revealed)")
    ).filter((el) => !el.closest("[data-clp-reveal-group]"));

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("clp-revealed");
        io.unobserve(e.target);
      }
    }, options);
    items.forEach((i) => io.observe(i));

    return () => {
      groupIo.disconnect();
      io.disconnect();
    };
  }, [kinetic]);

  /* ─── The one loop: register + specimen pan ────────────────────────── */
  useEffect(() => {
    if (!kinetic) {
      // Hand the ghosts back to CSS, which holds the static em-based offset.
      document
        .querySelectorAll<HTMLElement>("[data-clp-ghost]")
        .forEach((g) => {
          g.style.transform = "";
          g.style.willChange = "";
        });
      return;
    }

    const ghosts = Array.from(
      document.querySelectorAll<HTMLElement>("[data-clp-ghost]")
    );
    const track = document.querySelector<HTMLElement>("[data-clp-track]");
    const pin = document.querySelector<HTMLElement>("[data-clp-pin]");
    const cols = Array.from(
      document.querySelectorAll<HTMLElement>("[data-clp-spec-col]")
    );
    const outX = document.querySelector<HTMLElement>("[data-clp-readout-x]");
    const outY = document.querySelector<HTMLElement>("[data-clp-readout-y]");

    /* Pin geometry.
       `pinRange` and `maxTravel` are cached and refreshed on resize. The pin's
       POSITION is deliberately not cached: it is read live at the top of every
       frame, before any write. Caching it meant the pan's progress was
       computed against a document offset captured at mount, and any later
       reflow - a font swap, a revealed row, a spurious resize - desynchronised
       it, which showed up as the pan completing at 50% of the pin and then
       jumping backwards at 75%. Reading `rect.top` each frame is
       self-correcting and costs nothing measurable: it happens before the
       frame's writes, so it never forces a reflow within the frame. */
    let pinRange = 1;
    let maxTravel = 0;
    /* ONE slip value shared by all three ghosts, derived from the masthead's
       type size. They must never move independently - three elements slipping
       by the same amount in the same direction is what makes this read as one
       press sheet moving, rather than three decorations reacting. */
    let slip = SLIP_MIN;
    const measure = () => {
      if (pin) pinRange = Math.max(1, pin.offsetHeight - window.innerHeight);
      if (track) maxTravel = Math.max(0, track.scrollWidth - window.innerWidth);
      if (ghosts[0]) {
        const type = parseFloat(getComputedStyle(ghosts[0]).fontSize) || 0;
        slip = Math.min(SLIP_MAX, Math.max(SLIP_MIN, type * SLIP_RATIO_OF_TYPE));
      }
    };
    measure();

    let scrollY = window.scrollY;
    let lastY = scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    /* The register spring. `--clp-ease-snap`'s overshoot expressed as real
       physics: one critically-damped integration produces the single overshoot
       on the load snap and on every settle. */
    let gx = slip * SLIP_RATIO;
    let gy = slip;
    let gvx = 0;
    let gvy = 0;
    let trackX = 0;
    let lit = -1;
    let lastReadout = 0;
    let raf = 0;

    for (const g of ghosts) g.style.willChange = "transform";

    // The sheet arrives out of register and holds, long enough to be
    // unmistakably deliberate rather than a loading artefact.
    const releaseAt = performance.now() + HOLD_MS;

    let pinned = false;
    const pinIo = pin
      ? new IntersectionObserver(
          (entries) => {
            pinned = entries.some((e) => e.isIntersecting);
            // Never leave a ~2800x900 promoted layer alive off-screen.
            if (track) track.style.willChange = pinned ? "transform" : "";
          },
          { rootMargin: "20% 0px" }
        )
      : null;
    if (pin && pinIo) pinIo.observe(pin);

    const tick = (now: number) => {
      // ── Reads first, writes after. Nothing below this block reads layout.
      const velocity = scrollY - lastY;
      lastY = scrollY;
      // How far the pin has travelled through its own length, from its live
      // position: 0 when its top meets the viewport top, 1 at full travel.
      const pinProgress = pin
        ? -pin.getBoundingClientRect().top / pinRange
        : 0;

      let targetY: number;
      if (now < releaseAt) {
        targetY = slip;
      } else {
        // How hard you move the paper, not where your cursor is. There is no
        // pointermove listener anywhere in this route.
        targetY = Math.max(-slip, Math.min(slip, -velocity * 0.55));
      }
      const targetX = targetY * SLIP_RATIO;

      gvy += (targetY - gy) * 0.14;
      gvy *= 0.78;
      gy += gvy;
      gvx += (targetX - gx) * 0.14;
      gvx *= 0.78;
      gx += gvx;

      // Write 1-3: the three ghost nodes, in unison. They are never
      // independent, which is what makes this read as one sheet slipping
      // rather than three decorations reacting.
      const t = `translate3d(${gx.toFixed(2)}px, ${gy.toFixed(2)}px, 0)`;
      for (const g of ghosts) g.style.transform = t;

      // Write 4: the specimen track.
      if (track && pin) {
        let target: number;
        if (pinProgress <= 0.02) target = 0;
        else if (pinProgress >= 0.98) target = -maxTravel;
        // Full travel is reached by 90% of the pin, so the last 10% is settle
        // time and the release is always in perfect register.
        else target = -maxTravel * Math.min(1, Math.max(0, pinProgress / 0.9));
        trackX += (target - trackX) * 0.09;
        track.style.transform = `translate3d(${trackX.toFixed(2)}px, 0, 0)`;

        // Each column inks up as the pan brings it across. Thresholds are
        // derived from progress rather than from per-frame position reads.
        if (cols.length) {
          const span = 0.9 / cols.length;
          const next = Math.max(
            -1,
            Math.min(cols.length - 1, Math.floor(pinProgress / span))
          );
          if (next !== lit) {
            cols.forEach((c, i) =>
              c.classList.toggle("clp-spec-col-lit", i <= next)
            );
            lit = next;
          }
        }
      }

      // The instrument reports at 8Hz, not per frame, on a `contain: layout`
      // element with a ch-locked width, so a text change cannot reflow a
      // neighbour.
      if (now - lastReadout > 125) {
        lastReadout = now;
        if (outX) outX.textContent = gx.toFixed(1);
        if (outY) outY.textContent = gy.toFixed(1);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      pinIo?.disconnect();
      for (const g of ghosts) {
        g.style.transform = "";
        g.style.willChange = "";
      }
      if (track) {
        track.style.transform = "";
        track.style.willChange = "";
      }
    };
  }, [kinetic]);

  return null;
}
