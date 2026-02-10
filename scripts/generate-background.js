const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const outputPath = path.join(__dirname, '../public/background.mp4');

// Juneteenth Theme: Slow moving gradient of Red, Green, Gold on Black
// Using geq filter to create a procedural pattern
// r: 50 + 50*sin(...) -> Dark Red base
// g: 40 + 40*cos(...) -> Dark Green base
// b: 10 + 10*sin(...) -> faint Gold/Yellowish
// Keeping it dark (max ~100) to not overpower content

const ffmpegCommand = `ffmpeg -y -f lavfi -i color=c=black:s=1280x720 -t 15 -vf "geq=r='60+40*sin(X/300+T/2)':g='40+30*sin(Y/200+T/3)':b='10+10*sin((X+Y)/400+T)'" -pix_fmt yuv420p "${outputPath}"`;

console.log('Generating background video...');
console.log('Command:', ffmpegCommand);

exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error generating video: ${error.message}`);
        return;
    }
    if (stderr) {
        // FFmpeg writes progress to stderr
        console.log(`FFmpeg output: ${stderr.substring(0, 100)}...`);
    }
    console.log(`Background video generated at: ${outputPath}`);
});
