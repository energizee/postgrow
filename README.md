# postgrow
AdaHack project for the postcode lottery challenge.

Neighbours register their household to a postcode area, log sustainable actions, and grow their area's tree. Areas show up on a map coloured by green score and compete on leaderboards.

## Stack

- Vite + React + TypeScript
- Vanilla CSS: one `.css` file next to each component, with shared tokens in `src/styles/variables.css`
- Leaflet (`react-leaflet`) for the map
- [postcodes.io](https://postcodes.io) for postcode lookups

## Project structure

```
src/
  main.tsx          entry point
  App.tsx           top-level layout and page switching
  types/            shared TypeScript types (the data model)
  data/             fixed data: action list, demo seed data
  store/            app state + localStorage (the only place that touches storage)
  lib/              plain logic with no React: postcode lookup, scoring, map geometry
  components/       reusable UI pieces, each with its own .css file
  pages/            full screens (MapPage, ...), each with its own .css file
  styles/           variables.css (design tokens), global.css (base styles)
```
