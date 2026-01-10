const express = require('express');
const multer = require('multer');
const path = require('path');

const { createScreenshots } = require('../services/ffmpegService');
const { describeFirstScreenshot } = require('../services/visionService');

const router = express.Router();

// Multer-Configuration (Upload-Destination)
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('video'), async (req, res) => {
  console.log('Video uploaded', req.file);

  const inputPath = req.file.path;

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
  }
});

module.exports = router;