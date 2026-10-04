---
status: complete
---
# 261004-q4w — Legal notice: intellectual property clause, footer rights fallback

- FR and EN legal notices gain an "Propriété intellectuelle" / "Intellectual property" section: works of Romane Lepont, reproduction needs written permission, no use for AI training, text-and-data-mining opt-out (art. L. 122-5-3 CPI), contact address for permission requests.
- `BaseLayout.astro`: when the Studio `footerText` field is empty or blank the footer now shows "© Romane Lepont — Tous droits réservés" / "All rights reserved" (same wording as the image-credit fallback). The live site already had its own footer text in Sanity, so nothing changes visibly today.
- `tests/unit/legal-notice-ip.test.ts` covers both pages and the fallback.
- The legal wording has had no legal review (same caveat as the rest of the legal pages).
