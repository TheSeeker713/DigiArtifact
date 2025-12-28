# Glass Box Mode Diagnostic Report

## Step 1: Raw Data Dump
✅ **COMPLETED** - Added diagnostic JSON dump to `GamificationWidget.tsx`
- Component now displays raw data at top of widget
- Shows: xp, level, nextLevelXp, currentLevelXp, progress, isNaN, isInfinity flags

## Step 2: Variable Audit - Case Mismatch Analysis

### Backend API Response (handleGetGamification)
**Returns (snake_case):**
```typescript
{
  total_xp: number,           // ✅ Mapped
  level: number,              // ✅ Direct
  current_streak: number,     // ✅ Mapped
  longest_streak: number,     // ❌ NOT USED
  total_work_minutes: number, // ✅ Mapped to totalHoursWorked
  total_sessions: number,     // ✅ Mapped
  focus_sessions: number,     // ✅ Mapped
  achievements: string,       // ✅ Parsed
  last_activity_date: string  // ❌ NOT USED
}
```

### Frontend Context Interface (GamificationData)
**Expects (camelCase):**
```typescript
{
  totalXP: number,            // ✅ From total_xp
  level: number,             // ✅ Direct
  levelTitle: string,        // ✅ Calculated from level
  levelColor: string,        // ✅ Calculated from level
  currentLevelXP: number,    // ✅ Calculated (totalXP - level.xp)
  nextLevelXP: number,       // ✅ Calculated (nextLevel.xp - level.xp)
  achievements: Achievement[], // ✅ Parsed
  weeklyChallenge: WeeklyChallenge | null, // ❌ NOT FROM API
  totalHoursWorked: number,  // ✅ From total_work_minutes / 60
  totalSessions: number,     // ✅ From total_sessions
  currentStreak: number,     // ✅ From current_streak
  focusSessions: number,     // ✅ From focus_sessions
  lastUpdated: number       // ✅ Set to Date.now()
}
```

### Mapping Logic (GamificationContext.tsx:164-210)
**Current Mapping:**
```typescript
const totalXP = Math.min(apiData.total_xp || 0, MAX_LEVEL_XP);  // ✅ CORRECT
const level = getLevelFromXP(totalXP);                          // ✅ CORRECT
const nextLevelData = getNextLevelData(totalXP);                // ✅ CORRECT
const isMaxLevel = level.level >= MAX_LEVEL;                    // ✅ CORRECT

// Convert total_work_minutes to hours
const totalHoursWorked = apiData.total_work_minutes 
  ? (apiData.total_work_minutes / 60).toFixed(1) 
  : 0;                                                          // ✅ CORRECT

setData(prev => ({
  ...prev,
  totalXP,                                                      // ✅ CORRECT
  level: level.level,                                           // ✅ CORRECT
  levelTitle: level.title,                                     // ✅ CORRECT
  levelColor: level.color,                                      // ✅ CORRECT
  currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - level.xp : totalXP - level.xp, // ⚠️ POTENTIAL ISSUE
  nextLevelXP: nextLevelData ? nextLevelData.xp - level.xp : 0, // ⚠️ POTENTIAL ISSUE
  currentStreak: apiData.current_streak || 0,                  // ✅ CORRECT
  totalHoursWorked: parseFloat(totalHoursWorked as string) || 0, // ✅ CORRECT
  totalSessions: apiData.total_sessions || 0,                  // ✅ CORRECT
  focusSessions: apiData.focus_sessions || 0,                  // ✅ CORRECT
  lastUpdated: Date.now(),                                     // ✅ CORRECT
}))
```

### CRITICAL FINDINGS:

#### Issue #1: Race Condition Protection May Be Blocking Updates
**Location:** `GamificationContext.tsx:181-192`
```typescript
const timeSinceLastUpdate = Date.now() - prev.lastUpdated;
if (timeSinceLastUpdate < 2000 && prev.totalXP > totalXP) {
  console.log('Skipping API update - more recent local data exists');
  return prev; // ⚠️ THIS MAY BE BLOCKING LEGITIMATE UPDATES
}
```
**Problem:** If user has 0 XP locally and API returns 0 XP, but `prev.totalXP > totalXP` is false (0 > 0 = false), this check passes. BUT if the initial fetch happens AFTER an optimistic update that gets rolled back, the API data (0) might overwrite the optimistic update.

#### Issue #2: Math Calculation for currentLevelXP
**Location:** `GamificationContext.tsx:197`
```typescript
currentLevelXP: isMaxLevel ? MAX_LEVEL_XP - level.xp : totalXP - level.xp
```
**Problem Analysis:**
- Level 1: xp = 0, totalXP = 0 → currentLevelXP = 0 - 0 = 0 ✅
- Level 1: xp = 0, totalXP = 10 → currentLevelXP = 10 - 0 = 10 ✅
- Level 2: xp = 100, totalXP = 150 → currentLevelXP = 150 - 100 = 50 ✅
- **BUT:** If `level.xp` is undefined or null, this becomes `NaN` ❌

