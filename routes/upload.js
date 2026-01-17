const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createScreenshots } = require('../services/ffmpegService');
const { describeAllScreenshots } = require('../services/visionService');
const { summarizeDescriptions } = require('../services/summarizerService');

const router = express.Router();

// Multer-Configuration (Upload-Destination)
const upload = multer({ dest: 'uploads/' });

// Option to automatically clear screenshots after processing.
// Enable by setting the environment variable CLEAN_SCREENSHOTS=true
const CLEAN_SCREENSHOTS = 'true';

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

function cleanupUploads(uploadsDir) {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const files = fs.readdirSync(uploadsDir);
    files.forEach((f) => {
      try {
        const fullPath = path.join(uploadsDir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          fs.unlinkSync(fullPath);
        } else if (stat.isDirectory()) {
          // Recursively delete directories
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      } catch (e) {
        console.error('Failed to remove upload file/folder', f, e);
      }
    });
  } catch (e) {
    console.error('Error cleaning uploads folder:', e);
  }
}

function cleanupDescriptions(descriptionsDir) {
  try {
    if (!fs.existsSync(descriptionsDir)) return;
    const files = fs.readdirSync(descriptionsDir);
    files.forEach((f) => {
      if (/^desc-frame-\d+\.txt$/.test(f) || /^summary-\d+\.txt$/.test(f)) {
        try {
          fs.unlinkSync(path.join(descriptionsDir, f));
        } catch (e) {
          console.error('Failed to remove description file', f, e);
        }
      }
    });
  } catch (e) {
    console.error('Error cleaning descriptions folder:', e);
  }
}

router.post('/upload', upload.single('video'), async (req, res) => {
  console.log('Video uploaded', req.file);

  const inputPath = req.file && req.file.path;

  try {
    await createScreenshots(inputPath);

    // Describe all screenshots
    const descriptions = await describeAllScreenshots();

    // Ensure descriptions folder exists and save per-frame descriptions
    const descriptionsDir = path.join(__dirname, '..', 'descriptions');
    fs.mkdirSync(descriptionsDir, { recursive: true });

    const savedFiles = [];
    for (let i = 0; i < descriptions.length; i++) {
      const name = `desc-frame-${String(i + 1).padStart(3, '0')}.txt`;
      const p = path.join(descriptionsDir, name);
      try {
        fs.writeFileSync(p, descriptions[i], 'utf8');
        savedFiles.push(p);
      } catch (e) {
        console.error('Failed to save description', p, e);
      }
    }

    // Summarize all descriptions using the summarizer service
    const summary = await summarizeDescriptions(descriptions);

    // Save the final summary as well
    const summaryPath = path.join(descriptionsDir, `summary-${Date.now()}.txt`);
    try {
      fs.writeFileSync(summaryPath, summary, 'utf8');
      savedFiles.push(summaryPath);
    } catch (e) {
      console.error('Failed to save summary', summaryPath, e);
    }

    // Render results
    const listItems = descriptions.map((d, i) => `<li><strong>Frame ${i + 1}:</strong> ${d}</li>`).join('\n');
    res.send(`
      <h1>Video summary</h1>
      <h2>Concise summary</h2>
      <p>${summary}</p>
      <h2>Frame descriptions</h2>
      <ul>
        ${listItems}
      </ul>
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