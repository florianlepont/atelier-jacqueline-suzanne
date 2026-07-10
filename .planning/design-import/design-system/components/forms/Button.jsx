import React from "react";

export function Button({ children, variant = "primary", size = "md", disabled = false, ...rest }) {
  const isPrimary = variant === "primary";
  const padding = size === "sm" ? "var(--space-sm) var(--space-md)" : "var(--space-sm) var(--space-lg)";

  const base = {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-label-size)",
    fontWeight: "var(--weight-semibold)",
    lineHeight: "var(--text-label-leading)",
    padding,
    minHeight: "var(--tap-target-min)",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-xs)",
    transition: "opacity 120ms ease, background-color 120ms ease",
  };

  const style = isPrimary
    ? { ...base, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "1px solid var(--color-accent)" }
    : { ...base, background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-accent)" };

  return (
    <button
      style={style}
      disabled={disabled}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.8"; }}
      onMouseOut={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
