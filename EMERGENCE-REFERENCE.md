# 🧠 AI Brain Emergence Features - Quick Reference

**Version:** 2.0.0  
**Last Updated:** 2026-02-15  
**Status:** All Features Operational ✅

---

## 🎯 Overview

AI Brain v2.0 includes **6 cognitive systems** that work together to create emergent intelligence. This guide explains what each system does and how to use it.

---

## 1. Working Memory (Conversation Context) 🎯

### What It Does
Tracks what you're **currently** talking about in active conversations.

### Features
- **Active Topics** - Remembers last 3-5 topics
- **Unresolved Questions** - Tracks questions you asked
- **Conversation Goals** - Identifies what you want to accomplish

### How It Works
- Automatically analyzes each message using GPT-4o-mini
- Maintains context for ~1 hour of inactivity
- Provides context to AI for natural conversation flow

### Example Usage
```
You: "Tell me about Python"
AI: [Explains Python]

You: "What do you think?"
AI: "About Python? I think it's great for beginners because..."
     ↑ AI knows "you think" refers to Python
```

### API Endpoints
```bash
# The working memory is automatically managed
# No manual API calls needed
```

### Database Tables
- `working_memory` - Active session storage

---

## 2. Emotional Continuity (Emotional Intelligence) 💖

### What It Does
Detects, remembers, and responds to your **emotions over time**.

