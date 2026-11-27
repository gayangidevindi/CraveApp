# CraveApp – Discover. Cook. Enjoy.

CraveApp is a cross-platform recipe discovery and cooking companion built with
React Native and Expo. Browse recipes from TheMealDB, save favourites, track
ingredients, and keep key recipe data available offline.

## Features

- DummyJSON demo login, local account registration, session restoration, and
  logout.
- Device-local account credentials stored as salted PBKDF2-SHA256 hashes.
- SecureStore-backed native auth tokens; browser auth uses less secure browser
  storage (see [Authentication and storage](#authentication-and-storage)).
- Recipe search, featured and random recipes, category and cuisine filters.
- Debounced recipe search, recently viewed history, responsive recipe cards,
  and accessible loading/error/empty states.
- Recipe details, ingredient checklist, Cooking Mode, share/copy actions, and
  YouTube links when available.
- Per-user favourites, search, category filter, sorting, undo removal, and
  persistent storage.
- Per-user profile, cooking preferences, profile picture, and persistent
  Light/Dark Mode.
- Offline recipe cache, offline favourites, reconnection refresh, and last-sync
  display.

## Technologies

- Expo SDK 58, React Native 0.88, TypeScript
- React Navigation 7
- Redux Toolkit and RTK Query
- TheMealDB API and DummyJSON demo API
- AsyncStorage for non-sensitive local data
- Expo SecureStore for native authentication tokens
- Expo ImagePicker, ImageManipulator, Clipboard, and Jest

## Setup

Requirements: Node.js/npm, Git, and an Android emulator or Expo Go if testing
on a device.

```powershell
git clone https://github.com/gayangidevindi/CraveApp.git
Set-Location CraveApp
npm install
npx expo start
```

### Android Studio Emulator

1. Install Android Studio and create/start an Android Virtual Device.
2. Start the project with `npx expo start`.
3. Press `a` in the Expo terminal to open the app on the running emulator.
4. For a standalone native build, use Expo's development build workflow; Expo
   Go is sufficient for the currently used Expo modules.

### Expo Go

1. Install an Expo Go version compatible with SDK 58.
2. Run `npx expo start` on the development computer.
3. Scan the displayed QR code with Expo Go. The phone and computer should be
   reachable on the same network, or use the Expo CLI tunnel option.

### Expo Web

Run `npx expo start --web` and open the local URL printed by the CLI.

## Demo login

The login screen lists the DummyJSON demo credentials:

- Username: `emilys`
- Password: `emilyspass`

Registration creates a local account on this device and also sends DummyJSON's
simulated `POST /users/add` request. The simulated request has a five-second
timeout and does not determine whether the local account is saved or can log
in.

## Project structure

```text
src/
  app/                 App provider and splash bootstrap
  features/
    auth/              Login, registration, auth API/storage/state
    profile/           Profile screens, preferences, and storage
    recipes/           Discovery, details, favourites, API, and cache
  navigation/          Typed React Navigation stacks and tabs
  shared/
    components/        Theme-aware reusable controls and states
    hooks/             Shared React hooks
    theme/             Theme tokens, persistence, and selectors
  store/               Redux store, slices, and network status
App.tsx                Providers, navigation, and system bars
```

## Architecture

The app is organized by feature. Screens use typed React Navigation props and
read/write app state through typed Redux hooks. Shared UI components consume
the current CraveApp theme. API request and persistence logic stays in feature
services instead of screen components.

### State management

Redux Toolkit stores authentication, network state, theme, profile,
favourites, recently viewed recipes, and recipe synchronization state. RTK
Query handles meal API requests, caching, loading/error states, and cache
invalidation after reconnection.

### API integration

The app calls TheMealDB's public v1 API for searching, random/featured recipes,
categories, cuisine areas, filtering, and recipe details by ID. Responses are
schema-validated before display or caching. DummyJSON is used for demo login
and simulated registration, not as a production identity provider.

### Authentication and storage

Native access and refresh tokens are stored using Expo SecureStore. Locally
registered passwords are salted and hashed with PBKDF2-SHA256 before storage.
Profile data, favourites, recipe history, checklists, and recipe responses are
non-sensitive app data stored in AsyncStorage and scoped by user where
applicable.

On Web, SecureStore is unavailable. The demo uses `sessionStorage` for remote
auth tokens and `localStorage` for local-account session IDs. Browser storage
is readable by JavaScript and vulnerable to same-origin XSS; it is not
equivalent to a Keychain or Keystore. Do not treat the browser flow as
production-grade authentication.

### Offline-first behavior

Validated non-empty recipe responses are persisted in AsyncStorage and used
when the app detects an offline connection or a network fetch fails. The cache
is bounded to the 60 most recently used query entries. Cache refreshes do not
replace existing data with empty API responses. Favourites remain available
offline and are migrated from the older array storage shape without dropping
recipes. The last successful cache synchronization time is persisted and shown
on Home.

Previously viewed remote images may be served from platform networking/image
caches, but image bytes are not explicitly downloaded and managed by CraveApp.
Offline image display is therefore best-effort; placeholders are shown when an
image cannot be loaded.

Expo Go and development tooling need the app bundle to be loaded at least once.
An offline cold start before the JavaScript bundle is available cannot be
guaranteed in Expo Go. A previously installed standalone build has a bundled
JavaScript app and is more suitable for demonstrating offline cold starts.

### Dark Mode

The theme is managed in Redux, hydrated from persistent preference storage, and
used by shared theme-aware screens, components, and React Navigation. Changing
the theme does not clear recipe or favourite data.

## Testing

```powershell
npx tsc --noEmit
npx expo lint
npx jest --runInBand
npx expo install --check
npx expo-doctor
npx expo export --platform android
npx expo export --platform web
git diff --check
```

Run Android and Web exports sequentially to reduce Metro memory pressure.
Physical-device and emulator behavior still requires manual testing.

## Screenshots

Add genuine application screenshots after manual capture; no screenshots are
included in this repository yet.

### Login

`[Screenshot placeholder: Login screen]`

### Home

`[Screenshot placeholder: Home recipe discovery]`

### Recipe Details

`[Screenshot placeholder: Recipe details and Cooking Mode]`

### Favourites

`[Screenshot placeholder: Favourites search, filters, and sorting]`

### Profile

`[Screenshot placeholder: Profile and preferences]`

### Offline-first

`[Screenshot placeholder: Offline banner and cached recipes]`

### Dark Mode

`[Screenshot placeholder: Dark Mode screen]`

## Known limitations

- DummyJSON's `/users/add` endpoint simulates registration; it does not create
  an account usable for DummyJSON login. Locally registered accounts are
  device-specific and do not sync to other devices.
- Browser token storage is not protected by a browser-managed HTTP-only
  session.
- Image availability offline is best-effort rather than a guaranteed download.
- Recipe data and availability depend on TheMealDB and network access.
- Expo Go offline cold-start behavior depends on whether its JavaScript bundle
  is already available.
- This work was validated by automated checks and bundling; no physical Android
  device or emulator test is claimed.

## Key Decisions

Review and rewrite these decisions in your own words for your submission:

1. Keep the existing React Navigation architecture rather than migrate routing
   as part of feature work, reducing navigation risk and preserving typed route
   params.
2. Use SecureStore only for native authentication tokens, while AsyncStorage
   holds non-secret cached recipes and user-scoped app preferences.
3. Keep a bounded persistent RTK Query response cache and preserve previously
   saved non-empty data when refreshes return empty results.
4. Store favourites in a versioned envelope with timestamps while still
   accepting the existing array format, so sorting can be added without
   discarding existing user data.
