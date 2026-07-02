// /lib/machine-object/createSharetribeListingPayload.js

import { Money } from "sharetribe-flex-sdk".types;
import { createSharetribePublicDataFromMachine } from "./createMachineObjectModel";

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
