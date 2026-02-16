const base = 'http://localhost:3000';

async function check(path, opts = {}) {
    try {
        const res = await fetch(base + path, opts);
        const text = await res.text();
        let body;
        try { body = JSON.parse(text); } catch (e) { body = text; }
        console.log(`${opts.method || 'GET'} ${path} -> ${res.status}`);
        console.log(body);
    } catch (err) {
        console.error(`ERROR ${path}:`, err.message);
    }
}

(async () => {
    console.log('=== GET endpoints ===');
    await check('/api/control/performance');
    await check('/api/control/logs?limit=5');
    await check('/api/control/memory/analysis');
    await check('/api/control/personality');
    await check('/api/control/models');
    await check('/api/control/security');
    await check('/api/control/identity');
    await check('/api/control/emotions?days=7');
    await check('/api/control/concepts');

    console.log('\n=== POST actions (non-destructive) ===');
    await check('/api/control/performance/optimize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/performance/gc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/models/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/models/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4' }) });
    await check('/api/control/personality/evolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/personality/customize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/logs/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await check('/api/control/debug/db-inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });

    console.log('\n=== Personality PUT (customize) ===');
    await check('/api/control/personality', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ traits: { humor: 6.5, empathy: 7.0 } }) });

    console.log('\n=== Identity generate ===');
    await check('/api/control/identity/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'f9364170-b5d7-4239-affd-1eea6ad5dac2' }) });

    console.log('\nSmoke tests completed');
})();
