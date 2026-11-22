# Rizwan Clothing: Branch 1 Online Store

Customer-facing store for Branch 1 (Block B, Phase 1, City Center, Qambar, Swat).
The website has its OWN Supabase project (separate from the shop's sales software).
Built with Next.js (App Router), Tailwind CSS and Supabase.

## Run on your computer

1. Install packages: `npm install`
2. Copy `.env.example` to `.env.local` and put in the publishable key.
3. Start: `npm run dev`
4. Open http://localhost:3000

## Rules

- Only public Supabase values (URL and publishable key) are used in the code and in `.env.local`.
- Never add the `service_role` key, passwords or PINs to this project.
- Photos: the admin panel uploads to Cloudflare R2 through `/api/images` once these five variables are set in Vercel
  (Project > Settings > Environment Variables): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_PUBLIC_URL`. They are server-only secrets: set them in Vercel, never in the repo. Until they are all set, photos go to
  Supabase Storage as before. Photos already in Supabase Storage keep working.
- Work on a branch, check the Vercel preview, then merge to `main`.
