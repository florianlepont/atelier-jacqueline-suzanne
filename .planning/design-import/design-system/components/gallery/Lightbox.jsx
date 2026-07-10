import React from "react";

export function Lightbox({ imageSrc, imageAlt = "", index = 1, total = 1, onClose, onPrev, onNext }) {
  const iconBtn = {
    background: "transparent",
    border: "none",
    color: "var(--color-dominant)",
    cursor: "pointer",
    minWidth: "var(--tap-target-min)",
    minHeight: "var(--tap-target-min)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,26,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      <button aria-label="Fermer" onClick={onClose} style={{ ...iconBtn, position: "absolute", top: "var(--space-md)", right: "var(--space-md)", fontSize: 24 }}>
        ✕
      </button>
      <button aria-label="Image précédente" onClick={onPrev} style={{ ...iconBtn, position: "absolute", left: "var(--space-md)", fontSize: 28 }}>
        ‹
      </button>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{ maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain" }}
        />
      )}
      <button aria-label="Image suivante" onClick={onNext} style={{ ...iconBtn, position: "absolute", right: "var(--space-md)", fontSize: 28 }}>
        ›
      </button>
      <span
        style={{
          position: "absolute",
          bottom: "var(--space-md)",
          left: "50%",
          transform: "translateX(-50%)",
          color: "var(--color-dominant)",
          fontSize: "var(--text-label-size)",
        }}
      >
        {index} / {total}
      </span>
    </div>
  );
}
