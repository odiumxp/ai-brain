# 🧠 AI Brain - Persistent Memory AI with Evolving Personality

A sophisticated AI application featuring **persistent memory**, **evolving personality**, **multiple personas**, **AI-powered image generation**, and **advanced learning capabilities**. Built with GPT-4, React, Node.js, PostgreSQL, and Stable Diffusion.

![AI Brain Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-v18+-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)

## ✨ Features

### 🎭 Multiple AI Personas
- **Switch between specialized AI personalities** - General Assistant, Work Coach, Creative Partner, Learning Tutor
- **Create custom personas** with unique system prompts and behavior
- **Separate memory banks** - Each persona maintains its own conversation history
- **Seamless switching** - Change personalities mid-conversation

### 🎨 AI Image Generation (Stable Diffusion Integration)
- **Automatic Model Selection** - AI chooses the best model based on your prompt
  - **Anime/Manga** → NovaAnimeXL or WaiIllustrious models
  - **Realistic/Photographic** → JuggernautXL model
- **Smart Quality Tiers** - Automatic selection based on keywords
  - **SDXL** (High Quality) - For "hyper detail", "8k", "masterpiece"
  - **SD 1.5** (Fast) - For "quick", "draft", "simple"
  - **Turbo** (Ultra Fast) - For "instant", "turbo"
- **Intelligent Dimensions** - Understands aspect ratios
  - Exact dimensions: "1024x768"
  - Keywords: "portrait", "landscape", "square", "ultrawide", "banner"
- **Natural Language Prompts** - Just describe what you want!

### 🧠 Persistent Memory System
- **Never forgets** - Every conversation is stored with vector embeddings
- **Semantic search** - Retrieves relevant past conversations automatically
- **Importance scoring** - Prioritizes meaningful memories
- **Emotional context** - Tracks mood and sentiment using GPT-4 analysis
- **Memory Browser** - Search, filter, pin, and delete memories

### 📊 AI Insights Dashboard
- **Topic Analysis** - "What have we talked about most this month?"
- **Mood Tracking** - Visualize emotional trends over time
- **Behavior Patterns** - AI identifies recurring themes and habits
- **Personalized Recommendations** - Context-aware suggestions
- **Conversation Statistics** - Track engagement and activity

### 📚 Learning Mode (Integrated with Learning Tutor)
- **Quiz Generation** - Automatically creates questions from Learning Tutor conversations
- **Spaced Repetition** - Smart review scheduling (1 day → 3 days → 1 week → 2 weeks → 1 month)
- **Mastery Tracking** - 6-level progression system (New → Expert)
- **Study Sessions** - Focused learning with progress tracking
- **Knowledge Retention** - Review items when they're about to be forgotten

### 🎨 Rich Text Formatting
- **Markdown Support** - Bold, italic, headers, lists, tables
- **Syntax Highlighting** - Beautiful code blocks with 20+ languages
- **Clean Rendering** - Professional typography and spacing

