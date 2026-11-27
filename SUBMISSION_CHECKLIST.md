# CraveApp Submission Checklist

## Assignment requirements

- [ ] Review each assignment requirement against the final implementation.
- [ ] Confirm authentication behavior and native SecureStore usage.
- [ ] Confirm recipe search, cuisine/category filters, details, checklist, and
  Cooking Mode.
- [ ] Confirm favourites search, sorting, undo, and persistence.
- [ ] Confirm profile editing, photo selection/removal, permission feedback, and
  unsaved-changes warning.
- [ ] Confirm offline cached data, favourites, reconnection behavior, and
  automatic refresh.
- [ ] Confirm Light/Dark Mode and user data separation.

## Manual Android verification

- [ ] Complete the checklist in an Android emulator/device with network.
- [ ] Sign in using the sample credentials and confirm the Home screen greeting.
- [ ] Register a local account; confirm invalid and duplicate data are rejected.
- [ ] Force-close/reopen the app and confirm session restoration.
- [ ] Add/remove a favourite and verify it persists after restart.
- [ ] Open a recipe, check ingredients, restart, and verify checklist progress.
- [ ] Test Cooking Mode step navigation, exit, share, clipboard, and YouTube when
  available.
- [ ] Test profile photo selection, camera/gallery permission denial, removal,
  and logout confirmation.
- [ ] Load recipe data, enable airplane mode, and verify cached content and
  offline banner behavior.
- [ ] Restore connectivity and verify content refreshes without duplicate
  requests.
- [ ] Switch Light/Dark Mode and verify persistence after restart.

## Screenshots to capture

- [ ] Login
- [ ] Home recipe discovery
- [ ] Recipe Details and ingredient checklist
- [ ] Cooking Mode
- [ ] Favourites search/filter/sort
- [ ] Profile and preferences
- [ ] Offline banner with previously cached recipes
- [ ] Dark Mode

## Submission files and repository

- [ ] Review [README.md](./README.md); rewrite Key Decisions in your own words.
- [ ] Review [AI_USAGE.md](./AI_USAGE.md); verify the example and attribution.
- [ ] Add genuine screenshots; replace placeholders only after capture.
- [ ] Confirm the GitHub repository is up to date.
- [ ] Run tests, typecheck, lint, Expo checks, and Android/Web exports.
- [ ] Review `git status`, staged diffs, and ensure no secrets or generated
  exports are included.

## Narrated demo script (maximum 3 minutes)

### Part 1 — App demonstration (about 1 minute)

**0:00–0:10:** Open CraveApp and manually enter the sample DummyJSON
credentials from the README. Point out the personalized time-of-day greeting
and recipe discovery screen.

**0:10–0:25:** Search or filter recipes, open a result, and show its ingredients
and cooking instructions. Check an ingredient and briefly open Cooking Mode.

**0:25–0:38:** Return, save the recipe as a favourite, and visit Favourites to
show the saved recipe and search/filter/sort controls.

**0:38–1:00:** Restart the app and show the favourite/checklist persistence.
With a recipe already loaded, enable airplane mode and demonstrate the offline
banner and cached content. Mention that offline images are best-effort.

### Part 2 — Technical walkthrough (about 2 minutes)

**1:00–1:20:** Explain the feature-based `src/features`, shared components,
typed React Navigation, and Redux Toolkit state.

**1:20–1:40:** Show TheMealDB API integration and schema validation. Explain
that recipe details are loaded using typed recipe IDs.

**1:40–2:00:** Explain sample login, local registration, PBKDF2 password
hashing, native SecureStore tokens, and browser storage limitations.

**2:00–2:20:** Show persistent per-user favourites, recent history, and
ingredient checklists. Explain the backward-compatible favourites migration.

**2:20–2:40:** Explain the bounded recipe response cache, offline fallback,
network reconnection invalidation, and retained sync metadata. Note the
best-effort image cache and Expo Go cold-start limitation.

**2:40–3:00:** Demonstrate persistent Dark Mode and summarize automated test,
lint, typecheck, compatibility, and bundle-export results. State which Android
manual checks were actually performed.
