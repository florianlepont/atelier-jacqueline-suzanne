import React from "react";

export function Textarea({ label, id, placeholder, rows = 5, error, ...rest }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", fontFamily: "var(--font-sans)" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: "var(--text-label-size)", fontWeight: "var(--text-label-weight)", color: "var(--color-ink)" }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        placeholder={placeholder}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-size)",
          lineHeight: "var(--text-body-leading)",
          color: "var(--color-ink)",
          background: "var(--color-dominant)",
          border: `${error ? "var(--border-focus)" : "var(--border-hairline)"} solid ${error ? "var(--color-ink)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-sm) var(--space-md)",
          resize: "vertical",
        }}
        {...rest}
      />
      {error && (
        <span style={{ fontSize: "var(--text-label-size)", fontWeight: "var(--weight-semibold)", color: "var(--color-ink)" }}>{error}</span>
      )}
    </div>
  );
}
