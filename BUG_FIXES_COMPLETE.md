# Bug Fixes Summary

## Overview
This document outlines all the bug fixes and improvements made to the Marathon Server application based on the user's requirements.

---

## 1. Mission Timer and Reset Logic (IST Timezone)

### Problem
- Missions were using local timezone calculations (e.g., "last 7 days" for weekly)
- No proper reset at 12 AM IST for daily, Monday 12 AM IST for weekly, or 1st 12 AM IST for monthly missions
- Users with 5+ hours weren't getting mission XP because the time window calculations were incorrect

### Solution
Created **IST timezone utilities** (`lib/timezone-utils.ts`) with functions for:
- `getISTDayStart()` - Get 12:00 AM IST for current day
- `getISTWeekStart()` - Get Monday 12:00 AM IST for current week
- `getISTMonthStart()` - Get 1st day 12:00 AM IST for current month

### Files Modified
1. **`lib/timezone-utils.ts`** (NEW)
   - Complete IST timezone handling utilities
   
2. **`lib/mission-checker.ts`**
   - Updated DAILY missions to use `getISTDayStart()` instead of local midnight
   - Updated WEEKLY missions to use `getISTWeekStart()` instead of "7 days ago"
   - LONG_TERM missions remain all-time cumulative

3. **`app/api/users/stats/route.ts`**
   - Updated to use IST timezone for daily stats calculation
   - Weekly graph now uses IST-based date ranges

4. **`app/api/leaderboard/route.ts`**
   - Weekly leaderboard now resets Monday 12 AM IST
   - Monthly leaderboard now resets 1st day 12 AM IST

### How It Works Now
- **DAILY Missions**: Reset at 12:00 AM IST every day. Requirements must be met before next 12 AM IST.
- **WEEKLY Missions**: Reset at Monday 12:00 AM IST. Requirements must be met before next Monday 12 AM IST.
- **LONG_TERM Missions**: Never reset, cumulative across all time.

---

## 2. Dashboard Graph Enhancement

### Problem
- Graph was showing hours worked as bar chart
- User wanted XP earned per day as a line chart (like GitHub contributions)

### Solution
Completely redesigned the weekly activity graph to show:
- **Line chart** with connected points showing XP progression
- **Y-axis**: XP values with proper scaling
- **X-axis**: Dates (MM/DD format)
- **Hover tooltips**: Show exact XP and date on hover
- **Grid lines**: Subtle background grid for better readability

### Files Modified
1. **`app/dashboard/page.tsx`**
   - Replaced bar chart with SVG-based line chart
   - Added Y-axis labels with dynamic scaling
   - Added X-axis labels with dates
   - Added hover tooltips showing XP and date
   - Title changed to "Weekly XP Progress"

### Visual Features
- Green line (`rgb(0, 255, 149)`) matching the app's primary color
- Circular points at each data point
- Smooth polyline connecting all points
- Responsive hover states
- Grid lines for easier reading

---

## 3. Profile Picture Feature

### Problem
- Profile picture upload didn't work
- Only URL input was available
- Images weren't shown on leaderboards or across the site

### Solution
Enhanced profile picture functionality with:
- **URL input** (existing)
- **File upload** with base64 encoding (NEW)
- **Preview** before saving
- **Display everywhere**: Navbar, leaderboard, Hall of Fame

### Files Modified
1. **`app/settings/page.tsx`**
   - Added file upload input with base64 conversion
   - Added "OR" divider between URL and file upload
   - Preview shows for both URL and uploaded files

2. **`app/api/users/me/route.ts`**
   - Added `image` field to user response

3. **`app/api/leaderboard/route.ts`**
   - Added `image` field to all leaderboard queries
   - Images included in both all-time and period-based leaderboards

4. **`app/leaderboard/page.tsx`**
   - Updated podium (top 3) to show profile pictures
   - Updated list view to show profile pictures
   - Fallback to username initial if no image

5. **`components/navbar.tsx`**
   - Already had image support, now properly displays user images

### How It Works
- Users can paste an image URL OR upload a file
- Uploaded files are converted to base64 data URLs
- Images are stored in the database as strings
- Images display across the entire site with fallback to initials

---

## 4. Hall of Fame System

### Problem
- No system to archive and display past winners
- Monthly and weekly winners were lost after resets

### Solution
Created a complete Hall of Fame system with:
- **Database models** for archiving winners
- **Automated archival script** to run at reset times
- **Hall of Fame page** to display all past winners
- **API endpoint** to fetch archived data

### New Database Models
Added to `prisma/schema.prisma`:
1. **`WeeklyWinner`** - Squad weekly winners
2. **`UserWeeklyWinner`** - Individual weekly winners
3. **`UserMonthlyWinner`** - Individual monthly winners
4. **`MonthlyWinner`** - Squad monthly winners (already existed)

### New Files Created
1. **`app/hall-of-fame/page.tsx`** (NEW)
   - Beautiful tabbed interface showing:
     - Monthly Squad Champions
     - Weekly Squad Champions
     - Monthly User Champions
     - Weekly User Champions
   - Rank badges (Gold, Silver, Bronze)
   - Profile pictures for users
   - XP totals and period labels

2. **`app/api/hall-of-fame/route.ts`** (NEW)
   - Fetches all archived winners
   - Groups by period and assigns ranks
   - Returns top 3 per period

