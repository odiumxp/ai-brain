// Personas API
const express = require('express');
const router = express.Router();
const personaService = require('../services/persona-service');

/**
 * GET /api/personas/:userId
 * Get all personas for a user
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const personas = await personaService.getPersonas(userId);
        
        res.json({ personas });
    } catch (error) {
        console.error('Get personas error:', error);
        res.status(500).json({ error: 'Failed to fetch personas' });
    }
});

/**
 * GET /api/personas/:userId/active
 * Get active persona for a user
 */
router.get('/:userId/active', async (req, res) => {
    try {
        const { userId } = req.params;
        const persona = await personaService.getActivePersona(userId);
        
        res.json({ persona });
    } catch (error) {
        console.error('Get active persona error:', error);
        res.status(500).json({ error: 'Failed to fetch active persona' });
    }
});

/**
 * POST /api/personas/:userId
 * Create a new persona
 */
router.post('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const personaData = req.body;
        
        const persona = await personaService.createPersona(userId, personaData);
        
        res.json({ persona });
    } catch (error) {
        console.error('Create persona error:', error);
        res.status(500).json({ error: 'Failed to create persona' });
    }
});

/**
 * POST /api/personas/:userId/switch/:personaId
 * Switch to a different persona
 */
router.post('/:userId/switch/:personaId', async (req, res) => {
    try {
        const { userId, personaId } = req.params;
        
        const persona = await personaService.switchPersona(userId, personaId);
        
        res.json({ persona });
    } catch (error) {
        console.error('Switch persona error:', error);
        res.status(500).json({ error: 'Failed to switch persona' });
    }
});

/**
 * PATCH /api/personas/:personaId
 * Update a persona
 */
router.patch('/:personaId', async (req, res) => {
    try {
        const { personaId } = req.params;
        const updates = req.body;
        
        const persona = await personaService.updatePersona(personaId, updates);
        
        res.json({ persona });
    } catch (error) {
        console.error('Update persona error:', error);
        res.status(500).json({ error: 'Failed to update persona' });
    }
});

/**
 * DELETE /api/personas/:personaId
 * Delete a persona
 */
router.delete('/:personaId', async (req, res) => {
    try {
        const { personaId } = req.params;
        
        await personaService.deletePersona(personaId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Delete persona error:', error);
        res.status(500).json({ error: 'Failed to delete persona' });
    }
});

/**
 * GET /api/personas/:personaId/stats
 * Get persona statistics
 */
router.get('/:personaId/stats', async (req, res) => {
    try {
        const { personaId } = req.params;
        
        const stats = await personaService.getPersonaStats(personaId);
        
        res.json(stats);
    } catch (error) {
        console.error('Get persona stats error:', error);
        res.status(500).json({ error: 'Failed to fetch persona stats' });
    }
});

/**
 * POST /api/personas/:userId/initialize
 * Create default personas for a new user
 */
router.post('/:userId/initialize', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const personas = await personaService.createDefaultPersonas(userId);
        
        res.json({ personas });
    } catch (error) {
        console.error('Initialize personas error:', error);
        res.status(500).json({ error: 'Failed to initialize personas' });
    }
});

module.exports = router;
