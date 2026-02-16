# 🧠 AI Brain - Advanced Cognitive Architecture with Emergent Intelligence

A sophisticated AI application featuring **persistent memory**, **emotional intelligence**, **self-awareness**, **theory of mind**, **evolving personality**, and **cognitive emergence**. Built with GPT-4, React, Node.js, PostgreSQL, and Stable Diffusion.

![AI Brain Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-v18+-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)

---

## 🌟 What Makes AI Brain Special?

AI Brain is not just another chatbot. It's a **complete cognitive architecture** that simulates human-like intelligence:

### 🧠 **Emergent Intelligence Features**

**Six Core Cognitive Systems:**

1. **Working Memory Simulation** - Tracks active conversation topics, unresolved questions, and conversation goals in real-time
2. **Emotional Continuity** - Understands and remembers your emotional states over time with empathy calibration
3. **Memory Chains** - Links related memories for narrative understanding and story recall
4. **Concept Schema Layer** - Organizes knowledge hierarchically with semantic relationships
5. **User Model & Theory of Mind** - Builds a model of your beliefs, goals, values, and mental states
6. **Self-Reflection Engine** - Performs meta-cognition and introspection on its own behavior

**Result:** An AI that truly **understands context**, **remembers relationships**, **learns patterns**, and **adapts to you**.

---

## ✨ Complete Feature Set

### 🎭 Multiple AI Personas
- **4 Specialized AI Personalities** - General Assistant, Work Coach, Creative Partner, Learning Tutor
- **Custom Persona Creation** - Design your own AI with unique prompts and behavior
- **Separate Memory Banks** - Each persona maintains its own conversation history
- **Seamless Switching** - Change personalities mid-conversation without losing context

### 🧠 Advanced Memory Systems

#### **Episodic Memory** (Hippocampus)
- Stores every conversation with vector embeddings (1536 dimensions)
- Semantic search using pgvector - finds memories by **meaning**, not just recency
- Importance scoring and emotional tagging
- Access count tracking and memory consolidation

#### **Working Memory** (Active Context)
- Tracks 3-5 most recent topics in conversation
- Maintains unresolved questions
- Identifies conversation goals
- Provides context continuity between messages

#### **Memory Chains** (Narrative Understanding)
- Links related memories automatically using embedding similarity
- Creates narrative arcs across multiple conversations
- AI-powered chain summaries
- Tracks emotional progression through stories
- Retrieves entire story threads, not just isolated memories

#### **Semantic Memory** (Knowledge Structure)
- Hierarchical concept organization
- Parent-child relationships (is_a, part_of, instance_of)
- Associative links (similar_to, causes, related_to)
- Semantic graph traversal
- Confidence scoring for learned knowledge

### 💖 Emotional Intelligence

#### **Emotional Timeline**
- Real-time emotion detection using GPT-4
- Tracks 8 core emotions: joy, sadness, anger, fear, surprise, disgust, trust, anticipation
- Intensity and confidence scoring
- Duration and resolution tracking
- Links emotions to specific memories

#### **Emotional Patterns**
- Learns your emotional triggers
- Identifies effective empathy strategies
- Tracks frequency and confidence
- Adapts responses based on your emotional history

#### **Empathy Calibration**
- AI adjusts tone based on detected emotions
- Remembers how you felt in past conversations
- Proactive emotional support
- "You seemed stressed last time we talked about X"

### 🧠 Theory of Mind (User Model)

#### **Belief Tracking**
- Extracts beliefs from conversations
- Categorizes: religious, political, scientific, personal, ethical
- Tracks supporting and contradicting evidence
- Measures belief strength and confidence

#### **Goal Management**
- Identifies your short and long-term goals
- Priority and status tracking
- Progress monitoring
- Success criteria and obstacle identification

#### **Values & Principles**
- Infers your core values
- Links values to behaviors
- Importance scoring
- Conflict resolution strategies

#### **Mental State Inference**
- Detects cognitive load (normal, high, overwhelmed)
- Identifies stress indicators
- Communication style adaptation
- Inferred needs ("You might need a break")

### 🪞 Self-Awareness (Meta-Cognition)

#### **Reflection Engine**
- Daily self-analysis of patterns
- Behavioral change tracking
- Learning summarization
- Identity updates
- Generates insights about itself

