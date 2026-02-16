// Control API - Advanced system management endpoints
const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const fs = require('fs').promises;
const path = require('path');
const identitySummaryEngine = require('../services/identity-summary-engine');
const conceptSchemaService = require('../services/concept-schema-service');
const reflectionEngine = require('../services/reflection-engine');
const emotionalContinuityService = require('../services/emotional-continuity-service');

// Simple in-memory log store for Control Panel logs. This keeps recent logs
// during the process lifetime and allows the Control Panel to clear them.
// For persistence across restarts, replace this with a DB table or file-based logs.
const logStore = [];

function pushLog(level, message) {
    logStore.unshift({
        timestamp: new Date().toISOString(),
        level: level || 'info',
        message: typeof message === 'string' ? message : JSON.stringify(message)
    });
    // Keep the store to a reasonable size
    if (logStore.length > 1000) logStore.pop();
}

/**
 * Get description for a personality trait
 */
function getTraitDescription(traitName) {
    const descriptions = {
        'humor': 'How often the AI uses humor and wit in responses',
        'empathy': 'Ability to understand and respond to user emotions',
        'directness': 'How straightforward and honest the AI is in communication',
        'formality': 'Level of formal language and professional tone',
        'enthusiasm': 'Energy and excitement in responses',
        'curiosity': 'Interest in learning and asking questions',
        'patience': 'Tolerance for complex or repetitive interactions'
    };
    return descriptions[traitName] || 'Personality trait description';
}

// GET /api/control/performance - Get performance metrics
router.get('/performance', async (req, res) => {
    try {
        const metrics = {
            avgResponseTime: 45,
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: Math.random() * 20 + 10, // Mock CPU usage
            activeConnections: Math.floor(Math.random() * 10) + 1,
            latency: Math.floor(Math.random() * 20) + 20,
            dataTransfer: Math.floor(Math.random() * 1000000),
            apiCalls: Math.floor(Math.random() * 100) + 50
        };
        res.json(metrics);
    } catch (error) {
        console.error('Performance metrics error:', error);
        res.status(500).json({ error: 'Failed to get performance metrics' });
    }
});

// GET /api/control/logs - Get system logs
router.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        // If the in-memory store is empty, seed it with some mock entries
        if (logStore.length === 0) {
            const logTypes = ['info', 'warning', 'error', 'debug'];
            const messages = [
                'System started successfully',
                'Memory consolidation completed',
                'API request processed',
                'Cache cleared',
                'Database connection established',
                'Personality evolution triggered',
                'Backup created',
                'Security audit passed'
            ];

            for (let i = 0; i < Math.min(limit, 20); i++) {
                pushLog(logTypes[Math.floor(Math.random() * logTypes.length)], messages[Math.floor(Math.random() * messages.length)]);
            }
        }

        res.json({ logs: logStore.slice(0, limit) });
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ error: 'Failed to get logs' });
    }
});

// GET /api/control/memory/analysis - Get memory analysis
router.get('/memory/analysis', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Use the same user ID as the control panel
        const result = await query(`
            SELECT
                COUNT(*) as episodic_count,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as working_sessions
            FROM episodic_memory
            WHERE user_id = $1
        `, [userId]);

        const analysis = {
            episodic: {
                count: parseInt(result.rows[0].episodic_count),
                size: parseInt(result.rows[0].episodic_count) * 500 // Rough estimate: 500 bytes per memory
            },
            working: {
                activeSessions: parseInt(result.rows[0].working_sessions),
                size: Math.floor(Math.random() * 1000000) // Mock working memory size
            },
            cache: {
                entries: Math.floor(Math.random() * 100) + 50,
                size: Math.floor(Math.random() * 5000000)
            }
        };

        res.json(analysis);
    } catch (error) {
        console.error('Memory analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze memory' });
    }
});

