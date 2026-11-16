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

- Only public Supabase values (URL and publishable key) are used here.
- Never add the `service_role` key, passwords or PINs to this project.
- Work on a branch, check the Vercel preview, then merge to `main`.
