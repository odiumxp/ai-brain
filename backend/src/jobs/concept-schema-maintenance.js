// Concept Schema Maintenance Job
// Runs periodically to maintain and evolve the concept schema

const conceptSchemaService = require('../services/concept-schema-service');
const { query } = require('../db/connection');

class ConceptSchemaMaintenance {

    async run() {
        try {
            console.log('🧠 Starting concept schema maintenance...');

            // Get all users
            const usersResult = await query('SELECT user_id FROM users');
            const users = usersResult.rows;

            let totalProcessed = 0;

            for (const user of users) {
                const userId = user.user_id;
                console.log(`  Processing user: ${userId}`);

                try {
                    // Decay old/unused concepts and relationships
                    await this.decayOldConcepts(userId);

                    // Extract concepts from recent conversations
                    await this.processRecentConversations(userId);

                    // Strengthen relationships based on co-occurrence
                    await this.strengthenRelationships(userId);

                    // Infer new relationships from existing data
                    await this.inferNewRelationships(userId);

                    totalProcessed++;

                } catch (error) {
                    console.error(`  ❌ Error processing user ${userId}:`, error.message);
                }
            }

            console.log(`✅ Concept schema maintenance complete! Processed ${totalProcessed} users`);

        } catch (error) {
            console.error('❌ Concept schema maintenance error:', error);
        }
    }

    /**
     * Decay old and unused concepts/relationships
     */
    async decayOldConcepts(userId) {
        try {
            const result = await query('SELECT decay_concept_schema($1)', [userId]);
            console.log(`    Decayed concepts for user ${userId}`);
        } catch (error) {
            console.error('Error decaying concepts:', error);
        }
    }

    /**
     * Process recent conversations to extract new concepts
     */
    async processRecentConversations(userId) {
        try {
            // Get conversations from the last 24 hours that haven't been processed
            const conversationsResult = await query(`
                SELECT conversation_text
                FROM episodic_memory
                WHERE user_id = $1
                AND created_at > NOW() - INTERVAL '24 hours'
                AND conversation_text->>'processed_for_concepts' IS NULL
                LIMIT 10
            `, [userId]);

            for (const row of conversationsResult.rows) {
                const conversation = JSON.stringify(row.conversation_text);
                await conceptSchemaService.processConversationConcepts(userId, conversation);

                // Mark as processed
                await query(`
                    UPDATE episodic_memory
                    SET conversation_text = jsonb_set(conversation_text, '{processed_for_concepts}', 'true')
                    WHERE user_id = $1 AND conversation_text = $2
                `, [userId, row.conversation_text]);
            }

            if (conversationsResult.rows.length > 0) {
                console.log(`    Processed ${conversationsResult.rows.length} recent conversations for concepts`);
            }

        } catch (error) {
            console.error('Error processing recent conversations:', error);
        }
    }

    /**
     * Strengthen relationships based on concept co-occurrence in conversations
     */
    async strengthenRelationships(userId) {
        try {
            // Find concepts that frequently appear together in recent conversations
            const cooccurrenceResult = await query(`
                WITH recent_conversations AS (
                    SELECT
                        jsonb_object_keys(conversation_text) as key,
                        conversation_text->>jsonb_object_keys(conversation_text) as value
                    FROM episodic_memory
                    WHERE user_id = $1
                    AND created_at > NOW() - INTERVAL '7 days'
                ),
                concept_mentions AS (
                    SELECT
                        cs.concept_id,
                        cs.concept_name,
                        em.memory_id
                    FROM concept_schema cs
                    JOIN episodic_memory em ON em.user_id = cs.user_id
                    WHERE cs.user_id = $1
                    AND em.created_at > NOW() - INTERVAL '7 days'
                    AND (
                        em.conversation_text::text ILIKE '%' || cs.concept_name || '%' OR
                        em.conversation_text->>'user' ILIKE '%' || cs.concept_name || '%' OR
                        em.conversation_text->>'ai' ILIKE '%' || cs.concept_name || '%'
                    )
                ),
                concept_pairs AS (
                    SELECT
                        c1.concept_name as concept1,
                        c2.concept_name as concept2,
                        COUNT(*) as cooccurrence_count
                    FROM concept_mentions c1
                    JOIN concept_mentions c2 ON c1.memory_id = c2.memory_id AND c1.concept_id < c2.concept_id
                    GROUP BY c1.concept_name, c2.concept_name
                    HAVING COUNT(*) > 2
                )
                SELECT * FROM concept_pairs ORDER BY cooccurrence_count DESC LIMIT 20
            `, [userId]);

            // Strengthen relationships for frequently co-occurring concepts
            for (const pair of cooccurrenceResult.rows) {
                try {
                    await conceptSchemaService.addRelationship(
                        userId,
                        pair.concept1,
                        pair.concept2,
                        'related_to',
                        Math.min(0.3 + (pair.cooccurrence_count * 0.1), 0.8)
                    );
                } catch (error) {
                    // Ignore errors for existing relationships
                }
            }

            if (cooccurrenceResult.rows.length > 0) {
                console.log(`    Strengthened ${cooccurrenceResult.rows.length} relationships based on co-occurrence`);
            }

        } catch (error) {
            console.error('Error strengthening relationships:', error);
        }
    }

    /**
     * Infer new relationships from existing concept data
     */
    async inferNewRelationships(userId) {
        try {
            // Find concepts that might be opposites based on context
            const oppositeCandidates = await query(`
                SELECT DISTINCT
                    c1.concept_name as concept1,
                    c2.concept_name as concept2
                FROM concept_schema c1
                CROSS JOIN concept_schema c2
                WHERE c1.user_id = $1 AND c2.user_id = $1
                AND c1.concept_id != c2.concept_id
                AND c1.concept_name != c2.concept_name
                AND (
                    (c1.concept_name ILIKE 'not%' AND c2.concept_name = substring(c1.concept_name from 4)) OR
                    (c2.concept_name ILIKE 'not%' AND c1.concept_name = substring(c2.concept_name from 4)) OR
                    (c1.concept_name ILIKE '%less' AND c2.concept_name = replace(c1.concept_name, 'less', 'more')) OR
                    (c2.concept_name ILIKE '%less' AND c1.concept_name = replace(c2.concept_name, 'less', 'more'))
                )
                LIMIT 10
            `, [userId]);

            // Add opposite relationships
            for (const pair of oppositeCandidates.rows) {
                try {
                    await conceptSchemaService.addRelationship(
                        userId,
                        pair.concept1,
                        pair.concept2,
                        'opposite_of',
                        0.7
                    );
                } catch (error) {
                    // Ignore errors for existing relationships
                }
            }

            if (oppositeCandidates.rows.length > 0) {
                console.log(`    Inferred ${oppositeCandidates.rows.length} opposite relationships`);
            }

        } catch (error) {
            console.error('Error inferring relationships:', error);
        }
    }
}

module.exports = new ConceptSchemaMaintenance();
