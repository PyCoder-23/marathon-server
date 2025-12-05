# CRITICAL BUG FIXES - Mission System & XP Management

## Date: 2025-12-06
## Status: FIXED

---

## 🐛 BUGS IDENTIFIED AND FIXED

### 1. **Race Condition in Mission Acceptance** (CRITICAL)
**Problem**: Spam-clicking "Accept Mission" could create duplicate mission progress entries
**Root Cause**: Check-then-create pattern allowed race conditions between requests
**Solution**: Changed to atomic `upsert` operation
**File**: `app/api/missions/start/route.ts`
**Impact**: Prevents duplicate mission entries entirely

### 2. **Excessive Mission Penalties** (CRITICAL)
**Problem**: Users getting penalized multiple times for the same mission if duplicates existed
**Root Cause**: Penalty logic didn't deduplicate missions before applying penalties
**Solution**: Use `Map<missionId, mission>` to deduplicate before calculating penalties
**File**: `lib/mission-reset.ts`
**Impact**: Each unique mission only penalized once, even if duplicates exist

### 3. **Mission Reset Running Too Frequently** (CRITICAL)
**Problem**: Mission reset ran EVERY time missions page loaded, causing repeated penalties
**Root Cause**: No throttling mechanism
**Solution**: Added 1-hour cooldown between resets per user
**Files**: 
- `lib/mission-reset-throttle.ts` (new)
- `app/api/missions/route.ts`
**Impact**: Resets only run once per hour maximum

### 4. **Poor UI Feedback** (MEDIUM)
**Problem**: No loading states or clear feedback when accepting missions
**Root Cause**: Missing UX considerations
**Solution**: Added loading states and better alerts with emojis
**File**: `app/missions/page.tsx`
**Impact**: Users know immediately when missions are accepted

---

## 📋 CHANGES SUMMARY

### New Files Created:

1. **`lib/mission-reset-throttle.ts`**
   - Tracks last reset time per user
   - Prevents resets more than once per hour
   - Auto-cleans old entries to prevent memory leaks

### Modified Files:

1. **`app/api/missions/start/route.ts`**
   - Changed from `findUnique` + `create` to `upsert`
   - Prevents race conditions completely
   - Idempotent operation (safe to call multiple times)

2. **`lib/mission-reset.ts`**
   - Use `Map` instead of `Array` for incomplete missions
   - Deduplicates by mission ID before applying penalties
   - Added mission titles to penalty logs
   - Only applies penalty if totalPenalty > 0
   - Better logging with mission names

3. **`app/api/missions/route.ts`**
   - Added throttling check before running reset
   - Only resets if 1+ hour since last reset
   - Logs penalty information

4. **`app/missions/page.tsx`**
   - Added loading states to all mission actions
   - Better alert messages with emojis (🎉 for success, ❌ for failure)

---

## 🔧 HOW IT WORKS NOW

### Mission Acceptance Flow:
1. User clicks "Accept Mission"
2. Loading state shows immediately
3. `upsert` operation ensures no duplicates (atomic database operation)
4. Mission list refreshes
5. Loading state clears
6. User sees mission in "IN_PROGRESS" state

### Mission Reset Flow:
1. User opens missions page
2. System checks if 1+ hour since last reset for this user
3. If yes:
   - Finds all expired missions (daily before today IST, weekly before this week IST)
   - Deduplicates by mission ID using Map
   - Calculates penalties (half XP, rounded up)
   - Applies penalty once per unique mission
   - Deletes expired progress
   - Marks reset as run with current timestamp
4. If no: Skips reset entirely

### Penalty Calculation:
```typescript
// For each UNIQUE incomplete expired mission:
penalty = Math.ceil(mission.xpReward / 2)

// Examples:
// 150 XP mission incomplete = -75 XP penalty
// 100 XP mission incomplete = -50 XP penalty
// 75 XP mission incomplete = -38 XP penalty (rounded up)
// 50 XP mission incomplete = -25 XP penalty
```

### Deduplication Logic:
```typescript
const incompleteMissions: Map<string, { progress: any; mission: any }> = new Map();

for (const progress of allProgress) {
    if (shouldReset && !progress.completed && !incompleteMissions.has(mission.id)) {
        incompleteMissions.set(mission.id, { progress, mission });
    }
}
// Now incompleteMissions only has ONE entry per unique mission
```

---

## ✅ XP PROPAGATION

XP changes are automatically propagated throughout the website because:

