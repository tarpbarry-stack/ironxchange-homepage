import { useEffect } from "react";

import {
  captureMarketplaceIntelligence
} from "../../lib/marketplace/cardIntelligence";

const IMPRESSION_SELECTOR =
  ".marketplace-listing-card[data-marketplace-intelligence='true']";

function getCard(element) {
  return (
    element?.closest?.(IMPRESSION_SELECTOR) ||
    element
      ?.closest?.(".ixi-marketplace-object-console")
      ?.querySelector?.(IMPRESSION_SELECTOR) ||
    null
  );
}

function getListingId(card) {
  return String(card?.getAttribute("data-listing-card-id") || "");
}

function getSortable(card) {
  return card?.closest?.("[data-ixi-container]") || null;
}

function getPosition(sortable) {
  if (!sortable?.parentElement) return -1;

  return Array.from(sortable.parentElement.children).filter(
    child => child.matches?.("[data-ixi-container]")
  ).indexOf(sortable);
}

function readCardState(card) {
  const sortable = getSortable(card);

  return {
    listingId: getListingId(card),
    container: String(
      sortable?.getAttribute("data-ixi-container") || ""
    ),
    position: getPosition(sortable),
    face: Number(card?.getAttribute("data-marketplace-card-face") || 1),
    photoIndex: Number(
      card?.getAttribute("data-marketplace-photo-index") || 0
    )
  };
}

function findCardById(listingId) {
  return Array.from(document.querySelectorAll(IMPRESSION_SELECTOR)).find(
    card => getListingId(card) === listingId
  );
}

function getConsoleSide(label = "") {
  const normalized = label.toLowerCase();
  if (normalized.includes("left")) return "left";
  if (normalized.includes("right")) return "right";
  return "";
}