### 💡 Additional Features
- **Personality Evolution** - AI traits change naturally through interactions
- **Memory Consolidation** - Background jobs optimize storage
- **Real-time Stats** - Live personality trait visualization
- **Minimalist UI** - Clean, professional, Apple-inspired design
- **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 18+ ([Download](https://www.postgresql.org/download/))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Stable Diffusion Forge** (Optional - for image generation) ([Download](https://github.com/lllyasviel/stable-diffusion-webui-forge))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/odiumxp/ai-brain.git
cd ai-brain
```

#### 2. Set Up PostgreSQL Database

**Option A: Using psql (Command Line)**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE aibrain;

# Connect to database
\c aibrain

# Exit psql
\q
```

**Option B: Using pgAdmin (GUI)**

1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `aibrain`
4. Click "Save"

#### 3. Configure Backend

```bash
cd backend
npm install
```

Create `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aibrain
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stable Diffusion (Optional - for image generation)
SD_API_URL=http://localhost:7860

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Enable/disable background jobs
ENABLE_CRON_JOBS=true
```

**⚠️ Important:** Replace `your_postgres_password` and `sk-your-openai-api-key-here` with your actual credentials.

#### 4. Set Up Stable Diffusion (Optional)

**For Image Generation:**

1. Download [Stable Diffusion Forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)
2. Download models and place in `models/Stable-diffusion/`:
   - **Anime:** [NovaAnimeXL](https://civitai.com/models/...)
   - **Realistic:** [JuggernautXL](https://civitai.com/models/...)
   - Or use any SDXL/SD 1.5 models you prefer
3. Start Forge: `webui-user.bat` (Windows) or `./webui.sh` (Linux/Mac)
4. Enable API: Add `--api` flag to launch arguments
5. Verify running on `http://localhost:7860`

**Check Your Models:**
```bash
cd backend
node check-models.js
```

This will list all available models. Update model names in `backend/src/services/sd-service.js` if needed.

#### 5. Configure Frontend

```bash
cd ../frontend
npm install
```

No additional configuration needed for frontend!

#### 6. Start the Application

**Terminal 1 - Stable Diffusion (Optional):**
```bash
# Navigate to your SD Forge directory
cd path/to/stable-diffusion-webui-forge
./webui.sh --api
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

#### 7. Open the App

Navigate to **http://localhost:5173** in your browser.

---

## 📖 User Guide

### Getting Started

1. **Initialize Default Personas**
   - Click the persona dropdown in the chat header
   - Click "Create Default Personas"
   - This creates 4 AI personalities: General Assistant, Work Coach, Creative Partner, and Learning Tutor

2. **Start Chatting**
   - Type a message in the chat box
   - The AI will respond and remember your conversation
   - Switch personas anytime to change the AI's behavior

### Generating Images

Ask the AI to create images using natural language:

**Quality Keywords:**
```
"Generate a masterpiece 8k portrait..."       → SDXL (high quality)
"Create a quick sketch of..."                 → SD 1.5 (fast)
"Make an instant turbo image of..."           → Turbo (ultra fast)
```

**Style Keywords:**
```
"Generate an anime girl with blue hair..."    → Anime model
"Create a photorealistic landscape..."        → Realistic model
```

**Dimension Keywords:**
```
"Make a 1920x1080 image..."                   → Exact dimensions
"Create a portrait of..."                     → 512x896 (tall)
"Generate a landscape scene..."               → 896x512 (wide)
"Make a square wallpaper..."                  → 768x768
"Create an ultrawide banner..."               → 1024x512
```

**Examples:**
```
"Generate a hyper-detailed 8k anime warrior with silver hair in 1024x1024"
→ SDXL, Anime model, 1024x1024

"Create a quick realistic portrait in landscape"
→ SD 1.5, Realistic model, 896x512

"Make an instant turbo image of a cat"
→ Turbo model, 768x768 (default)
```

### Using Learning Mode

1. **Switch to Learning Tutor** persona
2. Have a learning conversation (e.g., "Teach me about photosynthesis")
3. Go to the **Learning** tab
4. Click **Generate Quiz** to create questions from your conversation
5. Click **Start Study Session** to review
6. Mark answers as correct/wrong
7. Items will come back for review based on spaced repetition

### Understanding Insights

- **Topics** - Shows what you discuss most frequently
- **Mood** - Tracks emotional trends (joy, sadness, etc.)
- **Patterns** - Identifies behavioral habits
- **Recommendations** - AI-generated suggestions based on your interests

### Managing Memories

- **Search** - Find specific conversations
- **Filter** - Sort by importance, date, or access count
- **Pin** - Mark important memories to prevent decay
- **Delete** - Remove unwanted memories

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.3 with Vite
- date-fns (date formatting)
- marked (Markdown parsing)
- highlight.js (syntax highlighting)

**Backend:**
- Node.js with Express
- PostgreSQL 18 (database)
- OpenAI API (GPT-4o and embeddings)
- Stable Diffusion Forge API (image generation)
- node-cron (background jobs)

**AI Models:**
- `gpt-4o` - Main conversational AI
- `text-embedding-3-small` - Vector embeddings for semantic search
- Stable Diffusion XL/1.5 - Image generation

### Project Structure

```
ai-brain/
├── backend/
│   ├── src/
│   │   ├── api/            # API endpoints
│   │   │   ├── chat.js     # Chat & memory endpoints
│   │   │   ├── personas.js # Persona management
│   │   │   ├── insights.js # Analytics endpoints
│   │   │   └── learning.js # Learning mode endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── gpt-service.js       # GPT-4 integration
│   │   │   ├── sd-service.js        # Stable Diffusion integration
│   │   │   ├── memory-service.js    # Memory storage/retrieval
│   │   │   ├── persona-service.js   # Persona management
│   │   │   ├── insights-service.js  # Analytics
│   │   │   └── learning-service.js  # Quiz generation
│   │   ├── jobs/           # Background tasks
│   │   ├── db/             # Database connection
│   │   └── server.js       # Express server
│   ├── check-models.js     # Utility to check SD models
│   ├── .env                # Configuration (create this)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MemoryBrowser.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── LearningMode.jsx
│   │   │   ├── PersonaSwitcher.jsx
│   │   │   └── MarkdownRenderer.jsx
│   │   ├── styles/         # CSS files
│   │   └── App.jsx         # Main app component
│   └── package.json
│
├── README.md
├── SETUP.md
├── LICENSE
└── .gitignore
```

### Database Schema

**Key Tables:**
- `episodic_memory` - Stores conversations with embeddings and emotional context
- `personality_state` - Tracks AI personality traits (humor, empathy, etc.)
- `ai_personas` - Multiple AI personalities with custom prompts
- `learning_items` - Quiz questions with spaced repetition data
- `study_sessions` - Learning session history

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DB_HOST` | Yes | PostgreSQL host | `localhost` |
| `DB_PORT` | Yes | PostgreSQL port | `5432` |
| `DB_NAME` | Yes | Database name | `aibrain` |
| `DB_USER` | Yes | Database user | `postgres` |
| `DB_PASSWORD` | Yes | Database password | - |
| `OPENAI_API_KEY` | Yes | OpenAI API key | - |
| `SD_API_URL` | No | Stable Diffusion API URL | `http://localhost:7860` |
| `PORT` | No | Backend port | `3000` |
| `NODE_ENV` | No | Environment | `development` |
| `ENABLE_CRON_JOBS` | No | Enable background jobs | `true` |

### Cost Estimates

**OpenAI API Costs** (approximate):
- **Embeddings:** $0.00002 per message (~$0.20 per 10,000 messages)
- **GPT-4o Chat:** $0.0025 per message (~$2.50 per 1,000 messages)
- **Insights Analysis:** $0.01 per analysis
- **Quiz Generation:** $0.02 per quiz (5 questions)

**Stable Diffusion:**
- **FREE** (runs locally on your GPU)
- Requires: 8GB+ VRAM for SDXL, 4GB+ for SD 1.5

**Typical Monthly Cost:** $15-45 for moderate use (1,000-3,000 messages) + local GPU

---

## 🎨 Stable Diffusion Configuration

### Automatic Model Selection

The AI automatically selects the best model based on your prompt:

**Quality Tiers:**
- **SDXL** (High Quality) - "hyper detail", "8k", "masterpiece", "best quality"
- **SD 1.5** (Fast) - "quick", "fast", "simple", "draft"
- **Turbo** (Ultra Fast) - "instant", "turbo", "ultra fast"

**Style Detection:**
- **Anime** - "anime", "manga", "cartoon", "chibi", "kawaii"
- **Realistic** - "realistic", "photo", "photorealistic", "cinematic"

### Supported Models

The system works with any Stable Diffusion models. Default configuration:

**SDXL Models:**
- `novaAnimeXL_ilV160.safetensors` - Anime/Manga
- `juggernautXL_ragnarokBy.safetensors` - Realistic/Photographic

**SD 1.5 Models:**
- `AnyLoRA-anime.safetensors` - Anime (fast)
- `v1-5-pruned-emaonly.ckpt` - Realistic (fast)

**Turbo Models:**
- `zImageTurbo_turbo.safetensors` - Ultra fast generation

### Customizing Models

1. Check your available models:
```bash
cd backend
node check-models.js
```

2. Update model names in:
```javascript
// backend/src/services/sd-service.js
const MODELS = {
    xl_anime: { name: 'your-anime-model.safetensors', ... },
    xl_realistic: { name: 'your-realistic-model.safetensors', ... },
    // ... etc
};
```

3. Restart backend

---

## 🎯 Advanced Features

### Background Jobs

The app runs three scheduled background jobs:

1. **Memory Consolidation** (Daily at 2 AM)
   - Merges similar memories
   - Archives old conversations
   - Optimizes database

2. **Personality Evolution** (Daily at 3 AM)
   - Updates AI traits based on interactions
   - Adjusts humor, empathy, directness, etc.

3. **Connection Decay** (Weekly on Sunday at 4 AM)
   - Reduces importance of old, unused memories
   - Simulates natural forgetting

Disable with: `ENABLE_CRON_JOBS=false` in `.env`

### Future Enhancements (pgvector)

The app is ready for **semantic search** using pgvector:

1. Install pgvector extension: `CREATE EXTENSION vector;`
2. Embeddings are already being generated and stored
3. Update retrieval queries to use vector similarity

This will enable finding memories by **meaning** rather than just recency.

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `ECONNREFUSED` or `Connection refused`
- **Solution:** Make sure PostgreSQL is running
- **Check:** `psql -U postgres -d aibrain` works

**Error:** `Invalid API key`
- **Solution:** Verify your OpenAI API key in `.env`
- **Get key:** https://platform.openai.com/api-keys

### Stable Diffusion Issues

**Error:** "Could not generate image — SD not running"
- **Solution:** Start Stable Diffusion Forge with `--api` flag
- **Check:** Navigate to `http://localhost:7860` in browser

**Error:** "Model switch failed"
- **Solution:** Check your model names with `node check-models.js`
- **Fix:** Update model names in `sd-service.js`

**Slow image generation:**
- **Reduce dimensions:** Use 512x512 instead of 1024x1024
- **Use faster models:** Add "quick" or "fast" to prompt for SD 1.5
- **Check GPU:** Ensure CUDA/DirectML is working

### Frontend shows blank screen

**Error:** Vite build error
- **Solution:** Delete `node_modules`, run `npm install` again
- **Check:** Both servers are running (port 3000 and 5173)

### Database errors

**Error:** `relation "users" does not exist`
- **Solution:** Tables weren't created. Check database connection
- **Manual setup:** Run SQL scripts from backend/src/db/

### Memory/Insights not working

**Error:** "No conversations found"
- **Solution:** Chat with the AI first to create memories
- **For Insights:** Need at least 5-10 conversations
- **For Learning:** Must use Learning Tutor persona

---

## 📝 API Documentation

### Main Endpoints

**Chat:**
- `POST /api/chat` - Send message, get response (includes image generation)
- `GET /api/chat/history/:userId` - Get conversation history
- `GET /api/chat/personality/:userId` - Get personality traits

**Personas:**
- `GET /api/personas/:userId` - List all personas
- `POST /api/personas/:userId` - Create new persona
- `POST /api/personas/:userId/switch/:personaId` - Switch active persona

**Insights:**
- `GET /api/insights/:userId?days=30` - Get comprehensive insights
- `GET /api/insights/:userId/mood` - Mood analysis
- `GET /api/insights/:userId/topics` - Topic analysis

**Learning:**
- `POST /api/learning/:userId/generate-quiz` - Generate quiz questions
- `GET /api/learning/:userId/due` - Get items due for review
- `POST /api/learning/answer/:itemId` - Submit answer

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test changes thoroughly
- Update README if adding features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 and embeddings API
- **Stable Diffusion / lllyasviel** - Forge WebUI and image generation
- **PostgreSQL** - Robust database system
- **React** - Frontend framework
- **Vite** - Lightning-fast build tool
- **highlight.js** - Syntax highlighting
- **marked** - Markdown parsing

---

## 📧 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/odiumxp/ai-brain/issues)
- **Discussions:** [GitHub Discussions](https://github.com/odiumxp/ai-brain/discussions)

---

## 🎉 What's Next?

### Planned Features
- [ ] Img2img and inpainting support
- [ ] ControlNet integration
- [ ] LoRA model support
- [ ] Voice input/output
- [ ] Mobile app (React Native)
- [ ] Export conversations to PDF
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Integration with Google Calendar
- [ ] Collaborative AI (shared with family/team)
- [ ] Vector search with pgvector
- [ ] Analytics dashboard with charts
- [ ] Memory visualization (mind maps)

### Want to Help?
Check out our [Contributing Guidelines](#contributing) and pick an issue to work on!

---

<div align="center">

**Made with ❤️ and 🧠**

[⭐ Star this repo](https://github.com/odiumxp/ai-brain) | [🐛 Report Bug](https://github.com/odiumxp/ai-brain/issues) | [💡 Request Feature](https://github.com/odiumxp/ai-brain/issues)

</div>
