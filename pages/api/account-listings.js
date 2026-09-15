import { loadInventoryAvailability } from "../../lib/server/aos/ixiInventoryAvailability";
import { applyInventoryProjection } from "../../lib/listings/IXISoldInventory.mjs";
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

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate"
  );

  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({
        error: "Missing authorId"
      });
    }

    const [rawInventory, availability] = await Promise.all([fetchSharetribeListingsByAuthor(String(authorId)), loadInventoryAvailability(String(authorId))]);

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

    return res.status(500).json({
      error:
        error.message ||
        "Failed to load account listings"
    });
  }
}
