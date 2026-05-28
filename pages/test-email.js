import { useState } from "react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function sendTest() {
    setStatus("Sending...");

    try {
      const res = await fetch("/api/email/welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          firstName: "Test"
        })
      });

      const data = await res.json();

      setStatus(JSON.stringify(data, null, 2));
    } catch (err) {
      setStatus(err.message || "Failed");
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0b0b0b",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
      padding: 40
    }}>
      <h1>IronXchange Email Test</h1>

      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your email"
        style={{
          width: 320,
          height: 40,
          padding: 10,
          marginRight: 10
        }}
      />

      <button onClick={sendTest} style={{ height: 40 }}>
        Send Test
      </button>

      <pre style={{ marginTop: 30, whiteSpace: "pre-wrap" }}>
        {status}
      </pre>
    </main>
  );
}
