// Memory Chains Service - Links related episodic memories for narrative understanding
const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Calculate similarity between two memory embeddings
 */
function calculateEmbeddingSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2); // Cosine similarity
}

/**
 * Detect relationships between memories
 */
async function detectMemoryRelationships(userId, memoryId, recentMemories = 50) {
    try {
        // Get the target memory
        const targetResult = await query(`
            SELECT memory_id, conversation_text, embedding, emotional_context, timestamp
            FROM episodic_memory
            WHERE memory_id = $1 AND user_id = $2
        `, [memoryId, userId]);

        if (targetResult.rows.length === 0) return [];

        const targetMemory = targetResult.rows[0];

        // Get recent memories to compare against
        const recentResult = await query(`
            SELECT memory_id, conversation_text, embedding, emotional_context, timestamp,
                   importance_score
            FROM episodic_memory
            WHERE user_id = $1 AND memory_id != $2
            ORDER BY timestamp DESC
            LIMIT $3
        `, [userId, memoryId, recentMemories]);

        const relationships = [];

        for (const memory of recentResult.rows) {
            // Calculate embedding similarity
            const similarity = calculateEmbeddingSimilarity(
                targetMemory.embedding,
                memory.embedding
            );

            // Calculate temporal proximity (closer in time = higher score)
            const timeDiff = Math.abs(
                new Date(targetMemory.timestamp) - new Date(memory.timestamp)
            );
            const temporalScore = Math.max(0, 1 - (timeDiff / (1000 * 60 * 60 * 24 * 7))); // 7 days

            // Calculate emotional continuity
            let emotionalScore = 0;
            if (targetMemory.emotional_context && memory.emotional_context) {
                const targetEmotions = targetMemory.emotional_context;
                const memoryEmotions = memory.emotional_context;

                // Simple emotional similarity based on dominant emotions
                if (targetEmotions.dominant && memoryEmotions.dominant) {
                    emotionalScore = targetEmotions.dominant === memoryEmotions.dominant ? 1 : 0.5;
                }
            }

            // Calculate overall relationship strength
            const relationshipStrength = (
                similarity * 0.5 +          // 50% weight on semantic similarity
                temporalScore * 0.3 +       // 30% weight on temporal proximity
                emotionalScore * 0.2        // 20% weight on emotional continuity
            ) * memory.importance_score;    // Boost by importance

            if (relationshipStrength > 0.3) { // Threshold for meaningful relationship
                relationships.push({
                    relatedMemoryId: memory.memory_id,
                    strength: relationshipStrength,
                    similarity: similarity,
                    temporalProximity: temporalScore,
                    emotionalContinuity: emotionalScore,
                    type: similarity > 0.8 ? 'continuation' :
                        temporalScore > 0.7 ? 'sequential' :
                            emotionalScore > 0.8 ? 'emotional' : 'thematic'
                });
            }
        }

        return relationships.sort((a, b) => b.strength - a.strength);
    } catch (error) {
        console.error('Error detecting memory relationships:', error);
        return [];
    }
}

/**
 * Create a memory chain from related memories
 */
async function createMemoryChain(userId, startMemoryId, relatedMemories, chainType = 'narrative') {
    try {
        // Get memory details for chain creation
        const memoryIds = [startMemoryId, ...relatedMemories.map(r => r.relatedMemoryId)];
        const memoriesResult = await query(`
            SELECT memory_id, conversation_text, timestamp, emotional_context
            FROM episodic_memory
            WHERE memory_id = ANY($1) AND user_id = $2
            ORDER BY timestamp ASC
        `, [memoryIds, userId]);

        const memories = memoriesResult.rows;

        // Generate chain summary using AI
        const chainSummary = await generateChainSummary(memories, chainType);

        // Extract topics and emotional arc
        const topics = extractTopicsFromMemories(memories);
        const emotionalArc = analyzeEmotionalArc(memories);

        // Create the chain
        const result = await query(`
            INSERT INTO memory_chains
            (user_id, chain_name, chain_type, start_memory_id, end_memory_id,
             memory_sequence, chain_strength, chain_summary, topics_covered, emotional_arc)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING chain_id
        `, [
            userId,
            generateChainName(memories, chainType),
            chainType,
            startMemoryId,
            relatedMemories[relatedMemories.length - 1]?.relatedMemoryId || startMemoryId,
            memoryIds,
            relatedMemories.reduce((sum, r) => sum + r.strength, 0) / relatedMemories.length,
            chainSummary,
            topics,
            JSON.stringify(emotionalArc)
        ]);

        return result.rows[0].chain_id;
    } catch (error) {
        console.error('Error creating memory chain:', error);
        throw error;
    }
}