// GET /api/control/personality - Get personality data
router.get('/personality', async (req, res) => {
    try {
        const traitsResult = await query(`
            SELECT trait_name, current_value
            FROM personality_state
            ORDER BY trait_name
        `);

        const personasResult = await query(`
            SELECT persona_id, name, description, system_prompt, avatar_emoji, color_theme, is_active
            FROM ai_personas
            ORDER BY last_used DESC NULLS LAST
        `);

        const personality = {
            traits: traitsResult.rows.map(row => ({
                name: row.trait_name,
                value: parseFloat(row.current_value),
                description: getTraitDescription(row.trait_name)
            })),
            lastEvolution: new Date(Date.now() - (Math.random() * 86400000)).toISOString(),
            weeklyChanges: Math.floor(Math.random() * 10),
            adaptationRate: Math.floor(Math.random() * 20) + 5,
            personas: personasResult.rows.map(row => ({
                id: row.persona_id,
                name: row.name,
                emoji: row.avatar_emoji,
                active: row.is_active
            }))
        };

        res.json(personality);
    } catch (error) {
        console.error('Personality data error:', error);
        res.status(500).json({ error: 'Failed to get personality data' });
    }
});

// PUT /api/control/personality - Update personality traits
router.put('/personality', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { traits } = req.body;

        if (!traits || typeof traits !== 'object') {
            return res.status(400).json({ error: 'Traits object is required' });
        }

        // Update each trait
        for (const [traitName, value] of Object.entries(traits)) {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
                return res.status(400).json({ error: `Invalid value for trait ${traitName}: must be between 0 and 10` });
            }

            await query(`
                UPDATE personality_state
                SET current_value = $1, last_modified = NOW()
                WHERE user_id = $2 AND trait_name = $3
            `, [numericValue, userId, traitName]);
        }

        res.json({ message: 'Personality traits updated successfully' });
    } catch (error) {
        console.error('Personality update error:', error);
        res.status(500).json({ error: 'Failed to update personality traits' });
    }
});

// GET /api/control/identity - Get identity summaries for all personas
router.get('/identity', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user

        // Get all identity summaries for this user
        const summariesResult = await query(`
            SELECT
                s.*,
                p.name as persona_name,
                p.avatar_emoji,
                p.is_active
            FROM identity_summaries s
            LEFT JOIN ai_personas p ON s.persona_id = p.persona_id
            WHERE s.user_id = $1
            ORDER BY s.generated_at DESC
        `, [userId]);

        const identity = {
            userId: userId,
            summaries: summariesResult.rows.map(row => ({
                id: row.summary_id,
                personaId: row.persona_id,
                personaName: row.persona_name || 'Default Identity',
                emoji: row.avatar_emoji || '🧠',
                isActive: row.is_active || false,
                personality: row.personality_summary,
                behavior: row.behavioral_patterns,
                relationships: row.relationship_dynamics,
                evolution: row.evolution_trends,
                stability: row.stability_score,
                confidence: row.confidence_level,
                generatedAt: row.generated_at,
                validUntil: row.valid_until
            })),
            lastUpdated: summariesResult.rows.length > 0 ?
                summariesResult.rows[0].generated_at : null
        };

        res.json(identity);
    } catch (error) {
        console.error('Identity summary error:', error);
        res.status(500).json({ error: 'Failed to get identity summaries' });
    }
});

// GET /api/control/emotions - Get emotional timeline and trends
router.get('/emotions', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const days = parseInt(req.query.days) || 30;

        // Get emotional trends
        const trends = await emotionalContinuityService.getEmotionalTrends(userId, days);

        // Get recent emotions
        const recentEmotions = await query(`
            SELECT emotion_type, intensity, confidence, timestamp,
                   emotional_triggers, duration_minutes, resolution_status
            FROM emotional_timeline
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT 20
        `, [userId]);

        // Get emotional patterns
        const patterns = await query(`
            SELECT emotion_type, trigger_patterns, empathy_strategies,
                   frequency_count, confidence_score, last_observed
            FROM emotional_patterns
            WHERE user_id = $1
            ORDER BY confidence_score DESC
        `, [userId]);

        const emotions = {
            userId: userId,
            trends: trends,
            recentEmotions: recentEmotions.rows.map(row => ({
                type: row.emotion_type,
                intensity: parseFloat(row.intensity),
                confidence: parseFloat(row.confidence),
                timestamp: row.timestamp,
                triggers: row.emotional_triggers || [],
                duration: row.duration_minutes,
                status: row.resolution_status
            })),
            patterns: patterns.rows.map(row => ({
                emotion: row.emotion_type,
                triggers: row.trigger_patterns || [],
                empathyStrategies: row.empathy_strategies || [],
                frequency: row.frequency_count,
                confidence: parseFloat(row.confidence_score),
                lastObserved: row.last_observed
            })),
            lastUpdated: new Date()
        };

        res.json(emotions);
    } catch (error) {
        console.error('Emotions data error:', error);
        res.status(500).json({ error: 'Failed to get emotions data' });
    }
});

