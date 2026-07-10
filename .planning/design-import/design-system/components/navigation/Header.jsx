import React from "react";

export function Header({
  siteTitle = "Atelier Jacqueline Suzanne",
  logoSrc,
  locale = "fr",
  homeLabel = "Accueil",
  navLabel = "Galeries",
  switcher,
  transparent = false,
}) {
  const ink = transparent ? "#FFFFFF" : "var(--color-ink)";
  const linkStyle = {
    fontSize: "var(--text-label-size)",
    fontWeight: "var(--text-label-weight)",
    lineHeight: "var(--text-label-leading)",
    color: ink,
    textDecoration: "none",
    minHeight: "var(--tap-target-min)",
    display: "inline-flex",
    alignItems: "center",
  };
  return (
    <header
      style={{
        background: transparent
          ? "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%)"
          : "var(--color-secondary)",
        borderBottom: transparent ? "none" : "var(--border-hairline) solid var(--color-border)",
        position: transparent ? "absolute" : "static",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        padding: "var(--space-lg) var(--space-xl)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-md)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <a href="#" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }} aria-label={siteTitle}>
        {logoSrc ? (
          <img src={logoSrc} alt={siteTitle} style={{ width: 48, height: "auto", display: "block" }} />
        ) : (
          <span
            style={{
              fontSize: "var(--text-heading-size)",
              fontWeight: "var(--text-heading-weight)",
              lineHeight: "var(--text-heading-leading)",
              color: ink,
              letterSpacing: "-0.01em",
            }}
          >
            {siteTitle}
          </span>
        )}
      </a>
      <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
        <a href="#" style={linkStyle}>{homeLabel}</a>
        <a href="#" style={linkStyle}>{navLabel}</a>
        {switcher}
      </nav>
    </header>
  );
}
