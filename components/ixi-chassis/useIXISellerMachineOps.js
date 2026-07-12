import { useState } from "react";

import {
  getListingId,
  cleanMachineTitle as formatCleanMachineTitle
} from "../../lib/listingFormatters";

import {
  IXI_MACHINE_MUTATION_COMMANDS
} from "../ixi-object-system/IXIMachineMutationCommandBus";

import {
  updateMachineFacts
} from "../ixi-object-system/IXIMachineMutationEngine";

import {
  saveMachinePlacement
} from "../../lib/machine-access/saveMachinePlacement";

function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function formatPriceInput(value) {
  const num = toNumber(value);
  return num ? num.toLocaleString() : "";
}

function getListingMachineFacts(listing = {}) {
  return {
    price:
      listing.price ||
      listing.publicData?.price ||
      "",

    hours:
      listing.hours ||
      listing.publicData?.hours ||
      "",

    location:
      listing.location ||
      listing.publicData?.location ||
      listing.publicData?.city ||
      "",

    description:
      listing.description ||
      listing.publicData?.description ||
      listing.publicData?.details ||
      "",

    keywords:
      listing.keywords ||
      listing.publicData?.keywords ||
      []
  };
}
export default function useIXISellerMachineOps({
  setSellerListings,
  showActionNotice
}) {
  const [savingPriceId, setSavingPriceId] = useState("");
const [savingDescriptionId, setSavingDescriptionId] = useState("");
const [machinePlacementBusyId, setMachinePlacementBusyId] = useState("");
const [listingWorkflows, setListingWorkflows] = useState({});
    async function runInventoryMachineMutation({
    listing,
    after = {},
    context = "inventory"
  }) {
    const listingId = getListingId(listing);

    if (!listingId) {
      throw new Error("Missing listingId");
    }

    const beforeFacts = getListingMachineFacts(listing);

    return updateMachineFacts({
      commandBus: IXI_MACHINE_MUTATION_COMMANDS,
      listingId,
      title: listing.title || "",
      before: beforeFacts,
      after: {
        ...beforeFacts,
        ...after
      },
      context
    });
  }

  async function savePrice(e, listing) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const input = e.currentTarget;
    const newPrice = input.value.replace(/,/g, "").trim();
    const listingId = getListingId(listing);

    if (!listingId || !newPrice) return;

    setSavingPriceId(String(listingId));
    input.classList.remove("saved", "error");

    try {
      const mutation = await runInventoryMachineMutation({
        listing,
        after: {
          price: newPrice
        },
        context: "inventory-price"
      });

      input.value = Number(newPrice).toLocaleString();
      input.classList.add("saved");

      showActionNotice?.({
        listingId,
        message: mutation.notices?.[0] || "PRICE UPDATED",
        tone: "success"
      });

      setSellerListings(current =>
        current.map(item =>
          String(getListingId(item)) === String(listingId)
            ? {
                ...item,
                price: newPrice,
                publicData: {
                  ...(item.publicData || {}),
                  price: Number(newPrice)
                },
                _machineMutation: mutation
              }
            : item
        )
      );
    } catch (error) {
      input.classList.add("error");

      showActionNotice?.({
        listingId,
        message: "PRICE FAILED",
        tone: "error"
      });

      alert(`Price update failed: ${error.message}`);
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
    if (e.key !== "Enter") return;

    e.preventDefault();

    const input = e.currentTarget;
    const newDescription = input.value.trim();
    const listingId = getListingId(listing);

    if (!listingId) return;

    setSavingDescriptionId(String(listingId));
    input.classList.remove("saved", "error");

    try {
      const mutation = await runInventoryMachineMutation({
        listing,
        after: {
          description: newDescription
        },
        context: "inventory-description"
      });

      input.classList.add("saved");

      showActionNotice?.({
        listingId,
        message: mutation.notices?.[0] || "DESCRIPTION UPDATED",
        tone: "success"
      });

      setSellerListings(current =>
        current.map(item =>
          String(getListingId(item)) === String(listingId)
            ? {
                ...item,
                description: newDescription,
                publicData: {
                  ...(item.publicData || {}),
                  description: newDescription,
                  details: newDescription
                },
                _machineMutation: mutation
              }
            : item
        )
      );
    } catch (error) {
      input.classList.add("error");

      showActionNotice?.({
        listingId,
        message: "DESCRIPTION FAILED",
        tone: "error"
      });

      alert(`Description update failed: ${error.message}`);
    } finally {
      setSavingDescriptionId("");
    }
  }

async function saveHours(e, listing) {
  if (e.key !== "Enter") return;

  e.preventDefault();

  const input = e.currentTarget;
  const newHours = input.value.replace(/[^0-9]/g, "").trim();
  const listingId = getListingId(listing);

  if (!listingId || !newHours) return;

  input.classList.remove("saved", "error");

  try {
    const mutation = await runInventoryMachineMutation({
      listing,
      after: {
        hours: newHours
      },
      context: "inventory-hours"
    });

    input.value = Number(newHours).toLocaleString();
    input.classList.add("saved");

    showActionNotice?.({
      listingId,
      message: mutation.notices?.[0] || "HOURS UPDATED",
      tone: "success"
    });

    setSellerListings(current =>
      current.map(item =>
        String(getListingId(item)) === String(listingId)
          ? {
              ...item,
              hours: newHours,
              publicData: {
                ...(item.publicData || {}),
                hours: Number(newHours)
              },
              _machineMutation: mutation
            }
          : item
      )
    );
  } catch (error) {
    input.classList.add("error");

    showActionNotice?.({
      listingId,
      message: "HOURS FAILED",
      tone: "error"
    });

    alert(`Hours update failed: ${error.message}`);
  }
}

async function saveLocation(e, listing) {
  if (e.key !== "Enter") return;

  e.preventDefault();

  const input = e.currentTarget;
  const row = input.closest(".location-row");

  const cityInput = row?.querySelector(".city-input");
  const stateInput = row?.querySelector(".state-input");

  const city = String(cityInput?.value || "").trim();
  const state = String(stateInput?.value || "").trim().toUpperCase();

  const newLocation = [city, state].filter(Boolean).join(", ");
  const listingId = getListingId(listing);

  if (!listingId || !newLocation) return;

  cityInput?.classList.remove("saved", "error");
  stateInput?.classList.remove("saved", "error");

  try {
    const mutation = await runInventoryMachineMutation({
      listing,
      after: {
        location: newLocation
      },
      context: "inventory-location"
    });

    cityInput?.classList.add("saved");
    stateInput?.classList.add("saved");

    showActionNotice?.({
      listingId,
      message: mutation.notices?.[0] || "LOCATION UPDATED",
      tone: "success"
    });

    setSellerListings(current =>
      current.map(item =>
        String(getListingId(item)) === String(listingId)
          ? {
              ...item,
              location: newLocation,
              publicData: {
                ...(item.publicData || {}),
                location: newLocation,
                city: newLocation
              },
              _machineMutation: mutation
            }
          : item
      )
    );
  } catch (error) {
    cityInput?.classList.add("error");
    stateInput?.classList.add("error");

    showActionNotice?.({
      listingId,
      message: "LOCATION FAILED",
      tone: "error"
    });

    alert(`Location update failed: ${error.message}`);
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

  async function updateMachinePlacement(
  listing,
  nextPlacement = {}
) {
  const listingId = getListingId(listing);

  if (!listingId) {
    return;
  }

  const {
    machineAccess,
    machineChannel
  } = nextPlacement;

  setMachinePlacementBusyId(
    String(listingId)
  );

  try {
    const result =
      await saveMachinePlacement({
        listingId,
        machineAccess,
        machineChannel
      });

    setSellerListings(current =>
      current.map(item =>
        String(getListingId(item)) ===
        String(listingId)
          ? {
              ...item,

              machineAccess:
                result.machineAccess,

              machineChannel:
                result.machineChannel,

              publicData: {
                ...(item.publicData || {}),

                machineAccess:
                  result.machineAccess,

                machineChannel:
                  result.machineChannel,

                machinePlacementChangedAt:
                  result.changedAt
              },

              metadata: {
                ...(item.metadata || {}),

                machineAccess:
                  result.machineAccess,

                machineChannel:
                  result.machineChannel,

                machinePlacementChangedAt:
                  result.changedAt,

                machinePlacementVersion: 1
              }
            }
          : item
      )
    );

    const placementLabel =
      result.machineChannel === "marketplace"
        ? "MACHINE MOVED TO MARKETPLACE"
        : result.machineChannel === "auction"
          ? "MACHINE MOVED TO AUCTION"
          : "MACHINE CHANGED TO PRIVATE";

    showActionNotice?.({
      listingId,
      message: placementLabel,
      tone: "success"
    });
  } catch (error) {
    console.error(
      "MACHINE PLACEMENT UPDATE FAILED:",
      error
    );

    showActionNotice?.({
      listingId,
      message: "PLACEMENT UPDATE FAILED",
      tone: "error"
    });

    alert(
      `Machine placement failed: ${error.message}`
    );
  } finally {
    setMachinePlacementBusyId("");
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
      onHoursKeyDown: saveHours,
      onLocationKeyDown: saveLocation,

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