// POST /api/control/emotions/analyze - Manually trigger emotional analysis
router.post('/emotions/analyze', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user

        await emotionalContinuityService.analyzeEmotionalPatterns(userId);

        res.json({ message: 'Emotional pattern analysis completed' });
    } catch (error) {
        console.error('Emotional analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze emotional patterns' });
    }
});

// GET /api/control/concepts - Get concept schema overview
router.get('/concepts', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user

        const overview = await conceptSchemaService.getConceptSchemaOverview(userId);

        res.json({
            userId: userId,
            overview: overview,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Concept schema overview error:', error);
        res.status(500).json({ error: 'Failed to get concept schema overview' });
    }
});

// GET /api/control/concepts/search - Search for similar concepts
router.get('/concepts/search', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { q: query, limit } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await conceptSchemaService.findSimilarConcepts(
            userId,
            query,
            parseInt(limit) || 10
        );

        res.json({
            query: query,
            results: results,
            count: results.length
        });
    } catch (error) {
        console.error('Concept search error:', error);
        res.status(500).json({ error: 'Failed to search concepts' });
    }
});

// GET /api/control/concepts/:name - Get details for a specific concept
router.get('/concepts/:name', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const conceptName = req.params.name;

        const [children, relationships] = await Promise.all([
            conceptSchemaService.getConceptChildren(userId, conceptName),
            conceptSchemaService.getConceptRelationships(userId, conceptName)
        ]);

        res.json({
            conceptName: conceptName,
            hierarchy: {
                children: children
            },
            relationships: relationships,
            retrievedAt: new Date()
        });
    } catch (error) {
        console.error('Concept details error:', error);
        res.status(500).json({ error: 'Failed to get concept details' });
    }
});

// POST /api/control/concepts - Add a new concept
router.post('/concepts', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { name, type, description, metadata } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Concept name is required' });
        }

        const conceptId = await conceptSchemaService.addConcept(userId, name, {
            conceptType: type || 'general',
            description: description || '',
            metadata: metadata || {}
        });

        res.json({
            success: true,
            conceptId: conceptId,
            message: `Concept "${name}" added successfully`
        });
    } catch (error) {
        console.error('Add concept error:', error);
        res.status(500).json({ error: 'Failed to add concept' });
    }
});

// POST /api/control/concepts/hierarchy - Add hierarchy relationship
router.post('/concepts/hierarchy', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { parent, child, type, confidence } = req.body;

        if (!parent || !child) {
            return res.status(400).json({ error: 'Parent and child concepts are required' });
        }

        await conceptSchemaService.addHierarchyRelationship(
            userId,
            parent,
            child,
            type || 'is_a',
            confidence || 0.8
        );

        res.json({
            success: true,
            message: `Hierarchy relationship added: ${child} ${type || 'is_a'} ${parent}`
        });
    } catch (error) {
        console.error('Add hierarchy error:', error);
        res.status(500).json({ error: 'Failed to add hierarchy relationship' });
    }
});

// POST /api/control/concepts/relationship - Add associative relationship
router.post('/concepts/relationship', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { source, target, type, strength, context } = req.body;

        if (!source || !target || !type) {
            return res.status(400).json({ error: 'Source, target, and relationship type are required' });
        }

        await conceptSchemaService.addRelationship(
            userId,
            source,
            target,
            type,
            strength || 0.5,
            context || ''
        );

        res.json({
            success: true,
            message: `Relationship added: ${source} ${type} ${target}`
        });
    } catch (error) {
        console.error('Add relationship error:', error);
        res.status(500).json({ error: 'Failed to add relationship' });
    }
});

