// Insights API
const express = require('express');
const router = express.Router();
const insightsService = require('../services/insights-service');

/**
 * GET /api/insights/:userId
 * Get comprehensive insights
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const insights = await insightsService.getComprehensiveInsights(userId, days);

        res.json(insights);
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

/**
 * GET /api/insights/:userId/topics
 * Get topics analysis
 */
router.get('/:userId/topics', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const topics = await insightsService.getTopicsAnalysis(userId, days);

        res.json(topics);
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ error: 'Failed to analyze topics' });
    }
});

/**
 * GET /api/insights/:userId/mood
 * Get mood analysis
 */
router.get('/:userId/mood', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const mood = await insightsService.getMoodAnalysis(userId, days);

        res.json(mood);
    } catch (error) {
        console.error('Get mood error:', error);
        res.status(500).json({ error: 'Failed to analyze mood' });
    }
});

/**
 * GET /api/insights/:userId/patterns
 * Get behavior patterns
 */
router.get('/:userId/patterns', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const patterns = await insightsService.getBehaviorPatterns(userId, days);

        res.json(patterns);
    } catch (error) {
        console.error('Get patterns error:', error);
        res.status(500).json({ error: 'Failed to identify patterns' });
    }
});

/**
 * GET /api/insights/:userId/recommendations
 * Get personalized recommendations
 */
router.get('/:userId/recommendations', async (req, res) => {
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;

        const recommendations = await insightsService.getRecommendations(userId, days);

        res.json(recommendations);
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

/**
 * GET /api/insights/:userId/stats
 * Get conversation statistics
 */
router.get('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await insightsService.getConversationStats(userId);

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;
