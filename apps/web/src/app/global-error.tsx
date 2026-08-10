"use client";

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", background: "#0B0F14", color: "#E6EDF3" }}>
        <main style={{ maxWidth: "60rem" }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.75rem" }}>The application stopped</h1>
          <p style={{ margin: "0 0 1rem", color: "#9FB0C0" }}>
            Nothing was selected, saved or published. The failure is shown below.
          </p>
          <pre style={{
            whiteSpace: "pre-wrap", wordBreak: "break-word", padding: "1rem",
            background: "#111820", border: "1px solid #24303C", borderRadius: "0.5rem",
            fontSize: "0.8125rem", lineHeight: 1.5,
          }}>
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
          <button
            type="button"
            onClick={reset}
            style={{
              marginBlockStart: "1rem", padding: "0.5rem 1rem", fontSize: "0.875rem",
              color: "#E6EDF3", background: "#1B2430", border: "1px solid #2C3A48",
              borderRadius: "0.375rem", cursor: "pointer",
            }}
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
