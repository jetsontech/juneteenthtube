const Database = require('better-sqlite3');
const db = new Database('C:/Users/jetso/AppData/Local/ErsatzTV/ersatztv.sqlite3', { readonly: true });

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('=== All Tables ===');
tables.forEach(t => console.log(t.name));

console.log('\n=== Channels ===');
try { console.log(JSON.stringify(db.prepare("SELECT * FROM Channel").all(), null, 2)); } catch (e) { console.log(e.message); }

console.log('\n=== Relevant Tables (media/source/library/collection/schedule) ===');
const relevant = tables.map(t => t.name).filter(n => {
    const l = n.toLowerCase();
    return l.includes('media') || l.includes('source') || l.includes('library') || l.includes('collection') || l.includes('schedule') || l.includes('playout') || l.includes('movie') || l.includes('other');
});
relevant.forEach(name => {
    try {
        const rows = db.prepare("SELECT * FROM \"" + name + "\" LIMIT 3").all();
        console.log("\n--- " + name + " (" + rows.length + " rows) ---");
        if (rows.length > 0) console.log(JSON.stringify(rows[0], null, 2));
    } catch (e) { console.log(name + ": " + e.message); }
});

db.close();
