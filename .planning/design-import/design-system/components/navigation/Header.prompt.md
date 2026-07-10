Site-wide header chrome — site title leading, nav + language switcher trailing, on the secondary chrome band.

```jsx
<Header
  siteTitle="Atelier Jacqueline Suzanne"
  logoSrc="../../assets/logos/AJS_Brutalist_Black_Transparent.png"
  homeLabel="Accueil"
  navLabel="Galeries"
  switcher={<LanguageSwitcher locale="fr" hrefFr="/" hrefEn="/en/" />}
/>
```

Variants: pass `locale="en"` for the English chrome; omit `switcher` while prototyping a locale-agnostic screen. Pass `transparent` to overlay the header directly on a full-bleed hero image — white nav text plus a built-in dark top-down scrim for contrast — instead of the default Secondary chrome band; use the White logo variant with it, and the Black logo variant on the solid Secondary band. Omit `logoSrc` to fall back to plain text.
