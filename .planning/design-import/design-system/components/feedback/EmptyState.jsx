import React from "react";

export function EmptyState({ heading = "Galeries à venir", body = "De nouvelles œuvres seront bientôt visibles ici. Revenez prochainement." }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        textAlign: "center",
        padding: "var(--space-3xl) var(--space-lg)",
        color: "var(--color-ink)",
      }}
    >
      <p style={{ fontSize: "var(--text-heading-size)", fontWeight: "var(--text-heading-weight)", lineHeight: "var(--text-heading-leading)", margin: "0 0 var(--space-sm) 0" }}>
        {heading}
      </p>
      <p style={{ fontSize: "var(--text-body-size)", fontWeight: "var(--text-body-weight)", lineHeight: "var(--text-body-leading)", margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
