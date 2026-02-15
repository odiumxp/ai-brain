// Main Express Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

// Import routes
const chatRoutes = require('./api/chat');
const personasRoutes = require('./api/personas');
const insightsRoutes = require('./api/insights');
const learningRoutes = require('./api/learning');

// Import jobs
const consolidationJob = require('./jobs/consolidation');
const personalityEvolutionJob = require('./jobs/personality-evolution');
const connectionDecayJob = require('./jobs/connection-decay');

// Initialize express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with larger limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies
app.use(morgan('combined')); // Logging

// Serve uploaded images
const path = require('path');
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/learning', learningRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI Brain API',
        version: '1.0.0',
        description: 'Brain-inspired AI with persistent memory and evolving personality',
        endpoints: {
            chat: 'POST /api/chat',
            stream: 'POST /api/chat/stream',
            history: 'GET /api/chat/history/:userId',
            health: 'GET /health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Schedule background jobs
if (process.env.ENABLE_CRON_JOBS !== 'false') {
    console.log('📅 Scheduling background jobs...');

    // Memory consolidation (daily at 2 AM)
    cron.schedule('0 2 * * *', () => {
        console.log('🧹 Running memory consolidation job...');
        consolidationJob.run().catch(console.error);
    });

    // Personality evolution (daily at 3 AM)
    cron.schedule('0 3 * * *', () => {
        console.log('🎭 Running personality evolution job...');
        personalityEvolutionJob.run().catch(console.error);
    });

    // Connection decay (weekly on Sunday at 4 AM)
    cron.schedule('0 4 * * 0', () => {
        console.log('🔗 Running connection decay job...');
        connectionDecayJob.run().catch(console.error);
    });

    console.log('✅ Background jobs scheduled');
}

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║          🧠 AI BRAIN SERVER STARTED                    ║
║                                                        ║
║  Port: ${PORT.toString().padEnd(45)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(38)}║
║  Database: Connected                                   ║
║                                                        ║
║  Ready to develop AI personalities! 🚀                 ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);

    console.log('\n📍 API Endpoints:');
    console.log(`   POST   http://localhost:${PORT}/api/chat`);
    console.log(`   POST   http://localhost:${PORT}/api/chat/stream`);
    console.log(`   GET    http://localhost:${PORT}/api/chat/history/:userId`);
    console.log(`   GET    http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
