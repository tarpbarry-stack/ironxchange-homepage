import { createHash } from "node:crypto";

const STORE_KEY = Symbol.for(
  "ironxchange.marketplace.distribution-control.v1"
);

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      rates: new Map(),
      sends: new Map()
    };
  }

  return globalThis[STORE_KEY];
}

function prune(map, now) {
  for (const [key, record] of map.entries()) {
    if (Number(record?.expiresAt || 0) <= now) {
      map.delete(key);
    }
  }
}

export function hashDistributionValue(value = "") {
  return createHash("sha256")
    .update(String(value))
    .digest("hex");
}

export function consumeMarketplaceDistributionRate({
  key,
  limit,
  windowMs,
  now = Date.now()
}) {
  const { rates } = getStore();
  prune(rates, now);

  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${key}:${windowStart}`;
  const expiresAt = windowStart + windowMs;
  const record = rates.get(bucketKey) || {
    count: 0,
    expiresAt
  };

  if (record.count >= limit) {
    const error = new Error(
      "Too many distribution requests. Wait before trying again."
    );
    error.code = "RATE_LIMITED";
    error.status = 429;
    error.retryable = true;
    error.retryAfterSeconds = Math.max(
      1,
      Math.ceil((expiresAt - now) / 1000)
    );
    throw error;
  }

  record.count += 1;
  rates.set(bucketKey, record);
}

export async function runMarketplaceDistributionIdempotently({
  key,
  fingerprint,
  ttlMs = 15 * 60 * 1000,
  task
}) {
  const { sends } = getStore();
  const now = Date.now();
  prune(sends, now);

  const existing = sends.get(key);

  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      const error = new Error(
        "This send token was already used for different content."
      );
      error.code = "IDEMPOTENCY_CONFLICT";
      error.status = 409;
      error.retryable = false;
      throw error;
    }

    if (existing.promise) {
      return {
        value: await existing.promise,
        replayed: true
      };
    }

    if (existing.value) {
      return {
        value: existing.value,
        replayed: true
      };
    }
  }

  const promise = Promise.resolve().then(task);

  sends.set(key, {
    fingerprint,
    promise,
    expiresAt: now + ttlMs
  });

  try {
    const value = await promise;
    sends.set(key, {
      fingerprint,
      value,
      expiresAt: Date.now() + ttlMs
    });
    return { value, replayed: false };
  } catch (error) {
    sends.delete(key);
    throw error;
  }
}

export function resetMarketplaceDistributionControlsForTests() {
  const store = getStore();
  store.rates.clear();
  store.sends.clear();
}
