# Database Migration Guide: SQLite to PostgreSQL

This guide will help you migrate from SQLite to PostgreSQL for Vercel deployment.

## Why Migrate?

- **Vercel Compatibility**: SQLite files cannot be used in serverless environments like Vercel
- **Scalability**: PostgreSQL is better suited for production applications
- **Performance**: Cloud PostgreSQL databases offer better performance and reliability

## Step-by-Step Migration

### 1. Set Up PostgreSQL Database

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Follow the setup wizard
5. Vercel will automatically add `POSTGRES_URL` to your environment variables

**For local development:**
- Copy the connection string from Vercel dashboard
- Add to your `.env` file as `DATABASE_URL`

#### Option B: Other Providers

**Neon (Serverless PostgreSQL):**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env` as `DATABASE_URL`

**Supabase:**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env` as `DATABASE_URL`

### 2. Update Environment Variables

Create or update your `.env` file:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your-secret-key-min-32-chars-long"
```

**Important:** For Vercel deployments, add `DATABASE_URL` in your Vercel project settings under Environment Variables.

### 3. Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` via the postinstall script.

### 4. Create New Migration

Since we're switching database providers, you'll need to create a fresh migration:

```bash
npx prisma migrate dev --name init_postgresql
```

This will:
- Create a new migration based on your current schema
- Apply it to your PostgreSQL database
- Generate the Prisma Client

### 5. Seed the Database (Optional)

If you want to populate your database with initial data:

```bash
npx prisma db seed
```

This will create:
- Default squads
- Admin user (email: `admin@marathon.com`, password: `admin123`)
- Demo missions
- Demo users

### 6. Verify the Migration

1. Check your database using Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Or verify via your application:
   ```bash
   npm run dev
   ```

## Important Notes

### Data Migration (If You Have Existing Data)

If you have existing data in your SQLite database that you want to migrate:

1. **Export data from SQLite:**
   ```bash
   # You may need to write a custom script to export your data
   # or use a tool like sqlite3 to export to CSV
   ```

2. **Import to PostgreSQL:**
   - Use Prisma's data migration tools
   - Or write a custom migration script
   - Or use a database migration tool

### Vercel Deployment

1. **Add Environment Variables in Vercel:**
   - Go to your project → Settings → Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Add `JWT_SECRET` if not already set

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Migrate to PostgreSQL"
   git push
   ```

3. **Run Migrations on Vercel:**
   - Vercel will automatically run `prisma generate` during build
   - You may need to run migrations manually via Vercel CLI or add a build script:
     ```json
     "scripts": {
       "build": "prisma migrate deploy && next build"
     }
     ```

## Troubleshooting

### Connection Issues

- **SSL Required**: Make sure your connection string includes `?sslmode=require`
- **Connection Pooling**: For serverless, consider using a connection pooler like PgBouncer
- **Vercel Postgres**: Uses connection pooling automatically

### Migration Errors

- **Schema Mismatch**: Make sure your Prisma schema matches your database
- **Missing Tables**: Run `npx prisma migrate deploy` to apply pending migrations
- **Type Errors**: Regenerate Prisma Client with `npx prisma generate`

### Build Errors on Vercel

- **Missing DATABASE_URL**: Ensure environment variable is set in Vercel
- **Prisma Client**: The postinstall script should handle this automatically
- **Migration Issues**: Add `prisma migrate deploy` to your build script if needed

## Next Steps

After migration:
1. ✅ Test your application locally
2. ✅ Deploy to Vercel
3. ✅ Verify all API endpoints work
4. ✅ Test authentication and database operations
5. ✅ Monitor your database connection in production

## Support

If you encounter issues:
- Check Prisma logs: `npx prisma migrate status`
- Verify connection: Test your `DATABASE_URL` connection string
- Check Vercel logs: Review deployment logs for errors