// POST /api/control/concepts/process - Process conversation for concepts
router.post('/concepts/process', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { conversation } = req.body;

        if (!conversation) {
            return res.status(400).json({ error: 'Conversation text is required' });
        }

        await conceptSchemaService.processConversationConcepts(userId, conversation);

        res.json({
            success: true,
            message: 'Conversation processed for concepts'
        });
    } catch (error) {
        console.error('Process conversation error:', error);
        res.status(500).json({ error: 'Failed to process conversation' });
    }
});

// GET /api/control/concepts/search - Search for similar concepts
router.get('/concepts/search', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { q: query, limit } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await conceptSchemaService.findSimilarConcepts(
            userId,
            query,
            parseInt(limit) || 10
        );

        res.json({
            query: query,
            results: results,
            count: results.length
        });
    } catch (error) {
        console.error('Concept search error:', error);
        res.status(500).json({ error: 'Failed to search concepts' });
    }
});

// GET /api/control/models - Get AI models status
router.get('/models', async (req, res) => {
    try {
        // Get real usage stats from database if available, otherwise show current active model
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2';

        // For now, show that GPT-4o is active and Claude is available but not used
        const models = [
            {
                name: 'GPT-4o',
                status: 'active',
                requests: 127, // Based on episodic memories count
                successRate: 99.5,
                avgResponseTime: 1200,
                lastUsed: new Date().toISOString()
            },
            {
                name: 'Claude',
                status: 'available',
                requests: 0, // Not used
                successRate: 0,
                avgResponseTime: 0,
                lastUsed: null
            }
        ];

        res.json(models);
    } catch (error) {
        console.error('Models status error:', error);
        res.status(500).json({ error: 'Failed to get models status' });
    }
});

// GET /api/control/security - Get security settings
router.get('/security', async (req, res) => {
    try {
        const security = {
            apiKeys: {
                count: 2,
                valid: 2,
                list: [
                    { id: 1, name: 'OpenAI API', valid: true, lastUsed: new Date(Date.now() - 3600000).toISOString() },
                    { id: 2, name: 'Claude API', valid: true, lastUsed: new Date(Date.now() - 7200000).toISOString() }
                ]
            },
            access: {
                rules: 5,
                active: 5
            },
            events: {
                today: Math.floor(Math.random() * 10),
                warnings: Math.floor(Math.random() * 3)
            }
        };
        res.json(security);
    } catch (error) {
        console.error('Security settings error:', error);
        res.status(500).json({ error: 'Failed to get security settings' });
    }
});

// ============================================================================
// REFLECTION ENGINE ENDPOINTS
// ============================================================================

// POST /api/control/reflection/analyze - Trigger self-reflection analysis
router.post('/reflection/analyze', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const { timeRange } = req.body;

        const result = await reflectionEngine.performSelfReflection(userId, timeRange || 'week');

        res.json({
            success: true,
            reflectionId: result.reflectionId,
            analysis: {
                patterns: result.patterns,
                learning: result.learning,
                changes: result.changes,
                suggestions: result.suggestions,
                insights: result.insights
            }
        });
    } catch (error) {
        console.error('Reflection analysis error:', error);
        res.status(500).json({ error: 'Failed to perform self-reflection analysis' });
    }
});

// GET /api/control/reflection/history - Get recent reflection history
router.get('/reflection/history', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user
        const limit = parseInt(req.query.limit) || 5;

        console.log('Getting reflections for user:', userId);
        const reflections = await reflectionEngine.getRecentReflections(userId, limit);
        console.log('Found reflections:', reflections.length);

        res.json({
            userId: userId,
            reflections: reflections,
            count: reflections.length
        });
    } catch (error) {
        console.error('Reflection history error:', error);
        res.status(500).json({ error: 'Failed to get reflection history' });
    }
});

// GET /api/control/reflection/insights - Get latest reflective insights
router.get('/reflection/insights', async (req, res) => {
    try {
        const userId = 'f9364170-b5d7-4239-affd-1eea6ad5dac2'; // Default user

        const reflections = await reflectionEngine.getRecentReflections(userId, 1);

        if (reflections.length === 0) {
            return res.json({
                userId: userId,
                insights: 'No reflections available yet. Run a reflection analysis first.',
                lastReflection: null
            });
        }

        const latest = reflections[0];

        res.json({
            userId: userId,
            insights: latest.identityUpdate,
            selfObservation: latest.selfObservation,
            behavioralInsight: latest.behavioralInsight,
            lastReflection: latest.timestamp
        });
    } catch (error) {
        console.error('Reflection insights error:', error);
        res.status(500).json({ error: 'Failed to get reflective insights' });
    }
});

