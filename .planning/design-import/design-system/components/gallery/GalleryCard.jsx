import React from "react";

export function GalleryCard({ title, imageSrc, imageAlt = "", href = "#", ctaLabel = "Voir la galerie" }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        aspectRatio: "1 / 1",
        position: "relative",
        overflow: "hidden",
        background: "var(--color-secondary)",
      }}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--color-secondary)",
          color: "var(--color-ink)",
          padding: "var(--space-md) var(--space-lg)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-heading-size)",
          fontWeight: "var(--text-heading-weight)",
          lineHeight: "var(--text-heading-leading)",
        }}
      >
        {title}
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          {" "}— {ctaLabel}
        </span>
      </span>
    </a>
  );
}