/**
 * Generate AI-powered summary of a memory chain
 */
async function generateChainSummary(memories, chainType) {
    try {
        const conversationTexts = memories.map(m =>
            `${new Date(m.timestamp).toLocaleString()}: ${JSON.stringify(m.conversation_text)}`
        ).join('\n\n');

        const prompt = `Analyze this sequence of conversations and create a concise summary that captures the narrative flow, key topics, and emotional progression. Focus on how these conversations connect thematically or chronologically.

Conversations:
${conversationTexts}

Provide a summary that shows how these memories form a coherent ${chainType} chain:`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.3
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating chain summary:', error);
        return 'Unable to generate summary due to an error.';
    }
}

/**
 * Extract key topics from a set of memories
 */
function extractTopicsFromMemories(memories) {
    const topics = new Set();

    memories.forEach(memory => {
        const text = JSON.stringify(memory.conversation_text).toLowerCase();

        // Simple keyword extraction (could be enhanced with NLP)
        const keywords = ['project', 'work', 'family', 'friend', 'travel', 'learning',
            'problem', 'solution', 'idea', 'plan', 'goal', 'emotion'];

        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                topics.add(keyword);
            }
        });
    });

    return Array.from(topics);
}

/**
 * Analyze emotional progression through a chain
 */
function analyzeEmotionalArc(memories) {
    const arc = {
        start: null,
        end: null,
        progression: [],
        dominant: null,
        volatility: 0
    };

    memories.forEach((memory, index) => {
        if (memory.emotional_context && memory.emotional_context.dominant) {
            const emotion = memory.emotional_context.dominant;
            arc.progression.push({
                position: index,
                emotion: emotion,
                timestamp: memory.timestamp
            });

            if (index === 0) arc.start = emotion;
            if (index === memories.length - 1) arc.end = emotion;
        }
    });

    // Calculate dominant emotion and volatility
    if (arc.progression.length > 0) {
        const emotions = arc.progression.map(p => p.emotion);
        arc.dominant = emotions[0]; // Could use frequency analysis

        // Calculate emotional volatility (changes in emotion)
        let changes = 0;
        for (let i = 1; i < emotions.length; i++) {
            if (emotions[i] !== emotions[i - 1]) changes++;
        }
        arc.volatility = changes / Math.max(1, emotions.length - 1);
    }

    return arc;
}

/**
 * Generate a descriptive name for the chain
 */
function generateChainName(memories, chainType) {
    if (memories.length === 0) return 'Empty Chain';

    const firstMemory = memories[0];
    const lastMemory = memories[memories.length - 1];

    const startTime = new Date(firstMemory.timestamp).toLocaleDateString();
    const endTime = new Date(lastMemory.timestamp).toLocaleDateString();

    const timeSpan = startTime === endTime ? startTime : `${startTime} - ${endTime}`;

    return `${chainType.charAt(0).toUpperCase() + chainType.slice(1)} Chain (${timeSpan})`;
}

/**
 * Automatically build memory chains for recent memories
 */
