#!/bin/bash

# Database Migration Script: PostgreSQL → SQLite
# This script handles the complete migration process

echo "🚀 Starting database migration to SQLite..."
echo ""

# Step 1: Backup current .env
echo "📋 Step 1: Backing up .env file..."
cp .env .env.postgres.backup
echo "✅ Backup created: .env.postgres.backup"
echo ""

# Step 2: Update DATABASE_URL in .env
echo "🔧 Step 2: Updating DATABASE_URL..."
echo "Please update your .env file manually:"
echo "Change: DATABASE_URL=\"postgresql://...\""
echo "To:     DATABASE_URL=\"file:./dev.db\""
echo ""
echo "Press Enter when done..."
read

# Step 3: Generate Prisma client for SQLite
echo "⚙️  Step 3: Generating Prisma client..."
npx prisma generate
echo ""

# Step 4: Create SQLite database with migrations
echo "🗄️  Step 4: Creating SQLite database..."
npx prisma migrate dev --name switch_to_sqlite
echo ""

# Step 5: Import data from PostgreSQL backup
echo "📥 Step 5: Importing data from PostgreSQL backup..."
BACKUP_FILE=$(ls -t backups/postgres-backup-*.json | head -1)
echo "Using backup: $BACKUP_FILE"
npx tsx scripts/import-to-sqlite.ts "$BACKUP_FILE"
echo ""

echo "✅ Migration complete!"
echo ""
echo "📊 Summary:"
echo "   - Old database: PostgreSQL (Neon)"
echo "   - New database: SQLite (dev.db)"
echo "   - Backup file: $BACKUP_FILE"
echo "   - .env backup: .env.postgres.backup"
echo ""
echo "🎉 You can now run: npm run dev"