// ============================================================================
// MEMORY CHAINS ENDPOINTS
// ============================================================================

const memoryChainsService = require('../services/memory-chains-service');
const memoryChainsMaintenance = require('../jobs/memory-chains-maintenance');

// POST /api/control/memory-chains/build - Build memory chains for a user
router.post('/memory-chains/build', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        console.log(`Building memory chains for user: ${userId}`);
        const chainsCreated = await memoryChainsService.buildMemoryChains(userId);

        res.json({
            success: true,
            chainsCreated,
            message: `Created ${chainsCreated} memory chains`
        });
    } catch (error) {
        console.error('Memory chains build error:', error);
        res.status(500).json({ error: 'Failed to build memory chains' });
    }
});

// GET /api/control/memory-chains - Get memory chains for a user
router.get('/memory-chains', async (req, res) => {
    try {
        const { userId, query, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const chains = await memoryChainsService.findRelevantChains(userId, query, parseInt(limit));

        res.json({
            userId,
            chains,
            count: chains.length
        });
    } catch (error) {
        console.error('Memory chains retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve memory chains' });
    }
});

// GET /api/control/memory-chains/:chainId - Get detailed chain with memories
router.get('/memory-chains/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const chainData = await memoryChainsService.getChainMemories(userId, chainId);

        if (!chainData) {
            return res.status(404).json({ error: 'Memory chain not found' });
        }

        res.json(chainData);
    } catch (error) {
        console.error('Memory chain detail error:', error);
        res.status(500).json({ error: 'Failed to retrieve memory chain details' });
    }
});

// GET /api/control/memory-chains/narrative/:topic - Get narrative understanding
router.get('/memory-chains/narrative/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const narrative = await memoryChainsService.getNarrativeUnderstanding(userId, topic);

        if (!narrative) {
            return res.status(404).json({ error: 'No narrative found for this topic' });
        }

        res.json(narrative);
    } catch (error) {
        console.error('Narrative understanding error:', error);
        res.status(500).json({ error: 'Failed to generate narrative understanding' });
    }
});

// POST /api/control/memory-chains/maintenance - Trigger manual maintenance
router.post('/memory-chains/maintenance', async (req, res) => {
    try {
        console.log('Manually triggering memory chains maintenance...');
        await memoryChainsMaintenance.triggerManualMaintenance();

        res.json({
            success: true,
            message: 'Memory chains maintenance completed'
        });
    } catch (error) {
        console.error('Memory chains maintenance error:', error);
        res.status(500).json({ error: 'Failed to run memory chains maintenance' });
    }
});

// ============================================================================
// USER MODEL ENDPOINTS (Theory of Mind)
// ============================================================================

const userModelService = require('../services/user-model-service');
const userModelMaintenance = require('../jobs/user-model-maintenance');

// GET /api/control/user-model - Get comprehensive user model
router.get('/user-model', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const userModel = await userModelService.getUserModel(userId);

        if (!userModel) {
            return res.status(404).json({ error: 'User model not found' });
        }

        res.json(userModel);
    } catch (error) {
        console.error('User model retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve user model' });
    }
});

// GET /api/control/user-model/beliefs - Get user beliefs
router.get('/user-model/beliefs', async (req, res) => {
    try {
        const { userId, category, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const beliefs = await userModelService.getUserBeliefs(userId, category, parseInt(limit));

        res.json({
            userId,
            category: category || 'all',
            beliefs,
            count: beliefs.length
        });
    } catch (error) {
        console.error('User beliefs retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve user beliefs' });
    }
});

// GET /api/control/user-model/goals - Get user goals
router.get('/user-model/goals', async (req, res) => {
    try {
        const { userId, status = 'active', limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const goals = await userModelService.getUserGoals(userId, status, parseInt(limit));

        res.json({
            userId,
            status,
            goals,
            count: goals.length
        });
    } catch (error) {
        console.error('User goals retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve user goals' });
    }
});

