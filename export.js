const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const archiver = require("archiver");

async function scrapeChat(url) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for chat content to load
    await page.waitForSelector("body");

    const data = await page.evaluate(() => {
        const elements = document.querySelectorAll("div");
        let text = "";

        elements.forEach(el => {
            const content = el.innerText;
            if (content && content.length > 20) {
                text += content + "\n\n";
            }
        });

        return text;
    });

    await browser.close();
    return data;
}

function buildClaudeProject(text) {
    fs.ensureDirSync("claude_project/context");

    fs.writeFileSync("claude_project/context/conversation.md", text);

    const summary = `# Summary\n\nAuto-generated Claude-ready context export.`;
    fs.writeFileSync("claude_project/context/summary.md", summary);

    const tasks = `# Tasks\n\n- Review conversation\n- Extract actionable items`;
    fs.writeFileSync("claude_project/context/tasks.md", tasks);

    const meta = {
        created: new Date().toISOString(),
        source: "ChatGPT Share Link",
    };

    fs.writeFileSync("claude_project/context/metadata.json", JSON.stringify(meta, null, 2));

    fs.writeFileSync(
        "claude_project/README.md",
        "# Claude Code Export\n\nGenerated from ChatGPT share link."
    );
}

function zipFolder() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream("claude-export.zip");
        const archive = archiver("zip");

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);
        archive.directory("claude_project/", false);
        archive.finalize();
    });
}

(async () => {
    const url = process.argv[2];

    if (!url) {
        console.log("Usage: node export.js <chatgpt-share-url>");
        process.exit(1);
    }

    console.log("Scraping chat...");
    const text = await scrapeChat(url);

    console.log("Building Claude project...");
    buildClaudeProject(text);

    console.log("Zipping...");
    await zipFolder();

    console.log("Done → claude-export.zip created");
})();