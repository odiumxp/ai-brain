const base = 'http://localhost:3000';
const actions = [
    // GET endpoints
    { method: 'GET', path: '/api/control/performance' },
    { method: 'GET', path: '/api/control/logs?limit=5' },
    { method: 'GET', path: '/api/control/memory/analysis' },
    { method: 'GET', path: '/api/control/personality' },
    { method: 'GET', path: '/api/control/models' },
    { method: 'GET', path: '/api/control/security' },
    { method: 'GET', path: '/api/control/identity' },
    { method: 'GET', path: '/api/control/emotions?days=7' },
    { method: 'GET', path: '/api/control/concepts' },

    // POST actions (safe + destructive)
    { method: 'POST', path: '/api/control/performance/optimize', body: {} },
    { method: 'POST', path: '/api/control/performance/gc', body: {} },
    { method: 'POST', path: '/api/control/performance/profile', body: {} },
    { method: 'POST', path: '/api/control/performance/reset-metrics', body: {} },

    { method: 'POST', path: '/api/control/models/test', body: {} },
    { method: 'POST', path: '/api/control/models/switch', body: { model: 'gpt-4' } },
    { method: 'POST', path: '/api/control/models/reset-stats', body: {} },

    { method: 'POST', path: '/api/control/memory/consolidate', body: {} },
    { method: 'POST', path: '/api/control/memory/cleanup', body: {} },
    { method: 'POST', path: '/api/control/memory/optimize', body: {} },
    { method: 'POST', path: '/api/control/memory/clear-cache', body: {} },
    { method: 'POST', path: '/api/control/memory/reset', body: {} },

    { method: 'POST', path: '/api/control/personality/evolve', body: {} },
    { method: 'POST', path: '/api/control/personality/reset', body: {} },
    { method: 'POST', path: '/api/control/personality/customize', body: {} },
    { method: 'POST', path: '/api/control/personality/toggle-persona', body: { id: '11193089-92ac-43b5-a953-5242ce45f72f' } },

    { method: 'POST', path: '/api/control/security/audit', body: {} },
    { method: 'POST', path: '/api/control/security/rotate-key', body: { id: 1 } },
    { method: 'POST', path: '/api/control/security/rotate-all', body: {} },
    { method: 'POST', path: '/api/control/security/lockdown', body: {} },
    { method: 'POST', path: '/api/control/security/reset', body: {} },

    { method: 'POST', path: '/api/control/logs/export', body: {} },
    { method: 'POST', path: '/api/control/logs/clear', body: {} },
    { method: 'POST', path: '/api/control/logs/archive', body: {} },

    { method: 'POST', path: '/api/control/backup/create', body: {} },
    { method: 'POST', path: '/api/control/backup/list', body: {} },
    { method: 'POST', path: '/api/control/backup/verify', body: {} },
    { method: 'POST', path: '/api/control/backup/cleanup', body: {} },
    { method: 'POST', path: '/api/control/backup/restore', body: { type: 'memory' } },

    { method: 'POST', path: '/api/control/debug/test-api', body: {} },
    { method: 'POST', path: '/api/control/debug/memory-inspect', body: {} },
    { method: 'POST', path: '/api/control/debug/profile', body: {} },
    { method: 'POST', path: '/api/control/debug/db-inspect', body: {} },
    { method: 'POST', path: '/api/control/debug/enable-verbose', body: {} },
    { method: 'POST', path: '/api/control/debug/reset', body: {} },
    { method: 'POST', path: '/api/control/debug/clear-all', body: {} },

    { method: 'POST', path: '/api/control/maintenance/run-daily', body: {} },
    { method: 'POST', path: '/api/control/maintenance/run-weekly', body: {} },
    { method: 'POST', path: '/api/control/maintenance/run-monthly', body: {} },
    { method: 'POST', path: '/api/control/maintenance/full-checkup', body: {} },
    { method: 'POST', path: '/api/control/maintenance/defragment', body: {} },
    { method: 'POST', path: '/api/control/maintenance/repair', body: {} },
    { method: 'POST', path: '/api/control/maintenance/vacuum', body: {} },
    { method: 'POST', path: '/api/control/maintenance/emergency-repair', body: {} },

    { method: 'POST', path: '/api/control/analytics/generate-report', body: {} },
    { method: 'POST', path: '/api/control/analytics/export-data', body: {} },
    { method: 'POST', path: '/api/control/analytics/schedule-report', body: {} },

    { method: 'POST', path: '/api/control/network/test-connectivity', body: {} },
    { method: 'POST', path: '/api/control/network/ping', body: {} },
    { method: 'POST', path: '/api/control/network/reset-connections', body: {} },
    { method: 'POST', path: '/api/control/network/firewall-check', body: {} },

    // destructive: reset database
    { method: 'POST', path: '/api/control/data/reset-database', body: {} },
];

(async () => {
    for (const a of actions) {
        try {
            const url = base + a.path;
            const opts = { method: a.method };
            if (a.method !== 'GET') {
                opts.headers = { 'Content-Type': 'application/json' };
                opts.body = JSON.stringify(a.body || {});
            }
            const res = await fetch(url, opts);
            const text = await res.text();
            let body;
            try { body = JSON.parse(text); } catch (e) { body = text; }
            console.log(`${a.method} ${a.path} -> ${res.status}`);
            console.log(body);
        } catch (err) {
            console.error(`ERROR ${a.method} ${a.path}:`, err.message);
        }
    }
    console.log('Exhaustive control panel actions completed');
})();
