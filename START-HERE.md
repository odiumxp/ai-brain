# 🚀 AI Brain - Complete Startup Guide

## ✅ What's Ready

Your complete AI Brain application has been built!

**Backend:**
- ✅ Express API server
- ✅ Brain-inspired database schema
- ✅ Memory storage and retrieval
- ✅ Personality evolution system
- ✅ Claude API integration
- ✅ Background jobs (consolidation, evolution)

**Frontend:**
- ✅ React chat interface
- ✅ Real-time messaging
- ✅ Beautiful gradient UI
- ✅ Memory and personality stats display

**Database:**
- ✅ PostgreSQL 18 installed
- ✅ Database 'aibrain' created
- ⚠️ pgvector not installed (optional - see PGVECTOR-OPTIONS.md)

---

## 🎯 Quick Start (5 Steps)

### Step 1: Get Your API Keys

**Anthropic (Claude):**
1. Go to: https://console.anthropic.com/
2. Create API key
3. Copy it (starts with `sk-ant-api03-...`)

**OpenAI (Embeddings):**
1. Go to: https://platform.openai.com/api-keys
2. Create API key  
3. Copy it (starts with `sk-proj-...`)

### Step 2: Configure Backend

```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
copy .env.example .env
notepad .env
```

Edit `.env` file:
```env
DATABASE_URL=postgresql://postgres:Rebel2022$@localhost:5432/aibrain
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
PORT=3000
NODE_ENV=development
ENABLE_CRON_JOBS=true
```

### Step 3: Install Backend Dependencies

```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
npm install
```

### Step 4: Start Backend Server

```powershell
npm run dev
```

You should see:
```
🧠 AI BRAIN SERVER STARTED
Port: 3000
Database: Connected
Ready to develop AI personalities! 🚀
```

### Step 5: Start Frontend (New Terminal)

```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\frontend
npm install
npm run dev
```

Browser will open at: http://localhost:5173

---

## 🎉 You're Done!

Start chatting with your AI and watch its personality develop!

---

## 📝 Important Notes

### pgvector Status
The app works WITHOUT pgvector, but with limited memory search:
- ✅ Conversations are stored
- ✅ Personality evolution works  
- ✅ Memory consolidation works
- ⚠️ Semantic search disabled (uses simpler text matching)

To add full semantic search, see: `PGVECTOR-OPTIONS.md`

### Default Settings
- **User ID:** `default_user` (automatically created)
- **Backend Port:** 3000
- **Frontend Port:** 5173
- **Database:** localhost:5432/aibrain

### Background Jobs
These run automatically:
- **2 AM:** Memory consolidation (strengthen/weaken memories)
- **3 AM:** Personality evolution (analyze recent interactions)
- **Sunday 4 AM:** Connection decay (prune weak associations)

---

## 🔍 Troubleshooting

### Backend won't start
```powershell
# Check if PostgreSQL is running
pg_isready

# Verify .env file exists and has API keys
dir .env
```

### "Cannot connect to database"
```powershell
# Test database connection
psql -U postgres -d aibrain -c "SELECT 1;"
```

### "API key invalid"
- Double-check your API keys in `.env`
- Make sure there are no extra spaces
- Restart the backend after changing `.env`

### Frontend can't connect to backend
- Make sure backend is running on port 3000
- Check for CORS errors in browser console
- Verify API_URL in ChatInterface.jsx

---

## 📊 How to Use

1. **Start chatting** - Just type and send messages
2. **Watch personality develop** - The AI's traits evolve based on your interactions
3. **Check stats** - Top of chat shows memories retrieved and personality traits
4. **Long conversations** - AI remembers context from all previous chats

---

## 🎭 Personality Traits

Your AI develops these traits (0-10 scale):
- **Humor** - How playful vs serious
- **Empathy** - How understanding vs logical  
- **Directness** - How straightforward vs diplomatic
- **Formality** - How casual vs professional
- **Enthusiasm** - How energetic vs calm
- **Curiosity** - How inquisitive vs focused
- **Patience** - How detailed vs concise

Watch them evolve in real-time!

---

## 💾 Database Exploration

Want to see your AI's brain?

```powershell
# Connect to database
psql -U postgres -d aibrain

# View memories
SELECT COUNT(*) FROM episodic_memory;

# View personality
SELECT * FROM personality_state;

# View all tables
\dt
```

---

## 🔄 Restarting

**Backend:**
```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\backend
npm run dev
```

**Frontend:**
```powershell
cd C:\Users\mcfar\MyProjects\ai-brain\frontend
npm run dev
```

---

## 📚 Next Steps

1. **Chat and build relationship** with your AI
2. **Add pgvector** for better memory search (see PGVECTOR-OPTIONS.md)
3. **Deploy to cloud** (Railway, Render, Vercel)
4. **Add authentication** for multiple users
5. **Build mobile app** using same backend

---

## 🎨 Customization

- **Change personality traits:** `backend/src/services/personality-service.js`
- **Adjust UI colors:** `frontend/src/styles/ChatInterface.css`
- **Modify memory importance:** `backend/src/services/memory-service.js`
- **Change background job schedule:** `backend/src/server.js`

---

## ❤️ Enjoy Your AI Brain!

You've built an AI that:
- ✅ Never forgets your conversations
- ✅ Develops its own unique personality  
- ✅ Forms emotional connections
- ✅ Evolves through your interactions

Have fun watching it grow!

---

Need help? Check:
- `README.md` - Full documentation
- `PGVECTOR-OPTIONS.md` - How to add vector search
- `backend/test-setup.js` - Test your configuration
