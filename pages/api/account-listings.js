import { loadInventoryAvailability } from "../../lib/server/aos/ixiInventoryAvailability";
import { applyInventoryProjection } from "../../lib/listings/IXISoldInventory.mjs";
import { resolveAosBrowserSession } from "../../lib/server/aos/resolveAosBrowserSession";
// /pages/api/account-listings.js

import {
  fetchSharetribeListingsByAuthor
} from "../../lib/listings/fetchSharetribeListingsByAuthor";

import {
  normalizeSharetribeListings
} from "../../lib/listings/normalizeSharetribeListings";

import {
  filterAosOwnedMachines
} from "../../lib/listings/IXIAosOwnedInventoryPolicy.mjs";

export function createAccountListingsHandler(dependencies = {}) {
const resolveSession = dependencies.resolveSession || resolveAosBrowserSession;
const fetchListings = dependencies.fetchListings || fetchSharetribeListingsByAuthor;
const loadAvailability = dependencies.loadAvailability || loadInventoryAvailability;
return async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate"
  );
  if (req.method !== "GET") return res.status(405).json({ error: "GET required." });

  try {
    const session = await resolveSession(req, res);
    const authorId = String(session?.userId || "").trim();

    if (!authorId) {
      return res.status(401).json({
        error: "Sign in to view your inventory."
      });
    }
    if (req.query.authorId && String(req.query.authorId) !== authorId) return res.status(403).json({ error: "This inventory belongs to another account." });

    const [rawInventory, availability] = await Promise.all([fetchListings(authorId), loadAvailability(authorId)]);

    const normalizedListings =
      applyInventoryProjection(normalizeSharetribeListings(rawInventory), availability);

    const requestedInventory =
      req.query.scope === "aos-owned"
        ? filterAosOwnedMachines(normalizedListings)
        : normalizedListings;

    const activeInventory =
      requestedInventory
        .filter(item => {
          return (
            item.listingStatus !== "deleted" &&
            item.listingStatus !== "archived"
          );
        })
        .map(item => {
          let age = null;

          if (item.createdAt) {
            const created =
              new Date(item.createdAt);

            const now =
              new Date();

            age = Math.max(
              0,
              Math.floor(
                (now - created) /
                  (1000 * 60 * 60 * 24)
              )
            );
          }

          return {
            ...item,
            age
          };
        });

    return res
      .status(200)
      .json(activeInventory);
  } catch (error) {
    console.error(
      "ACCOUNT LISTINGS ERROR:",
      error
    );

    return res.status(error.status || 500).json({
      error:
        error.message ||
        "Failed to load account listings"
    });
  }
};
}

export default createAccountListingsHandler();
