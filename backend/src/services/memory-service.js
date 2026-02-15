// Memory Service - Handles all memory operations
const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

/**
 * Store a conversation in episodic memory
 */
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

/**
 * Retrieve relevant memories using semantic search
 */
async function retrieveRelevantMemories(userId, searchQuery, limit = 10, personaId = null) {
    try {
        // For now, return recent memories without semantic search
        // TODO: Implement text-based similarity when pgvector is available
        
        let queryText = `
            SELECT
                memory_id,
                conversation_text,
                emotional_context,
                timestamp,
                importance_score,
                0.5 as similarity
            FROM episodic_memory
            WHERE user_id = $1
            AND importance_score > 0.3
        `;
        
        const params = [userId];
        
        // Filter by persona if provided
        if (personaId) {
            queryText += ` AND persona_id = $${params.length + 1}`;
            params.push(personaId);
        }
        
        queryText += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
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

        return result.rows;
    } catch (error) {
        console.error('Error retrieving memories:', error);
        throw error;
    }
}

/**
 * Analyze emotion using GPT-4
 */
async function analyzeEmotion(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the emotional tone of the text. Respond ONLY with valid JSON: {"joy": 0-1, "sadness": 0-1, "anger": 0-1, "fear": 0-1, "surprise": 0-1}'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            max_tokens: 100,
            temperature: 0.3
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error('Error analyzing emotion:', error);
        // Fallback to neutral emotions
        return { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 };
    }
}

/**
 * Calculate importance score for a memory
 */
function calculateImportance(message, emotion) {
    let score = 1.0;

    // Boost for emotional intensity
    const emotionIntensity = Object.values(emotion)
        .reduce((sum, val) => sum + Math.abs(val), 0);
    score += emotionIntensity * 0.5;

    // Boost for length (indicates detail)
    if (message.length > 500) score += 0.3;
    if (message.length > 1000) score += 0.5;

    // Boost for personal keywords
    const personalKeywords = [
        'feel', 'think', 'remember', 'important', 'love', 'hate',
        'want', 'need', 'dream', 'hope', 'fear', 'believe'
    ];
    const hasPersonal = personalKeywords.some(kw =>
        message.toLowerCase().includes(kw)
    );
    if (hasPersonal) score += 0.4;

    // Boost for questions (indicates curiosity/engagement)
    const questionCount = (message.match(/\?/g) || []).length;
    score += questionCount * 0.2;

    return Math.min(score, 3.0);
}

/**
 * Get memory statistics for a user
 */
async function getMemoryStats(userId) {
    try {
        const result = await query(`
            SELECT
                COUNT(*) as total_memories,
                AVG(importance_score) as avg_importance,
                MAX(timestamp) as last_memory,
                SUM(access_count) as total_accesses
            FROM episodic_memory
            WHERE user_id = $1
        `, [userId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting memory stats:', error);
        throw error;
    }
}

module.exports = {
    storeMemory,
    retrieveRelevantMemories,
    generateEmbedding,
    analyzeEmotion,
    calculateImportance,
    getMemoryStats
};
