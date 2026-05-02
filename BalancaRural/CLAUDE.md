# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run local dev server (http://127.0.0.1:5173)
npm run dev

# Syntax-check all key JS files
npm run check
```

There is no build step, no bundler, and no transpilation. The app is served directly as static files.

## Architecture

**Balança Rural** is a vanilla JavaScript PWA for cattle weight tracking on farms — mobile-first, offline-capable, with optional Firebase cloud sync.

### Tech Stack

- **No framework**: pure ES6 modules, vanilla DOM manipulation
- **Local storage**: IndexedDB (primary, source of truth)
- **Cloud sync**: Firebase Firestore (optional, user-scoped)
- **Auth**: Firebase Authentication
- **PWA**: native Service Worker (`sw.js`) + `manifest.webmanifest`
- **Export**: custom CSV and PDF generation (no external libs)
- Firebase libraries loaded from CDN (no npm install needed)

### Layered Architecture

```
UI Layer          src/app/main.js (single large file ~1200 lines)
                  → routing, global state object, all event handlers, render()

Business Logic    src/features/{properties,weight-records}/
                  → domain rules and validations

Data Access       src/data/repositories/{propertiesRepository,weightRecordsRepository}.js
                  → abstract IndexedDB operations

Local DB          src/data/db/indexedDb.js
                  → IndexedDB wrapper (3 stores: properties, weightRecords, appState)

Cloud Sync        src/firebase/firestoreSync.js
                  → queues offline operations in appState store, flushes when online
```

### Data Flow

1. User input → `main.js` modifies the global `state` object
2. Mutations call repositories → IndexedDB stores data
3. If online and `firebaseSyncEnabled`, `firestoreSync.js` syncs to Firestore
4. `render()` is called to update the DOM

### Key Design Decisions

- **Local-first**: IndexedDB is always the source of truth; Firestore is a sync layer only
- **User isolation**: all data is scoped to `ownerId` (Firebase UID); Firestore rules enforce `request.auth.uid == userId`
- **Offline queue**: pending operations are stored in the `appState` IndexedDB store and flushed on reconnect
- **No SPA router library**: routing is manual in `main.js`
- **Portuguese UI**: all user-facing strings are in Brazilian Portuguese

### Firebase Configuration

Config lives in `src/firebase/config.js`. Toggle sync with `firebaseSyncEnabled`. Firestore data hierarchy:
```
users/{userId}/properties/{propertyId}
users/{userId}/weightRecords/{recordId}
users/{userId}/appState/{stateId}
```

Deploy with Firebase CLI:
```bash
firebase deploy          # deploy hosting + rules
firebase deploy --only hosting
firebase deploy --only firestore:rules
```
