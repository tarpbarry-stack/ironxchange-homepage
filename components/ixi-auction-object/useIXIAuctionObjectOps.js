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

function cleanNumber(
  value = ""
) {
  return String(value)
    .replace(
      /[^0-9]/g,
      ""
    )
    .trim();
}

function getPublicData(
  listing = {}
) {
  return (
    listing?.publicData ||
    listing?.attributes
      ?.publicData ||
    {}
  );
}

function getExistingFacts(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

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

    lotNumber:
      listing?.lotNumber ??
      publicData?.lotNumber ??
      listing?.auction
        ?.lot?.lotNumber ??
      publicData?.auction
        ?.lot?.lotNumber ??
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

function getNoticeMessage({
  field,
  mutation
}) {
  const noticeMap = {
    price:
      "AUCTION PRICE UPDATED",

    hours:
      "AUCTION HOURS UPDATED",

    location:
      "MACHINE LOCATION UPDATED",

    lotNumber:
      "AUCTION LOT NUMBER UPDATED"
  };

  return (
    mutation?.notices?.[0] ||
    noticeMap[field] ||
    "AUCTION OBJECT UPDATED"
  );
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
    slotId: "",
    face: 0,
    field: ""
  });

  const [
    panelNotifications,
    setPanelNotifications
  ] = useState({});

  function getPanelNotificationKey({
    listingId,
    slotId
  }) {
    return [
      String(
        listingId || ""
      ),

      String(
        slotId || "listing"
      )
    ].join("::");
  }

  function setPanelNotification({
    listingId,
    slotId,
    face,
    field,
    status,
    message
  }) {
    const key =
      getPanelNotificationKey({
        listingId,
        slotId
      });

    setPanelNotifications(
      current => ({
        ...current,

        [key]: {
          listingId:
            String(
              listingId || ""
            ),

          slotId:
            String(
              slotId ||
              "listing"
            ),

          face:
            Number(face) || 1,

          field:
            String(
              field || ""
            ),

          status:
            String(
              status || ""
            ),

          message:
            String(
              message || ""
            ),

          updatedAt:
            Date.now()
        }
      })
    );
  }

  function clearPanelNotification({
    listingId,
    slotId
  }) {
    const key =
      getPanelNotificationKey({
        listingId,
        slotId
      });

    setPanelNotifications(
      current => {
        if (!current[key]) {
          return current;
        }

        const next = {
          ...current
        };

        delete next[key];

        return next;
      }
    );
  }

  function getPanelNotification(
    listingId,
    slotId
  ) {
    const key =
      getPanelNotificationKey({
        listingId,
        slotId
      });

    return (
      panelNotifications[key] ||
      null
    );
  }

  function getDraft(
    listing = {}
  ) {
    const listingId =
      String(
        getListingId(listing) ||
        ""
      );

    return (
      auctionDrafts[
        listingId
      ] ||
      {}
    );
  }

  function updateDraft(
    listing,
    field,
    value
  ) {
    const listingId =
      String(
        getListingId(listing) ||
        ""
      );

    if (!listingId) {
      return;
    }

    setAuctionDrafts(
      current => ({
        ...current,

        [listingId]: {
          ...(
            current[
              listingId
            ] ||
            {}
          ),

          [field]:
            value
        }
      })
    );
  }

  function clearDraftField(
    listingId,
    field
  ) {
    setAuctionDrafts(
      current => {
        const existing =
          current[
            listingId
          ];

        if (!existing) {
          return current;
        }

        const nextRecord = {
          ...existing
        };

        delete nextRecord[
          field
        ];

        if (
          Object.keys(
            nextRecord
          ).length === 0
        ) {
          const nextState = {
            ...current
          };

          delete nextState[
            listingId
          ];

          return nextState;
        }

        return {
          ...current,

          [listingId]:
            nextRecord
        };
      }
    );
  }

  async function persistAuctionField({
    listing,
    field,
    value
  }) {
    const listingId =
      String(
        getListingId(listing) ||
        ""
      );

    if (!listingId) {
      throw new Error(
        "Missing auction listing ID"
      );
    }

    const before =
      getExistingFacts(
        listing
      );

    const after = {
      ...before,

      [field]:
        value
    };

    return updateMachineFacts({
      commandBus:
        IXI_MACHINE_MUTATION_COMMANDS,

      listingId,

      title:
        listing?.title ||
        "",

      before,
      after,

      context:
        `auction-work-${field}`
    });
  }

  function updateListingAfterSave({
    listingId,
    field,
    value,
    mutation
  }) {
    if (
      typeof setListings !==
      "function"
    ) {
      return;
    }

    setListings(
      current =>
        current.map(item => {
          const itemId =
            String(
              getListingId(
                item
              ) ||
              ""
            );

          if (
            itemId !==
            listingId
          ) {
            return item;
          }

          const publicData =
            getPublicData(
              item
            );

          if (
            field ===
            "price"
          ) {
            return {
              ...item,

              price:
                value,

              publicData: {
                ...publicData,

                price:
                  Number(
                    value
                  )
              },

              _machineMutation:
                mutation
            };
          }

          if (
            field ===
            "hours"
          ) {
            return {
              ...item,

              hours:
                value,

              publicData: {
                ...publicData,

                hours:
                  Number(
                    value
                  )
              },

              _machineMutation:
                mutation
            };
          }

          if (
            field ===
            "location"
          ) {
            return {
              ...item,

              location:
                value,

              publicData: {
                ...publicData,

                location:
                  value,

                city:
                  value,

                cityState:
                  value
              },

              _machineMutation:
                mutation
            };
          }

          if (
            field ===
            "lotNumber"
          ) {
            const auction =
              item?.auction &&
              typeof item.auction ===
                "object"
                ? item.auction
                : {};

            const auctionLot =
              auction?.lot &&
              typeof auction.lot ===
                "object"
                ? auction.lot
                : {};

            const publicAuction =
              publicData?.auction &&
              typeof publicData.auction ===
                "object"
                ? publicData.auction
                : {};

            const publicAuctionLot =
              publicAuction?.lot &&
              typeof publicAuction.lot ===
                "object"
                ? publicAuction.lot
                : {};

            return {
              ...item,

              lotNumber:
                value,

              auction: {
                ...auction,

                lot: {
                  ...auctionLot,

                  lotNumber:
                    value
                }
              },

              publicData: {
                ...publicData,

                lotNumber:
                  value,

                auction: {
                  ...publicAuction,

                  lot: {
                    ...publicAuctionLot,

                    lotNumber:
                      value
                  }
                }
              },

              _machineMutation:
                mutation
            };
          }

          return item;
        })
    );
  }

  function createEnterHandler(
    listing,
    field,
    panelContext = {}
  ) {
    return async event => {
      if (
        event.key !==
        "Enter"
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const listingId =
        String(
          getListingId(
            listing
          ) ||
          ""
        );

      if (!listingId) {
        return;
      }

      const slotId =
        String(
          panelContext.slotId ||
          "listing"
        );

      const face =
        Number(
          panelContext.face
        ) || 1;

      const draft =
        getDraft(
          listing
        );

      let value =
        draft[field];

      if (
        value === undefined
      ) {
        value =
          event
            .currentTarget
            ?.value ??
          "";
      }

      if (
        field === "price" ||
        field === "hours"
      ) {
        value =
          cleanNumber(
            value
          );
      } else {
        value =
          String(
            value || ""
          ).trim();
      }

      if (!value) {
        return;
      }

      setPanelNotification({
        listingId,
        slotId,
        face,
        field,

        status:
          "saving",

        message:
          "SAVING..."
      });

      setSavingField({
        listingId,
        slotId,
        face,
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

        updateListingAfterSave({
          listingId,
          field,
          value,
          mutation
        });

        clearDraftField(
          listingId,
          field
        );

        event.currentTarget
          ?.classList
          ?.add(
            "saved"
          );

        const successMessage =
          getNoticeMessage({
            field,
            mutation
          });

        setPanelNotification({
          listingId,
          slotId,
          face,
          field,

          status:
            "success",

          message:
            successMessage
        });

        showActionNotice?.({
          listingId,
          slotId,
          face,
          field,

          message:
            successMessage,

          tone:
            "success"
        });

        return {
          ok: true,

          listingId,
          slotId,
          face,
          field,
          value,
          mutation,

          message:
            successMessage
        };
      } catch (error) {
        console.error(
          "AUCTION OBJECT UPDATE FAILED:",
          {
            listingId,
            slotId,
            face,
            field,
            error
          }
        );

        event.currentTarget
          ?.classList
          ?.add(
            "error"
          );

        const failureMessage =
          `${
            field.toUpperCase()
          } UPDATE FAILED`;

        setPanelNotification({
          listingId,
          slotId,
          face,
          field,

          status:
            "error",

          message:
            failureMessage
        });

        showActionNotice?.({
          listingId,
          slotId,
          face,
          field,

          message:
            failureMessage,

          tone:
            "error"
        });

        window.alert(
          `Auction update failed: ${
            error?.message ||
            "Unknown error"
          }`
        );

        return {
          ok: false,

          listingId,
          slotId,
          face,
          field,
          value,
          error,

          message:
            failureMessage
        };
      } finally {
        setSavingField({
          listingId: "",
          slotId: "",
          face: 0,
          field: ""
        });
      }
    };
  }

  function getAuctionListingCardProps(
    listing = {},
    panelContext = {}
  ) {
    const listingId =
      String(
        getListingId(
          listing
        ) ||
        ""
      );

    const publicData =
      getPublicData(
        listing
      );

    const draft =
      getDraft(
        listing
      );

    const normalizedPanelContext = {
      slotId:
        String(
          panelContext.slotId ||
          "listing"
        ),

      face:
        Number(
          panelContext.face
        ) || 1
    };

    const existingLocation =
      listing?.location ??
      publicData?.location ??
      publicData?.cityState ??
      publicData?.city ??
      "";

    const existingLotNumber =
      listing?.lotNumber ??
      publicData?.lotNumber ??
      listing?.auction
        ?.lot?.lotNumber ??
      publicData?.auction
        ?.lot?.lotNumber ??
      "";

    return {
      priceValue:
        draft.price !==
        undefined
          ? draft.price
          : (
              listing?.price ??
              publicData?.price ??
              ""
            ),

      onPriceChange:
        value => {
          updateDraft(
            listing,
            "price",
            cleanNumber(
              value
            )
          );
        },

      onPriceKeyDown:
        createEnterHandler(
          listing,
          "price",
          normalizedPanelContext
        ),

      hoursValue:
        draft.hours !==
        undefined
          ? draft.hours
          : String(
              listing?.hours ??
              publicData?.hours ??
              ""
            ).replace(
              /[^0-9]/g,
              ""
            ),

      onHoursChange:
        value => {
          updateDraft(
            listing,
            "hours",
            cleanNumber(
              value
            )
          );
        },

      onHoursKeyDown:
        createEnterHandler(
          listing,
          "hours",
          normalizedPanelContext
        ),

      locationValue:
        draft.location !==
        undefined
          ? draft.location
          : existingLocation,

      onLocationChange:
        value => {
          updateDraft(
            listing,
            "location",
            value
          );
        },

      onLocationKeyDown:
        createEnterHandler(
          listing,
          "location",
          normalizedPanelContext
        ),

      lotNumberValue:
        draft.lotNumber !==
        undefined
          ? draft.lotNumber
          : existingLotNumber,

      onLotNumberChange:
        value => {
          updateDraft(
            listing,
            "lotNumber",
            value
          );
        },

      onLotNumberKeyDown:
        createEnterHandler(
          listing,
          "lotNumber",
          normalizedPanelContext
        ),

      savingAuctionField:
        (
          savingField
            .listingId ===
          listingId
        ) &&
        (
          savingField
            .slotId ===
          normalizedPanelContext
            .slotId
        )
          ? savingField.field
          : "",

      panelNotification:
        getPanelNotification(
          listingId,
          normalizedPanelContext
            .slotId
        )
    };
  }

  return {
    auctionDrafts,
    savingField,
    panelNotifications,

    getDraft,
    updateDraft,

    getPanelNotification,
    setPanelNotification,
    clearPanelNotification,

    persistAuctionField,
    createEnterHandler,

    getAuctionListingCardProps
  };
}
