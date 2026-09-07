"use client"

/**
 * Last-resort boundary: it replaces the root layout, so it brings its own
 * `<html>`/`<body>` and cannot rely on the app's providers or styles.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Algo deu errado
        </h1>
        <p style={{ color: "#71717a", maxWidth: "40ch" }}>
          Ocorreu uma falha inesperada na aplicação.
        </p>
        {error.digest ? (
          <p style={{ color: "#71717a", fontSize: "0.75rem" }}>
            Referência: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            cursor: "pointer",
            border: "1px solid #d4d4d8",
            padding: "0.5rem 1rem",
            background: "transparent",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
