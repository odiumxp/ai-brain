# 🚀 AI Brain - Quick Setup Guide

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the 'postgres' user

## Step 2: Set Up Database

Open PowerShell or Command Prompt and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In the psql prompt:
CREATE DATABASE aibrain;
\c aibrain
\q
```

Then run the schema:
```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
psql -U postgres -d aibrain -f src/db/schema-no-pgvector.sql
```

## Step 3: Get OpenAI API Key

### OpenAI API Key (for GPT-4 and embeddings):
1. Go to: https://platform.openai.com/api-keys
2. Sign in
3. Create new secret key
4. Copy the key (starts with sk-proj- or sk-)

## Step 4: Configure Environment

Create a `.env` file in the backend folder:

```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
copy .env.example .env
notepad .env
```

Edit the file with your values:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aibrain
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
PORT=3000
NODE_ENV=development
ENABLE_CRON_JOBS=true
```

## Step 5: Install Dependencies

```powershell
# Backend
cd C:\Users\mcfar\MyProjects\ai-brain\backend
npm install

# Frontend
cd ..\frontend
npm install
```

## Step 6: Start the Servers

### Terminal 1 - Backend:
```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
npm run dev
```

You should see:
```
🧠 AI BRAIN SERVER STARTED
Port: 3000
Database: Connected
Ready to develop AI personalities! 🚀
```

### Terminal 2 - Frontend:
```powershell
# In NEW terminal
cd C:\Users\mcfar\MyProjects\ai-brain\frontend
npm run dev
```

Browser opens at: http://localhost:5173

## Step 7: Chat! 🎉

Start talking to your AI and watch its personality develop!

---

## Troubleshooting

### "psql: command not found"
- Add PostgreSQL bin folder to PATH:
  `C:\Program Files\PostgreSQL\18\bin`

### Database connection error
- Check PostgreSQL is running: `pg_isready`
- Verify your DATABASE_URL in .env
- Check your postgres password

### "npm: command not found"
- Install Node.js from: https://nodejs.org/

### OpenAI API errors
- Verify your API key in .env
- Check you have credits in OpenAI account
- Make sure key starts with sk-

---

## What You Get

- ✅ GPT-4o AI with actual persistent memory
- ✅ Personality that evolves through conversations
- ✅ Live stats showing traits and memory activity
- ✅ Beautiful cyberpunk themed UI
- ✅ Brain-inspired database architecture
- ✅ Automatic memory consolidation
- ✅ Emotional context tracking

---

## Next Steps

1. **Chat regularly** - The more you talk, the more unique the personality becomes
2. **Watch the stats** - See traits evolve in real-time
3. **Check the database** - Explore the "brain" structure with psql
4. **Add pgvector** (optional) - For semantic memory search

---

## Useful Commands

```powershell
# View database tables
psql -U postgres -d aibrain -c "\dt"

# Check memories
psql -U postgres -d aibrain -c "SELECT COUNT(*) FROM episodic_memory;"

# Check personality traits
psql -U postgres -d aibrain -c "SELECT * FROM personality_state;"

# Restart backend
cd backend
npm run dev

# Restart frontend
cd frontend
npm run dev
```

Happy building! 🚀🧠
