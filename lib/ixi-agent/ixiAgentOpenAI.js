function clean(value) {
  return String(value ?? "").trim();
}

function workerConfig() {
  return {
    apiKey: clean(process.env.OPENAI_API_KEY),
    model: clean(process.env.IXI_AGENT_MODEL) || "gpt-5.6-sol",
    ticketMcpUrl: clean(process.env.IXI_AGENT_MCP_PUBLIC_URL),
    ticketMcpToken: clean(process.env.IXI_AGENT_BRIDGE_SECRET),
    executionMcpUrl: clean(process.env.IXI_EXECUTION_MCP_URL),
    executionMcpToken: clean(process.env.IXI_EXECUTION_MCP_TOKEN)
  };
}

function requireConfig({ needsExecution = true } = {}) {
  const cfg = workerConfig();
  const missing = [];
  if (!cfg.apiKey) missing.push("OPENAI_API_KEY");
  if (!cfg.ticketMcpUrl) missing.push("IXI_AGENT_MCP_PUBLIC_URL");
  if (!cfg.ticketMcpToken) missing.push("IXI_AGENT_BRIDGE_SECRET");
  if (needsExecution && !cfg.executionMcpUrl) missing.push("IXI_EXECUTION_MCP_URL");
  if (missing.length) {
    const error = new Error(`IXI Agent Worker is not configured: ${missing.join(", ")}`);
    error.status = 503;
    error.code = "IXI_AGENT_WORKER_NOT_CONFIGURED";
    error.details = { missing };
    throw error;
  }
  return cfg;
}

function ticketTool(cfg) {
  return {
    type: "mcp",
    server_label: "ixi_ticket",
    server_url: cfg.ticketMcpUrl,
    headers: { Authorization: `Bearer ${cfg.ticketMcpToken}` },
    allowed_tools: ["get_ticket", "claim_ticket", "heartbeat_ticket", "submit_ticket_closeout"],
    require_approval: "never"
  };
}

function executionTool(cfg) {
  if (!cfg.executionMcpUrl) return null;
  return {
    type: "mcp",
    server_label: "ixi_execution",
    server_url: cfg.executionMcpUrl,
    ...(cfg.executionMcpToken ? { headers: { Authorization: `Bearer ${cfg.executionMcpToken}` } } : {}),
    require_approval: "never"
  };
}

async function createWorkerResponse({ ticket, runId, agentId, instructions }) {
  const needsExecution = ticket?.executionClass !== "review" && ticket?.type !== "research";
  const cfg = requireConfig({ needsExecution });
  const tools = [ticketTool(cfg), { type: "web_search" }];
  const execution = executionTool(cfg);
  if (needsExecution && execution) tools.push(execution);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: cfg.model,
      background: true,
      store: true,
      max_output_tokens: 24000,
      tools,
      tool_choice: "auto",
      metadata: {
        ixi_ticket_id: ticket.ticketId,
        ixi_ticket_revision: String(ticket.revision),
        ixi_agent_id: agentId,
        ixi_run_id: runId,
        repository: clean(ticket.repository).slice(0, 512)
      },
      input: [{ role: "user", content: [{ type: "input_text", text: instructions }] }]
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.id) {
    const error = new Error(payload?.error?.message || `OpenAI worker launch failed (${response.status}).`);
    error.status = response.status || 502;
    error.code = payload?.error?.code || "IXI_AGENT_OPENAI_LAUNCH_FAILED";
    error.details = payload?.error || payload;
    throw error;
  }
  return payload;
}

async function getWorkerResponse(responseId) {
  const cfg = requireConfig({ needsExecution: false });
  const id = clean(responseId);
  if (!id) throw new Error("responseId is required.");
  const response = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `OpenAI worker status failed (${response.status}).`);
    error.status = response.status;
    error.code = payload?.error?.code || "IXI_AGENT_OPENAI_STATUS_FAILED";
    throw error;
  }
  return payload;
}

module.exports = {
  createWorkerResponse,
  getWorkerResponse
};
