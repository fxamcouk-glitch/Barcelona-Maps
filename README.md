# Barcelona-Maps

Our shared map of places to see and eat in Barcelona, 8–11 October 2026.

- **Live site:** https://fxamcouk-glitch.github.io/Barcelona-Maps/
- Anyone with the link can view, add, edit and pin places. Changes show up for everyone straight away.
- "Show where I am" uses your phone's location to put you on the map and list the nearest places.

## How it's built

A plain static site on GitHub Pages: `index.html`, `styles.css`, `app.js`.

- Map: [Leaflet](https://leafletjs.com) with OpenStreetMap / CARTO tiles.
- Address search: OpenStreetMap Nominatim.
- Shared places: Cloud Firestore (Firebase). Config in `firebase-config.js`, security rules in `firestore.rules`.
- `seed.js` holds the starting list. It's written to the database once, the first time the site opens with an empty database.
