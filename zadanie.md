# QuickSpend v0.0.1

QuickSpend je TypeScript PWA určená na čo najrýchlejšie zaznamenávanie osobných výdavkov v telefóne. Aplikácia nemá backend ani používateľské účty; všetky záznamy zostávajú v lokálnom úložisku prehliadača.

Technický základ je React, TypeScript a Vite. Produkčný build sa publikuje z priečinka `dist` na `https://zrebec.github.io/calc/` prostredníctvom GitHub Actions.

## Spoločné správanie

- Aplikácia má tri obrazovky: Nový výdavok, Prehľad výdavkov a Export/Import.
- Medzi obrazovkami sa prepína fixnou spodnou navigáciou.
- Po každom novom otvorení alebo refreshi sa zobrazí Nový výdavok.
- Globálny prepínač umožňuje svetlú a tmavú tému. Výber sa uloží do zariadenia; bez uloženej voľby sa použije systémová téma.
- Rozhranie je v slovenčine, sumy sa zobrazujú v EUR a formátujú cez lokalitu `sk-SK`.
- Mobilný layout rešpektuje iOS safe areas, používa dynamickú výšku viewportu a nedovoľuje biely prescroll pod aplikáciou.

## Nový výdavok

Obrazovka slúži na rýchle vloženie:

- **Kategória:** vždy je vybratá práve jedna z deviatich možností s emoji ikonou:
  - Stravovanie (`dining`)
  - Domácnosť (`household`)
  - Potraviny (`groceries`, predvolené)
  - Zdravie (`health`)
  - Auto (`car`)
  - Domáci miláčikovia (`pets`)
  - Zábava (`entertainment`)
  - Paušálne náklady (`recurring`)
  - Ostatné (`other`)
- **Suma:** po otvorení dostane best-effort focus a používa numerickú klávesnicu s desatinným oddeľovačom. Akceptuje celé kladné číslo alebo najviac dve desatinné miesta s čiarkou aj bodkou, napríklad `25`, `25,25` a `25.35`. Interne sa suma uloží ako celé centy.
- **Poznámka:** nepovinný text s maximálnou dĺžkou 64 znakov.
- **Dátum a čas:** natívne `input type="date"` a `input type="time"`, prednastavené na aktuálny lokálny čas.
- **Uloženie:** plávajúce tlačidlo `✓ Hotovo` je stále viditeľné nad spodnou navigáciou, takže kvôli uloženiu netreba scrollovať na koniec formulára.

Pred zápisom sa na klientovi overí suma, kategória, poznámka a platný lokálny dátum/čas. Po úspešnom uložení sa otvorí Prehľad výdavkov a zobrazí potvrdenie.

## Prehľad výdavkov

- Predvolene zobrazuje aktuálny mesiac, jeho celkovú sumu a prepínanie medzi mesiacmi.
- Záznamy sú zoradené od najnovšieho.
- Každý záznam má dva tabuľkové riadky:
  - dátum a čas | kategória | suma tučným písmom,
  - poznámka cez všetky tri stĺpce spolu s akciami Upraviť a Zmazať.
- Úprava používa rovnaké validačné pravidlá ako nový záznam.
- Zmazanie vyžaduje potvrdenie.

## Export a import

- Export stiahne všetky záznamy ako čitateľný, verziovaný JSON.
- Obálka obsahuje `format`, `schemaVersion`, `appVersion`, `currency`, `exportedAt` a `records`.
- Exportovaná suma je presný desatinný reťazec, napríklad `"25.35"`.
- Pri ručnom dopĺňaní možno vynechať `id`, `createdAt` a `updatedAt`.
- Import sa najprv celý načíta a validuje. Ak je chybný alebo nejednoznačný čo i len jeden záznam, nezapíše sa nič.
- Záznamy sa párujú primárne podľa UUID. Bez jednoznačnej UUID zhody sa použije suma + kategória + dátum/čas; poznámka sa pri identifikovaní zhody ignoruje.
- Pri konflikte vyhrá importovaná verzia. Úplne nezmenený záznam sa preskočí.
- Ak fallback nájde viac lokálnych kandidátov alebo import obsahuje opakované neidentifikované záznamy bez UUID, celý import sa odmietne.
- Výsledok importu ukáže počet pridaných, aktualizovaných a nezmenených záznamov.

## Ukladanie a odolnosť

- Záznamy sa ukladajú pod verziovaným kľúčom `quickspend:data:v1`.
- Voľba témy sa samostatne ukladá pod `quickspend:theme`.
- Poškodené existujúce dáta aplikácia nikdy automaticky neprepíše; zápis sa uzamkne a používateľ si môže stiahnuť záchrannú kópiu.
- Lokálne záznamy s rovnakou sumou, kategóriou a časom sú povolené, pretože ich rozlišuje UUID.

## PWA a Apple zariadenia

- Zdrojová ikona je SVG; aplikácia zároveň obsahuje `favicon.png`, `apple-touch-icon.png`, ikony 192 × 192 a 512 × 512 a maskable 512 × 512 variant.
- `manifest.json` aj `sw.js` obsahujú verziu `0.0.1`.
- Service worker precachuje aplikačný shell, používa verziovaný názov cache, odstráni staré cache a umožní bezpečnú aktualizáciu.
- Manifest používa start URL, scope a ID `/calc/`, standalone režim a portrait orientáciu.

## CI a kontrola kvality

Workflow `.github/workflows/ci.yml` pri pull requeste aj pushi spúšťa:

1. čisté `npm ci`,
2. ESLint,
3. TypeScript typecheck,
4. Vitest testy,
5. produkčný build.

Push do `main` navyše nahrá `dist` ako GitHub Pages artifact a nasadí ho pomocou oficiálnych Pages actions.
