// Database connection configuration
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'aibrain',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || null,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

// Helper function to execute queries with error handling
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper to get a client from the pool (for transactions)
async function getClient() {
    const client = await pool.connect();
    const originalQuery = client.query;
    const originalRelease = client.release;

    // Monkey patch the query method to track duration
    client.query = async (...args) => {
        const start = Date.now();
        try {
            const res = await originalQuery.apply(client, args);
            const duration = Date.now() - start;
            console.log('Transaction query', { duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Transaction query error:', error);
            throw error;
        }
    };

    // Track release to prevent double-release
    let released = false;
    client.release = () => {
        if (released) {
            console.warn('⚠️  Client already released');
            return;
        }
        released = true;
        return originalRelease.apply(client);
    };

    return client;
}

module.exports = {
    pool,
    query,
    getClient
};