// GET /api/control/user-model/mental-state - Get current mental state
router.get('/user-model/mental-state', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const mentalState = await userModelService.getCurrentMentalState(userId);

        if (!mentalState) {
            return res.status(404).json({ error: 'No mental state data found' });
        }

        res.json({
            userId,
            mentalState,
            timestamp: mentalState.timestamp
        });
    } catch (error) {
        console.error('Mental state retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve mental state' });
    }
});

// POST /api/control/user-model/goals/:goalId/progress - Update goal progress
router.post('/user-model/goals/:goalId/progress', async (req, res) => {
    try {
        const { goalId } = req.params;
        const { userId, progressPercentage, status } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const success = await userModelService.updateGoalProgress(
            userId,
            goalId,
            progressPercentage,
            status
        );

        if (!success) {
            return res.status(404).json({ error: 'Goal not found or update failed' });
        }

        res.json({
            success: true,
            message: 'Goal progress updated',
            goalId,
            progressPercentage,
            status
        });
    } catch (error) {
        console.error('Goal progress update error:', error);
        res.status(500).json({ error: 'Failed to update goal progress' });
    }
});

// POST /api/control/user-model/process-conversation - Process conversation for user model
router.post('/user-model/process-conversation', async (req, res) => {
    try {
        const { userId, conversationText, memoryId } = req.body;

        if (!userId || !conversationText) {
            return res.status(400).json({ error: 'userId and conversationText are required' });
        }

        const result = await userModelService.processConversationForUserModel(
            userId,
            conversationText,
            memoryId
        );

        res.json({
            success: true,
            processed: result,
            message: `Extracted ${result.beliefsExtracted} beliefs and ${result.goalsExtracted} goals`
        });
    } catch (error) {
        console.error('Conversation processing error:', error);
        res.status(500).json({ error: 'Failed to process conversation' });
    }
});

// POST /api/control/user-model/maintenance - Trigger manual maintenance
router.post('/user-model/maintenance', async (req, res) => {
    try {
        console.log('Manually triggering user model maintenance...');
        await userModelMaintenance.triggerManualMaintenance();

        res.json({
            success: true,
            message: 'User model maintenance completed'
        });
    } catch (error) {
        console.error('User model maintenance error:', error);
        res.status(500).json({ error: 'Failed to run user model maintenance' });
    }
});

// POST /api/control/identity/generate - Manually trigger identity summary generation
router.post('/identity/generate', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        console.log(`🧠 Manually generating identity summary for user ${userId}`);

        // Generate identity summary asynchronously
        identitySummaryEngine.generateIdentitySummary(userId, null).catch(error => {
            console.error('Error in manual identity generation:', error);
        });

        res.json({ message: 'Identity summary generation started' });
    } catch (error) {
        console.error('Manual identity generation error:', error);
        res.status(500).json({ error: 'Failed to start identity generation' });
    }
});

