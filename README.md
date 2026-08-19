# MandalRent frontend

Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Magic UI, and Supabase.

```powershell
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to connect Supabase. With no keys, all main journeys remain usable through the local demo adapter; use OTP `123456`.

Useful checks:

```powershell
npm run lint
npm run build
```

Routes: `/` farmer marketplace, `/login` common role login, `/owner` equipment-owner workspace, `/api/locations` lazy location lookup.
