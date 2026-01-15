const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

async function createScreenshots(inputPath, intervalSec = 1) { //hier kann die Intervallzeit eingestellt werden
  const outputFolder = path.join(__dirname, '..', 'screenshots');
  await fs.promises.mkdir(outputFolder, { recursive: true });

  // 1. Videolänge
  const duration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });

  // 2. Timestamps 
  const timestamps = [];
  for (let t = 0; t < duration; t += intervalSec) {
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    timestamps.push(`00:${m}:${s}.000`);
  }

  // 3. Screenshots
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', () => {
        console.log(`Done! Created ${timestamps.length} screenshots.`);
        resolve(outputFolder);
      })
      .on('error', reject)
      .screenshots({
        timestamps,
        filename: 'shot-%04d.png',
        folder: outputFolder,
        size: '640x?'
      });
  });
}

module.exports = { createScreenshots };