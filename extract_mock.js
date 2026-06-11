/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('git show HEAD~10:src/context/VideoContext.tsx', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const match = output.match(/const MOCK_VIDEOS: VideoProps\[\] = \[([\s\S]*?)\];/);
    if (match) {
        console.log('FOUND MOCK_VIDEOS:');
        console.log(match[0]);
        fs.writeFileSync('temp_mock_videos.txt', match[0]);
    } else {
        console.log('MOCK_VIDEOS array not found or empty in regex match');
        // Try to find it in older version if not found here
        const outputOld = execSync('git show HEAD~30:src/context/VideoContext.tsx', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        const matchOld = outputOld.match(/const MOCK_VIDEOS: VideoProps\[\] = \[([\s\S]*?)\];/);
        if (matchOld) {
            console.log('FOUND OLD MOCK_VIDEOS:');
            console.log(matchOld[0]);
            fs.writeFileSync('temp_mock_videos.txt', matchOld[0]);
        }
    }
} catch (e) {
    console.error(e);
}
