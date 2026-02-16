// Concept Schema Layer (Semantic Backbone)
// Manages hierarchical concept organization and relationships

const { query } = require('../db/connection');
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class ConceptSchemaService {

    /**
     * Generate embedding for concept text
     */
    async generateEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating concept embedding:', error);
            return null;
        }
    }

    /**
     * Add or update a concept in the schema
     */
    async addConcept(userId, conceptName, options = {}) {
        try {
            const {
                conceptType = 'general',
                description = '',
                importance = 1.0,
                metadata = {}
            } = options;

            // Generate embedding for the concept
            const embedding = await this.generateEmbedding(`${conceptName} ${description}`);
            console.log(`📚 Embedding generated: ${embedding ? 'success' : 'failed'}`);

            let finalEmbedding = embedding;
            if (!embedding) {
                // Use a zero vector as default when embedding generation fails
                finalEmbedding = new Array(1536).fill(0);
                console.log('📚 Using zero vector fallback');
            }

            // Format embedding as pgvector string format
            const embeddingString = `[${finalEmbedding.join(',')}]`;

            // Insert or update concept
            const result = await query(`
                INSERT INTO concept_schema
                (user_id, concept_name, concept_type, description, embedding, importance_score)
                VALUES ($1, $2, $3, $4, $5::vector, $6)
                ON CONFLICT (user_id, concept_name)
                DO UPDATE SET
                    concept_type = EXCLUDED.concept_type,
                    description = EXCLUDED.description,
                    embedding = EXCLUDED.embedding,
                    importance_score = GREATEST(concept_schema.importance_score, EXCLUDED.importance_score),
                    updated_at = NOW()
                RETURNING concept_id
            `, [userId, conceptName, conceptType, description, embeddingString, importance]);

            const conceptId = result.rows[0].concept_id;

            // Add metadata if provided
            if (Object.keys(metadata).length > 0) {
                await this.addConceptMetadata(conceptId, userId, metadata);
            }

            console.log(`📚 Added/updated concept: ${conceptName} (${conceptType})`);
            return conceptId;

        } catch (error) {
            console.error('Error adding concept:', error);
            throw error;
        }
    }

    /**
     * Add metadata to a concept
     */
    async addConceptMetadata(conceptId, userId, metadata) {
        try {
            const inserts = [];

            for (const [key, value] of Object.entries(metadata)) {
                let valueType = 'string';
                let stringValue = null, numberValue = null, booleanValue = null, jsonValue = null;

                if (typeof value === 'number') {
                    valueType = 'number';
                    numberValue = value;
                } else if (typeof value === 'boolean') {
                    valueType = 'boolean';
                    booleanValue = value;
                } else if (typeof value === 'object') {
                    valueType = 'json';
                    jsonValue = JSON.stringify(value);
                } else {
                    stringValue = String(value);
                }

                inserts.push(
                    query(`
                        INSERT INTO concept_metadata
                        (concept_id, user_id, key_name, value_type, string_value, number_value, boolean_value, json_value)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (concept_id, key_name)
                        DO UPDATE SET
                            value_type = EXCLUDED.value_type,
                            string_value = EXCLUDED.string_value,
                            number_value = EXCLUDED.number_value,
                            boolean_value = EXCLUDED.boolean_value,
                            json_value = EXCLUDED.json_value
                    `, [conceptId, userId, key, valueType, stringValue, numberValue, booleanValue, jsonValue])
                );
            }

            await Promise.all(inserts);

        } catch (error) {
            console.error('Error adding concept metadata:', error);
            throw error;
        }
    }

    /**
     * Create a hierarchical relationship between concepts
     */
    async addHierarchyRelationship(userId, parentConceptName, childConceptName, relationshipType = 'is_a', confidence = 0.8) {
        try {
            // Get concept IDs
            const parentResult = await query(
                'SELECT concept_id FROM concept_schema WHERE user_id = $1 AND concept_name = $2',
                [userId, parentConceptName]
            );
            const childResult = await query(
                'SELECT concept_id FROM concept_schema WHERE user_id = $1 AND concept_name = $2',
                [userId, childConceptName]
            );

            if (parentResult.rows.length === 0 || childResult.rows.length === 0) {
                throw new Error('Parent or child concept not found');
            }

            const parentId = parentResult.rows[0].concept_id;
            const childId = childResult.rows[0].concept_id;

            // Add hierarchy relationship
            await query(`
                INSERT INTO concept_hierarchy
                (user_id, parent_concept_id, child_concept_id, relationship_type, confidence_score)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, parent_concept_id, child_concept_id, relationship_type)
                DO UPDATE SET confidence_score = GREATEST(concept_hierarchy.confidence_score, EXCLUDED.confidence_score)
            `, [userId, parentId, childId, relationshipType, confidence]);

            console.log(`🔗 Added hierarchy: ${childConceptName} ${relationshipType} ${parentConceptName}`);

        } catch (error) {
            console.error('Error adding hierarchy relationship:', error);
            throw error;
        }
    }

    /**
     * Create an associative relationship between concepts
     */
    async addRelationship(userId, sourceConceptName, targetConceptName, relationshipType, strength = 0.5, context = '') {
        try {
            // Get concept IDs
            const sourceResult = await query(
                'SELECT concept_id FROM concept_schema WHERE user_id = $1 AND concept_name = $2',
                [userId, sourceConceptName]
            );
            const targetResult = await query(
                'SELECT concept_id FROM concept_schema WHERE user_id = $1 AND concept_name = $2',
                [userId, targetConceptName]
            );

            if (sourceResult.rows.length === 0 || targetResult.rows.length === 0) {
                throw new Error('Source or target concept not found');
            }

            const sourceId = sourceResult.rows[0].concept_id;
            const targetId = targetResult.rows[0].concept_id;

            // Add relationship
            await query(`
                INSERT INTO concept_relationships
                (user_id, source_concept_id, target_concept_id, relationship_type, strength, context_notes)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, source_concept_id, target_concept_id, relationship_type)
                DO UPDATE SET strength = GREATEST(concept_relationships.strength, EXCLUDED.strength)
            `, [userId, sourceId, targetId, relationshipType, strength, context]);

            console.log(`🔗 Added relationship: ${sourceConceptName} ${relationshipType} ${targetConceptName}`);

        } catch (error) {
            console.error('Error adding relationship:', error);
            throw error;
        }
    }

    /**
     * Find concepts similar to given text
     */
    async findSimilarConcepts(userId, text, limit = 10) {
        try {
            const embedding = await this.generateEmbedding(text);
            if (!embedding) return [];

            const embeddingString = `[${embedding.join(',')}]`;

            const result = await query(`
                SELECT
                    concept_id,
                    concept_name,
                    concept_type,
                    description,
                    importance_score,
                    1 - (embedding <=> $1::vector) as similarity
                FROM concept_schema
                WHERE user_id = $2
                AND embedding IS NOT NULL
                ORDER BY embedding <=> $1::vector
                LIMIT $3
            `, [embeddingString, userId, limit]);

            return result.rows;

        } catch (error) {
            console.error('Error finding similar concepts:', error);
            return [];
        }
    }

    /**
     * Get concept hierarchy (children of a concept)
     */
    async getConceptChildren(userId, conceptName, depth = 1) {
        try {
            const result = await query(`
                WITH RECURSIVE concept_tree AS (
                    SELECT
                        h.child_concept_id,
                        h.parent_concept_id,
                        h.relationship_type,
                        h.confidence_score,
                        cs.concept_name as child_name,
                        cs.concept_type,
                        cs.description,
                        1 as level
                    FROM concept_hierarchy h
                    JOIN concept_schema cs ON h.child_concept_id = cs.concept_id
                    WHERE cs.user_id = $1 AND cs.concept_name = $2

                    UNION ALL

                    SELECT
                        h.child_concept_id,
                        h.parent_concept_id,
                        h.relationship_type,
                        h.confidence_score,
                        cs.concept_name as child_name,
                        cs.concept_type,
                        cs.description,
                        ct.level + 1
                    FROM concept_hierarchy h
                    JOIN concept_schema cs ON h.child_concept_id = cs.concept_id
                    JOIN concept_tree ct ON h.parent_concept_id = ct.child_concept_id
                    WHERE ct.level < $3
                )
                SELECT * FROM concept_tree ORDER BY level, child_name
            `, [userId, conceptName, depth]);

            return result.rows;

        } catch (error) {
            console.error('Error getting concept children:', error);
            return [];
        }
    }

    /**
     * Get concept relationships
     */
    async getConceptRelationships(userId, conceptName) {
        try {
            const result = await query(`
                SELECT
                    cr.relationship_type,
                    cr.strength,
                    cr.context_notes,
                    cs.concept_name as related_concept,
                    cs.concept_type,
                    'outgoing' as direction
                FROM concept_relationships cr
                JOIN concept_schema cs ON cr.target_concept_id = cs.concept_id
                JOIN concept_schema source ON cr.source_concept_id = source.concept_id
                WHERE source.user_id = $1 AND source.concept_name = $2

                UNION ALL

                SELECT
                    cr.relationship_type,
                    cr.strength,
                    cr.context_notes,
                    cs.concept_name as related_concept,
                    cs.concept_type,
                    'incoming' as direction
                FROM concept_relationships cr
                JOIN concept_schema cs ON cr.source_concept_id = cs.concept_id
                JOIN concept_schema target ON cr.target_concept_id = target.concept_id
                WHERE target.user_id = $1 AND target.concept_name = $2

                ORDER BY strength DESC
            `, [userId, conceptName]);

            return result.rows;

        } catch (error) {
            console.error('Error getting concept relationships:', error);
            return [];
        }
    }

    /**
     * Get full concept schema overview
     */
    async getConceptSchemaOverview(userId) {
        try {
            const [conceptsResult, hierarchyResult, relationshipsResult] = await Promise.all([
                query(`
                    SELECT concept_type, COUNT(*) as count
                    FROM concept_schema
                    WHERE user_id = $1
                    GROUP BY concept_type
                    ORDER BY count DESC
                `, [userId]),

                query(`
                    SELECT relationship_type, COUNT(*) as count
                    FROM concept_hierarchy
                    WHERE user_id = $1
                    GROUP BY relationship_type
                    ORDER BY count DESC
                `, [userId]),

                query(`
                    SELECT relationship_type, COUNT(*) as count
                    FROM concept_relationships
                    WHERE user_id = $1
                    GROUP BY relationship_type
                    ORDER BY count DESC
                `, [userId])
            ]);

            return {
                concepts: conceptsResult.rows,
                hierarchy: hierarchyResult.rows,
                relationships: relationshipsResult.rows,
                totalConcepts: conceptsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                totalRelationships: hierarchyResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0) +
                    relationshipsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
            };

        } catch (error) {
            console.error('Error getting concept schema overview:', error);
            return { concepts: [], hierarchy: [], relationships: [], totalConcepts: 0, totalRelationships: 0 };
        }
    }

    /**
     * Activate concepts and relationships based on usage
     */
    async activateConcepts(userId, conceptNames) {
        try {
            if (conceptNames.length === 0) return;

            // Activate concepts
            await query(`
                UPDATE concept_schema
                SET activation_count = activation_count + 1,
                    last_activated = NOW(),
                    importance_score = LEAST(importance_score * 1.05, 5.0)
                WHERE user_id = $1 AND concept_name = ANY($2)
            `, [userId, conceptNames]);

            // Activate related relationships
            await query(`
                UPDATE concept_relationships
                SET activation_count = activation_count + 1,
                    last_activated = NOW(),
                    strength = LEAST(strength * 1.02, 1.0)
                WHERE user_id = $1
                AND (source_concept_id IN (
                    SELECT concept_id FROM concept_schema
                    WHERE user_id = $1 AND concept_name = ANY($2)
                ) OR target_concept_id IN (
                    SELECT concept_id FROM concept_schema
                    WHERE user_id = $1 AND concept_name = ANY($2)
                ))
            `, [userId, conceptNames]);

        } catch (error) {
            console.error('Error activating concepts:', error);
        }
    }

    /**
     * Extract and organize concepts from conversation
     */
    async processConversationConcepts(userId, conversationText) {
        try {
            // Use GPT to extract concepts from conversation
            const prompt = `Analyze this conversation and extract key concepts, entities, and relationships. Return as JSON with this structure:
            {
                "concepts": [
                    {"name": "concept_name", "type": "entity|action|property|abstract", "description": "brief description"}
                ],
                "relationships": [
                    {"source": "concept1", "target": "concept2", "type": "related_to|causes|property_of", "strength": 0.5}
                ],
                "hierarchy": [
                    {"parent": "parent_concept", "child": "child_concept", "type": "is_a|part_of"}
                ]
            }

            Conversation: ${conversationText}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1000
            });

            const analysis = JSON.parse(response.choices[0].message.content);

            // Add concepts
            for (const concept of analysis.concepts || []) {
                await this.addConcept(userId, concept.name, {
                    conceptType: concept.type || 'general',
                    description: concept.description || '',
                    importance: 1.0
                });
            }

            // Add relationships
            for (const rel of analysis.relationships || []) {
                await this.addRelationship(userId, rel.source, rel.target, rel.type || 'related_to', rel.strength || 0.5);
            }

            // Add hierarchy
            for (const hier of analysis.hierarchy || []) {
                await this.addHierarchyRelationship(userId, hier.parent, hier.child, hier.type || 'is_a');
            }

            console.log(`📚 Processed conversation concepts: ${analysis.concepts?.length || 0} concepts, ${analysis.relationships?.length || 0} relationships, ${analysis.hierarchy?.length || 0} hierarchies`);

        } catch (error) {
            console.error('Error processing conversation concepts:', error);
        }
    }
}

module.exports = new ConceptSchemaService();
