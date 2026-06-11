const Database = require('better-sqlite3');
const db = new Database('C:/Users/jetso/AppData/Local/ErsatzTV/ersatztv.sqlite3');

try {
    // 1. Insert ProgramScheduleItem (Flood type — loops continuously)
    console.log("=== Creating Flood Schedule Item ===");
    const stmt = db.prepare(`INSERT INTO ProgramScheduleItem 
        ("Index", ProgramScheduleId, PlaybackOrder, CollectionType, CollectionId, 
         GuideMode, FillWithGroupMode, MarathonGroupBy, MarathonShuffleGroups, 
         MarathonShuffleItems) 
        VALUES (0, 1, 2, 1, 1, 0, 0, 0, 0, 0)`);
    const result = stmt.run();
    const schedItemId = result.lastInsertRowid;
    console.log(`  Created schedule item ID: ${schedItemId}`);

    // 2. Register as flood item
    db.prepare("INSERT INTO ProgramScheduleFloodItem (Id) VALUES (?)").run(Number(schedItemId));
    console.log(`  Registered as flood item`);

    // 3. Create Playout linking Channel 1 to Schedule 1
    console.log("\n=== Creating Playout ===");
    const existing = db.prepare("SELECT * FROM Playout WHERE ChannelId = 1").get();
    if (!existing) {
        db.prepare(`INSERT INTO Playout (ChannelId, ProgramScheduleId, ScheduleKind, Seed) 
                     VALUES (1, 1, 0, ?)`).run(Math.floor(Math.random() * 100000));
        console.log("  Created playout for Channel 1");
    } else {
        db.prepare("UPDATE Playout SET ProgramScheduleId = 1 WHERE ChannelId = 1").run();
        console.log(`  Updated existing playout (ID: ${existing.Id})`);
    }

    console.log("\n═══════════════════════════════════════");
    console.log("✅ ErsatzTV fully configured!");
    console.log("═══════════════════════════════════════");
    console.log("\n18 videos in the 'JuneteenthTube All' collection");
    console.log("Flood schedule will loop them 24/7 on Channel 1");
    console.log("\nRestart ErsatzTV now to start broadcasting!");

} catch (err) {
    console.error("Error:", err.message);
} finally {
    db.close();
}
