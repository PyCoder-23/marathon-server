# Database Migration Guide: PostgreSQL → SQLite

## ✅ Completed Steps

1. ✅ **Data Exported** - All PostgreSQL data backed up
   - File: `backups/postgres-backup-2025-12-07T16-03-30-573Z.json`
   - 32 users, 1819 sessions, 2068 XP transactions preserved

2. ✅ **Schema Updated** - Changed `prisma/schema.prisma` to use SQLite

3. ✅ **Scripts Created**
   - `scripts/export-postgres-data.ts` - Export script
   - `scripts/import-to-sqlite.ts` - Import script

## 🔄 Next Steps (Manual)

### Step 1: Update .env File

Open `.env` and change the DATABASE_URL:

```bash
# OLD (PostgreSQL):
DATABASE_URL="postgresql://..."

# NEW (SQLite):
DATABASE_URL="file:./dev.db"
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Create SQLite Database

```bash
npx prisma migrate dev --name switch_to_sqlite
```

This will:
- Create `dev.db` file
- Create all tables
- Apply the schema

### Step 4: Import Data

```bash
npx tsx scripts/import-to-sqlite.ts backups/postgres-backup-2025-12-07T16-03-30-573Z.json
```

This will import all your data into SQLite.

### Step 5: Verify

```bash
# View database
npx prisma studio

# Start dev server
npm run dev
```

## 📊 What Gets Migrated

- ✅ All 32 users (with passwords, XP, coins, etc.)
- ✅ All 4 squads
- ✅ All 1819 sessions
- ✅ All 2068 XP transactions
- ✅ All 16 missions
- ✅ All 187 mission progress records
- ✅ All 21 shop items
- ✅ All coin transactions
- ✅ All events, tasks, audit logs
- ✅ Hall of Fame winners

## ⚠️ Important Notes

1. **Backup Created**: Your PostgreSQL .env is backed up to `.env.postgres.backup`
2. **No Network Transfer**: SQLite is local, no more 5GB limit!
3. **Deployment**: SQLite won't work on Vercel (serverless). You'll need to self-host or use a VPS.

## 🔙 Rollback (If Needed)

If something goes wrong:

```bash
# Restore PostgreSQL .env
cp .env.postgres.backup .env

# Regenerate Prisma client
npx prisma generate

# You're back to PostgreSQL!
```

---

**Ready to proceed?** Follow steps 1-5 above.
