// Learning API - Connected to Learning Tutor persona
const express = require('express');
const router = express.Router();
const learningService = require('../services/learning-service');

/**
 * POST /api/learning/:userId/generate-quiz
 * Generate quiz from Learning Tutor conversations
 */
router.post('/:userId/generate-quiz', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topic, count } = req.body;
        
        const quiz = await learningService.generateQuiz(userId, topic, count || 5);
        
        res.json(quiz);
    } catch (error) {
        console.error('Generate quiz error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate quiz' });
    }
});

/**
 * GET /api/learning/:userId/due
 * Get items due for review
 */
router.get('/:userId/due', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const items = await learningService.getDueItems(userId, limit);
        
        res.json({ items });
    } catch (error) {
        console.error('Get due items error:', error);
        res.status(500).json({ error: error.message || 'Failed to get due items' });
    }
});

/**
 * POST /api/learning/answer/:itemId
 * Submit answer and update mastery
 */
router.post('/answer/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { correct } = req.body;
        
        const result = await learningService.submitAnswer(itemId, correct);
        
        res.json(result);
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});

/**
 * POST /api/learning/:userId/session/start
 * Start a study session
 */
router.post('/:userId/session/start', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topic } = req.body;
        
        const sessionId = await learningService.startStudySession(userId, topic);
        
        res.json({ sessionId });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

/**
 * POST /api/learning/session/:sessionId/complete
 * Complete a study session
 */
router.post('/session/:sessionId/complete', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { itemsReviewed, itemsCorrect, durationMinutes } = req.body;
        
        await learningService.completeStudySession(
            sessionId, 
            itemsReviewed, 
            itemsCorrect, 
            durationMinutes
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Complete session error:', error);
        res.status(500).json({ error: 'Failed to complete session' });
    }
});

/**
 * GET /api/learning/:userId/stats
 * Get learning statistics
 */
router.get('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stats = await learningService.getLearningStats(userId);
        
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to get stats' });
    }
});

/**
 * GET /api/learning/:userId/topics
 * Get study topics
 */
router.get('/:userId/topics', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const topics = await learningService.getStudyTopics(userId);
        
        res.json({ topics });
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ error: 'Failed to get topics' });
    }
});

module.exports = router;
