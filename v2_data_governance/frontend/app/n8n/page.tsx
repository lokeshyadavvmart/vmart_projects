// app/n8n/page.tsx
"use client";

import { useState } from "react";

export default function N8NTriggerPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const triggerFlow = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5678/webhook-test/d3a1a97c-21cc-4e63-a741-91d84542ee34", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Start workflow" }),
      });

      const text = await res.text();
      setResponse(text);
    } catch (err: any) {
      setResponse("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Trigger n8n Workflow</h1>

      <button
        onClick={triggerFlow}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
      >
        {loading ? "Triggering..." : "Trigger n8n Webhook"}
      </button>

      {response && (
        <pre className="mt-6 p-4 bg-gray-200 rounded w-full max-w-xl overflow-x-auto text-sm">
          {response}
        </pre>
      )}
    </div>
  );
}
