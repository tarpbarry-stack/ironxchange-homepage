// Durations only: no credentials, identities, request bodies or financial values.
function createIXIGatewayTiming(res, service) {
  const startedAt = performance.now();
  const phases = {};
  return {
    async measure(name, operation) {
      const start = performance.now();
      try { return await operation(); }
      finally { phases[name] = Math.round(performance.now() - start); }
    },
    finish(status) {
      phases.total = Math.round(performance.now() - startedAt);
      res.setHeader("Server-Timing", Object.entries(phases)
        .map(([name, duration]) => `ixi-${name};dur=${duration}`).join(", "));
      console.info("IXI TRANSACT GATEWAY", { service, status, ...phases });
    }
  };
}

async function withIXIGatewayTimeout(operation, { timeoutMs, code, message }) {
  let timer;
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error(message), {
          code, status: 502
        })), timeoutMs);
      })
    ]);
  } finally { clearTimeout(timer); }
}

module.exports = { createIXIGatewayTiming, withIXIGatewayTimeout };
