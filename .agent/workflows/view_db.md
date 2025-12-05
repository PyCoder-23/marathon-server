---
description: How to view the Prisma database using Prisma Studio
---

## Steps to view the database

1. **Install Prisma CLI (if not already installed)**
   ```bash
   npm install @prisma/cli --save-dev
   ```

2. **Generate Prisma client** (ensure the schema is up‑to‑date)
   ```bash
   npx prisma generate
   ```

3. **Run Prisma Studio** to open an interactive UI in your browser.
   ```bash
   // turbo
   npx prisma studio
   ```
   This will launch a local web server (usually at `http://localhost:5555`) where you can explore tables, view records, and edit data.

4. **Alternative: Directly inspect the SQLite file** (if using SQLite)
   - The SQLite database file is located at `prisma/dev.db` (or the path defined in `prisma/schema.prisma`).
   - You can open it with any SQLite viewer (e.g., DB Browser for SQLite) or run SQL queries via the command line:
     ```bash
     sqlite3 prisma/dev.db "SELECT * FROM User;"
     ```

5. **Stop Prisma Studio**
   - Press `Ctrl+C` in the terminal where it is running.

---

**Tip:** Keep the terminal open while using Prisma Studio. Any changes you make in the UI are saved instantly to the database.
