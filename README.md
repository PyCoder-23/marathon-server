This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database Setup

This project uses **PostgreSQL** as the database. You'll need to set up a PostgreSQL database before running the application.

### Option 1: Vercel Postgres (Recommended for Vercel Deployments)

1. **Create a Vercel Postgres database:**

   - Go to your Vercel project dashboard
   - Navigate to the "Storage" tab
   - Click "Create Database" and select "Postgres"
   - Follow the setup wizard

2. **Get your connection string:**
   - Vercel will automatically add the `POSTGRES_URL` environment variable
   - For local development, copy the connection string from Vercel dashboard
   - Add it to your `.env` file as `DATABASE_URL`

### Option 2: Other PostgreSQL Providers

You can use any PostgreSQL provider such as:

- [Neon](https://neon.tech) (Serverless PostgreSQL)
- [Supabase](https://supabase.com) (PostgreSQL with additional features)
- [Railway](https://railway.app) (PostgreSQL hosting)
- [AWS RDS](https://aws.amazon.com/rds/postgresql/)
- Any other PostgreSQL database

**Connection String Format:**

```
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### Setting Up the Database

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up your environment variables:**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-secret-key-min-32-chars-long"
   ```

3. **Run database migrations:**

   ```bash
   npx prisma migrate deploy
   ```

   Or for development (creates a new migration):

   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

   (This runs automatically on `npm install` via the postinstall script)

5. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

## Getting Started

First, set up your database (see above), then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Before Deploying

1. **Set up PostgreSQL database** (see Database Setup section above)
2. **Add environment variables in Vercel:**

   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A secure secret key (min 32 characters)

3. **For Vercel Postgres:**

   - Create a Postgres database in your Vercel project
   - The `POSTGRES_URL` will be automatically available
   - Use `POSTGRES_URL` as your `DATABASE_URL` in Vercel

4. **Run migrations:**
   - Migrations will run automatically during build if you add to build script
   - Or run manually: `npx prisma migrate deploy`

For detailed migration instructions, see [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
