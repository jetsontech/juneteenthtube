const Database = require('better-sqlite3');
const db = new Database('C:/Users/jetso/AppData/Local/ErsatzTV/ersatztv.sqlite3');

try {
    // Check ProgramScheduleItem schema
    const cols = db.prepare("PRAGMA table_info(ProgramScheduleItem)").all();
    console.log("=== ProgramScheduleItem Columns ===");
    cols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''} ${c.dflt_value ? 'DEFAULT ' + c.dflt_value : ''}`));

    console.log("\n=== ProgramScheduleFloodItem Columns ===");
    const floodCols = db.prepare("PRAGMA table_info(ProgramScheduleFloodItem)").all();
    floodCols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''}`));

    console.log("\n=== Playout Columns ===");
    const playoutCols = db.prepare("PRAGMA table_info(Playout)").all();
    playoutCols.forEach(c => console.log(`  ${c.name} (${c.type}) ${c.notnull ? 'NOT NULL' : ''} ${c.dflt_value ? 'DEFAULT ' + c.dflt_value : ''}`));

    // Verify collection exists
    const coll = db.prepare("SELECT * FROM Collection").all();
    console.log("\n=== Collections ===");
    console.log(JSON.stringify(coll));

    // Check if we already have items
    const items = db.prepare("SELECT COUNT(*) as cnt FROM CollectionItem").get();
    console.log(`\nCollectionItems: ${items.cnt}`);

} catch (err) {
    console.error("Error:", err.message);
} finally {
    db.close();
}
