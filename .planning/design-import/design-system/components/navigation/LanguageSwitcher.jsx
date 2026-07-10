import React from "react";

export function LanguageSwitcher({ locale = "fr", hrefFr = "#", hrefEn = "#", color = "var(--color-accent)" }) {
  const linkStyle = (active) => ({
    fontSize: "var(--text-label-size)",
    fontWeight: active ? "var(--weight-semibold)" : "var(--text-label-weight)",
    lineHeight: "var(--text-label-leading)",
    color: color,
    textDecoration: active ? "underline" : "none",
    textUnderlineOffset: "3px",
    padding: "var(--space-sm)",
    minHeight: "var(--tap-target-min)",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 200ms ease",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontFamily: "var(--font-sans)" }}>
      <a href={hrefFr} style={linkStyle(locale === "fr")} aria-current={locale === "fr" ? "true" : undefined}>
        FR
      </a>
      <span style={{ color: color, opacity: 0.5, fontSize: "var(--text-label-size)" }}>|</span>
      <a href={hrefEn} style={linkStyle(locale === "en")} aria-current={locale === "en" ? "true" : undefined}>
        EN
      </a>
    </div>
  );
}