#### Issue #3: Math Calculation for nextLevelXP
**Location:** `GamificationContext.tsx:198`
```typescript
nextLevelXP: nextLevelData ? nextLevelData.xp - level.xp : 0
```
**Problem Analysis:**
- Level 1 (0 XP): nextLevelData = Level 2 (100 XP) → nextLevelXP = 100 - 0 = 100 ✅
- Level 10 (10000 XP): nextLevelData = null → nextLevelXP = 0 ✅
- **BUT:** If `nextLevelData.xp` or `level.xp` is undefined, this becomes `NaN` ❌

#### Issue #4: Progress Bar Calculation
**Location:** `GamificationWidget.tsx:25-30`
```typescript
const xpProgress = data.nextLevelXP > 0 
  ? Math.min((data.currentLevelXP / data.nextLevelXP) * 100, 100)
  : 100

const safeProgress = Math.max(0, Math.min(100, xpProgress))
```
**Problem Analysis:**
- If `nextLevelXP = 0` and `currentLevelXP = 0`: xpProgress = 100 ✅ (but should be 0?)
- If `nextLevelXP = 0` and `currentLevelXP > 0`: xpProgress = 100 ✅ (max level)
- If `nextLevelXP = 100` and `currentLevelXP = 0`: xpProgress = 0 ✅
- **BUT:** If `currentLevelXP` or `nextLevelXP` is `NaN`, xpProgress = `NaN`, safeProgress = 0 ❌

### Potential Root Causes:

1. **Initial State Issue:** DEFAULT_DATA has `nextLevelXP: LEVEL_DEFINITIONS[1].xp - LEVEL_DEFINITIONS[0].xp` = 100 - 0 = 100 ✅
2. **API Returns 0 XP:** If user has no gamification record, API returns defaultStats with `total_xp: 0`
3. **Mapping Preserves 0:** Mapping correctly converts 0 to 0
4. **Level Calculation:** getLevelFromXP(0) should return Level 1 (xp: 0) ✅
5. **nextLevelData:** getNextLevelData(0) should return Level 2 (xp: 100) ✅
6. **currentLevelXP:** 0 - 0 = 0 ✅
7. **nextLevelXP:** 100 - 0 = 100 ✅
8. **Progress:** (0 / 100) * 100 = 0 ✅

### THE SMOKING GUN:
**The race condition protection at line 185 may be preventing the initial data fetch from updating the state if:**
- Component mounts with DEFAULT_DATA (totalXP: 0, lastUpdated: Date.now())
- API fetch completes quickly (< 2 seconds)
- API returns total_xp: 0
- Check: `timeSinceLastUpdate < 2000 && prev.totalXP > totalXP`
- If `prev.totalXP = 0` and `totalXP = 0`, then `0 > 0` = false, so check passes ✅
- **BUT:** If there's any optimistic update that got rolled back, `prev.totalXP` might be > 0, causing the API update to be skipped ❌

### Math Verification:

**DEFAULT_DATA (Initial State):**
```typescript
totalXP: 0
level: 1
levelTitle: 'Apprentice'
levelColor: '#a0a0a0'
currentLevelXP: 0
nextLevelXP: 100  // LEVEL_DEFINITIONS[1].xp - LEVEL_DEFINITIONS[0].xp = 100 - 0 = 100 ✅
```

**Expected Calculation for 0 XP:**
- `getLevelFromXP(0)` → Level 1 (xp: 0) ✅
- `getNextLevelData(0)` → Level 2 (xp: 100) ✅
- `currentLevelXP = 0 - 0 = 0` ✅
- `nextLevelXP = 100 - 0 = 100` ✅
- `xpProgress = (0 / 100) * 100 = 0` ✅
- `safeProgress = Math.max(0, Math.min(100, 0)) = 0` ✅

**Expected Calculation for 10 XP (after clock in):**
- `getLevelFromXP(10)` → Level 1 (xp: 0) ✅
- `getNextLevelData(10)` → Level 2 (xp: 100) ✅
- `currentLevelXP = 10 - 0 = 10` ✅
- `nextLevelXP = 100 - 0 = 100` ✅
- `xpProgress = (10 / 100) * 100 = 10` ✅
- `safeProgress = Math.max(0, Math.min(100, 10)) = 10` ✅

### THE SMOKING GUN - Race Condition Protection:

**Line 185 in GamificationContext.tsx:**
```typescript
if (timeSinceLastUpdate < 2000 && prev.totalXP > totalXP) {
  return prev; // ⚠️ BLOCKS UPDATE
}
```

**Scenario that breaks:**
1. User clocks in → `addXP(10)` called
2. Optimistic update: `totalXP = 10`, `lastUpdated = Date.now()`
3. API call starts
4. API call fails or returns error → rollback to `totalXP = 0`
5. Initial fetch completes (or retry) → API returns `total_xp: 0`
6. Check: `timeSinceLastUpdate < 2000` = true (just rolled back)
7. Check: `prev.totalXP > totalXP` = `0 > 0` = false ✅ (should pass)
8. **BUT:** If rollback didn't happen yet, `prev.totalXP = 10`, `totalXP = 0`
9. Check: `10 > 0` = true ❌ → **UPDATE BLOCKED!**

### Next Steps:
1. ✅ Diagnostic dump added - Check browser to see actual values
2. ✅ Math verified - Calculations are correct IF values are not NaN/undefined
3. ⚠️ Race condition protection may be blocking updates after rollback
4. ⚠️ Need to verify if API is actually returning data or if fetch is failing silently

