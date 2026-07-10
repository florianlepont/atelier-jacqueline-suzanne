Locked plain-text "FR | EN" locale switcher — no dropdown, no flag icons, per the product's D-11 decision.

```jsx
<LanguageSwitcher locale="en" hrefFr="/" hrefEn="/en/" />
```

Variants: `locale="fr"` vs `locale="en"` swaps which half is emphasized. Never add a dropdown, flags, or more than these two options. Pass `color` to sync the switcher's text with a dynamic accent (e.g. the homepage's per-gallery hero color) instead of the default pink.
