# Chokbit

React + Vite + TypeScript + Tailwind mobile web app with Supabase authentication and encrypted generation history.

## Development

```sh
npm ci
npm run dev
```

## GitHub Pages

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The included `.github/workflows/pages.yml` builds `dist` and deploys on pushes to `main`. For an existing repository, switch away from “Deploy from a branch” before running the workflow. The app uses hash navigation and the workflow sets the repository asset base automatically.

```sh
VITE_BASE_PATH=/chokbit/ npm run build
```

The default `npm run build` uses `/` for other hosts. Only the generated `dist` directory is served; TypeScript source is not a deployable website.

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
