# Supabase setup

1. Apply `supabase/migrations/202610050001_records.sql` in your project's SQL editor (or through Supabase migrations).
2. Create an email/password user in Authentication > Users. Public signup is not required; disable it for a personal collector.
3. Copy `.env.example` to `.env.local` and set the project URL and publishable key. Never use a service-role or secret key in Vite.
4. Run `npm install` and `npm run dev`, or rebuild with `npm run build` after setting the environment.
5. Sign in using only the account email and password. The same password derives the encryption key for new records. Keep the original password to decrypt records if you later change your sign-in password. Records created with the earlier separate vault passphrase still require that original passphrase; no data is automatically re-encrypted.

The client uses Supabase Auth and the PostgREST API. Sessions and vault credentials stay in memory. Refreshing requires sign-in again. Generation saves an initial checking row, then updates it with address results. Errors pause automatic generation. Recheck retries the same row UUID. Anonymous access is denied and RLS restricts rows to their owner.

Key hex and compressed WIF use AES-256-GCM with a fresh 12-byte IV per write, a random 16-byte salt per session, PBKDF2-SHA256 with 600,000 iterations, and record UUID as authenticated data. Public addresses and lookup statistics are queryable plaintext. The encryption protects database contents, not a compromised browser or frontend.

Generated Historical queries owner-scoped records with network, activity, status, exact Bitcoin-address filters, and pagination (10/25/50 rows). Expand a record to inspect the four formats, balances, TX counts, and API errors. Private key and WIF remain masked until explicitly decrypted with the current session password. JSON exports and folder-based recording have been removed.

Responsive UI uses a monochrome light/dark theme, persisted sidebar state on desktop, a drawer on tablet, and iOS-style bottom navigation on phones. Native selects use overlaid Lucide chevrons that rotate on focus and reset on selection.

Before production, verify with two test users that neither can read or modify the other's records and that anonymous requests cannot access the table. Live Auth, RLS, and database integration must be checked against the configured project.
