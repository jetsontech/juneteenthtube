const Database = require('better-sqlite3');

// Stop ErsatzTV first to avoid database locks
// Then run this script, then restart ErsatzTV

const db = new Database('C:/Users/jetso/AppData/Local/ErsatzTV/ersatztv.sqlite3');

try {
    // 1. Check what movies we have
    const movies = db.prepare("SELECT m.Id, mm.Title, mv.Duration FROM Movie m JOIN MovieMetadata mm ON mm.MovieId = m.Id JOIN MediaVersion mv ON mv.MovieId = m.Id").all();
    console.log("=== Found Movies ===");
    movies.forEach(m => console.log(`  Movie ${m.Id}: "${m.Title}" (${m.Duration})`));

    if (movies.length === 0) {
        console.log("No movies found! Make sure ErsatzTV has scanned the library.");
        process.exit(1);
    }

    // 2. Create a Collection named "JuneteenthTube All"
    console.log("\n=== Creating Collection ===");
    const insertCollection = db.prepare("INSERT INTO Collection (Name, UseCustomPlaybackOrder) VALUES (?, 0)");
    const collResult = insertCollection.run("JuneteenthTube All");
    const collectionId = collResult.lastInsertRowid;
    console.log(`  Created Collection ID: ${collectionId}`);

    // 3. Add all movies to the collection via CollectionItem
    //    CollectionItem links MediaItem to Collection
    const mediaItems = db.prepare("SELECT Id FROM MediaItem").all();
    console.log(`  Found ${mediaItems.length} media items`);

    const insertCollItem = db.prepare("INSERT INTO CollectionItem (CollectionId, MediaItemId, CustomIndex) VALUES (?, ?, ?)");
    mediaItems.forEach((item, idx) => {
        insertCollItem.run(Number(collectionId), item.Id, idx);
        console.log(`  Added MediaItem ${item.Id} to Collection`);
    });

    // 4. Get (or confirm) the ProgramSchedule
    let schedule = db.prepare("SELECT * FROM ProgramSchedule LIMIT 1").get();
    if (!schedule) {
        console.log("\n=== Creating ProgramSchedule ===");
        const insertSchedule = db.prepare("INSERT INTO ProgramSchedule (Name, RandomStartPoint, ShuffleScheduleItems, KeepMultiPartEpisodesTogether, TreatCollectionsAsShows, FixedStartTimeBehavior) VALUES (?, 0, 1, 0, 0, 0)");
        const schedResult = insertSchedule.run("JuneteenthTube 24/7");
        schedule = { Id: schedResult.lastInsertRowid, Name: "JuneteenthTube 24/7" };
    }
    console.log(`\n=== Using Schedule: "${schedule.Name}" (ID: ${schedule.Id}) ===`);

    // 5. Add a ProgramScheduleFloodItem (floods/loops the collection continuously)
    console.log("\n=== Creating Schedule Item (Flood/Loop) ===");
    const insertSchedItem = db.prepare("INSERT INTO ProgramScheduleItem (Index_, ProgramScheduleId, PlaybackOrder, CollectionType, CollectionId, PlayAll, GuideMode, GuideGroup, Discriminator, PreRollFillerId, MidRollFillerId, PostRollFillerId, TailFillerId, FallbackFillerId, WatermarkId, PreferredAudioLanguageCode, PreferredAudioTitle, PreferredSubtitleLanguageCode, SubtitleMode, FillWithGroupMode, DefaultFillerId, GuideGroupingKey, MultiCollectionId, SmartCollectionId, PlaylistId, TraktListItemId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL)");
    insertSchedItem.run(0, schedule.Id, 2, 1, Number(collectionId), 0, 0, 0, "ProgramScheduleFloodItem");
    console.log("  Created flood schedule item");

    // 6. Also insert into ProgramScheduleFloodItem
    const floodItems = db.prepare("SELECT Id FROM ProgramScheduleItem WHERE Discriminator = 'ProgramScheduleFloodItem' ORDER BY Id DESC LIMIT 1").get();
    if (floodItems) {
        db.prepare("INSERT INTO ProgramScheduleFloodItem (Id) VALUES (?)").run(floodItems.Id);
        console.log(`  Registered flood item ID: ${floodItems.Id}`);
    }

    // 7. Create a Playout linking Channel 1 to this Schedule
    console.log("\n=== Creating Playout ===");
    const existingPlayout = db.prepare("SELECT * FROM Playout WHERE ChannelId = 1").get();
    if (!existingPlayout) {
        const insertPlayout = db.prepare("INSERT INTO Playout (ChannelId, ProgramScheduleId, Seed, DailyRebuildTime) VALUES (?, ?, ?, NULL)");
        const playoutResult = insertPlayout.run(1, schedule.Id, Math.floor(Math.random() * 100000));
        console.log(`  Created Playout ID: ${playoutResult.lastInsertRowid}`);
    } else {
        console.log(`  Playout already exists (ID: ${existingPlayout.Id}), updating schedule...`);
        db.prepare("UPDATE Playout SET ProgramScheduleId = ? WHERE Id = ?").run(schedule.Id, existingPlayout.Id);
    }

    console.log("\n═══════════════════════════════════════");
    console.log("✅ ErsatzTV configured successfully!");
    console.log("═══════════════════════════════════════");
    console.log("\nRestart ErsatzTV to apply changes.");
    console.log("The channel will now loop through all your videos 24/7.");

} catch (err) {
    console.error("Error:", err.message);
    console.error(err.stack);
} finally {
    db.close();
}
