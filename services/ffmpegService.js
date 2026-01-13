const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

async function createScreenshots(inputPath) {
  const outputFolder = path.join(__dirname, '..', 'screenshots');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', () => {
        console.log('Screenshots created');
        // Wir wissen hier noch nicht genau, wie viele – fürs Erste
        // geben wir nur das Verzeichnis zurück.
        // Hallo ich bin auch da
        resolve(outputFolder);
      })
      .on('error', (err) => {
        console.error('FFmpeg-Error:', err);
        reject(err);
      })
      .screenshots({
        timestamps: ['00:00:01.000', '00:00:03.000', '00:00:05.000'],
        filename: 'shot-%03d.png',
        folder: outputFolder,
        size: '640x?'
      });
  });
}

module.exports = {
  createScreenshots,
};