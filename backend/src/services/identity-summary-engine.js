// Self-Model Layer (Identity Summary Engine)
// Generates and maintains identity summaries for each user/persona combination
const { query } = require('../db/connection');

class IdentitySummaryEngine {
    /**
     * Generate a comprehensive identity summary for a user/persona
     */
    async generateIdentitySummary(userId, personaId = null) {
        try {
            console.log(`🧠 Generating identity summary for user ${userId}, persona ${personaId || 'default'}`);

            // Gather all relevant data
            const personalityData = await this.getPersonalityData(userId, personaId);
            const behavioralData = await this.getBehavioralData(userId, personaId);
            const relationshipData = await this.getRelationshipData(userId, personaId);
            const evolutionData = await this.getEvolutionData(userId, personaId);

            // Analyze stability and confidence
            const stabilityScore = this.calculateStabilityScore(personalityData, behavioralData);
            const confidenceLevel = this.calculateConfidenceLevel(personalityData, behavioralData, relationshipData);

            // Generate the summary
            const summary = {
                personality_summary: this.summarizePersonality(personalityData),
                behavioral_patterns: this.summarizeBehavior(behavioralData),
                relationship_dynamics: this.summarizeRelationships(relationshipData),
                evolution_trends: this.summarizeEvolution(evolutionData),
                metadata: {
                    data_points_analyzed: personalityData.length + behavioralData.length + relationshipData.length,
                    time_range_days: this.calculateTimeRange(evolutionData),
                    stability_score: stabilityScore,
                    confidence_level: confidenceLevel,
                    generated_at: new Date().toISOString()
                }
            };

            // Save to database
            await this.saveIdentitySummary(userId, personaId, summary, stabilityScore, confidenceLevel);

            console.log(`✅ Identity summary generated with stability: ${(stabilityScore * 100).toFixed(1)}%, confidence: ${(confidenceLevel * 100).toFixed(1)}%`);

            return summary;
        } catch (error) {
            console.error('❌ Error generating identity summary:', error);
            throw error;
        }
    }

    /**
     * Get current personality data
     */
    async getPersonalityData(userId, personaId) {
        const result = await query(`
            SELECT trait_name, current_value, historical_values, last_modified
            FROM personality_state
            WHERE user_id = $1
            ORDER BY last_modified DESC
        `, [userId]);

        return result.rows;
    }

    /**
     * Get behavioral patterns from recent conversations
     */
    async getBehavioralData(userId, personaId) {
        // Get conversations filtered by persona if specified
        let queryText = `
            SELECT conversation_text, emotional_context, timestamp
            FROM episodic_memory
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '30 days'
            ORDER BY timestamp DESC
            LIMIT 100
        `;
        let params = [userId];

        if (personaId) {
            queryText = `
                SELECT em.conversation_text, em.emotional_context, em.timestamp
                FROM episodic_memory em
                JOIN working_memory wm ON em.user_id = wm.user_id
                WHERE em.user_id = $1 AND wm.persona_id = $2
                AND em.timestamp > NOW() - INTERVAL '30 days'
                ORDER BY em.timestamp DESC
                LIMIT 100
            `;
            params = [userId, personaId];
        }

        const result = await query(queryText, params);
        return result.rows;
    }

    /**
     * Get relationship dynamics with the user
     */
    async getRelationshipData(userId, personaId) {
        // Analyze interaction patterns, emotional responses, etc.
        const result = await query(`
            SELECT
                COUNT(*) as total_interactions,
                AVG(CASE WHEN emotional_context->>'sentiment' = 'positive' THEN 1 ELSE 0 END) as positive_ratio,
                AVG(CASE WHEN emotional_context->>'sentiment' = 'negative' THEN 1 ELSE 0 END) as negative_ratio,
                MODE() WITHIN GROUP (ORDER BY emotional_context->>'tone') as common_tone
            FROM episodic_memory
            WHERE user_id = $1
            AND timestamp > NOW() - INTERVAL '30 days'
        `, [userId]);

        return result.rows[0];
    }

    /**
     * Get evolution trends over time
     */
    async getEvolutionData(userId, personaId) {
        // Get personality changes over the last 90 days
        const result = await query(`
            SELECT
                DATE_TRUNC('week', last_modified) as week,
                json_object_agg(trait_name, current_value) as traits
            FROM personality_state
            WHERE user_id = $1
            AND last_modified > NOW() - INTERVAL '90 days'
            GROUP BY DATE_TRUNC('week', last_modified)
            ORDER BY week DESC
        `, [userId]);

        return result.rows;
    }