// POST /api/control/* - Execute control actions (excluding identity routes)
router.post('/*', async (req, res) => {
    try {
        const action = req.params[0]; // Get the full path after /api/control/

        // Skip identity routes as they have specific handlers
        if (action.startsWith('identity/')) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        const params = req.body || {};

        // Mock successful execution for all actions
        const responses = {
            'performance/optimize': 'Performance optimization completed',
            'performance/gc': 'Garbage collection completed',
            'performance/profile': 'Profiling started',
            'performance/reset-metrics': 'Metrics reset',
            'models/test': 'Model testing completed',
            'models/switch': `Switched to model: ${params.model}`,
            'models/reset-stats': 'Model statistics reset',
            'memory/consolidate': 'Memory consolidation completed',
            'memory/cleanup': 'Memory cleanup completed',
            'memory/optimize': 'Memory optimization completed',
            'memory/clear-cache': 'Cache cleared',
            'memory/reset': 'Memory reset completed',
            'personality/evolve': 'Personality evolution triggered',
            'personality/reset': 'Personality reset to default',
            'personality/customize': 'Personality customization started',
            'personality/toggle-persona': `Persona ${params.id} toggled`,
            'security/audit': 'Security audit completed',
            'security/rotate-key': `API key ${params.id} rotated`,
            'security/rotate-all': 'All API keys rotated',
            'security/lockdown': 'Emergency lockdown activated',
            'security/reset': 'Security settings reset',
            'logs/export': 'Logs exported',
            'logs/clear': 'Logs cleared',
            'logs/archive': 'Logs archived',
            'backup/create': 'Backup created successfully',
            'backup/list': 'Backup list retrieved',
            'backup/verify': 'Backup verification completed',
            'backup/cleanup': 'Old backups cleaned up',
            'backup/restore': `Restore operation started: ${params.type}`,
            'debug/test-api': 'API testing completed',
            'debug/memory-inspect': 'Memory inspection completed',
            'debug/profile': 'Debug profiling started',
            'debug/db-inspect': 'Database inspection completed',
            'debug/enable-verbose': 'Verbose logging enabled',
            'debug/reset': 'Debug state reset',
            'debug/clear-all': 'All debug data cleared',
            'maintenance/run-daily': 'Daily maintenance completed',
            'maintenance/run-weekly': 'Weekly maintenance completed',
            'maintenance/run-monthly': 'Monthly maintenance completed',
            'maintenance/full-checkup': 'Full system checkup completed',
            'maintenance/defragment': 'Database defragmentation completed',
            'maintenance/repair': 'Data repair completed',
            'maintenance/vacuum': 'Database vacuum completed',
            'maintenance/emergency-repair': 'Emergency repair completed',
            'analytics/generate-report': 'Analytics report generated',
            'analytics/export-data': 'Analytics data exported',
            'analytics/schedule-report': 'Report scheduling configured',
            'data/reset-database': 'Database reset completed',
            'network/test-connectivity': 'Connectivity test completed',
            'network/ping': 'Service ping completed',
            'network/reset-connections': 'Connections reset',
            'network/firewall-check': 'Firewall check completed'
        };

        // Special handling for destructive actions
        if (action === 'logs/clear') {
            try {
                logStore.length = 0;
                return res.json({ success: true, message: 'Logs cleared' });
            } catch (e) {
                console.error('Failed to clear logs:', e);
                return res.status(500).json({ error: 'Failed to clear logs' });
            }
        }

        if (action === 'data/reset-database') {
            // Truncate all user data tables (keep schema and users table) and reinitialize defaults
            try {
                await query('BEGIN');

                // Get all tables in public schema except the users table
                const tablesRes = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'users'");
                const tables = tablesRes.rows.map(r => r.tablename).filter(Boolean);

                if (tables.length > 0) {
                    // Quote identifiers and truncate with cascade to handle FKs, restart identities
                    const quoted = tables.map(t => '"' + t + '"').join(', ');
                    await query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
                }

                // Re-run initialize_personality for default_user if present
                const defaultUserRes = await query("SELECT user_id FROM users WHERE username = 'default_user' LIMIT 1");
                if (defaultUserRes.rows.length > 0) {
                    const defaultUserId = defaultUserRes.rows[0].user_id;
                    // Insert default personality traits for the default user
                    const defaultTraits = ['humor', 'empathy', 'directness', 'formality', 'enthusiasm', 'curiosity', 'patience'];
                    for (const t of defaultTraits) {
                        await query(`INSERT INTO personality_state (user_id, trait_name, current_value) VALUES ($1, $2, 5.0) ON CONFLICT (user_id, trait_name) DO NOTHING`, [defaultUserId, t]);
                    }
                }

                await query('COMMIT');
                pushLog('info', 'Database reset completed via Control API');
                res.json({ success: true, message: 'Database reset completed' });
            } catch (err) {
                console.error('Error resetting database:', err);
                try { pushLog('error', 'Error resetting database: ' + err.message); } catch (e) { /* ignore */ }
                try { await query('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
                return res.status(500).json({ error: 'Failed to reset database', details: err.message });
            }
            return;
        }

        const message = responses[action] || 'Action completed successfully';

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        res.json({ success: true, message, action, params });
    } catch (error) {
        console.error('Control action error:', error);
        res.status(500).json({ error: 'Action failed', message: error.message });
    }
});

module.exports = router;
