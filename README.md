# QuickSpend

QuickSpend je mobilná PWA na rýchle zaznamenávanie osobných výdavkov. Funguje bez účtu a všetky údaje zostávajú v `localStorage` daného zariadenia.

## Funkcie

- rýchle zadanie sumy, jednej z deviatich kategórií, poznámky a času,
- svetlá a tmavá téma s uložením voľby,
- stále dostupné plávajúce tlačidlo na uloženie,
- mesačný prehľad so súčtom, úpravou a zmazaním,
- transakčný export/import verziovaného JSON,
- offline PWA režim a samostatné ikony pre iOS,
- automatické zostavenie a nasadenie na GitHub Pages.

## Lokálny vývoj

Vyžaduje Node.js 22.13 alebo novší a npm.

```bash
npm ci
npm run dev
```

Kontroly pred odoslaním zmeny:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Produkčný build používa base path `/quickspend/`. GitHub Pages musí mať v **Settings → Pages → Build and deployment** zvolený zdroj **GitHub Actions**.

## JSON import

Export obsahuje názov formátu, verziu schémy/aplikácie, menu a pole záznamov. Pri ručnom dopĺňaní možno vynechať `id`, `createdAt` a `updatedAt`; suma môže byť JSON číslo alebo reťazec s bodkou či čiarkou. Kategória musí byť jedna z:

`dining`, `household`, `groceries`, `health`, `car`, `pets`, `entertainment`, `recurring`, `other`.

Import najprv overí celý súbor. Pri chybe nezapíše nič.