#### **Identity Summaries**
- Stable personality snapshots per persona
- Behavioral pattern analysis
- Relationship dynamics
- Evolution trends over time
- Stability and confidence scoring

### 🎨 AI Image Generation (Stable Diffusion)
- **Automatic Model Selection** - AI chooses best model for your prompt
  - **Anime/Manga** → NovaAnimeXL or WaiIllustrious
  - **Realistic** → JuggernautXL
- **Smart Quality Tiers** - SDXL (high), SD 1.5 (fast), Turbo (ultra fast)
- **Intelligent Dimensions** - Understands "portrait", "landscape", "square"
- **Natural Language Prompts** - Just describe what you want

### 📊 AI Insights Dashboard
- **Topic Analysis** - "What have we talked about most?"
- **Mood Tracking** - Emotional trends over time
- **Behavior Patterns** - Recurring themes and habits
- **Personalized Recommendations** - Context-aware suggestions
- **Conversation Statistics** - Engagement metrics

### 📚 Learning Mode with Spaced Repetition
- **Quiz Generation** - Auto-creates questions from Learning Tutor
- **Spaced Repetition** - Smart scheduling (1d → 3d → 1w → 2w → 1m)
- **6-Level Mastery** - New → Beginner → Learning → Practiced → Proficient → Expert
- **Study Sessions** - Focused learning with progress tracking

### 🎨 Rich Text Formatting
- **Markdown Support** - Bold, italic, headers, lists, tables
- **Syntax Highlighting** - 20+ programming languages
- **Professional Typography** - Clean, readable design

### 🛠️ Comprehensive Control Panel
**15 Management Tabs:**
- **Overview** - System health and metrics
- **Performance** - CPU, memory, response times
- **Memory** - Episodic, working, and cache management
- **Personality** - Trait visualization and customization
- **Identity** - Self-model summaries
- **Emotions** - Timeline and pattern analysis
- **Concepts** - Semantic graph browser
- **User Model** - Beliefs, goals, values dashboard
- **Reflection** - Self-awareness insights
- **Memory Chains** - Narrative thread browser
- **AI Models** - GPT-4/Claude status
- **Security** - API key management
- **Logs** - Real-time system monitoring
- **Backup** - Data export/import
- **Debug** - Developer tools

