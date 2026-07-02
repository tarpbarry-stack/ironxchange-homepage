// /lib/machine-object/createSharetribeListingPayload.js

import { types as sdkTypes } from "sharetribe-flex-sdk";
import { createSharetribePublicDataFromMachine } from "./createMachineObjectModel";

const { Money } = sdkTypes;

function cleanNumber(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

export function createSharetribeListingPayload({
  machine,
  imageIds = []
}) {
  const amount = Number(cleanNumber(machine.price || 0));

  return {
    title: machine.title,

    description: machine.description || "",

    publicData: createSharetribePublicDataFromMachine(machine),

    price: new Money(
      amount * 100,
      "USD"
    ),

    images: imageIds
  };
}