async function buildMemoryChains(userId, maxChains = 10, lookbackDays = 7) {
    try {
        console.log(`Building memory chains for user ${userId}...`);

        // Get recent memories
        const recentMemoriesResult = await query(`
            SELECT memory_id
            FROM episodic_memory
            WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '${lookbackDays} days'
            ORDER BY timestamp DESC
            LIMIT 100
        `, [userId]);

        const memoryIds = recentMemoriesResult.rows.map(r => r.memory_id);
        let chainsCreated = 0;

        // Process each memory as a potential chain start
        for (const memoryId of memoryIds.slice(0, maxChains)) {
            const relationships = await detectMemoryRelationships(userId, memoryId);

            if (relationships.length >= 2) { // Need at least 2 related memories for a chain
                await createMemoryChain(userId, memoryId, relationships.slice(0, 5)); // Limit to top 5
                chainsCreated++;
            }
        }

        console.log(`Created ${chainsCreated} memory chains for user ${userId}`);
        return chainsCreated;
    } catch (error) {
        console.error('Error building memory chains:', error);
        return 0;
    }
}

/**
 * Retrieve memories following a chain
 */
async function getChainMemories(userId, chainId) {
    try {
        // Get chain details
        const chainResult = await query(`
            SELECT memory_sequence, chain_summary, topics_covered, emotional_arc
            FROM memory_chains
            WHERE chain_id = $1 AND user_id = $2
        `, [chainId, userId]);

        if (chainResult.rows.length === 0) return null;

        const chain = chainResult.rows[0];

        // Get the actual memories in sequence
        const memoriesResult = await query(`
            SELECT memory_id, timestamp, conversation_text, emotional_context, importance_score
            FROM episodic_memory
            WHERE memory_id = ANY($1) AND user_id = $2
            ORDER BY array_position($1, memory_id)
        `, [chain.memory_sequence, userId]);

        // Update access count
        await query(`
            UPDATE memory_chains
            SET access_count = access_count + 1, last_updated = NOW()
            WHERE chain_id = $1
        `, [chainId]);

        return {
            chainId,
            summary: chain.chain_summary,
            topics: chain.topics_covered,
            emotionalArc: chain.emotional_arc,
            memories: memoriesResult.rows
        };
    } catch (error) {
        console.error('Error retrieving chain memories:', error);
        return null;
    }
}

/**
 * Find relevant chains for a query or context
 */
async function findRelevantChains(userId, query = null, limit = 5) {
    try {
        let queryCondition = '';
        let params = [userId];

        if (query) {
            queryCondition = 'AND (chain_summary ILIKE $2 OR topics_covered && $3)';
            params.push(`%${query}%`, [query.toLowerCase()]);
        }

        const result = await query(`
            SELECT chain_id, chain_name, chain_type, chain_summary, topics_covered,
                   chain_strength, access_count, created_at
            FROM memory_chains
            WHERE user_id = $1 ${queryCondition}
            ORDER BY chain_strength DESC, access_count DESC
            LIMIT $${params.length + 1}
        `, [...params, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error finding relevant chains:', error);
        return [];
    }
}

/**
 * Get narrative understanding from chains
 */
async function getNarrativeUnderstanding(userId, topic = null) {
    try {
        const chains = await findRelevantChains(userId, topic, 10);

        if (chains.length === 0) return null;

        // Combine chain summaries for overall narrative
        const narrativePrompt = `Based on these memory chains, provide a coherent narrative understanding:

${chains.map(chain => `Chain: ${chain.chain_name}
Summary: ${chain.chain_summary}
Topics: ${chain.topics_covered?.join(', ') || 'None'}
`).join('\n')}

Create a unified narrative that connects these chains:`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: narrativePrompt }],
            max_tokens: 500,
            temperature: 0.4
        });

        return {
            topic: topic || 'General',
            chainsAnalyzed: chains.length,
            narrative: response.choices[0].message.content.trim(),
            keyChains: chains.slice(0, 3)
        };
    } catch (error) {
        console.error('Error getting narrative understanding:', error);
        return null;
    }
}

module.exports = {
    detectMemoryRelationships,
    createMemoryChain,
    buildMemoryChains,
    getChainMemories,
    findRelevantChains,
    getNarrativeUnderstanding,
    generateChainSummary,
    extractTopicsFromMemories,
    analyzeEmotionalArc
};