    /**
     * Calculate stability score (0-1, higher = more stable)
     */
    calculateStabilityScore(personalityData, behavioralData) {
        if (personalityData.length < 2) return 0.5;

        // Analyze personality trait variance
        const traitVariances = personalityData.map(trait => {
            if (trait.historical_values && Object.keys(trait.historical_values).length > 1) {
                const values = Object.values(trait.historical_values);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
                return variance;
            }
            return 0.1; // Default low variance
        });

        const avgVariance = traitVariances.reduce((a, b) => a + b, 0) / traitVariances.length;

        // Convert variance to stability (lower variance = higher stability)
        return Math.max(0.1, Math.min(1.0, 1 - (avgVariance * 10)));
    }

    /**
     * Calculate confidence level based on data quality and quantity
     */
    calculateConfidenceLevel(personalityData, behavioralData, relationshipData) {
        let confidence = 0.5; // Base confidence

        // More personality data = higher confidence
        if (personalityData.length > 5) confidence += 0.2;

        // More behavioral data = higher confidence
        if (behavioralData.length > 20) confidence += 0.2;

        // Established relationship patterns = higher confidence
        if (relationshipData.total_interactions > 50) confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    /**
     * Create a human-readable personality summary
     */
    summarizePersonality(personalityData) {
        if (personalityData.length === 0) return { description: "Personality data not yet established" };

        const traits = {};
        personalityData.forEach(trait => {
            traits[trait.trait_name] = {
                current_value: trait.current_value,
                description: this.describeTrait(trait.trait_name, trait.current_value)
            };
        });

        return {
            traits: traits,
            dominant_traits: this.identifyDominantTraits(traits),
            description: this.generatePersonalityDescription(traits)
        };
    }

    /**
     * Summarize behavioral patterns
     */
    summarizeBehavior(behavioralData) {
        if (behavioralData.length === 0) return { patterns: [], description: "Insufficient behavioral data" };

        // Analyze conversation patterns, emotional responses, etc.
        const patterns = {
            interaction_style: this.analyzeInteractionStyle(behavioralData),
            emotional_patterns: this.analyzeEmotionalPatterns(behavioralData),
            topic_preferences: this.analyzeTopicPreferences(behavioralData),
            response_patterns: this.analyzeResponsePatterns(behavioralData)
        };

        return {
            patterns: patterns,
            description: this.generateBehavioralDescription(patterns)
        };
    }

    /**
     * Summarize relationship dynamics
     */
    summarizeRelationships(relationshipData) {
        if (!relationshipData.total_interactions) return { dynamics: {}, description: "No relationship data available" };

        const dynamics = {
            interaction_frequency: relationshipData.total_interactions,
            emotional_balance: {
                positive_ratio: relationshipData.positive_ratio || 0,
                negative_ratio: relationshipData.negative_ratio || 0
            },
            common_tone: relationshipData.common_tone || 'neutral',
            engagement_level: this.calculateEngagementLevel(relationshipData)
        };

        return {
            dynamics: dynamics,
            description: this.generateRelationshipDescription(dynamics)
        };
    }

    /**
     * Summarize evolution trends
     */
    summarizeEvolution(evolutionData) {
        if (evolutionData.length < 2) return { trends: [], description: "Insufficient historical data for trend analysis" };

        const trends = evolutionData.map((week, index) => {
            if (index < evolutionData.length - 1) {
                const current = week.traits;
                const previous = evolutionData[index + 1].traits;

                const changes = {};
                Object.keys(current).forEach(trait => {
                    if (previous[trait] !== undefined) {
                        changes[trait] = current[trait] - previous[trait];
                    }
                });

                return {
                    week: week.week,
                    changes: changes,
                    significant_changes: this.identifySignificantChanges(changes)
                };
            }
            return null;
        }).filter(Boolean);

        return {
            trends: trends,
            overall_direction: this.analyzeOverallDirection(trends),
            description: this.generateEvolutionDescription(trends)
        };
    }

    /**
     * Save identity summary to database
     */
    async saveIdentitySummary(userId, personaId, summary, stabilityScore, confidenceLevel) {
        const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Valid for 7 days

        await query(`
            INSERT INTO identity_summaries (
                user_id, persona_id, personality_summary, behavioral_patterns,
                relationship_dynamics, evolution_trends, stability_score,
                confidence_level, valid_until
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, persona_id)
            DO UPDATE SET
                personality_summary = EXCLUDED.personality_summary,
                behavioral_patterns = EXCLUDED.behavioral_patterns,
                relationship_dynamics = EXCLUDED.relationship_dynamics,
                evolution_trends = EXCLUDED.evolution_trends,
                stability_score = EXCLUDED.stability_score,
                confidence_level = EXCLUDED.confidence_level,
                generated_at = NOW(),
                valid_until = EXCLUDED.valid_until
        `, [
            userId, personaId, summary.personality_summary, summary.behavioral_patterns,
            summary.relationship_dynamics, summary.evolution_trends, stabilityScore,
            confidenceLevel, validUntil
        ]);
    }

    /**
     * Get existing identity summary (if still valid)
     */
    async getIdentitySummary(userId, personaId = null) {
        const result = await query(`
            SELECT * FROM identity_summaries
            WHERE user_id = $1 AND persona_id IS NOT DISTINCT FROM $2
            AND valid_until > NOW()
            ORDER BY generated_at DESC
            LIMIT 1
        `, [userId, personaId]);

        return result.rows[0] || null;
    }

    // Helper methods for analysis
    describeTrait(traitName, value) {
        const descriptions = {
            humor: value > 0.7 ? "very humorous" : value > 0.4 ? "moderately humorous" : "not very humorous",
            empathy: value > 0.7 ? "highly empathetic" : value > 0.4 ? "moderately empathetic" : "less empathetic",
            directness: value > 0.7 ? "very direct" : value > 0.4 ? "moderately direct" : "quite indirect",
            formality: value > 0.7 ? "very formal" : value > 0.4 ? "moderately formal" : "quite casual",
            enthusiasm: value > 0.7 ? "very enthusiastic" : value > 0.4 ? "moderately enthusiastic" : "quite reserved",
            curiosity: value > 0.7 ? "highly curious" : value > 0.4 ? "moderately curious" : "less curious",
            patience: value > 0.7 ? "very patient" : value > 0.4 ? "moderately patient" : "less patient"
        };
        return descriptions[traitName] || `value: ${value.toFixed(2)}`;
    }

    identifyDominantTraits(traits) {
        return Object.entries(traits)
            .filter(([_, data]) => data.current_value > 0.6)
            .sort((a, b) => b[1].current_value - a[1].current_value)
            .slice(0, 3)
            .map(([name, _]) => name);
    }

    generatePersonalityDescription(traits) {
        const dominant = this.identifyDominantTraits(traits);
        if (dominant.length === 0) return "Personality still developing";

        return `This persona is particularly ${dominant.join(', ')} in nature.`;
    }

    analyzeInteractionStyle(behavioralData) {
        // Simple analysis - could be enhanced with NLP
        const avgLength = behavioralData.reduce((sum, conv) =>
            sum + JSON.stringify(conv.conversation_text).length, 0) / behavioralData.length;

        if (avgLength > 500) return "detailed and thorough";
        if (avgLength > 200) return "moderately detailed";
        return "concise and direct";
    }

    analyzeEmotionalPatterns(behavioralData) {
        // Analyze emotional context from conversations
        const emotions = behavioralData
            .filter(conv => conv.emotional_context)
            .map(conv => conv.emotional_context);

        if (emotions.length === 0) return "neutral";

        const positive = emotions.filter(e => e.sentiment === 'positive').length;
        const negative = emotions.filter(e => e.sentiment === 'negative').length;

        if (positive > negative * 1.5) return "generally positive";
        if (negative > positive * 1.5) return "generally cautious";
        return "balanced emotional tone";
    }

    analyzeTopicPreferences(behavioralData) {
        // This would require more sophisticated NLP - placeholder
        return ["general conversation", "problem solving"];
    }

    analyzeResponsePatterns(behavioralData) {
        // Analyze response timing, length, etc.
        return "responsive and engaged";
    }

    generateBehavioralDescription(patterns) {
        return `This persona typically interacts in a ${patterns.interaction_style} manner with ${patterns.emotional_patterns} emotional tone.`;
    }

    calculateEngagementLevel(relationshipData) {
        const interactions = relationshipData.total_interactions || 0;
        if (interactions > 100) return "highly engaged";
        if (interactions > 50) return "moderately engaged";
        if (interactions > 10) return "occasionally engaged";
        return "newly developing";
    }

    generateRelationshipDescription(dynamics) {
        return `The relationship shows ${dynamics.engagement_level} with a ${(dynamics.emotional_balance.positive_ratio * 100).toFixed(0)}% positive interaction rate.`;
    }

    calculateTimeRange(evolutionData) {
        if (evolutionData.length < 2) return 0;
        const first = new Date(evolutionData[evolutionData.length - 1].week);
        const last = new Date(evolutionData[0].week);
        return Math.floor((last - first) / (1000 * 60 * 60 * 24));
    }

    identifySignificantChanges(changes) {
        return Object.entries(changes)
            .filter(([_, change]) => Math.abs(change) > 0.1)
            .map(([trait, change]) => ({ trait, change: change > 0 ? 'increased' : 'decreased' }));
    }

    analyzeOverallDirection(trends) {
        if (trends.length === 0) return "stable";

        const totalChanges = trends.reduce((sum, trend) => {
            return sum + Object.values(trend.changes).reduce((s, c) => s + Math.abs(c), 0);
        }, 0);

        const avgChange = totalChanges / trends.length;
        if (avgChange > 0.2) return "actively evolving";
        if (avgChange > 0.1) return "gradually changing";
        return "mostly stable";
    }

    generateEvolutionDescription(trends) {
        const direction = this.analyzeOverallDirection(trends);
        return `The persona is ${direction} over time.`;
    }
}

module.exports = new IdentitySummaryEngine();