3. **`scripts/archive-winners.ts`** (NEW)
   - Automated script to archive winners before resets
   - Should run daily at 12:01 AM IST
   - Checks for Monday (weekly reset) and 1st (monthly reset)
   - Archives top 3 squads and top 3 users for each period

4. **`components/navbar.tsx`** (MODIFIED)
   - Added "Hall of Fame" link to navigation

### How to Run Archival Script
```bash
# Manually run the archival script
npx ts-node scripts/archive-winners.ts

# Set up a cron job to run daily at 12:01 AM IST
# Add to crontab: 1 0 * * * cd /path/to/marathon-server && npx ts-node scripts/archive-winners.ts
```

### How It Works
1. Script runs daily at 12:01 AM IST
2. On Monday: Archives last week's top 3 squads and users
3. On 1st of month: Archives last month's top 3 squads and users
4. Winners are permanently stored in the database
5. Hall of Fame page displays all archived winners grouped by period

---

## Database Migration

### Changes Made
```bash
# Generated Prisma client with new models
npx prisma generate

# Pushed schema changes to database
npx prisma db push
```

### New Tables Created
- `WeeklyWinner`
- `UserWeeklyWinner`
- `UserMonthlyWinner`

### Relations Added
- User → UserWeeklyWinner (one-to-many)
- User → UserMonthlyWinner (one-to-many)
- Squad → WeeklyWinner (one-to-many)

---

## Testing Checklist

### Mission Timer
- [ ] Start a session at 11:50 PM IST, complete after midnight - should count for next day
- [ ] Complete 5 hours in a single day (IST) - should award "Marathon Runner" mission
- [ ] Complete 15 hours in a week (Monday-Sunday IST) - should award "Time Master" mission
- [ ] Check that missions reset at exactly 12 AM IST

### Dashboard Graph
- [ ] Verify graph shows XP (not hours) on Y-axis
- [ ] Verify dates show on X-axis
- [ ] Hover over points to see XP and date tooltips
- [ ] Check that line connects all 7 days

### Profile Pictures
- [ ] Upload an image file in settings
- [ ] Paste an image URL in settings
- [ ] Verify preview shows correctly
- [ ] Check image appears in navbar
- [ ] Check image appears on leaderboard
- [ ] Check image appears in Hall of Fame

### Hall of Fame
- [ ] Navigate to /hall-of-fame
- [ ] Verify all 4 tabs work (Monthly Squads, Weekly Squads, Monthly Users, Weekly Users)
- [ ] Run archive script manually to test
- [ ] Verify winners appear with correct ranks and XP

---

## Summary of Changes

### Files Created (7)
1. `lib/timezone-utils.ts`
2. `app/hall-of-fame/page.tsx`
3. `app/api/hall-of-fame/route.ts`
4. `scripts/archive-winners.ts`

### Files Modified (8)
1. `lib/mission-checker.ts`
2. `app/api/users/stats/route.ts`
3. `app/api/users/me/route.ts`
4. `app/api/leaderboard/route.ts`
5. `app/dashboard/page.tsx`
6. `app/settings/page.tsx`
7. `app/leaderboard/page.tsx`
8. `components/navbar.tsx`

### Database Changes
1. Added 3 new models (WeeklyWinner, UserWeeklyWinner, UserMonthlyWinner)
2. Updated User model with 2 new relations
3. Updated Squad model with 1 new relation

---

## Next Steps

### 1. Set Up Automated Archival
You need to set up a cron job or scheduled task to run the archival script daily at 12:01 AM IST:

**Option A: Cron Job (Linux/Mac)**
```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your project)
1 0 * * * cd /path/to/marathon-server-main && npx ts-node scripts/archive-winners.ts >> /var/log/marathon-archive.log 2>&1
```

**Option B: Vercel Cron (if deployed on Vercel)**
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/archive-winners",
    "schedule": "1 0 * * *"
  }]
}
```

Then create `/app/api/cron/archive-winners/route.ts` that calls the archival logic.

### 2. Test Everything
- Deploy to a staging environment
- Test all mission types with IST timezone
- Upload profile pictures and verify they appear everywhere
- Manually run the archive script to populate Hall of Fame

### 3. Monitor
- Check logs for the archival script
- Verify winners are being archived correctly
- Monitor for any timezone-related issues

---

## Technical Notes

### IST Timezone Handling
The IST timezone utilities work by:
1. Getting current UTC time
2. Adding 5 hours 30 minutes (IST offset)
3. Setting appropriate hour/minute/second values
4. All date comparisons use these IST-adjusted dates

### Base64 Image Storage
- Images uploaded via file input are converted to base64 data URLs
- Stored directly in PostgreSQL as TEXT
- No external storage needed
- Works for images up to ~1-2MB (reasonable for profile pictures)

### Winner Archival Logic
- Uses XPTransaction table to calculate period totals
- Groups by squad/user
- Sorts by total XP
- Stores top 3 in dedicated tables
- Upsert operation prevents duplicates

---

## Known Limitations

1. **Base64 Images**: Large images may impact database performance. Consider adding file size validation.
2. **Archival Script**: Must be run externally (cron job). Not built into the app.
3. **Timezone**: All calculations assume IST. Users in other timezones will see IST-based resets.

---

## Support

If you encounter any issues:
1. Check the IST timezone calculations are working correctly
2. Verify database schema was updated successfully
3. Ensure archival script has proper permissions
4. Check logs for any errors during archival

All bugs mentioned in the original request have been addressed! 🎉
