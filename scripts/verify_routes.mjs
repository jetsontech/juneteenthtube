// using native fetch

async function verifyRoutes() {
    const routes = [
        '/',
        '/shorts',
        '/freedom-map',
        '/vault',
        '/research',
        '/gallery',
        '/photos',
        '/georgia-united',
        '/subscriptions',
        '/you',
        '/history',
        '/studio',
        '/admin',
        '/live'
    ];

    const baseUrl = 'http://localhost:3000';
    console.log(`Checking ${routes.length} routes at ${baseUrl}...`);

    for (const route of routes) {
        try {
            const res = await fetch(`${baseUrl}${route}`, { method: 'GET' });
            console.log(`  [${res.status}] ${route}`);
        } catch (err) {
            console.log(`  [ERROR] ${route}: ${err.message}`);
        }
    }
}

verifyRoutes().catch(console.error);
