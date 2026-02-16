const { query } = require('../src/db/connection');

(async () => {
    try {
        const res = await query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        if (res.rows.length > 0) {
            console.log('✅ pgvector (vector) extension is installed');
        } else {
            console.log('❌ pgvector (vector) extension is NOT installed');
            console.log("Run: CREATE EXTENSION vector;");
        }
    } catch (err) {
        console.error('Error checking pgvector extension:', err.message);
        process.exit(1);
    }
    process.exit(0);
})();
