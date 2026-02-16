# Theory of Mind — Computational Specification

**Abstract**

This document defines an operational Theory of Mind (ToM) for an artificial agent, provides the computational model, mathematical foundations, and example implementation snippets (Node.js + PostgreSQL + pgvector) used in `ai-brain`. It is written to support a scientific paper and reproducible implementation.

---

## 1. Introduction

Theory of Mind (ToM) is the ability to attribute mental states — beliefs, intents, desires, knowledge — to others and to reason about them. For an artificial agent, ToM enables better predictions of user behavior, improved personalization, and safer interactions.

We describe:
- A formal belief representation and update mechanism.
- A retrieval and memory architecture for long-term and working memory.
- Concrete code examples showing storage, retrieval (semantic search via `pgvector`), and belief update.

---

## 2. Formal Definition

Let the agent maintain for each user a set of hypotheses (mental-state variables) $H = \{h_1, h_2, \dots, h_n\}$. Observations $D_t$ arrive as time-series data (utterances, actions, sensor readings). The agent maintains probability distributions over hypotheses and updates them with Bayesian updates or approximations.

Bayes' rule for a hypothesis $h$ given new observation $D$:

$$
P(h\mid D) = \frac{P(D\mid h)\,P(h)}{P(D)}
$$

In practice we use log-odds or variational approximations to avoid intractable normalization across high-dimensional hypothesis spaces.

We also maintain embeddings for episodic memories and beliefs. Let $e(x)\in\mathbb{R}^d$ denote an embedding function (e.g., OpenAI embeddings). Semantic retrieval uses a similarity function $s(e_a, e_b)$ (cosine or angular distance); in Postgres+pgvector we use the operator `<=>` for distance.

---

## 3. Computational Architecture

High-level pipeline:

- Perception: tokenize & embed incoming text into $e(x)$.
- Retrieval: search episodic/semantic memory for relevant events using embedding similarity.
- Inference / Update: compute belief updates using retrieved context + explicit update rules (Bayes, scoring, or learned model).
- Action selection: choose persona/response using updated beliefs and policy.
- Consolidation: periodically condense memories into summaries and update identity representations.

Sequence diagram (conceptual):

- User utterance → Embed → Retrieve relevant memories → Update beliefs → Generate response

---

## 4. Belief Representation

Beliefs are stored as structured records with numeric confidence. Example schema (conceptual):

```sql
CREATE TABLE beliefs (
  belief_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb,
  confidence double precision DEFAULT 0.5,
  embedding vector(1536), -- pgvector column for semantic matching
  created_at timestamptz DEFAULT now()
);
```

Belief retrieval by semantic similarity (pgvector):

```sql
-- Find top-5 beliefs most similar to query embedding
SELECT belief_id, key, value, confidence
FROM beliefs
ORDER BY embedding <=> $1 -- smaller distance = more similar
LIMIT 5;
```

---

## 5. Algorithms and Update Rules

A practical hybrid update often uses a mixture of rule-based and learned updates. Example pseudocode (log-odds style):

Let $\ell(h) = \log\frac{P(h)}{1-P(h)}$ be the log-odds of hypothesis $h$. For a new observation $D$:

- Compute a compatibility score $S(h, D)$ (e.g., from a classifier or similarity measure).
- Update log-odds: $\ell'(h) = \ell(h) + \alpha\,S(h, D)$, where $\alpha$ is a learning rate.
- Convert back to probability: $P'(h) = \sigma(\ell'(h))$ where $\sigma(x)=1/(1+e^{-x})$.

Inline KaTeX example:

$\ell'(h) = \ell(h) + \alpha S(h,D)$

And the sigmoid:

$$
P'(h)=\frac{1}{1+e^{-\ell'(h)}}
$$

---

## 6. Example Implementation (Node.js + pgvector)

Below are minimal code snippets illustrating storing embeddings, retrieving memories via pgvector, and updating a belief record.

### 6.1: Insert memory with embedding

The repository implements memory storage in `backend/src/services/memory-service.js`. The actual `storeMemory` function used by the app:

```javascript
async function storeMemory(userId, userMessage, aiResponse, personaId = null) {
  try {
    // Combine messages for embedding
    const combinedText = `User: ${userMessage}\nAI: ${aiResponse}`;

    // Generate embedding
    const embedding = await generateEmbedding(combinedText);

    // Analyze emotional content using GPT-4
    const emotion = await analyzeEmotion(userMessage);

    // Calculate importance score
    const importance = calculateImportance(userMessage, emotion);

    // Store in database
    const result = await query(`
      INSERT INTO episodic_memory
      (user_id, conversation_text, embedding, emotional_context, importance_score, persona_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING memory_id
    `, [
      userId,
      JSON.stringify({ user: userMessage, ai: aiResponse }),
      JSON.stringify(embedding),
      JSON.stringify(emotion),
      importance,
      personaId
    ]);

    return result.rows[0].memory_id;
  } catch (error) {
    console.error('Error storing memory:', error);
    throw error;
  }
}
```

Note: `embedding` must be an array or the correct pgvector text representation (e.g. `'[0.12, 0.03, ...]'`). Many `pg` client libraries accept arrays for `vector` columns.

### 6.2: Semantic retrieval (top-K)

The app uses `retrieveRelevantMemories` from `backend/src/services/memory-service.js` which generates a query embedding and performs pgvector similarity search:

```javascript
async function retrieveRelevantMemories(userId, searchQuery, limit = 10, personaId = null) {
  try {
    // Generate embedding for search query
    const searchEmbedding = await generateEmbedding(searchQuery);

    // Use vector similarity search with pgvector
    let queryText = `
      SELECT
        memory_id,
        conversation_text,
        emotional_context,
        timestamp,
        importance_score,
        1 - (embedding <=> $2::vector) as similarity
      FROM episodic_memory
      WHERE user_id = $1
      AND importance_score > 0.3
    `;

    const params = [userId, JSON.stringify(searchEmbedding)];

    // Filter by persona if provided
    if (personaId) {
      queryText += ` AND persona_id = $${params.length + 1}`;
      params.push(personaId);
    }

    // Order by semantic similarity (cosine distance)
    queryText += ` ORDER BY embedding <=> $2::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    // Update access count for retrieved memories
    if (result.rows.length > 0) {
      const memoryIds = result.rows.map(r => r.memory_id);
      await query(`
        UPDATE episodic_memory
        SET access_count = access_count + 1,
          last_accessed = NOW()
        WHERE memory_id = ANY($1)
      `, [memoryIds]);
    }

    console.log(`🧠 Retrieved ${result.rows.length} semantically similar memories (avg similarity: ${(result.rows.reduce((sum, r) => sum + parseFloat(r.similarity), 0) / result.rows.length || 0).toFixed(3)})`);

    return result.rows;
  } catch (error) {
    console.error('Error retrieving memories:', error);
    throw error;
  }
}
```

### 6.3: Belief extraction and storage (used in the app)

The app extracts beliefs using an LLM and stores/updates them with `storeUserBelief` in `backend/src/services/user-model-service.js`:

```javascript
async function extractBeliefsFromText(text, userId) {
  try {
    const prompt = `Analyze the following conversation text and extract any beliefs, opinions, or convictions expressed by the user. Focus on:\n\n1. Explicit statements of belief ("I believe that...", "I'm convinced that...")\n2. Strong opinions or values\n3. Philosophical or ethical stances\n4. Political, religious, or ideological positions\n5. Personal principles or life philosophies\n\nFor each belief identified, provide:\n- The belief statement (paraphrase if needed for clarity)\n- Category (religious, political, scientific, personal, ethical, etc.)\n- Confidence level (0-1, how certain they seem)\n- Strength (0-1, how strongly held)\n\nReturn as JSON array of belief objects.\n\nConversation text:\n${text}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error extracting beliefs:', error);
    return [];
  }
}

async function storeUserBelief(userId, beliefData, memoryId = null) {
  try {
    // Check if belief already exists
    const existingResult = await query(`
      SELECT belief_id, belief_strength, evidence_sources
      FROM user_beliefs
      WHERE user_id = $1 AND belief_statement = $2
    `, [userId, beliefData.belief_statement]);

    if (existingResult.rows.length > 0) {
      // Update existing belief
      const existing = existingResult.rows[0];
      const newStrength = Math.min(1.0, existing.belief_strength + 0.1);
      const newEvidence = memoryId ?
        [...(existing.evidence_sources || []), memoryId] :
        existing.evidence_sources;

      await query(`
        UPDATE user_beliefs
        SET belief_strength = $1,
          evidence_sources = $2,
          last_reinforced = NOW(),
          confidence_level = GREATEST(confidence_level, $3)
        WHERE belief_id = $4
      `, [newStrength, newEvidence, beliefData.confidence_level || 0.5, existing.belief_id]);

      return existing.belief_id;
    } else {
      // Create new belief
      const result = await query(`
        INSERT INTO user_beliefs
        (user_id, belief_statement, belief_category, confidence_level,
         evidence_sources, first_expressed, belief_strength)
        VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        RETURNING belief_id
      `, [
        userId,
        beliefData.belief_statement,
        beliefData.category,
        beliefData.confidence_level || 0.5,
        memoryId ? [memoryId] : [],
        beliefData.strength || 0.5
      ]);

      return result.rows[0].belief_id;
    }
  } catch (error) {
    console.error('Error storing user belief:', error);
    throw error;
  }
}
```

Evidence scoring can be derived from text classifiers, embedding similarity, or pretrained models that map `(context, candidate belief) -> score`.

---

## 7. Integration with Identity / Persona

The system keeps a separate `personality_state` and `ai_personas` table (see `backend/src/db/schema.sql` in the repository). ToM feeds into persona selection by providing belief-driven preferences and safety constraints.

Example: A high-confidence belief that a user prefers concise answers will bias the response generator toward shorter outputs or a compact persona.

---

## 7.1 Usage in the Chat Handler (real call sites)

Below are the exact call sites from `backend/src/api/chat.js` showing how the memory and user-model services are used in the live request flow. This demonstrates retrieval → context build → generation → storage → downstream processing.

```javascript
// 1) Retrieve relevant memories for context
const memories = await memoryService.retrieveRelevantMemories(
  userId,
  searchQuery,
  15,
  activePersona ? activePersona.persona_id : null
);

// 2) Build context (persona, working memory, memory chains, etc.)
const context = await contextBuilder.buildContext(
  personality,
  memories,
  activePersona ? activePersona.system_prompt : null,
  workingMemoryContext,
  userId
);

// 3) Call the model
const rawResponse = await gptService.sendMessage(context, message, imageToSend);

// 4) Store the conversation in episodic memory
const memoryText = image ? `${message || 'Image analysis'}: ${image.name}` : message;
const memoryId = await memoryService.storeMemory(
  userId,
  memoryText,
  response,
  activePersona ? activePersona.persona_id : null
);

// 5) Trigger downstream processing (async)
emotionalContinuityService.detectEmotionsFromText(fullConversation, userId, memoryId).catch(console.error);
personalityService.updatePersonality(userId).catch(console.error);
workingMemoryService.updateWorkingMemory(userId, memoryText, response, activePersona ? activePersona.persona_id : null).catch(console.error);

// 6) User-model maintenance (runs as a scheduled job or via control endpoints)
//    The job calls `userModelService.processConversationForUserModel(userId, fullText, memoryId)`
//    which in turn calls `extractBeliefsFromText` and `storeUserBelief` for each extracted belief.
```


## 8. Evaluation & Metrics

Suggested metrics for a ToM-enabled agent:

- Prediction accuracy: how often the agent's predicted user action matches observed action.
- Calibration: Brier score or log-loss for belief probabilities.
- Human evaluation: A/B tests where users rate alignment and helpfulness.
- Personalization retention: task success over repeated interactions.

Mathematical note: Calibration can be assessed by computing the expected sharpness and reliability diagrams; the Brier score is

$$
\text{Brier} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2
$$

---

## 9. Ethical Considerations

Building ToM-capable systems raises privacy and manipulation concerns. Key mitigations:

- Data minimization and user consent for long-term memory.
- Transparent user controls to view and delete stored beliefs and memories (e.g., the Control Panel in this repo).
- Rate-limited or reversible personalization to avoid lock-in.

---

## 10. References

- Premack, D., & Woodruff, G. (1978). Does the chimpanzee have a theory of mind? Behavioral and Brain Sciences.
- Baker, C. L., Saxe, R., & Tenenbaum, J. B. (2011). Bayesian theory of mind: Modeling human reasoning about beliefs, desires, and goals. In Proceedings of the 33rd Annual Conference of the Cognitive Science Society.
- Relevance: pgvector documentation — https://github.com/pgvector/pgvector
- OpenAI embeddings documentation

---

## 11. Reproducibility checklist

- Ensure `pgvector` extension exists: `CREATE EXTENSION IF NOT EXISTS vector;`
- Database schema for `beliefs` / `episodic_memory` must include `vector(d)` columns.
- Provide an embedding model and an API key (OpenAI or other) and place in `.env`.

---

If you want, I can:
- Include figures (Mermaid diagrams) or generate a reproducible Jupyter notebook demonstrating retrieval+update.
- Extract and embed specific code from `backend/src/services/*` into this document as working examples.