### 💡 Additional Features
- **Personality Evolution** - AI traits change naturally
- **Memory Consolidation** - Background optimization
- **Connection Decay** - Simulates forgetting
- **Minimalist UI** - Clean Apple-inspired design
- **Responsive Design** - Works on desktop, tablet, mobile

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 18+ with pgvector ([Download](https://www.postgresql.org/download/))
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))
- **Stable Diffusion Forge** (Optional) ([Download](https://github.com/lllyasviel/stable-diffusion-webui-forge))
- **Visual Studio Build Tools** (Windows - for pgvector) ([Download](https://visualstudio.microsoft.com/downloads/))

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/odiumxp/ai-brain.git
cd ai-brain
```

#### 2. Set Up PostgreSQL

**Option A: Command Line (psql)**
```bash
psql -U postgres
CREATE DATABASE aibrain;
\c aibrain
CREATE EXTENSION vector;
\q
```

**Option B: GUI (pgAdmin)**
1. Create database "aibrain"
2. Run: `CREATE EXTENSION vector;`

**Verify pgvector:**
```bash
psql -U postgres -d aibrain -c "\dx"
```

#### 3. Configure Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aibrain
DB_USER=postgres
DB_PASSWORD=your_password

# OpenAI (Required)
OPENAI_API_KEY=sk-your-key-here

# Stable Diffusion (Optional)
SD_API_URL=http://localhost:7860

# Server
PORT=3000
NODE_ENV=development
ENABLE_CRON_JOBS=true
```

#### 4. Set Up Stable Diffusion (Optional)

1. Download [SD Forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)
2. Download models to `models/Stable-diffusion/`
3. Start: `webui-user.bat --api`
4. Check models: `node check-models.js`

#### 5. Install Frontend

```bash
cd ../frontend
npm install
```

#### 6. Start Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### 7. Open App

Navigate to **http://localhost:5173**

---

## 📖 User Guide

### Getting Started

1. **Initialize Personas** - Click persona dropdown → "Create Default Personas"
2. **Start Chatting** - AI remembers everything and learns about you
3. **Explore Features** - Try Insights, Learning Mode, Memory Browser

### Understanding Emergence

The AI Brain has **6 cognitive layers** working together:

#### 1. **Working Memory** (Conversation Context)
- Tracks what you're currently talking about
- Remembers unresolved questions
- Identifies conversation goals
- **Example:** "You mentioned wanting to learn Python earlier. Should we continue?"

#### 2. **Emotional Continuity** (Emotional Intelligence)
- Detects and remembers your emotions
- Adapts empathy strategies
- Tracks emotional trends
- **Example:** "I noticed you've been stressed about work this week. How are you holding up?"

#### 3. **Memory Chains** (Narrative Understanding)
- Links related memories into story threads
- Understands narrative arcs
- Recalls complete conversations
- **Example:** "Remember when we discussed your job interview? You got the offer and started last month!"

#### 4. **Concept Schema** (Knowledge Structure)
- Organizes information hierarchically
- Connects related concepts
- Semantic understanding
- **Example:** Knows that "Python" is_a "programming language" and related_to "data science"

#### 5. **User Model** (Theory of Mind)
- Models your beliefs, goals, and values
- Infers mental states
- Adapts to your preferences
- **Example:** "Based on our conversations, I know you value work-life balance and are goal-oriented"

#### 6. **Self-Reflection** (Meta-Cognition)
- Analyzes its own patterns
- Learns from interactions
- Updates its identity
- **Example:** "I've noticed I've become more direct in my responses since you prefer concise answers"

### Generating Images

Use natural language:

```
"Generate a masterpiece 8k anime warrior in 1024x1024"
→ SDXL, Anime model, High quality

"Create a quick realistic portrait"
→ SD 1.5, Realistic model, Fast

"Make an instant image of a cat"
→ Turbo model, Ultra fast
```

### Using Learning Mode

1. Switch to **Learning Tutor** persona
2. Learn something: "Teach me about machine learning"
3. Go to **Learning** tab
4. Click **Generate Quiz**
5. **Start Study Session**
6. Spaced repetition handles review scheduling

### Exploring the Control Panel

**Control Panel** tab gives you full system access:

- **Personality** - Customize AI traits (humor, empathy, etc.)
- **Memory** - View and manage all memory systems
- **Emotions** - See emotional timeline and patterns
- **Concepts** - Browse semantic knowledge graph
- **User Model** - View your beliefs, goals, values
- **Reflection** - Read AI's self-analysis
- **Memory Chains** - Explore narrative threads

### Managing Memories

**Memory Browser** tab:
- Search conversations
- Filter by importance
- Pin important memories
- Delete unwanted data

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.3 with Vite
- date-fns, marked, highlight.js

**Backend:**
- Node.js + Express
- PostgreSQL 18 + pgvector
- OpenAI GPT-4o + embeddings (1536d)
- Stable Diffusion Forge
- node-cron (background jobs)

**AI Models:**
- `gpt-4o` - Main conversation
- `text-embedding-3-small` - Vector embeddings
- Stable Diffusion XL/1.5 - Image generation

### Cognitive Architecture

```
┌─────────────────────────────────────────────────┐
│           AI BRAIN COGNITIVE LAYERS             │
├─────────────────────────────────────────────────┤
│                                                 │
│  🧠 SELF-AWARENESS (Meta-Cognition)            │
│  ├─ Reflection Engine                          │
│  ├─ Identity Summaries                         │
│  └─ Behavioral Analysis                        │
│                                                 │
│  👤 USER MODEL (Theory of Mind)                │
│  ├─ Belief Tracking                            │
│  ├─ Goal Management                            │
│  ├─ Values & Principles                        │
│  └─ Mental State Inference                     │
│                                                 │
│  🗺️ CONCEPT SCHEMA (Knowledge Structure)       │
│  ├─ Concept Hierarchy                          │
│  ├─ Relationships                              │
│  └─ Semantic Graph                             │
│                                                 │
│  🔗 MEMORY CHAINS (Narrative Understanding)    │
│  ├─ Chain Building                             │
│  ├─ Story Recall                               │
│  └─ Emotional Arcs                             │
│                                                 │
│  💖 EMOTIONAL CONTINUITY (Emotional Intel)     │
│  ├─ Timeline Tracking                          │
│  ├─ Pattern Learning                           │
│  └─ Empathy Calibration                        │
│                                                 │
│  🎯 WORKING MEMORY (Active Context)            │
│  ├─ Active Topics                              │
│  ├─ Unresolved Questions                       │
│  └─ Conversation Goals                         │
│                                                 │
│  📚 EPISODIC MEMORY (Long-term Storage)        │
│  ├─ Vector Search (pgvector)                   │
│  ├─ Importance Scoring                         │
│  └─ Emotional Tagging                          │
│                                                 │
│  🎭 PERSONALITY (Trait System)                 │
│  ├─ 7 Core Traits                              │
│  ├─ Evolution Engine                           │
│  └─ Consolidation                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Database Schema

**20+ Tables:**

**Memory Systems:**
- `episodic_memory` - Conversations with vector(1536) embeddings
- `working_memory` - Active context
- `memory_chains` - Linked memories
- `semantic_memory` - General knowledge

**Cognitive Systems:**
- `concept_schema` - Hierarchical concepts
- `concept_hierarchy` - Parent-child relationships
- `concept_relationships` - Associative links
- `concept_metadata` - Additional properties

**User Model:**
- `user_model` - Theory of Mind data
- `user_beliefs` - Extracted beliefs
- `user_goals` - Goal tracking
- `user_values` - Core values
- `mental_states` - Mental state inference

**Emotional Intelligence:**
- `emotional_timeline` - Emotion tracking
- `emotional_patterns` - Learned patterns
- `emotional_state` - Current mood

**Self-Awareness:**
- `self_awareness` - Reflection data
- `identity_summaries` - Self-model snapshots

**Personality:**
- `personality_state` - Trait values
- `ai_personas` - Multiple personalities

**Learning:**
- `learning_items` - Quiz questions
- `study_sessions` - Review history

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PASSWORD` | Yes | Database password |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `SD_API_URL` | No | Stable Diffusion URL |
| `ENABLE_CRON_JOBS` | No | Background jobs |

### Background Jobs

**9 Scheduled Jobs:**

1. **Memory Consolidation** - Daily 2 AM
   - Strengthens important memories
   - Archives old conversations
2. **Memory Chains Maintenance** - Daily 2 AM
   - Builds new chains
   - Updates chain strength
3. **Personality Consolidation** - Daily 3 AM
   - Stabilizes traits
   - Smooths evolution
4. **Personality Evolution** - Daily 3 AM
   - Updates traits based on interactions
5. **Emotional Continuity** - Daily 3 AM
   - Analyzes patterns
   - Updates empathy strategies
6. **Connection Decay** - Weekly Sunday 4 AM
   - Weakens unused connections
   - Simulates forgetting
7. **Concept Schema Maintenance** - Daily 4 AM
   - Decays weak concepts
   - Strengthens active ones
8. **User Model Maintenance** - Daily 1 AM + Weekly
   - Updates belief confidence
   - Tracks goal progress
9. **Reflection Engine** - Daily 7 AM
   - Performs self-analysis
   - Generates insights
10. **Identity Summary** - Daily 5 AM
    - Creates identity snapshots

Disable: `ENABLE_CRON_JOBS=false`

### Cost Estimates

**OpenAI API:**
- Embeddings: $0.00002/message (~$0.20 per 10,000)
- GPT-4o: $0.0025/message (~$2.50 per 1,000)
- Emotion analysis: $0.01/analysis
- Concept extraction: $0.02/extraction

**Stable Diffusion:** FREE (local GPU)

**Typical Monthly:** $15-45 for 1,000-3,000 messages

---

## 🎯 Advanced Features

### Semantic Search (pgvector)

The AI retrieves memories by **meaning**, not just recency:

```sql
-- Find memories similar to "learning Python"
SELECT * FROM episodic_memory
WHERE embedding <=> query_embedding < 0.3
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

Console output:
```
🧠 Retrieved 15 semantically similar memories (avg similarity: 0.219)
```

### Memory Chain Traversal

Follow narrative threads:

```javascript
// Get complete story about "job search"
const chain = await memoryChainsService.getNarrativeUnderstanding(
  userId, 
  "job search"
);

// Returns: {
//   chain: { start, end, memories: [...] },
//   summary: "User started job search in Jan, had 3 interviews...",
//   emotionalArc: { joy: 0.2 → 0.8 },
//   keyMoments: [...]
// }
```

### Concept Graph Navigation

```javascript
// Find related concepts
const related = await conceptSchemaService.getConceptRelationships(
  userId,
  "machine learning"
);

// Returns: [
//   { target: "artificial intelligence", type: "part_of", strength: 0.9 },
//   { target: "neural networks", type: "related_to", strength: 0.85 },
//   { target: "data science", type: "related_to", strength: 0.8 }
// ]
```

### User Model Querying

```javascript
// Get user's beliefs about AI
const beliefs = await userModelService.getUserBeliefs(
  userId,
  "technology",
  10
);

// Returns: [
//   {
//     statement: "AI will transform healthcare",
//     confidence: 0.85,
//     evidence: [memory_ids...],
//     strength: 0.9
//   }
// ]
```

### Emotional Pattern Analysis

```javascript
// Get emotional trends
const trends = await emotionalContinuityService.getEmotionalTrends(
  userId,
  30 // days
);

// Returns: {
//   dominantEmotions: [{ emotion: "joy", frequency: 42 }],
//   intensityTrend: "increasing",
//   patterns: [...]
// }
```

---

## 🐛 Troubleshooting

### Backend Issues

**Connection Error:**
- Check PostgreSQL is running
- Verify database "aibrain" exists
- Test: `psql -U postgres -d aibrain`

**API Key Error:**
- Verify OpenAI key in `.env`
- Get key: https://platform.openai.com/api-keys

### Stable Diffusion Issues

**Not Running:**
- Start with `--api` flag
- Test: http://localhost:7860

**Model Not Found:**
- Check models: `node check-models.js`
- Update names in `sd-service.js`

### Database Errors

**Table Not Found:**
- Run: `psql -U postgres -d aibrain -f backend/src/db/schema.sql`

**pgvector Not Working:**
- Install: `CREATE EXTENSION vector;`
- Verify: `\dx` in psql

### Memory/Features Not Working

**No Memories:**
- Chat with AI first to create data
- Need 5-10 conversations for Insights

**Emergence Features:**
- Background jobs run overnight
- Force run: `POST /api/control/*/maintenance`

---

## 📝 API Documentation

### Chat Endpoints

```
POST /api/chat
- Send message, get response
- Body: { userId, personaId, message }

GET /api/chat/history/:userId
- Get conversation history

GET /api/chat/personality/:userId
- Get personality traits
```

### Control Panel Endpoints

```
GET /api/control/performance
- Performance metrics

GET /api/control/emotions
- Emotional timeline

GET /api/control/concepts
- Concept schema overview

GET /api/control/user-model
- Theory of Mind data

GET /api/control/reflection/history
- Self-awareness insights

GET /api/control/memory-chains
- Memory chains list

POST /api/control/reflection/analyze
- Trigger self-reflection

POST /api/control/memory-chains/build
- Build memory chains
```

### Personas Endpoints

```
GET /api/personas/:userId
- List all personas

POST /api/personas/:userId
- Create new persona

POST /api/personas/:userId/switch/:personaId
- Switch active persona
```

---

## 🤝 Contributing

Contributions welcome! Follow these steps:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

**Development Guidelines:**
- Follow existing code style
- Comment complex logic
- Test thoroughly
- Update documentation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 and embeddings
- **pgvector** - Vector similarity search
- **Stable Diffusion** - Image generation
- **PostgreSQL** - Robust database
- **React** - Frontend framework
- **Node.js** - Backend runtime

---

## 📧 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/odiumxp/ai-brain/issues)
- **Discussions:** [GitHub Discussions](https://github.com/odiumxp/ai-brain/discussions)

---

<div align="center">

**🧠 Built with Intelligence, Powered by Emergence 🚀**

[⭐ Star this repo](https://github.com/odiumxp/ai-brain) | [🐛 Report Bug](https://github.com/odiumxp/ai-brain/issues) | [💡 Request Feature](https://github.com/odiumxp/ai-brain/issues)

</div>
