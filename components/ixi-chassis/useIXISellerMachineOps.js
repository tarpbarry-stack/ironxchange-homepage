import { useState } from "react";
import { getListingId, cleanMachineTitle as formatCleanMachineTitle } from "../../lib/listingFormatters";

function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function formatPriceInput(value) {
  const num = toNumber(value);
  return num ? num.toLocaleString() : "";
}

export default function useIXISellerMachineOps({
  setSellerListings
}) {
  const [savingPriceId, setSavingPriceId] = useState("");
  const [savingDescriptionId, setSavingDescriptionId] = useState("");
  const [listingWorkflows, setListingWorkflows] = useState({});

  async function savePrice(e, listing) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const input = e.currentTarget;
    const newPrice = input.value.replace(/,/g, "").trim();

    if (!listing?.id || !newPrice) return;

    setSavingPriceId(String(listing.id));
    input.classList.remove("saved", "error");

    try {
      const response = await fetch("/api/update-listing-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id,
          price: newPrice
        })
      });

      if (!response.ok) throw new Error("Price update failed");

      input.value = Number(newPrice).toLocaleString();
      input.classList.add("saved");
    } catch {
      input.classList.add("error");
      alert("Price update failed.");
    } finally {
      setSavingPriceId("");
    }
  }

  async function confirmDelete(listing) {
    const ok = window.confirm(
      `Delete this listing?\n\n${formatCleanMachineTitle(listing.title)}\n\nThis cannot be undone.`
    );

    if (!ok) return;

    try {
      const response = await fetch("/api/delete-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setSellerListings(current =>
        current.filter(
          item => String(item.id) !== String(listing.id)
        )
      );
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
      console.error("Delete failed:", error);
    }
  }

  async function saveDescription(e, listing) {
  if (e.key !== "Enter" || !e.metaKey) return;

  e.preventDefault();

  const input = e.currentTarget;
  const newDescription = input.value.trim();

  if (!listing?.id) return;

  setSavingDescriptionId(String(listing.id));
  input.classList.remove("saved", "error");

  try {
    const response = await fetch("/api/update-listing-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId: listing.id,
        description: newDescription
      })
    });

    if (!response.ok) throw new Error("Description update failed");

    input.classList.add("saved");

    setSellerListings(current =>
      current.map(item =>
        String(item.id) === String(listing.id)
          ? {
              ...item,
              description: newDescription,
              publicData: {
                ...(item.publicData || {}),
                description: newDescription,
                details: newDescription
              }
            }
          : item
      )
    );
  } catch {
    input.classList.add("error");
    alert("Description update failed.");
  } finally {
    setSavingDescriptionId("");
  }
}

  async function pauseListing(listing) {
    const ok = window.confirm(
      `Pause this listing?\n\n${formatCleanMachineTitle(listing.title)}`
    );

    if (!ok) return;

    try {
      const response = await fetch("/api/pause-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pause failed");
      }

      setSellerListings(current =>
        current.map(item =>
          String(item.id) === String(listing.id)
            ? {
                ...item,
                publicData: {
                  ...(item.publicData || {}),
                  listingStatus: "paused"
                },
                listingStatus: "paused"
              }
            : item
        )
      );
    } catch (error) {
      alert(`Pause failed: ${error.message}`);
      console.error("Pause failed:", error);
    }
  }

  async function reactivateListing(listing) {
    try {
      const response = await fetch("/api/reactivate-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reactivate failed");
      }

      setSellerListings(current =>
        current.map(item =>
          String(item.id) === String(listing.id)
            ? {
                ...item,
                publicData: {
                  ...(item.publicData || {}),
                  listingStatus: "live"
                },
                listingStatus: "live"
              }
            : item
        )
      );
    } catch (error) {
      alert(`Reactivate failed: ${error.message}`);
      console.error("Reactivate failed:", error);
    }
  }

  function getWorkflowStatus(listing) {
    const listingId = getListingId(listing);

    return (
      listingWorkflows[listingId] ||
      listing.workflowStatus ||
      listing.publicData?.workflowStatus ||
      listing.attributes?.publicData?.workflowStatus ||
      listing.metadata?.workflowStatus ||
      listing.attributes?.metadata?.workflowStatus ||
      "good-listing"
    );
  }

  async function updateWorkflowStatus(listing, status) {
    const listingId = getListingId(listing);

    if (!listingId) return;

    setListingWorkflows(current => ({
      ...current,
      [listingId]: status
    }));

    try {
      const response = await fetch("/api/update-listing-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId,
          workflowStatus: status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Workflow update failed");
      }
    } catch (error) {
      alert(`Workflow update failed: ${error.message}`);
      console.error("Workflow update failed:", error);
    }
  }

  function getSellerListingCardProps(listing) {
    const listingId = getListingId(listing);

    const listingStatus =
      listing.listingStatus ||
      listing.publicData?.listingStatus ||
      listing.attributes?.publicData?.listingStatus ||
      "live";

    return {
      showSave: false,
      from: "account",
      sellerMode: true,

      workflowValue: getWorkflowStatus(listing),
      onWorkflowChange: updateWorkflowStatus,

      priceValue: formatPriceInput(listing.price),
      onPriceKeyDown: savePrice,

      savingPrice: savingPriceId === String(listingId),

      descriptionValue:
  listing.description ||
  listing.publicData?.description ||
  listing.publicData?.details ||
  "",

      onDescriptionKeyDown: saveDescription,

      savingDescription:
      savingDescriptionId === String(listingId),

      isPaused: listingStatus === "paused",

      onEdit: item => {
        window.location.href = `/live?id=${getListingId(item)}`;
      },

      onPause: pauseListing,
      onReactivate: reactivateListing,
      onDelete: confirmDelete
    };
  }

  return {
    savingPriceId,
    getSellerListingCardProps
  };
}