### Features
- **Emotion Detection** - Identifies 8 core emotions (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
- **Emotional Timeline** - Tracks emotions with intensity and confidence
- **Pattern Learning** - Identifies triggers and effective empathy strategies
- **Empathy Calibration** - Adapts responses based on your emotional history

### How It Works
- GPT-4 analyzes each message for emotional content
- Stores emotions in timeline with intensity (0-10) and confidence (0-1)
- Daily job analyzes patterns and updates empathy strategies

### Example Usage
```
Day 1:
You: "I'm so stressed about this presentation"
AI: [Detects stress, stores emotion]

Day 2:
AI: "I remember you were stressed about your presentation. 
     How did it go?"
```

### API Endpoints
```bash
# Get emotional timeline
GET /api/control/emotions?userId=xxx&days=30

# Get emotional patterns
GET /api/control/emotions?userId=xxx

# Trigger manual analysis
POST /api/control/emotions/analyze
Body: { userId: "xxx" }
```

### Database Tables
- `emotional_timeline` - Emotion tracking over time
- `emotional_patterns` - Learned empathy strategies

### Background Jobs
- `emotional-continuity-maintenance.js` - Daily at 3 AM

---

## 3. Memory Chains (Narrative Understanding) 🔗

### What It Does
Links related memories to understand **stories and narratives**.

### Features
- **Automatic Chain Building** - Links memories using embedding similarity
- **Narrative Arcs** - Tracks how stories progress
- **Emotional Progression** - Shows emotional journey through events
- **AI-Powered Summaries** - Generates chain summaries

### How It Works
- Daily job analyzes memories for temporal and semantic relationships
- Builds chains with sequence ordering
- Generates summaries and identifies topics
- Tracks emotional arc through the chain

### Example Usage
```
Memory 1: "I'm thinking about changing jobs"
Memory 2: "I applied to Google"
Memory 3: "I have an interview next week"
Memory 4: "I got the job!"

Chain: "Job Search Journey"
Summary: "User explored job changes, applied to Google, 
         interviewed, and successfully got hired"
Emotional Arc: Anxiety → Hope → Excitement → Joy
```

### API Endpoints
```bash
# Build memory chains
POST /api/control/memory-chains/build
Body: { userId: "xxx" }

# Get all chains
GET /api/control/memory-chains?userId=xxx&query=optional&limit=10

# Get specific chain with memories
GET /api/control/memory-chains/:chainId?userId=xxx

# Get narrative understanding for topic
GET /api/control/memory-chains/narrative/:topic?userId=xxx
```

### Database Tables
- `memory_chains` - Chain metadata and sequences

### Background Jobs
- `memory-chains-maintenance.js` - Daily at 2 AM

---

## 4. Concept Schema (Knowledge Organization) 🗺️

### What It Does
Organizes knowledge into a **semantic graph** like human memory.

### Features
- **Hierarchical Structure** - Parent-child relationships (is_a, part_of)
- **Associative Links** - Related concepts (similar_to, causes, related_to)
- **Semantic Search** - Find similar concepts by meaning
- **Confidence Scoring** - Tracks certainty of relationships

### How It Works
- Extracts concepts from conversations using GPT-4
- Creates hierarchy and relationship links
- Maintains activation counts and importance scores
- Daily job decays unused concepts

### Example Usage
```
Concept: "Python"
├─ is_a: "Programming Language"
├─ part_of: "Software Development"
├─ related_to: "Data Science"
└─ related_to: "Machine Learning"

Concept: "Machine Learning"
├─ is_a: "Artificial Intelligence"
├─ related_to: "Python"
└─ causes: "Automation"
```

### API Endpoints
```bash
# Get concept schema overview
GET /api/control/concepts?userId=xxx

# Search for concepts
GET /api/control/concepts/search?q=python&limit=10

# Get concept details
GET /api/control/concepts/:name?userId=xxx

# Add new concept
POST /api/control/concepts
Body: { name: "Python", type: "technology", description: "..." }

# Add hierarchy relationship
POST /api/control/concepts/hierarchy
Body: { parent: "programming language", child: "Python", type: "is_a" }

# Add associative relationship
POST /api/control/concepts/relationship
Body: { source: "Python", target: "data science", type: "related_to" }

# Process conversation for concepts
POST /api/control/concepts/process
Body: { conversation: "text..." }
```

### Database Tables
- `concept_schema` - Core concepts with embeddings
- `concept_hierarchy` - Parent-child relationships
- `concept_relationships` - Associative links
- `concept_metadata` - Additional properties

### Background Jobs
- `concept-schema-maintenance.js` - Daily at 4 AM

---

## 5. User Model (Theory of Mind) 👤

### What It Does
Builds a model of **your beliefs, goals, values, and mental states**.

### Features
- **Belief Tracking** - Extracts beliefs with evidence
- **Goal Management** - Tracks goals and progress
- **Value Identification** - Identifies core principles
- **Mental State Inference** - Infers cognitive and emotional state

### How It Works
- GPT-4 extracts beliefs, goals, and values from conversations
- Links evidence (memory IDs) to each belief
- Tracks goal progress and completion
- Infers mental state (stress, motivation, attention)
- Weekly job updates confidence scores

### Example Usage
```
Conversation: "I believe AI will transform healthcare. 
               I want to learn machine learning this year."

Extracted:
Belief: "AI will transform healthcare"
  Category: Technology
  Confidence: 0.8
  Evidence: [memory_id_123]

Goal: "Learn machine learning"
  Category: Learning
  Priority: 8/10
  Status: Active
  Target: End of year
```

### API Endpoints
```bash
# Get complete user model
GET /api/control/user-model?userId=xxx

# Get user beliefs
GET /api/control/user-model/beliefs?userId=xxx&category=optional&limit=20

# Get user goals
GET /api/control/user-model/goals?userId=xxx&status=active&limit=10

# Get current mental state
GET /api/control/user-model/mental-state?userId=xxx

# Update goal progress
POST /api/control/user-model/goals/:goalId/progress
Body: { userId: "xxx", progressPercentage: 50, status: "active" }

# Process conversation for user model
POST /api/control/user-model/process-conversation
Body: { userId: "xxx", conversationText: "...", memoryId: "..." }

# Trigger maintenance
POST /api/control/user-model/maintenance
```

### Database Tables
- `user_model` - Flexible model storage
- `user_beliefs` - Belief tracking with evidence
- `user_goals` - Goal management
- `user_values` - Core values
- `mental_states` - Mental state inference

### Background Jobs
- `user-model-maintenance.js` - Daily at 1 AM + Weekly on Sunday

---

## 6. Self-Reflection (Meta-Cognition) 🪞

### What It Does
AI **reflects on its own behavior** and learns from patterns.

### Features
- **Pattern Recognition** - Analyzes own behavior patterns
- **Learning Summary** - Summarizes what it learned
- **Behavioral Changes** - Tracks how it's evolved
- **Identity Updates** - Updates self-concept
- **Introspective Insights** - Generates self-observations

### How It Works
- Daily job analyzes memories, emotions, and interactions
- GPT-4 generates reflections and insights
- Updates identity and behavioral understanding
- Stores observations in self_awareness table

### Example Usage
```
Reflection:
"Over the past week, I've noticed I've become more 
 direct in my responses. This seems to align with 
 the user's preference for concise answers. I've also 
 learned that the user values work-life balance and 
 is goal-oriented about career growth."

Identity Update:
- Trait: Directness increased from 5.0 to 6.2
- User preference: Concise communication
- Core value identified: Work-life balance
```

### API Endpoints
```bash
# Trigger self-reflection
POST /api/control/reflection/analyze
Body: { userId: "xxx", timeRange: "week" }
Response: { reflectionId, analysis: { patterns, learning, changes, suggestions } }

# Get recent reflections
GET /api/control/reflection/history?userId=xxx&limit=5

# Get latest insights
GET /api/control/reflection/insights?userId=xxx
```

### Database Tables
- `self_awareness` - Reflection data
- `identity_summaries` - Stable identity snapshots

### Background Jobs
- `reflection-engine.js` - Daily at 7 AM
- `identity-summary-generation.js` - Daily at 5 AM

---

## 🔄 How They Work Together

### Example Conversation Flow

```
User: "I'm worried about my job interview tomorrow"

1. Working Memory
   - Active Topics: [job interview]
   - Unresolved Questions: None
   - Goal: Get interview advice

2. Emotional Continuity
   - Detected: Anxiety (intensity: 7/10)
   - Trigger: Job interview
   - Empathy Strategy: Supportive + Practical advice

3. Memory Chains
   - Recalls chain: "Job Search Journey"
   - Knows: User has been preparing for weeks

4. Concept Schema
   - Activates: "job interview" → "career" → "professional development"
   - Related: "confidence", "preparation", "communication skills"

5. User Model
   - Belief: User values career growth
   - Goal: Get new job (priority: 9/10)
   - Mental State: High stress, low confidence

6. Self-Reflection
   - Notes: User responds well to encouraging tone
   - Strategy: Provide practical tips + emotional support

AI Response:
"I know you've been preparing really hard for this interview 
 over the past few weeks. Let's review your preparation and 
 talk through any concerns. Remember, you've got strong 
 technical skills and your passion for the work really shows. 
 What specific aspects are you most worried about?"
```

### Context Building Process

```
1. Retrieve episodic memories (pgvector semantic search)
2. Get working memory (active topics)
3. Check emotional timeline (recent emotions)
4. Find relevant memory chains (narrative context)
5. Activate concept schema (semantic understanding)
6. Load user model (beliefs, goals, mental state)
7. Include self-awareness insights (personality adaptation)

Result: Rich, multi-layered context for GPT-4
```

---

## 🛠️ Control Panel Access

All emergence features are accessible through the **Control Panel** tab:

### Tabs
- **Overview** - System health and metrics
- **Memory** - Episodic, working, chains
- **Personality** - Trait visualization
- **Identity** - Self-model summaries
- **Emotions** - Timeline and patterns
- **Concepts** - Knowledge graph
- **User Model** - Beliefs, goals, values
- **Reflection** - Self-awareness insights

### Quick Actions
- **Generate Identity** - Trigger identity summary
- **Analyze Emotions** - Process emotional patterns
- **Build Chains** - Create memory chains
- **Process Concepts** - Extract concepts from text
- **Analyze User Model** - Update beliefs/goals
- **Trigger Reflection** - Run self-analysis

---

## 📊 Monitoring and Maintenance

### Daily Background Jobs

| Job | Time | Purpose |
|-----|------|---------|
| User Model | 1 AM | Update beliefs/goals |
| Memory Consolidation | 2 AM | Strengthen important memories |
| Memory Chains | 2 AM | Build new chains |
| Personality Consolidation | 3 AM | Stabilize traits |
| Personality Evolution | 3 AM | Update traits |
| Emotional Continuity | 3 AM | Analyze patterns |
| Concept Schema | 4 AM | Decay unused concepts |
| Identity Summary | 5 AM | Generate snapshots |
| Reflection Engine | 7 AM | Self-analysis |

### Weekly Background Jobs

| Job | Time | Purpose |
|-----|------|---------|
| Connection Decay | Sunday 4 AM | Simulate forgetting |
| User Model (Weekly) | Sunday 2 AM | Deep belief analysis |

### Manual Triggers

All background jobs can be triggered manually via API:
```bash
POST /api/control/memory-chains/maintenance
POST /api/control/emotions/analyze
POST /api/control/reflection/analyze
POST /api/control/user-model/maintenance
# ... etc
```

---

## 🎓 Best Practices

### For Users

1. **Natural Conversation** - Talk naturally, the AI understands context
2. **Express Emotions** - The AI learns from emotional feedback
3. **Share Goals** - Mention what you want to accomplish
4. **Be Specific** - Clear questions get better answers
5. **Review Insights** - Check Control Panel for AI understanding

### For Developers

1. **Monitor Background Jobs** - Check logs daily
2. **Review Confidence Scores** - Adjust thresholds if needed
3. **Analyze Patterns** - Use Control Panel for debugging
4. **Backup Data** - Regular database backups
5. **Cost Monitoring** - Track GPT-4 API usage

---

## 🐛 Troubleshooting

### Working Memory Not Tracking

**Issue:** AI doesn't remember recent topics  
**Solution:** Check session timeout (default 1 hour)  
**Verify:** `SELECT * FROM working_memory WHERE user_id = 'xxx'`

### Emotions Not Detected

**Issue:** No emotional data in timeline  
**Solution:** Ensure GPT-4 API key is valid  
**Verify:** Check `/api/control/emotions` endpoint

### Memory Chains Not Building

**Issue:** No chains appearing  
**Solution:** Need at least 10-15 memories  
**Verify:** Run `POST /api/control/memory-chains/build` manually

### Concepts Not Extracted

**Issue:** Concept schema empty  
**Solution:** Background job may have failed  
**Verify:** Check logs, run manual extraction

### User Model Empty

**Issue:** No beliefs/goals tracked  
**Solution:** Have longer, substantive conversations  
**Verify:** Run `POST /api/control/user-model/process-conversation`

### Reflection Not Running

**Issue:** No reflection data  
**Solution:** Check cron job status  
**Verify:** Run `POST /api/control/reflection/analyze` manually

---

## 📞 Support

**Documentation:**
- README.md - Full documentation
- PROJECT-COMPLETE.md - Status report
- ARCHITECTURE_VISUAL.md - System design
- This file - Quick reference

**API Testing:**
- Use Postman or curl to test endpoints
- Check Control Panel for data verification
- Review backend logs for errors

**Community:**
- GitHub Issues
- GitHub Discussions

---

<div align="center">

**🧠 AI Brain v2.0 - Emergence Feature Reference 🚀**

*Six cognitive systems working together to create intelligence*

</div>