1. **Squads**: Calculate total XP by summing all member XP from database
2. **Leaderboards**: Query user XP directly from database in real-time
3. **Navbar**: `refreshUser()` called after XP changes
4. **Dashboard**: Stats fetched fresh on each page load

**No additional changes needed** - the architecture already supports real-time XP updates.

---

## 🧪 TESTING CHECKLIST

### Test Mission Acceptance:
- [ ] Click "Accept Mission" once - should work
- [ ] Spam-click "Accept Mission" rapidly - should only accept once
- [ ] Check database - should have exactly 1 progress entry per mission
- [ ] Mission should show as "IN_PROGRESS" immediately
- [ ] Loading indicator should appear during acceptance

### Test Mission Reset Throttling:
- [ ] Open missions page
- [ ] Check console for reset log
- [ ] Refresh page immediately
- [ ] Should NOT see reset log again (throttled)
- [ ] Wait 1 hour, refresh
- [ ] Should see reset log (throttle expired)

### Test Penalty Deduplication:
- [ ] Manually create duplicate mission progress entries in database for same mission
- [ ] Wait for mission to expire (or manually set startedAt to past)
- [ ] Trigger reset by opening missions page
- [ ] Check XP - should only lose penalty ONCE per unique mission
- [ ] Check XP transaction - should show correct count of unique missions

### Test XP Propagation:
- [ ] Complete a mission
- [ ] Check navbar XP - should update immediately
- [ ] Check leaderboard - should reflect new XP
- [ ] Check squad page - squad total should update
- [ ] Get penalized for incomplete mission
- [ ] All above should reflect penalty (negative XP)

### Test UI Feedback:
- [ ] Click "Accept Mission" - loading state should show
- [ ] Click "Check Progress" - loading state should show
- [ ] Complete mission - should see "🎉 Mission Complete! +X XP"
- [ ] Try to complete incomplete mission - should see "❌ Mission criteria not yet met"

---

## 🚨 IMPORTANT NOTES

1. **Throttling is in-memory**: Reset throttle uses Map in memory. If server restarts, throttle resets. This is acceptable as it's just a safety mechanism to prevent excessive resets.

2. **Upsert is Atomic**: The `upsert` operation is atomic at the database level, so even if 1000 requests come in simultaneously, only one mission progress entry will be created.

3. **Deduplication**: Even if database somehow has duplicates (from before the fix), penalty logic now handles it gracefully by deduplicating before applying penalties.

4. **Loading States**: All mission actions now show loading to prevent spam-clicking and give immediate feedback.

5. **IST Timezone**: All resets are based on IST timezone:
   - Daily missions reset at 12:00 AM IST
   - Weekly missions reset Monday 12:00 AM IST
   - Long-term missions never reset

---

## 📊 EXPECTED BEHAVIOR

### Scenario 1: User spam-clicks Accept Mission
**Before**: Could create duplicates, get penalized multiple times
**After**: Only creates one progress entry, safe to spam-click

### Scenario 2: User refreshes missions page multiple times
**Before**: Reset runs every time, could apply penalties repeatedly
**After**: Reset only runs once per hour maximum

### Scenario 3: Duplicate entries exist in database
**Before**: User penalized once per duplicate
**After**: User penalized once per unique mission

### Scenario 4: User accepts mission but doesn't complete it
**Before**: Gets penalized when mission expires
**After**: Still gets penalized (this is intended behavior)
**Note**: Penalty only applied once even if user refreshes page multiple times

---

## 🔮 FUTURE IMPROVEMENTS (Optional)

1. **Toast Notifications**: Replace `alert()` with proper toast UI component
2. **Mission Preview**: Show mission details modal before accepting
3. **Penalty Warning**: Show warning 1 day before mission deadline
4. **Mission History**: Track completed/failed missions over time
5. **Persistent Throttle**: Use database to track reset times instead of memory
6. **Batch Operations**: Allow accepting/checking multiple missions at once

---

## ✨ SUMMARY

All critical bugs in the mission system have been fixed:
- ✅ No more duplicate mission entries (atomic upsert)
- ✅ No more excessive penalties (deduplication)
- ✅ No more repeated resets (1-hour throttle)
- ✅ Better UI feedback (loading states + emojis)
- ✅ XP propagates correctly throughout site

The system is now robust and prevents accidental XP loss from technical issues.
Users will only be penalized for missions they genuinely failed to complete.
