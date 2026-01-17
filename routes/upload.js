const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createScreenshots } = require('../services/ffmpegService');
const { describeFirstScreenshot } = require('../services/visionService');

const router = express.Router();

// Multer-Configuration (Upload-Destination)
const upload = multer({ dest: 'uploads/' });

// Option to automatically clear screenshots after processing.
// Enable by setting the environment variable CLEAN_SCREENSHOTS=true
const CLEAN_SCREENSHOTS = process.env.CLEAN_SCREENSHOTS === 'true';

function cleanupScreenshots(screenshotsDir) {
  try {
    if (!fs.existsSync(screenshotsDir)) return;
    const files = fs.readdirSync(screenshotsDir);
    files.forEach((f) => {
      if (/^shot-\d+(?:_\d+)?\.png$/.test(f)) {
        try {
          fs.unlinkSync(path.join(screenshotsDir, f));
        } catch (e) {
          console.error('Failed to remove screenshot', f, e);
        }
      }
    });
  } catch (e) {
    console.error('Error cleaning screenshots folder:', e);
  }
}

router.post('/upload', upload.single('video'), async (req, res) => {
  console.log('Video uploaded', req.file);

  const inputPath = req.file && req.file.path;

  try {
    await createScreenshots(inputPath);
    const description = await describeFirstScreenshot(); // ggf. Modellname anpassen

    res.send(`
      <h1>Video summary (single frame)</h1>
      <p>${description}</p>
      <a href="/">Back to upload</a>
    `);
  } catch (err) {
    console.error('Error during processing:', err);
    res.status(500).send('Error during video processing.');
  } finally {
    if (CLEAN_SCREENSHOTS) {
      const screenshotsDir = path.join(__dirname, '..', 'screenshots');
      cleanupScreenshots(screenshotsDir);
    }
  }
});

module.exports = router;