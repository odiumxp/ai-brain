const { query } = require('../src/db/connection');

(async () => {
    try {
        const res = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
        const tables = res.rows.map(r => r.tablename);
        for (const t of tables) {
            const c = await query(`SELECT COUNT(*)::int AS cnt FROM "${t}"`);
            console.log(`${t}: ${c.rows[0].cnt}`);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking table counts:', err);
        process.exit(1);
    }
})();
