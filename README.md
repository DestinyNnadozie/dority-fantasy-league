# Dority Fantasy League

Next.js + Prisma. Local SQLite. Use Postgres on Vercel.

## Local
npm install
npx prisma@6.15.0 generate
npx prisma@6.15.0 db push
npm run db:seed
npm run dev

Coordinator login after seed:
coordinator@school.local
ChangeThisAdminPass1

## Vercel
SQLite will not work on Vercel. Create a Neon/Supabase Postgres database first.
Change prisma/schema.prisma datasource provider to postgresql.
Set Vercel env vars:
DATABASE_URL
AUTH_SECRET
Then prisma migrate deploy / db push against Postgres and seed.
