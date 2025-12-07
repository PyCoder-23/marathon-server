# 🏃 Marathon Server

A professional study community platform built with Next.js, featuring XP systems, squad competitions, missions, and comprehensive analytics.

## 🚀 Features

- **Study Session Tracking** - Track study time with built-in timer
- **XP & Leveling System** - Earn XP for completed study sessions
- **Squad System** - Join teams and compete on leaderboards
- **Mission System** - Complete daily, weekly, and long-term challenges
- **Leaderboards** - Weekly, monthly, and all-time rankings
- **Streak Tracking** - Maintain study streaks with freeze system
- **Shop & Cosmetics** - Unlock frames, nameplates, and badges
- **Admin Panel** - Comprehensive user and content management
- **Hall of Fame** - Celebrate top performers

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with bcrypt
- **Styling:** Tailwind CSS
- **Deployment:** Vercel-ready

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd marathon-server-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed initial data (squads, missions, shop items)
   npx tsx prisma/seed.ts
   
   # Create admin user
   npx tsx prisma/seed_admin.ts
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Management

### View Database with Prisma Studio
```bash
npx prisma studio
```

### Create a Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

## 👤 Default Admin Account

After running `seed_admin.ts`:
- **Email:** admin@test.com
- **Password:** admin123
- **Roles:** Admin, Management

⚠️ **Change the password immediately in production!**

## 📁 Project Structure

```
marathon-server-main/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── leaderboard/       # Leaderboard page
│   ├── missions/          # Missions page
│   ├── profile/           # Profile pages
│   └── ...
├── components/            # React components
├── lib/                   # Utility functions & helpers
│   ├── db.ts             # Prisma client
│   ├── cache.ts          # Response caching
│   ├── api-helpers.ts    # Auth & response helpers
│   └── ...
├── prisma/               # Database schema & migrations
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Initial data seeder
│   └── migrations/       # Migration files
└── public/               # Static assets
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login

### Sessions
- `POST /api/sessions/start` - Start study session
- `POST /api/sessions/stop` - Stop session & earn XP

### User Data
- `GET /api/users/me` - Get current user
- `GET /api/users/stats` - Get dashboard stats
- `GET /api/users/profile/[username]` - Get user profile

### Leaderboards & Squads
- `GET /api/leaderboard?period=weekly` - Get leaderboard
- `GET /api/squads` - Get all squads

### Missions
- `GET /api/missions` - Get available missions
- `POST /api/missions/start` - Start a mission
- `POST /api/missions/complete` - Complete a mission

### Admin (Requires Admin Role)
- `GET /api/admin/users/list` - List all users
- `POST /api/admin/users/update-xp` - Modify user XP
- `POST /api/admin/users/ban` - Ban/unban users

## ⚡ Performance Optimizations

This application includes several performance optimizations:

- **Response Caching** - Frequently accessed data is cached (leaderboards, squads, stats)
- **Database Indexes** - Critical indexes on Session, MissionProgress, XPTransaction
- **Parallel Queries** - Multiple database queries run simultaneously
- **Aggregation** - Database-level aggregation instead of in-memory processing
- **Selective Fields** - Only fetch required fields from database

### Cache Configuration

Caches are automatically managed with TTL:
- **Leaderboard:** 2 minutes
- **Squads:** 2 minutes  
- **User Stats:** 30 seconds

Caches are invalidated when:
- User completes a session
- Missions are completed
- Admin makes changes

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_API_URL="https://your-domain.com"
```

## 📊 Monitoring

### Check Cache Statistics

The cache system provides statistics:
```typescript
import { cache } from '@/lib/cache';
console.log(cache.getStats());
```

### Database Query Performance

Monitor slow queries in your database logs. All critical queries should complete in <100ms with proper indexes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues & Solutions

### High Memory Usage
- Ensure Prisma query logging is disabled in production
- Check that all database indexes are applied
- Monitor cache size with `cache.getStats()`

### Slow Queries
- Run `npx prisma migrate deploy` to ensure indexes are applied
- Check database connection pooling settings
- Review query patterns in slow endpoints

### Session Timer Issues
- Timer resets immediately on stop (optimistic UI update)
- If API call fails, timer state is restored
- Minimum 25-minute sessions required for XP

## 📞 Support

For issues or questions:
1. Check the code comments for implementation details
2. Review the Prisma schema for data structure
3. Check API route files for endpoint logic

---

**Built with ❤️ for focused learners**
