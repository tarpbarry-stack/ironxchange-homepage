// /pages/api/update-machine-placement.js

import {
  validateMachinePlacement
} from "../../lib/machine-access/IXIMachineAccess";

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status}: ${text.slice(0, 120)}`
    );
  }
}

async function getAccessToken() {
  const response = await fetch(
    "https://flex-api.sharetribe.com/v1/auth/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=utf-8",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHARETRIBE_CLIENT_ID,
        client_secret:
          process.env.SHARETRIBE_CLIENT_SECRET,
        scope: "integ"
      })
    }
  );

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      `Auth failed: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      listingId,
      machineAccess,
      machineChannel
    } = req.body || {};

    if (!listingId) {
      return res.status(400).json({
        ok: false,
        error: "Missing listingId"
      });
    }

    const placement = validateMachinePlacement({
      access: machineAccess,
      channel: machineChannel
    });

    if (!placement.ok) {
      return res.status(400).json({
        ok: false,
        error: placement.error
      });
    }

    const changedAt = new Date().toISOString();
    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/update?expand=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          id: listingId,

          publicData: {
            machineAccess: placement.access,
            machineChannel: placement.channel,
            machinePlacementChangedAt: changedAt
          },

          metadata: {
            machineAccess: placement.access,
            machineChannel: placement.channel,
            machinePlacementChangedAt: changedAt,
            machinePlacementVersion: 1
          }
        })
      }
    );

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return res.status(200).json({
      ok: true,
      command: "UPDATE_MACHINE_PLACEMENT",
      listingId: String(listingId),

      machineAccess: placement.access,
      machineChannel: placement.channel,
      changedAt,

      sharetribe: data
    });
  } catch (error) {
    console.error(
      "UPDATE MACHINE PLACEMENT ERROR:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error.message ||
        "Machine placement update failed"
    });
  }
}
