"use client";

/**
 * One collection: its HTML, plus the card dialog and the clicks that drive
 * it. The HTML is in the static page, so the collection reads fine before this
 * hydrates; only the sort buttons, card details and overview links wait on it.
 */
import { useRef } from "react";
import { X } from "lucide-react";

// Keys match CARD_SORTS in scripts/build-collections.mjs; any other key
// ("order") sorts by place in the markdown.
const SORT_DIRECTION: Record<string, number> = { "price-asc": 1, "price-desc": -1 };

/**
 * Reorders a card list when one of the sort buttons the build script puts
 * above it is pressed. Each card carries its place in the markdown
 * (`data-order`) and its price (`data-price`); unpriced cards sink to the end
 * either way and ties keep the markdown order. Mutating the injected DOM is
 * safe because React only rewrites the article when the collection's HTML
 * changes.
 */
function sortCards(button: HTMLButtonElement) {
  const group = button.closest(".card-sort");
  const list = group?.nextElementSibling;
  if (!group || !(list instanceof HTMLUListElement)) return;

  const direction = SORT_DIRECTION[button.dataset.sort ?? ""] ?? 0;
  const order = (card: HTMLElement) => Number(card.dataset.order);
  const price = (card: HTMLElement) => (card.dataset.price ? Number(card.dataset.price) : null);

  const cards = Array.from(list.children).filter((el) => el instanceof HTMLElement);
  cards.sort((a, b) => {
    const pa = price(a);
    const pb = price(b);
    if (direction && pa !== pb) {
      if (pa === null) return 1;
      if (pb === null) return -1;
      return (pa - pb) * direction;
    }
    return order(a) - order(b);
  });
  list.append(...cards);

  for (const other of group.querySelectorAll("button[data-sort]")) {
    other.setAttribute("aria-pressed", String(other === button));
  }
}

/**
 * The card an in-page link points at, such as a thumbnail in a story page's
 * overview, or null when it points at anything else.
 */
function linkedCard(link: HTMLAnchorElement): HTMLElement | null {
  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  return target?.matches("li.card") ? target : null;
}

const CARD_DIALOG_TITLE_ID = "card-dialog-title";

/**
 * Shows a gallery tile or compact row as a full card in the card dialog. The
 * card already carries its fields, hidden by collections.css, so a copy of it
 * is the whole detail view, photo included.
 */
function openCard(source: Element, dialog: HTMLDialogElement) {
  const slot = dialog.querySelector("ul.cards");
  if (!slot) return;

  const card = source.cloneNode(true) as HTMLElement;
  card.removeAttribute("id");
  card.querySelector(".card-open")?.remove();
  card.querySelector(".card-name")?.setAttribute("id", CARD_DIALOG_TITLE_ID);
  slot.replaceChildren(card);
  dialog.showModal();
}

// Smooth scrolling fires `scroll` every frame, so this long without one means
// the page has come to rest.
const SCROLL_SETTLE_MS = 120;

/**
 * Brings a card to the middle of the screen and calls `then` once scrolling
 * stops. The scroll follows the root `scroll-behavior`: smooth unless reduced
 * motion is on.
 */
function scrollCardIntoView(card: HTMLElement, then: () => void) {
  let timer = window.setTimeout(settled, SCROLL_SETTLE_MS);
  const wait = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(settled, SCROLL_SETTLE_MS);
  };
  function settled() {
    document.removeEventListener("scroll", wait, { capture: true });
    if (card.isConnected) then();
  }
  // Capturing, because `scroll` doesn't bubble from an inner scroller.
  document.addEventListener("scroll", wait, { capture: true, passive: true });
  card.scrollIntoView({ block: "center" });
}

/**
 * Scrolls to a card, then opens it in the card dialog. Opening any sooner
 * would cut the scroll short, since the open dialog locks page scrolling. The
 * card's own open button takes focus first, so closing the dialog hands focus
 * back here rather than to the link up the page.
 */
function scrollToAndOpen(card: HTMLElement, dialog: HTMLDialogElement) {
  scrollCardIntoView(card, () => {
    if (!dialog.isConnected || dialog.open) return;
    card.querySelector<HTMLElement>(".card-open")?.focus({ preventScroll: true });
    openCard(card, dialog);
  });
}

/**
 * Scrolls to a card that shows its details in place, then highlights it so
 * the eye finds it among its neighbours. Focus moves to the card, so the
 * keyboard carries on from there.
 */
function scrollToCard(card: HTMLElement) {
  scrollCardIntoView(card, () => {
    card.tabIndex = -1;
    card.focus({ preventScroll: true });
    card.removeAttribute("data-flash");
    // Reading layout here lets a repeat click restart the animation.
    void card.offsetWidth;
    card.setAttribute("data-flash", "");
    card.addEventListener("animationend", () => card.removeAttribute("data-flash"), {
      once: true,
    });
  });
}

export default function CollectionView({ html }: { html: string }) {
  const cardDialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      {/* The HTML is ours, rendered by `marked` at build time from the committed markdown. */}
      <article
        className="collections-prose"
        onClick={(event) => {
          const target = event.target instanceof Element ? event.target : null;
          const button = target?.closest("button[data-sort]");
          if (button instanceof HTMLButtonElement) sortCards(button);
          const dialog = cardDialog.current;
          const link = target?.closest('a[href^="#"]');
          const linked = link instanceof HTMLAnchorElement ? linkedCard(link) : null;
          const tile = target?.closest("button.card-open")?.closest("li.card");
          if (linked) {
            event.preventDefault();
            if (dialog && linked.querySelector(".card-open")) scrollToAndOpen(linked, dialog);
            else scrollToCard(linked);
          } else if (dialog && tile) {
            openCard(tile, dialog);
          }
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/*
        Filled by `openCard`. React renders no children into the list, so it
        never overwrites the copied card. The scroll wrapper fills the dialog,
        so a click whose target is the dialog itself landed on the backdrop.
      */}
      <dialog
        ref={cardDialog}
        aria-labelledby={CARD_DIALOG_TITLE_ID}
        className="collections-prose card-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <button
          type="button"
          onClick={() => cardDialog.current?.close()}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-overlay)] text-[color:var(--color-fg-muted)] backdrop-blur-md transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-fg)]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="card-dialog-scroll">
          <ul className="cards" />
        </div>
      </dialog>
    </>
  );
}
