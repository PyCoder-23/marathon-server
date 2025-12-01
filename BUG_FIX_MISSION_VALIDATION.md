# Bug Fix: Mission Completion for Invalid Sessions

## Issue Description
Users were able to complete missions (like "First Steps" - Complete your first 25-minute session) even when ending sessions that were less than 25 minutes long (e.g., 5-6 minutes).

## Root Cause Analysis

### The Bug
In `/app/api/sessions/stop/route.ts`, the mission checker was being called **AFTER** the session was marked as completed, but **REGARDLESS** of whether the session met the minimum 25-minute requirement.

### Bug Flow
1. User starts a session
2. User ends session after only 6 minutes
3. Session is marked as `completed: true` in database (line 54)
4. Mission checker runs (lines 130-131) - **THIS WAS THE PROBLEM**
5. Mission checker queries all completed sessions
6. Mission checker filters for valid sessions (>= 25 mins)
7. If user had ANY previous valid session, mission completes incorrectly

### Why It Happened
```typescript
// BEFORE (BUGGY CODE):
// Update session
const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: {
        endTs,
        durationMin,
        completed: true,  // ❌ Marked as completed regardless of duration
    },
});

// Only update user stats if valid
if (isValidSession) {
    // ... update XP, streak, etc
}

// ❌ BUG: Mission checker runs OUTSIDE the isValidSession block
const { checkAllActiveMissions } = await import("@/lib/mission-checker");
const completedMissions = await checkAllActiveMissions(payload.userId);
```

## The Fix

### Changes Made
**File**: `/app/api/sessions/stop/route.ts`

Moved the mission checking logic **INSIDE** the `isValidSession` block so missions only check after valid sessions (>= 25 minutes).

```typescript
// AFTER (FIXED CODE):
if (isValidSession) {
    // ... update XP, streak, etc
    
    // ✅ FIX: Mission checker now ONLY runs for valid sessions
    const { checkAllActiveMissions } = await import("@/lib/mission-checker");
    const completedMissions = await checkAllActiveMissions(payload.userId);

    return successResponse({
        session: updatedSession,
        xpEarned,
        durationMin,
        isValidSession,
        completedMissions: completedMissions.map(m => ({ id: m.id, title: m.title, xpReward: m.xpReward })),
    });
}

// ✅ Session was too short - return without checking missions
return successResponse({
    session: updatedSession,
    xpEarned: 0,
    durationMin,
    isValidSession: false,
    completedMissions: [],
    message: "Session too short. Minimum 25 minutes required for XP and mission progress."
});
```

## Validation Logic

### Session Validation Rules
1. **Minimum Duration**: 25 minutes
2. **XP Calculation**: 20 XP per 25-minute block
3. **Mission Progress**: Only counted for valid sessions (>= 25 mins)
4. **Streak Tracking**: Only counted for valid sessions (>= 25 mins)
5. **Total Time**: Only counted for valid sessions (>= 25 mins)

### User Experience
- **Before 25 minutes**: User gets a confirmation dialog warning them
- **If confirmed**: Session ends, marked as completed, but:
  - ❌ No XP earned
  - ❌ No mission progress
  - ❌ No streak update
  - ❌ No total time added
  - ✅ Message: "Session too short. Minimum 25 minutes required for XP and mission progress."

- **After 25+ minutes**: Session ends normally:
  - ✅ XP earned (20 per 25-min block)
  - ✅ Mission progress checked
  - ✅ Streak updated
  - ✅ Total time added

## Testing Checklist

### Test Cases
- [x] **Test 1**: Start session, end after 5 minutes
  - Expected: No XP, no mission progress, warning message
  
- [x] **Test 2**: Start session, end after 25 minutes
  - Expected: 20 XP, mission progress checked, stats updated
  
- [x] **Test 3**: Start session, end after 50 minutes
  - Expected: 40 XP (2 blocks), mission progress checked
  
- [x] **Test 4**: Complete "First Steps" mission with valid session
  - Expected: Mission completes, 50 XP awarded
  
- [x] **Test 5**: Try to complete mission with short session
  - Expected: Mission does NOT complete

## Related Files

### Modified
- `/app/api/sessions/stop/route.ts` - Fixed mission checking logic

### Verified (No Changes Needed)
- `/lib/mission-checker.ts` - Already filters for valid sessions (>= 25 mins)
- `/components/session-timer.tsx` - Already has 25-min warning dialog
- `/prisma/seed.ts` - Mission definitions are correct

## Impact

### Before Fix
- ❌ Users could game the system by ending sessions early
- ❌ Missions completed incorrectly
- ❌ Unfair XP distribution
- ❌ Leaderboard integrity compromised

### After Fix
- ✅ Missions only complete for valid sessions
- ✅ Fair XP distribution
- ✅ Leaderboard integrity maintained
- ✅ Clear feedback for invalid sessions
- ✅ System works as designed

## Deployment Notes
- No database migration required
- No breaking changes to API
- Backward compatible
- Existing invalid sessions remain in database but won't affect future mission progress
