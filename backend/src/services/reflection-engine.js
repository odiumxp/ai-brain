// Reflection Engine (Meta-Cognition)
// Performs periodic self-analysis and pattern recognition across memories and behavior
const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class ReflectionEngine {

    /**
     * Perform comprehensive self-reflection analysis
     */
    async performSelfReflection(userId, timeRange = 'week') {
        try {
            console.log(`🧠 Starting self-reflection analysis for user ${userId} (${timeRange})`);

            // Gather data for analysis
            const memoryPatterns = await this.analyzeMemoryPatterns(userId, timeRange);
            const learningSummary = await this.summarizeLearning(userId, timeRange);
            const behavioralChanges = await this.trackBehavioralChanges(userId, timeRange);
            const associationSuggestions = await this.generateAssociationSuggestions(userId, timeRange);

            // Generate insights using AI
            const insights = await this.generateReflectiveInsights({
                memoryPatterns,
                learningSummary,
                behavioralChanges,
                associationSuggestions
            });

            // Save reflection to database
            const reflectionId = await this.saveReflection(userId, {
                timeRange,
                memoryPatterns,
                learningSummary,
                behavioralChanges,
                associationSuggestions,
                insights,
                generatedAt: new Date()
            });

            console.log(`✅ Self-reflection complete for user ${userId}`);
            return {
                reflectionId,
                insights,
                patterns: memoryPatterns,
                learning: learningSummary,
                changes: behavioralChanges,
                suggestions: associationSuggestions
            };

        } catch (error) {
            console.error('❌ Error in self-reflection:', error);
            throw error;
        }
    }

    /**
     * Analyze patterns in episodic memories
     */
    async analyzeMemoryPatterns(userId, timeRange = 'week') {
        try {
            const timeFilter = this.getTimeFilter(timeRange);

            // Get recent memories
            const memoriesResult = await query(`
                SELECT
                    memory_id,
                    timestamp,
                    conversation_text,
                    emotional_context,
                    importance_score
                FROM episodic_memory
                WHERE user_id = $1 AND timestamp >= ${timeFilter}
                ORDER BY timestamp DESC
                LIMIT 1000
            `, [userId]);

            const memories = memoriesResult.rows;

            // Analyze patterns
            const patterns = {
                totalMemories: memories.length,
                emotionalTrends: this.analyzeEmotionalTrends(memories),
                topicClusters: await this.clusterTopics(memories),
                interactionPatterns: this.analyzeInteractionPatterns(memories),
                temporalPatterns: this.analyzeTemporalPatterns(memories)
            };

            return patterns;

        } catch (error) {
            console.error('Error analyzing memory patterns:', error);
            return { error: error.message };
        }
    }

    /**
     * Summarize learning and knowledge acquisition
     */
    async summarizeLearning(userId, timeRange = 'week') {
        try {
            const timeFilter = this.getTimeFilter(timeRange);

            // Get learning-related memories
            const learningMemories = await query(`
                SELECT
                    memory_id,
                    conversation_text,
                    emotional_context,
                    importance_score,
                    timestamp
                FROM episodic_memory
                WHERE user_id = $1
                  AND timestamp >= ${timeFilter}
                  AND (
                      conversation_text::text ILIKE '%learn%'
                      OR conversation_text::text ILIKE '%understand%'
                      OR conversation_text::text ILIKE '%knowledge%'
                      OR conversation_text::text ILIKE '%concept%'
                  )
                ORDER BY timestamp DESC
            `, [userId]);

            // Analyze concept schema changes
            const conceptChanges = await this.analyzeConceptChanges(userId, timeRange);

            // Analyze personality evolution
            const personalityChanges = await this.analyzePersonalityChanges(userId, timeRange);

            const summary = {
                newConceptsLearned: conceptChanges.newConcepts,
                conceptsStrengthened: conceptChanges.strengthened,
                personalityShifts: personalityChanges,
                learningMemories: learningMemories.rows.length,
                keyInsights: await this.extractKeyInsights(learningMemories.rows)
            };

            return summary;

        } catch (error) {
            console.error('Error summarizing learning:', error);
            return { error: error.message };
        }
    }

    /**
     * Track behavioral changes over time
     */
    async trackBehavioralChanges(userId, timeRange = 'week') {
        try {
            const timeFilter = this.getTimeFilter(timeRange);

            // Get personality state changes
            const personalityHistory = await query(`
                SELECT
                    trait_name,
                    current_value,
                    updated_at
                FROM personality_state
                WHERE user_id = $1 AND updated_at >= ${timeFilter}
                ORDER BY updated_at DESC
            `, [userId]);

            // Get decision pattern changes
            const decisionPatterns = await query(`
                SELECT
                    pattern_name,
                    pattern_strength,
                    last_updated
                FROM decision_patterns
                WHERE user_id = $1 AND last_updated >= ${timeFilter}
                ORDER BY last_updated DESC
            `, [userId]);

            // Analyze changes
            const changes = {
                personalityEvolution: this.calculatePersonalityEvolution(personalityHistory.rows),
                decisionPatternShifts: this.calculateDecisionPatternShifts(decisionPatterns.rows),
                behavioralConsistency: this.measureBehavioralConsistency(personalityHistory.rows, decisionPatterns.rows)
            };

            return changes;

        } catch (error) {
            console.error('Error tracking behavioral changes:', error);
            return { error: error.message };
        }
    }

    /**
     * Generate suggestions for association reinforcement/decay
     */
    async generateAssociationSuggestions(userId, timeRange = 'week') {
        try {
            // Analyze concept relationships that need strengthening
            const weakRelationships = await query(`
                SELECT
                    cr.source_concept_id,
                    cr.target_concept_id,
                    cr.relationship_type,
                    cr.strength,
                    cs1.concept_name as source_name,
                    cs2.concept_name as target_name
                FROM concept_relationships cr
                JOIN concept_schema cs1 ON cr.source_concept_id = cs1.concept_id
                JOIN concept_schema cs2 ON cr.target_concept_id = cs2.concept_id
                WHERE cr.user_id = $1 AND cr.strength < 0.3
                ORDER BY cr.strength ASC
                LIMIT 10
            `, [userId]);

            // Find unused concepts that could be decayed
            const unusedConcepts = await query(`
                SELECT
                    concept_id,
                    concept_name,
                    importance_score,
                    updated_at
                FROM concept_schema
                WHERE user_id = $1
                  AND updated_at < NOW() - INTERVAL '30 days'
                  AND importance_score < 0.2
                ORDER BY updated_at ASC
                LIMIT 5
            `, [userId]);

            const suggestions = {
                strengthenRelationships: weakRelationships.rows.map(row => ({
                    type: 'strengthen',
                    source: row.source_name,
                    target: row.target_name,
                    relationship: row.relationship_type,
                    currentStrength: row.strength,
                    suggestion: `Consider strengthening the ${row.relationship_type} relationship between "${row.source_name}" and "${row.target_name}"`
                })),
                decayConcepts: unusedConcepts.rows.map(row => ({
                    type: 'decay',
                    concept: row.concept_name,
                    lastUsed: row.updated_at,
                    importance: row.importance_score,
                    suggestion: `Consider decaying the concept "${row.concept_name}" as it hasn't been used recently and has low importance`
                }))
            };

            return suggestions;

        } catch (error) {
            console.error('Error generating association suggestions:', error);
            return { error: error.message };
        }
    }

    /**
     * Generate reflective insights using AI
     */
    async generateReflectiveInsights(data) {
        try {
            const prompt = `
Analyze this AI system's self-reflection data and provide insights:

MEMORY PATTERNS:
${JSON.stringify(data.memoryPatterns, null, 2)}

LEARNING SUMMARY:
${JSON.stringify(data.learningSummary, null, 2)}

BEHAVIORAL CHANGES:
${JSON.stringify(data.behavioralChanges, null, 2)}

ASSOCIATION SUGGESTIONS:
${JSON.stringify(data.associationSuggestions, null, 2)}

Please provide:
1. Key insights about the system's current state
2. Patterns you've identified
3. Recommendations for improvement
4. Any concerns or areas needing attention

Keep your response concise but insightful.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.7
            });

            return response.choices[0].message.content;

        } catch (error) {
            console.error('Error generating reflective insights:', error);
            return 'Unable to generate AI-powered insights at this time.';
        }
    }

    /**
     * Save reflection results to database
     */
    async saveReflection(userId, reflectionData) {
        try {
            const result = await query(`
                INSERT INTO self_awareness
                (user_id, self_observation, identity_update, behavioral_insight)
                VALUES ($1, $2, $3, $4)
                RETURNING reflection_id
            `, [
                userId,
                JSON.stringify({
                    timeRange: reflectionData.timeRange,
                    patterns: reflectionData.memoryPatterns,
                    learning: reflectionData.learningSummary
                }),
                JSON.stringify({ content: reflectionData.insights }), // Store as JSON object
                JSON.stringify({
                    changes: reflectionData.behavioralChanges,
                    suggestions: reflectionData.associationSuggestions
                })
            ]);

            return result.rows[0].reflection_id;

        } catch (error) {
            console.error('Error saving reflection:', error);
            throw error;
        }
    }

    /**
     * Get recent reflections for a user
     */
    async getRecentReflections(userId, limit = 5) {
        try {
            const result = await query(`
                SELECT
                    reflection_id,
                    timestamp,
                    self_observation,
                    identity_update,
                    behavioral_insight
                FROM self_awareness
                WHERE user_id = $1
                ORDER BY timestamp DESC
                LIMIT $2
            `, [userId, limit]);

            return result.rows.map(row => {
                try {
                    let identityUpdate = row.identity_update;

                    // Handle different formats of identity_update
                    if (typeof identityUpdate === 'object' && identityUpdate.content) {
                        // New JSON format: { content: "insights text" }
                        identityUpdate = identityUpdate.content;
                    } else if (typeof identityUpdate === 'string') {
                        // Old plain text format or already parsed string
                        identityUpdate = identityUpdate;
                    } else {
                        // Fallback
                        identityUpdate = '';
                    }

                    return {
                        id: row.reflection_id,
                        timestamp: row.timestamp,
                        selfObservation: JSON.parse(row.self_observation || '{}'),
                        identityUpdate: identityUpdate,
                        behavioralInsight: row.behavioral_insight // This is already parsed by pg
                    };
                } catch (error) {
                    console.error('Error processing reflection row:', error, row);
                    return null;
                }
            }).filter(row => row !== null);

        } catch (error) {
            console.error('Error getting recent reflections:', error);
            return [];
        }
    }

    // Helper methods
    getTimeFilter(timeRange) {
        const now = new Date();
        switch (timeRange) {
            case 'day':
                return `NOW() - INTERVAL '1 day'`;
            case 'week':
                return `NOW() - INTERVAL '7 days'`;
            case 'month':
                return `NOW() - INTERVAL '30 days'`;
            default:
                return `NOW() - INTERVAL '7 days'`;
        }
    }

    analyzeEmotionalTrends(memories) {
        // Simple emotional trend analysis
        const emotions = memories
            .filter(m => m.emotional_context)
            .map(m => m.emotional_context);

        if (emotions.length === 0) return { trend: 'neutral', dominant: 'none' };

        // Count emotions
        const emotionCounts = {};
        emotions.forEach(emotion => {
            Object.keys(emotion).forEach(key => {
                emotionCounts[key] = (emotionCounts[key] || 0) + emotion[key];
            });
        });

        const dominantEmotion = Object.keys(emotionCounts)
            .reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);

        return {
            dominant: dominantEmotion,
            counts: emotionCounts,
            sampleSize: emotions.length
        };
    }

    async clusterTopics(memories) {
        // Simple topic clustering based on keywords
        const topics = {};
        memories.forEach(memory => {
            const text = JSON.stringify(memory.conversation_text).toLowerCase();
            const keywords = ['learn', 'understand', 'think', 'feel', 'remember', 'create'];

            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    topics[keyword] = (topics[keyword] || 0) + 1;
                }
            });
        });

        return topics;
    }

    analyzeInteractionPatterns(memories) {
        const patterns = {
            totalInteractions: memories.length,
            avgImportance: memories.reduce((sum, m) => sum + (m.importance_score || 1), 0) / memories.length,
            timeDistribution: this.getTimeDistribution(memories)
        };

        return patterns;
    }

    analyzeTemporalPatterns(memories) {
        const hourCounts = {};
        memories.forEach(memory => {
            const hour = new Date(memory.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return {
            peakHours: Object.keys(hourCounts)
                .sort((a, b) => hourCounts[b] - hourCounts[a])
                .slice(0, 3),
            activityDistribution: hourCounts
        };
    }

    async analyzeConceptChanges(userId, timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);

        const newConcepts = await query(`
            SELECT COUNT(*) as count
            FROM concept_schema
            WHERE user_id = $1 AND created_at >= ${timeFilter}
        `, [userId]);

        const strengthenedConcepts = await query(`
            SELECT COUNT(*) as count
            FROM concept_schema
            WHERE user_id = $1 AND updated_at >= ${timeFilter} AND importance_score > 0.5
        `, [userId]);

        return {
            newConcepts: parseInt(newConcepts.rows[0].count),
            strengthened: parseInt(strengthenedConcepts.rows[0].count)
        };
    }

    async analyzePersonalityChanges(userId, timeRange) {
        const timeFilter = this.getTimeFilter(timeRange);

        const changes = await query(`
            SELECT trait_name, COUNT(*) as change_count
            FROM personality_state
            WHERE user_id = $1 AND updated_at >= ${timeFilter}
            GROUP BY trait_name
            ORDER BY change_count DESC
            LIMIT 5
        `, [userId]);

        return changes.rows;
    }

    async extractKeyInsights(memories) {
        if (memories.length === 0) return [];

        // Extract key learning moments
        const insights = memories
            .filter(m => m.importance_score > 1.5)
            .map(m => ({
                timestamp: m.timestamp,
                importance: m.importance_score,
                keyMoment: JSON.stringify(m.conversation_text).substring(0, 200) + '...'
            }))
            .slice(0, 3);

        return insights;
    }

    calculatePersonalityEvolution(personalityHistory) {
        const evolution = {};
        personalityHistory.forEach(record => {
            if (!evolution[record.trait_name]) {
                evolution[record.trait_name] = [];
            }
            evolution[record.trait_name].push({
                value: record.current_value,
                timestamp: record.updated_at
            });
        });

        // Calculate trends
        const trends = {};
        Object.keys(evolution).forEach(trait => {
            const values = evolution[trait];
            if (values.length > 1) {
                const recent = values.slice(0, Math.min(5, values.length));
                const avgRecent = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
                const avgOlder = values.slice(5).reduce((sum, v) => sum + v.value, 0) / Math.max(1, values.length - 5);

                trends[trait] = {
                    direction: avgRecent > avgOlder ? 'increasing' : avgRecent < avgOlder ? 'decreasing' : 'stable',
                    change: Math.abs(avgRecent - avgOlder),
                    dataPoints: values.length
                };
            }
        });

        return trends;
    }

    calculateDecisionPatternShifts(patterns) {
        return patterns.map(p => ({
            pattern: p.pattern_name,
            strength: p.pattern_strength,
            lastUpdated: p.last_updated
        }));
    }

    measureBehavioralConsistency(personalityData, decisionData) {
        const personalityChanges = personalityData.length;
        const decisionChanges = decisionData.length;

        // Simple consistency score based on change frequency
        const totalChanges = personalityChanges + decisionChanges;
        const consistencyScore = Math.max(0, 1 - (totalChanges / 100)); // Lower changes = higher consistency

        return {
            score: consistencyScore,
            personalityChanges,
            decisionChanges,
            assessment: consistencyScore > 0.8 ? 'highly_consistent' :
                consistencyScore > 0.6 ? 'moderately_consistent' :
                    consistencyScore > 0.4 ? 'variable' : 'highly_variable'
        };
    }

    getTimeDistribution(memories) {
        const distribution = {};
        memories.forEach(memory => {
            const hour = new Date(memory.timestamp).getHours();
            const period = hour < 6 ? 'night' :
                hour < 12 ? 'morning' :
                    hour < 18 ? 'afternoon' : 'evening';
            distribution[period] = (distribution[period] || 0) + 1;
        });

        return distribution;
    }
}

module.exports = new ReflectionEngine();
