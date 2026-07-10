import React from "react";

export function Footer({ text = "© 2026 Atelier Jacqueline Suzanne" }) {
  return (
    <footer
      style={{
        background: "var(--color-secondary)",
        borderTop: "var(--border-hairline) solid var(--color-border)",
        padding: "var(--space-lg) var(--space-xl)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-label-size)",
        fontWeight: "var(--text-label-weight)",
        lineHeight: "var(--text-label-leading)",
        color: "var(--color-ink)",
      }}
    >
      {text}
    </footer>
  );
}
