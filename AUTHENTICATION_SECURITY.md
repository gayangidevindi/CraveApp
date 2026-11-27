# Authentication Security

## Authentication flows

- DummyJSON login uses `POST /auth/login` for the sample credentials.
- Registration is stored locally and also sent to DummyJSON's simulated
  `POST /users/add` endpoint with a five-second timeout. The local account
  remains usable if the simulated request fails or times out.
- Local account passwords are salted and hashed with PBKDF2-SHA256. Plain-text
  passwords are not persisted.
- Local usernames and email addresses are checked without regard to letter case
  before an account is created.

## Native applications

- On iOS and Android, access and refresh tokens are stored with Expo SecureStore,
  backed by the platform Keychain or Keystore.
- Authentication tokens are never written to AsyncStorage or MMKV.
- The local account session user ID is stored outside the password and account
  record and is restored alongside the local account data.

## Web applications

- Expo SecureStore is not available in a browser. Sample login tokens are stored in
  `sessionStorage`, and the local account session ID is stored in
  `localStorage`.
- Browser storage does not provide the OS-level protection of a native
  Keychain or Keystore. Both storage mechanisms are accessible to JavaScript
  and should be considered vulnerable to XSS on the origin.
- Web authentication is suitable for evaluation, not production. Production
  deployments should use secure, HTTP-only, same-site cookies or a dedicated
  server-side session system.
- Session storage ends when the browser tab session ends. Local-account session
  ID persistence may survive a full browser restart.

## Session lifecycle

- Saved sessions are restored at startup.
- DummyJSON sessions verify `/auth/me` and refresh expired access tokens through
  `/auth/refresh`.
- Invalid or expired credentials are cleared, and the user is returned to login.
- Logout clears token and local-session storage.