export default function MarketplaceCardIntelligence() {
  useEffect(() => {
    const observed = new WeakSet();
    const impressed = new Set();
    let pointerSnapshot = null;

    const impressionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.intersectionRatio < .3) return;

          const card = entry.target;
          const listingId = getListingId(card);
          if (!listingId || impressed.has(listingId)) return;

          impressed.add(listingId);
          captureMarketplaceIntelligence("listing_card_impression", {
            listing_id: listingId,
            card_face: Number(
              card.getAttribute("data-marketplace-card-face") || 1
            ),
            result: "viewed"
          });
        });
      },
      { threshold: [.3] }
    );

    function observeCards(root = document) {
      root.querySelectorAll?.(IMPRESSION_SELECTOR).forEach(card => {
        if (observed.has(card)) return;
        observed.add(card);
        impressionObserver.observe(card);
      });
    }

    observeCards();

    const mutationObserver = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches?.(IMPRESSION_SELECTOR) && !observed.has(node)) {
            observed.add(node);
            impressionObserver.observe(node);
          }
          observeCards(node);
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    function confirmCardChange(before, type) {
      window.setTimeout(() => {
        const card = findCardById(before.listingId);
        if (!card) return;
        const after = readCardState(card);

        if (type === "photo" && after.photoIndex !== before.photoIndex) {
          captureMarketplaceIntelligence("listing_card_photo_changed", {
            listing_id: after.listingId,
            card_face: after.face,
            photo_index: after.photoIndex,
            result: "changed"
          });
        }

        if (type === "face" && after.face !== before.face) {
          captureMarketplaceIntelligence("listing_card_face_changed", {
            listing_id: after.listingId,
            card_face: after.face,
            result: "changed"
          });
        }
      }, 40);
    }

    function confirmMovement(before, control) {
      window.setTimeout(() => {
        const card = findCardById(before.listingId);
        if (!card) return;
        const after = readCardState(card);

        if (
          before.container === after.container &&
          before.position === after.position
        ) {
          return;
        }

        captureMarketplaceIntelligence("listing_card_moved", {
          listing_id: after.listingId,
          source_container: before.container,
          destination_container: after.container,
          source_position: before.position,
          destination_position: after.position,
          control,
          result: "completed"
        });
      }, 100);
    }

    function handleClick(event) {
      const target = event.target?.closest?.("button, a");
      if (!target) return;

      const card = getCard(target);
      const before = card ? readCardState(card) : null;
      const label = String(target.getAttribute("aria-label") || "").trim();
      const normalizedLabel = label.toLowerCase();

      if (
        before &&
        target.matches(".photo-click-zone, .title-click-zone")
      ) {
        captureMarketplaceIntelligence("listing_card_clicked", {
          listing_id: before.listingId,
          card_face: before.face,
          result: "opened"
        });
      }

      if (before && target.matches(".card-photo-nav")) {
        confirmCardChange(before, "photo");
      }

      if (before && target.matches(".rail-flip")) {
        captureMarketplaceIntelligence("listing_rail_control_selected", {
          listing_id: before.listingId,
          control: "flip",
          result: "selected"
        });
        confirmCardChange(before, "face");
      }

      const railControls = [
        [".rail-half:first-child", "move_forward"],
        [".rail-color", "relationship_color"],
        [".rail-width", "relationship_strength"],
        [".rail-send", "distribution"],
        [".rail-sync", "armed_destination"],
        [".rail-half:last-child", "move_backward"]
      ];

      if (before) {
        const match = railControls.find(([selector]) =>
          target.matches(selector)
        );

        if (match) {
          captureMarketplaceIntelligence("listing_rail_control_selected", {
            listing_id: before.listingId,
            control: match[1],
            result: "selected"
          });

          if (["move_forward", "move_backward"].includes(match[1])) {
            confirmMovement(before, match[1]);
          }
        }
      }

      if (
        before &&
        normalizedLabel.startsWith("open marketplace console")
      ) {
        const side = getConsoleSide(normalizedLabel);
        window.setTimeout(() => {
          const currentCard = findCardById(before.listingId);
          const consoleElement = currentCard
            ?.closest(".ixi-marketplace-object-console");
          if (!consoleElement) return;

          captureMarketplaceIntelligence("listing_console_opened", {
            listing_id: before.listingId,
            console_side: side,
            console_depth: Number(
              consoleElement.getAttribute("data-console-depth") || 1
            ),
            result: "opened"
          });
        }, 60);
      }

      if (before && normalizedLabel.includes("close marketplace module")) {
        window.setTimeout(() => {
          const currentCard = findCardById(before.listingId);
          const consoleElement = currentCard
            ?.closest(".ixi-marketplace-object-console");

          captureMarketplaceIntelligence("listing_console_closed", {
            listing_id: before.listingId,
            console_depth: Number(
              consoleElement?.getAttribute("data-console-depth") || 1
            ),
            result: "closed"
          });
        }, 60);
      }

      if (before && normalizedLabel.startsWith("change marketplace face")) {
        captureMarketplaceIntelligence("listing_console_face_changed", {
          listing_id: before.listingId,
          result: "changed"
        });
      }

      if (normalizedLabel.startsWith("arm ")) {
        const destination = normalizedLabel
          .replace(/^arm\s+/u, "")
          .replace(/\s+/gu, "_");

        window.setTimeout(() => {
          const activeDestination = String(
            document
              .querySelector("main[data-marketplace-armed-destination]")
              ?.getAttribute("data-marketplace-armed-destination") || ""
          );

          captureMarketplaceIntelligence("armed_destination_changed", {
            destination_container: activeDestination || destination,
            result: activeDestination ? "activated" : "cancelled"
          });
        }, 40);
      }
    }

    function handlePointerDown(event) {
      if (
        event.target?.closest?.(
          "button, input, select, textarea, a"
        )
      ) {
        pointerSnapshot = null;
        return;
      }

      const card = getCard(event.target);
      pointerSnapshot = card ? readCardState(card) : null;
    }

    function handlePointerUp() {
      if (!pointerSnapshot) return;
      const before = pointerSnapshot;
      pointerSnapshot = null;
      confirmMovement(before, "drag_drop");
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerUp, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handlePointerUp, true);
      mutationObserver.disconnect();
      impressionObserver.disconnect();
    };
  }, []);

  return null;
}
