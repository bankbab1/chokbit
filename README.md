# Chokbit

React + Vite + TypeScript + Tailwind mobile web app with Supabase authentication and encrypted generation history.

## Development

```sh
npm ci
npm run dev
```

## GitHub Pages

In repository **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/docs**. The committed `docs/index.html` and `docs/assets` are the built app. The Actions workflow validates builds without competing with the branch deployment. Hash navigation works without server-side route rewrites.

```sh
npm run build -- --mode github-pages
```

Rebuild and commit the generated `/docs` files after source edits. This mode uses `/chokbit/` asset paths and preserves setup documentation in `/docs`. The default `npm run build` still uses `/` and outputs `dist` for other hosts. TypeScript source is not a deployable website.

## Structure

- `src/app`: application layout and generator orchestration
- `src/components`: shared UI
- `src/features/auth`: sign-in overlay and account menu
- `src/features/generator`: automatic run settings
- `src/features/history`: Supabase history browser
- `src/lib`: Bitcoin, encryption, Supabase and recording logic
- `src/styles`: responsive app styling
- `supabase/migrations`: database schema and ownership policies

## Authentication

Enter a Gmail username or a full email address and password. Mobile password entry requests a numeric keyboard. Credentials and the session remain in memory; refreshing requires sign-in again. Logout is available in the top-right account menu when generation is idle.

Private keys are encrypted before storage using the sign-in password. Keep the original password for older records if it changes. Public frontend Supabase configuration is in `.env.example`; never add account passwords or service-role keys to the repository. See [Supabase setup](docs/SUPABASE_SETUP.md).

## Address variants

New generations check five addresses: compressed and uncompressed P2PKH, compressed P2WPKH and nested P2SH-P2WPKH, and x-only P2TR. Uncompressed SegWit variants are not offered because standard relay policy requires compressed public keys. Taproot has no separate compressed/uncompressed address variants. Existing four-address records remain readable.

`encrypted_secret` contains an AES-GCM ciphertext for the private key and compressed WIF, together with salt, IV, format version and PBKDF2 iteration count. There is no plaintext private-key database column. Use Generated Historical → Reveal key to decrypt a saved key in the browser.
