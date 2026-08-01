import { useState } from "react";

import {
  getListingId
} from "../../lib/listingFormatters";

import {
  IXI_MACHINE_MUTATION_COMMANDS
} from "../ixi-object-system/IXIMachineMutationCommandBus";

import {
  updateMachineFacts
} from "../ixi-object-system/IXIMachineMutationEngine";

function cleanNumber(value = "") {
  return String(value)
    .replace(/[^0-9]/g, "")
    .trim();
}

function getPublicData(listing = {}) {
  return (
    listing?.publicData ||
    listing?.attributes?.publicData ||
    {}
  );
}

function getExistingFacts(listing = {}) {
  const publicData = getPublicData(listing);

  return {
    price:
      listing?.price ??
      publicData?.price ??
      "",

    hours:
      listing?.hours ??
      publicData?.hours ??
      "",

    location:
      listing?.location ??
      publicData?.location ??
      publicData?.cityState ??
      publicData?.city ??
      "",

    description:
      listing?.description ??
      publicData?.description ??
      publicData?.details ??
      "",

    keywords:
      listing?.keywords ??
      publicData?.keywords ??
      []
  };
}

export default function useIXIAuctionObjectOps({
  setListings,
  showActionNotice
}) {
  const [
    auctionDrafts,
    setAuctionDrafts
  ] = useState({});

  const [
    savingField,
    setSavingField
  ] = useState({
    listingId: "",
    field: ""
  });

  function getDraft(listing = {}) {
    const listingId = String(
      getListingId(listing) || ""
    );

    return (
      auctionDrafts[listingId] ||
      {}
    );
  }

  function updateDraft(
    listing,
    field,
    value
  ) {
    const listingId = String(
      getListingId(listing) || ""
    );

    if (!listingId) return;

    setAuctionDrafts(current => ({
      ...current,

      [listingId]: {
        ...(current[listingId] || {}),
        [field]: value
      }
    }));
  }

  function clearDraftField(
    listingId,
    field
  ) {
    setAuctionDrafts(current => {
      const existing =
        current[listingId];

      if (!existing) {
        return current;
      }

      const nextRecord = {
        ...existing
      };

      delete nextRecord[field];

      if (
        Object.keys(nextRecord)
          .length === 0
      ) {
        const nextState = {
          ...current
        };

        delete nextState[listingId];

        return nextState;
      }

      return {
        ...current,
        [listingId]: nextRecord
      };
    });
  }

  async function persistAuctionField({
    listing,
    field,
    value
  }) {
    const listingId = String(
      getListingId(listing) || ""
    );

    if (!listingId) {
      throw new Error(
        "Missing auction listing ID"
      );
    }

    const before =
      getExistingFacts(listing);

    const after = {
      ...before,
      [field]: value
    };

    return updateMachineFacts({
      commandBus:
        IXI_MACHINE_MUTATION_COMMANDS,

      listingId,
      title:
        listing?.title || "",

      before,
      after,

      context:
        `auction-work-${field}`
    });
  }

  function createEnterHandler(
    listing,
    field
  ) {
    return async event => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const listingId = String(
        getListingId(listing) || ""
      );

      if (!listingId) {
        return;
      }

      const draft =
        getDraft(listing);

      let value =
        draft[field];

      if (
        value === undefined
      ) {
        value =
          event.currentTarget?.value ??
          "";
      }

      if (
        field === "price" ||
        field === "hours"
      ) {
        value =
          cleanNumber(value);
      } else {
        value =
          String(value || "")
            .trim();
      }

      if (!value) {
        return;
      }

      setSavingField({
        listingId,
        field
      });

      event.currentTarget
        ?.classList
        ?.remove(
          "saved",
          "error"
        );

      try {
        const mutation =
          await persistAuctionField({
            listing,
            field,
            value
          });

        setListings(current =>
          current.map(item => {
            const itemId = String(
              getListingId(item) || ""
            );

            if (
              itemId !== listingId
            ) {
              return item;
            }

            const publicData =
              getPublicData(item);

            if (
              field === "price"
            ) {
              return {
                ...item,

                price: value,

                publicData: {
                  ...publicData,
                  price: Number(value)
                },

                _machineMutation:
                  mutation
              };
            }

            if (
              field === "hours"
            ) {
              return {
                ...item,

                hours: value,

                publicData: {
                  ...publicData,
                  hours: Number(value)
                },

                _machineMutation:
                  mutation
              };
            }

            if (
              field === "location"
            ) {
              return {
                ...item,

                location: value,

                publicData: {
                  ...publicData,
                  location: value,
                  city: value,
                  cityState: value
                },

                _machineMutation:
                  mutation
              };
            }

            return item;
          })
        );

        clearDraftField(
          listingId,
          field
        );

        event.currentTarget
          ?.classList
          ?.add("saved");

        const noticeMap = {
          price:
            "AUCTION PRICE UPDATED",

          hours:
            "AUCTION HOURS UPDATED",

          location:
            "MACHINE LOCATION UPDATED"
        };

        showActionNotice?.({
          listingId,

          message:
            mutation?.notices?.[0] ||
            noticeMap[field] ||
            "AUCTION OBJECT UPDATED",

          tone: "success"
        });
      } catch (error) {
        console.error(
          "AUCTION OBJECT UPDATE FAILED:",
          {
            listingId,
            field,
            error
          }
        );

        event.currentTarget
          ?.classList
          ?.add("error");

        showActionNotice?.({
          listingId,

          message:
            `${field.toUpperCase()} UPDATE FAILED`,

          tone: "error"
        });

        window.alert(
          `Auction update failed: ${
            error?.message ||
            "Unknown error"
          }`
        );
      } finally {
        setSavingField({
          listingId: "",
          field: ""
        });
      }
    };
  }

  function getAuctionListingCardProps(
    listing = {}
  ) {
    const listingId = String(
      getListingId(listing) || ""
    );

    const publicData =
      getPublicData(listing);

    const draft =
      getDraft(listing);

    const existingLocation =
      listing?.location ??
      publicData?.location ??
      publicData?.cityState ??
      "";

    return {
      priceValue:
        draft.price !== undefined
          ? draft.price
          : (
              listing?.price ??
              publicData?.price ??
              ""
            ),

      onPriceChange: value => {
        updateDraft(
          listing,
          "price",
          value
        );
      },

      onPriceKeyDown:
        createEnterHandler(
          listing,
          "price"
        ),

      hoursValue:
        draft.hours !== undefined
          ? draft.hours
          : String(
              listing?.hours ??
              publicData?.hours ??
              ""
            ).replace(
              /[^0-9]/g,
              ""
            ),

      onHoursChange: value => {
        updateDraft(
          listing,
          "hours",
          cleanNumber(value)
        );
      },

      onHoursKeyDown:
        createEnterHandler(
          listing,
          "hours"
        ),

      locationValue:
        draft.location !== undefined
          ? draft.location
          : existingLocation,

      onLocationChange: value => {
        updateDraft(
          listing,
          "location",
          value
        );
      },

      onLocationKeyDown:
        createEnterHandler(
          listing,
          "location"
        ),

      lotNumberValue:
        draft.lotNumber !== undefined
          ? draft.lotNumber
          : (
              listing?.lotNumber ??
              publicData?.lotNumber ??
              ""
            ),

      onLotNumberChange: value => {
        updateDraft(
          listing,
          "lotNumber",
          value
        );
      },

      savingAuctionField:
        savingField.listingId ===
        listingId
          ? savingField.field
          : ""
    };
  }

  return {
    auctionDrafts,
    savingField,
    getAuctionListingCardProps
  };
}
