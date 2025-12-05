# Setting Up Automated Winner Archival

## Overview
The winner archival script (`scripts/archive-winners.ts`) needs to run daily at 12:01 AM IST to archive weekly (Monday) and monthly (1st) winners before leaderboard resets.

## Option 1: Cron Job (Recommended for VPS/Server Deployment)

### Step 1: Make the script executable
```bash
cd /Users/harleensingh/Desktop/AI\ Stuff/marathon-server-main
chmod +x scripts/archive-winners.ts
```

### Step 2: Test the script manually
```bash
npx ts-node scripts/archive-winners.ts
```

### Step 3: Set up cron job
```bash
# Open crontab editor
crontab -e

# Add this line (runs daily at 12:01 AM IST)
# Note: Adjust the path to match your actual deployment path
1 0 * * * cd /path/to/marathon-server-main && npx ts-node scripts/archive-winners.ts >> /var/log/marathon-archive.log 2>&1
```

### Cron Schedule Explanation
- `1 0 * * *` = At 00:01 (12:01 AM) every day
- Logs are saved to `/var/log/marathon-archive.log`
- The script itself checks if it's Monday (for weekly) or 1st (for monthly)

## Option 2: Vercel Cron (For Vercel Deployments)

### Step 1: Create API endpoint
Create `/app/api/cron/archive-winners/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// Import the archival logic from scripts/archive-winners.ts
// (You'll need to refactor it into importable functions)

export async function GET(request: Request) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // Run archival logic here
        // await archiveWeeklyWinners();
        // await archiveMonthlyWinners();
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Archival error:', error);
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
```

### Step 2: Create `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/archive-winners",
    "schedule": "1 0 * * *"
  }]
}
```

### Step 3: Add environment variable
```bash
# In Vercel dashboard, add:
CRON_SECRET=your-random-secret-here
```

## Option 3: GitHub Actions (For GitHub-hosted Projects)

Create `.github/workflows/archive-winners.yml`:

```yaml
name: Archive Winners

on:
  schedule:
    # Runs at 00:01 UTC daily (adjust for IST if needed)
    - cron: '1 0 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  archive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run archival script
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx ts-node scripts/archive-winners.ts
```

## Option 4: Node.js Scheduler (Built-in)

Add to your Next.js app (e.g., in a background service):

```typescript
// lib/scheduler.ts
import cron from 'node-cron';
import { archiveWinners } from './archive-logic';

// Runs at 12:01 AM IST every day
cron.schedule('1 0 * * *', async () => {
    console.log('Running winner archival...');
    try {
        await archiveWinners();
        console.log('Archival completed successfully');
    } catch (error) {
        console.error('Archival failed:', error);
    }
}, {
    timezone: "Asia/Kolkata" // IST timezone
});
```

Install dependency:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

## Testing

### Manual Test
```bash
# Run the script manually to test
npx ts-node scripts/archive-winners.ts

# Check output for:
# - "Not Monday, skipping weekly archive" (if not Monday)
# - "Not 1st of month, skipping monthly archive" (if not 1st)
# - "Archived squad X: Y XP" (if it's Monday or 1st)
```

### Verify Cron Job
```bash
# List current cron jobs
crontab -l

# Check cron logs (location varies by system)
tail -f /var/log/cron
# or
tail -f /var/log/syslog | grep CRON
```

## Monitoring

### Check Logs
```bash
# View archival logs
tail -f /var/log/marathon-archive.log

# Check for errors
grep -i error /var/log/marathon-archive.log
```

### Database Verification
```sql
-- Check if winners are being archived
SELECT * FROM "WeeklyWinner" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "UserWeeklyWinner" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "MonthlyWinner" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "UserMonthlyWinner" ORDER BY "createdAt" DESC LIMIT 10;
```

## Troubleshooting

### Script doesn't run
1. Check cron service is running: `systemctl status cron`
2. Verify cron job syntax: `crontab -l`
3. Check file permissions: `ls -la scripts/archive-winners.ts`
4. Verify Node.js is in PATH: `which node`

### Database connection fails
1. Ensure `.env` file is accessible
2. Check DATABASE_URL is set correctly
3. Verify network connectivity to database

### Winners not archiving
1. Check if it's actually Monday or 1st of month
2. Verify IST timezone calculations
3. Check if there are any users/squads with XP in the period
4. Review script logs for errors

## Recommended Setup

For production, I recommend:
1. **Vercel Deployment**: Use Vercel Cron (easiest)
2. **VPS/Server**: Use system cron job (most reliable)
3. **Development**: Run manually or use node-cron

## Important Notes

- The script is **idempotent** - running it multiple times won't create duplicates
- It only archives on Monday (weekly) and 1st (monthly)
- Running it on other days is safe - it will just skip archival
- All times are in IST (Indian Standard Time)

## Next Steps

1. Choose your deployment method
2. Set up the cron job/scheduler
3. Test manually first
4. Monitor logs for the first few runs
5. Verify winners appear in Hall of Fame

Need help? Check the main BUG_FIXES_COMPLETE.md document!
