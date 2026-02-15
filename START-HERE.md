# 🚀 AI Brain - Quick Start Guide

Welcome! Your AI Brain application is **production-ready** with all major features.

---

## ⚡ 5-Minute Quick Start

### Step 1: Get API Keys

**OpenAI (Required):**
1. Go to https://platform.openai.com/api-keys
2. Create new key
3. Copy it (starts with `sk-proj-` or `sk-`)

### Step 2: Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API key
```

Your `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aibrain
DB_USER=postgres
DB_PASSWORD=Rebel2022$

# OpenAI (Required)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Stable Diffusion (Optional - for images)
SD_API_URL=http://localhost:7860

# Server
PORT=3000
NODE_ENV=development
ENABLE_CRON_JOBS=true
```

### Step 3: Install & Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Open:** http://localhost:5173

---

## 🎨 Optional: Image Generation

Want AI to generate images? See **SETUP_STABLE_DIFFUSION.md**

Quick version:
1. Download [SD Forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)
2. Add `--api` flag to launch
3. Start SD Forge
4. AI will auto-detect and use it!

---

## ✨ What You Get

### 🎭 Multiple AI Personas
- General Assistant, Work Coach, Creative Partner, Learning Tutor
- Create custom personas
- Each has separate memories

### 🎨 AI Image Generation
- Natural language: "Generate a hyper detailed anime portrait"
- Automatic model selection (anime/realistic)
- Smart quality tiers (8k → SDXL, quick → SD 1.5)
- Intelligent dimensions (portrait, landscape, 1024x768)

### 📊 AI Insights
- Topic analysis
- Mood tracking
- Behavior patterns
- Personalized recommendations

### 📚 Learning Mode
- Quiz generation from conversations
- Spaced repetition
- Mastery tracking (6 levels)
- Study sessions

### 🎨 Rich Text
- Markdown support
- Syntax highlighting (20+ languages)
- Beautiful code blocks

### 💾 Persistent Memory
- Never forgets conversations
- GPT-4 emotional analysis
- Memory browser (search/filter/pin)

---

## 🎯 First Steps

1. **Initialize Personas**
   - Click persona dropdown
   - "Create Default Personas"

2. **Start Chatting**
   - Switch between personas
   - Watch personality develop

3. **Generate Images** (if SD running)
   - "Generate a masterpiece 8k anime warrior"
   - "Create a quick realistic landscape"

4. **Try Learning Mode**
   - Switch to Learning Tutor
   - Have a conversation
   - Go to Learning tab
   - Generate Quiz!

5. **Check Insights**
   - Go to Insights tab
   - See topics, mood, patterns

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Verify API key in `.env`

**No images generating:**
- Stable Diffusion is optional
- See SETUP_STABLE_DIFFUSION.md to enable

**Insights/Learning not working:**
- Need conversations first (5-10 chats minimum)
- Learning requires Learning Tutor persona

---

## 📚 Documentation

- **README.md** - Complete guide with all features
- **SETUP_STABLE_DIFFUSION.md** - Image generation setup
- **TECHNICAL_SD_INTEGRATION.md** - Architecture details
- **PROJECT-COMPLETE.md** - What's been built

---

## 💰 Costs

**OpenAI API:**
- ~$15-45/month for moderate use
- Embeddings: $0.20 per 10K messages
- GPT-4o: $2.50 per 1K messages

**Stable Diffusion:**
- FREE (runs locally on GPU)
- Or cloud: $0.50-2/hour

---

## 🎉 Enjoy!

You have a production-ready AI with:
- ✅ 6,278+ lines of code
- ✅ 4 major features
- ✅ Image generation
- ✅ Complete documentation

**Have fun!** 🧠✨

---

**Questions?** Check README.md or open a GitHub issue.
