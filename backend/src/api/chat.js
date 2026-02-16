// Chat API - Main chat endpoint
const express = require('express');
const router = express.Router();
const memoryService = require('../services/memory-service');
const personalityService = require('../services/personality-service');
const gptService = require('../services/gpt-service');
const contextBuilder = require('../services/context-builder');
const personaService = require('../services/persona-service');
const sdService = require('../services/sd-service');
const workingMemoryService = require('../services/working-memory-service');
const emotionalContinuityService = require('../services/emotional-continuity-service');

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/', async (req, res) => {
    try {
        const { userId, message, image } = req.body;

        if (!userId || (!message && !image)) {
            return res.status(400).json({
                error: 'Missing required fields: userId and either message or image'
            });
        }

        console.log(`💬 Chat request from user ${userId}`);

        // 0. Get active persona
        const activePersona = await personaService.getActivePersona(userId);
        console.log(`🎭 Using persona: ${activePersona ? activePersona.name : 'default'}`);

        // 1. Retrieve relevant memories (filtered by persona if exists)
        const searchQuery = message || 'image analysis';
        const memories = await memoryService.retrieveRelevantMemories(
            userId,
            searchQuery,
            15,
            activePersona ? activePersona.persona_id : null
        );
        console.log(`📚 Retrieved ${memories.length} relevant memories`);

        // 2. Get current personality state
        const personality = await personalityService.getPersonality(userId);
        console.log(`🎭 Loaded personality with ${Object.keys(personality).length} traits`);

        // 2.5. Get working memory context (current conversation topics/goals)
        const workingMemoryContext = await workingMemoryService.getWorkingMemoryContext(
            userId,
            activePersona ? activePersona.persona_id : null
        );
        if (workingMemoryContext) {
            console.log(`💭 Working Memory: Active conversation context loaded`);
        }

        // 3. If an image (data URL) was provided, save it to disk and convert to a public URL
        let imageToSend = image;
        if (image && image.data && image.data.startsWith('data:image/')) {
            try {
                const fs = require('fs');
                const path = require('path');
                const crypto = require('crypto');

                const match = image.data.match(/^data:(image\/[^;]+);base64,(.+)$/);
                if (match) {
                    const mime = match[1];
                    const base64 = match[2];
                    const ext = mime.split('/')[1].replace('jpeg', 'jpg');
                    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
                    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                    const filePath = path.join(uploadsDir, filename);
                    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
                    const localUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
                    imageToSend = { data: image.data, url: localUrl, name: image.name || filename };
                    console.log(`🖼️ Saved uploaded image to ${filePath}`);

                    // Try to upload to public HTTPS host (0x0.st) so Anthropic can fetch it
                    try {
                        const https = require('https');
                        const fileBuffer = fs.readFileSync(filePath);
                        const boundary = '----AI-BRAIN-BOUNDARY-' + crypto.randomBytes(8).toString('hex');
                        const metaPart = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`, 'utf8');
                        const endPart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
                        const body = Buffer.concat([metaPart, fileBuffer, endPart]);

                        const options = {
                            hostname: '0x0.st',
                            path: '/',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                                'Content-Length': body.length
                            }
                        };

                        const publicUrl = await new Promise((resolve, reject) => {
                            const req2 = https.request(options, (res2) => {
                                let data = '';
                                res2.setEncoding('utf8');
                                res2.on('data', chunk => data += chunk);
                                res2.on('end', () => {
                                    const url = data.trim();
                                    if (url.startsWith('http')) resolve(url);
                                    else reject(new Error('Unexpected upload response'));
                                });
                            });
                            req2.on('error', reject);
                            req2.write(body);
                            req2.end();
                        });

                        console.log('🌐 Uploaded image to public host (0x0.st):', publicUrl);
                        imageToSend = { data: image.data, url: publicUrl, name: image.name || filename };

                    } catch (uploadErr) {
                        console.error('0x0.st upload failed:', uploadErr.message || uploadErr);

                        // Fallback: try transfer.sh (HTTPS PUT)
                        try {
                            const https = require('https');
                            const fileBuffer = fs.readFileSync(filePath);
                            const options2 = {
                                hostname: 'transfer.sh',
                                path: `/${filename}`,
                                method: 'PUT',
                                headers: {
                                    'Content-Type': mime,
                                    'Content-Length': fileBuffer.length
                                }
                            };

                            const transferUrl = await new Promise((resolve, reject) => {
                                const req3 = https.request(options2, (res3) => {
                                    let data = '';
                                    res3.setEncoding('utf8');
                                    res3.on('data', chunk => data += chunk);
                                    res3.on('end', () => {
                                        const url = data.trim();
                                        if (url.startsWith('http')) resolve(url);
                                        else reject(new Error('transfer.sh returned unexpected response'));
                                    });
                                });
                                req3.on('error', reject);
                                req3.write(fileBuffer);
                                req3.end();
                            });

                            console.log('🌐 Uploaded image to transfer.sh:', transferUrl);
                            imageToSend = { data: image.data, url: transferUrl, name: image.name || filename };

                        } catch (transferErr) {
                            console.error('transfer.sh upload failed:', transferErr.message || transferErr);
                            // keep imageToSend as localUrl (fallback)
                        }
                    }
                }
            } catch (err) {
                console.error('Error saving uploaded image:', err);
            }
        }

        // 4. Build context with persona system prompt, working memory, AND memory chains
        const context = await contextBuilder.buildContext(
            personality,
            memories,
            activePersona ? activePersona.system_prompt : null,
            workingMemoryContext, // Add working memory context
            userId // Add userId for memory chains
        );

        // 5. Call GPT-4 API
        const rawResponse = await gptService.sendMessage(context, message, imageToSend);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const response = await sdService.processImageTags(rawResponse, baseUrl);

        // 6. Store conversation in memory with persona_id
        const memoryText = image ? `${message || 'Image analysis'}: ${image.name}` : message;
        const memoryId = await memoryService.storeMemory(
            userId,
            memoryText,
            response,
            activePersona ? activePersona.persona_id : null
        );
        console.log(`💾 Stored memory ${memoryId}`);

        // 6.5. Detect emotions from the conversation (async, don't wait)
        const fullConversation = `${memoryText}\nAI: ${response}`;
        emotionalContinuityService.detectEmotionsFromText(fullConversation, userId, memoryId)
            .then(emotions => {
                if (emotions.emotions && emotions.emotions.length > 0) {
                    console.log(`🤗 Detected ${emotions.emotions.length} emotions: ${emotions.emotions.map(e => e.type).join(', ')}`);
                }
            })
            .catch(err => {
                console.error('Error detecting emotions:', err);
            });

        // 7. Update personality (async, don't wait)
        personalityService.updatePersonality(userId)
            .catch(err => {
                console.error('Error updating personality:', err);
            });

        // 7. Update working memory (async, don't wait)
        workingMemoryService.updateWorkingMemory(
            userId,
            memoryText,
            response,
            activePersona ? activePersona.persona_id : null
        ).catch(err => {
            console.error('Error updating working memory:', err);
        });

        // Return response
        res.json({
            response,
            metadata: {
                memories_retrieved: memories.length,
                personality_traits: Object.keys(personality).length
            }
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to process message',
            details: error.message
        });
    }
});

/**
 * POST /api/chat/stream
 * Streaming chat endpoint
 */
router.post('/stream', async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                error: 'Missing required fields: userId and message'
            });
        }

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Retrieve context
        const memories = await memoryService.retrieveRelevantMemories(userId, message, 15); // Increased to 15
        const personality = await personalityService.getPersonality(userId);
        const context = await contextBuilder.buildContext(personality, memories, null, null, userId);

        // Stream response
        let fullResponse = '';
        await gptService.streamMessage(context, message, (chunk) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        // Store memory
        memoryService.storeMemory(userId, message, fullResponse).catch(console.error);
        personalityService.updatePersonality(userId).catch(console.error);

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Stream error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * GET /api/chat/history/:userId
 * Get chat history for a user
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { query } = require('../db/connection');
        const result = await query(`
            SELECT
                memory_id,
                conversation_text,
                emotional_context,
                timestamp,
                importance_score
            FROM episodic_memory
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        res.json({
            history: result.rows,
            count: result.rows.length,
            limit,
            offset
        });

    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * GET /api/chat/memories/:userId
 * Get all memories for a user
 */
router.get('/memories/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { query } = require('../db/connection');
        const result = await query(`
            SELECT
                memory_id,
                conversation_text,
                emotional_context,
                timestamp,
                importance_score,
                access_count,
                last_accessed,
                pinned
            FROM episodic_memory
            WHERE user_id = $1
            ORDER BY timestamp DESC
        `, [userId]);

        res.json({
            memories: result.rows
        });

    } catch (error) {
        console.error('Memories error:', error);
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});

/**
 * GET /api/chat/memory-stats/:userId
 * Get memory statistics for a user
 */
router.get('/memory-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await memoryService.getMemoryStats(userId);

        res.json({
            total: parseInt(stats.total_memories) || 0,
            avgImportance: parseFloat(stats.avg_importance) || 0,
            totalAccesses: parseInt(stats.total_accesses) || 0,
            lastMemory: stats.last_memory
        });

    } catch (error) {
        console.error('Memory stats error:', error);
        res.status(500).json({ error: 'Failed to fetch memory stats' });
    }
});

/**
 * DELETE /api/chat/memories/:memoryId
 * Delete a specific memory
 */
router.delete('/memories/:memoryId', async (req, res) => {
    try {
        const { memoryId } = req.params;

        const { query } = require('../db/connection');
        await query(`
            DELETE FROM episodic_memory
            WHERE memory_id = $1
        `, [memoryId]);

        res.json({ success: true });

    } catch (error) {
        console.error('Delete memory error:', error);
        res.status(500).json({ error: 'Failed to delete memory' });
    }
});

/**
 * PATCH /api/chat/memories/:memoryId/pin
 * Toggle pin status for a memory
 */
router.patch('/memories/:memoryId/pin', async (req, res) => {
    try {
        const { memoryId } = req.params;
        const { pinned } = req.body;

        const { query } = require('../db/connection');
        await query(`
            UPDATE episodic_memory
            SET pinned = $1
            WHERE memory_id = $2
        `, [pinned, memoryId]);

        res.json({ success: true, pinned });

    } catch (error) {
        console.error('Pin memory error:', error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

/**
 * GET /api/chat/personality/:userId
 * Get personality traits for a user
 */
router.get('/personality/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const personality = await personalityService.getPersonality(userId);

        res.json({
            traits: personality
        });

    } catch (error) {
        console.error('Personality error:', error);
        res.status(500).json({ error: 'Failed to fetch personality' });
    }
});

module.exports = router;
