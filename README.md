# MandalRent frontend

Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Magic UI, and Supabase Postgres/Storage.

```powershell
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to connect Supabase. Authentication uses the server-side MandalRent mobile+PIN credential and session APIs.

Useful checks:

```powershell
npm run lint
npm run build
```

Routes: `/` farmer marketplace, `/login` common role login, `/owner` equipment-owner workspace, `/api/locations` lazy location lookup.
