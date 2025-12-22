-- Marathon Server - Supabase Seed Script
-- Run this in Supabase SQL Editor to populate initial data

-- 1. Create Squads
INSERT INTO "Squad" (id, name, description, slogan, "createdAt")
VALUES 
  (gen_random_uuid(), 'Alpha Squad', 'The first and the finest', 'First to fight, last to fall', NOW()),
  (gen_random_uuid(), 'Beta Battalion', 'Strategic excellence', 'Strategy over strength', NOW()),
  (gen_random_uuid(), 'Gamma Guild', 'Innovation and creativity', 'Create, innovate, dominate', NOW()),
  (gen_random_uuid(), 'Delta Division', 'Precision and discipline', 'Discipline equals freedom', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Create Admin User
INSERT INTO "User" (
  id, email, username, "passwordHash", "discordHandle",
  "isAdmin", "isVerified", "totalXp", "totalMinutes", "coins",
  "streakDays", "streakFreezes", "missionPardons",
  "createdAt", "updatedAt", "lastMissionCheck"
)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  'Commander',
  '$2a$10$rFqGJB8xqZ0y5gKZp5vZN.Xn7vZQYxGxGxGxGxGxGxGxGxGxGxGxG', -- password: "password"
  '@commander',
  true,
  true,
  0,
  0,
  100,
  0,
  2,
  2,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Create Missions
INSERT INTO "Mission" (id, title, description, criteria, type, difficulty, "xpReward", active, "createdAt")
VALUES
  -- Daily Missions
  (gen_random_uuid(), 'Early Bird', 'Complete a session before 9 AM', 'time_of_day:before_9am', 'DAILY', 'EASY', 50, true, NOW()),
  (gen_random_uuid(), 'Quick Sprint', 'Complete a 25-minute session', 'session_count:1', 'DAILY', 'EASY', 30, true, NOW()),
  (gen_random_uuid(), 'Double Down', 'Complete 2 sessions in one day', 'session_count:2', 'DAILY', 'MEDIUM', 75, true, NOW()),
  (gen_random_uuid(), 'Marathon Runner', 'Study for 2 hours total', 'total_minutes:120', 'DAILY', 'HARD', 150, true, NOW()),
  
  -- Weekly Missions
  (gen_random_uuid(), 'Consistency King', 'Complete sessions on 5 different days', 'unique_days:5', 'WEEKLY', 'MEDIUM', 200, true, NOW()),
  (gen_random_uuid(), 'Weekend Warrior', 'Complete sessions on both Saturday and Sunday', 'weekend_sessions:2', 'WEEKLY', 'MEDIUM', 150, true, NOW()),
  (gen_random_uuid(), 'Week Grinder', 'Study for 10 hours this week', 'total_minutes:600', 'WEEKLY', 'HARD', 300, true, NOW()),
  (gen_random_uuid(), 'Perfect Week', 'Complete sessions every day this week', 'unique_days:7', 'WEEKLY', 'HARD', 500, true, NOW()),
  
  -- Long-term Missions
  (gen_random_uuid(), 'Century Club', 'Reach 100 total hours studied', 'total_minutes:6000', 'LONG_TERM', 'HARD', 1000, true, NOW()),
  (gen_random_uuid(), 'XP Master', 'Reach 5000 total XP', 'total_xp:5000', 'LONG_TERM', 'HARD', 500, true, NOW()),
  (gen_random_uuid(), 'Streak Legend', 'Maintain a 30-day streak', 'streak_days:30', 'LONG_TERM', 'HARD', 1500, true, NOW()),
  (gen_random_uuid(), 'Marathon Master', 'Complete 100 total sessions', 'session_count:100', 'LONG_TERM', 'HARD', 2000, true, NOW())
ON CONFLICT (title, criteria) DO NOTHING;

-- 4. Create Shop Items
INSERT INTO "ShopItem" (id, name, description, type, price, "assetUrl", "cssClass", "isAnimated", "createdAt")
VALUES
  -- Frames
  (gen_random_uuid(), 'Gold Frame', 'Luxurious gold border for your profile', 'FRAME', 500, NULL, 'border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]', false, NOW()),
  (gen_random_uuid(), 'Diamond Frame', 'Sparkling diamond border', 'FRAME', 1000, NULL, 'border-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]', true, NOW()),
  (gen_random_uuid(), 'Fire Frame', 'Blazing hot frame', 'FRAME', 750, NULL, 'border-4 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]', true, NOW()),
  
  -- Nameplates
  (gen_random_uuid(), 'Rainbow Text', 'Colorful gradient nameplate', 'NAMEPLATE', 300, NULL, 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent', true, NOW()),
  (gen_random_uuid(), 'Gold Text', 'Shiny gold nameplate', 'NAMEPLATE', 400, NULL, 'text-yellow-500 font-bold', false, NOW()),
  
  -- Utility Items
  (gen_random_uuid(), 'Streak Freeze', 'Protect your streak for one day', 'FREEZE', 100, NULL, NULL, false, NOW()),
  (gen_random_uuid(), 'Mission Pardon', 'Withdraw from a mission without penalty', 'PARDON', 50, NULL, NULL, false, NOW())
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database seeded successfully! ✅' as status;
