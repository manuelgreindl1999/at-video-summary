const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createScreenshots } = require('../services/ffmpegService');
const { describeAllScreenshots } = require('../services/visionService');
const { summarizeDescriptions } = require('../services/summarizerService');

const router = express.Router();

// Multer-Konfiguration (Upload-Ziel)
const upload = multer({ dest: 'uploads/' });

// Option zum automatischen Löschen von Screenshots nach der Verarbeitung.
// Aktivierung durch Setzen der Umgebungsvariable CLEAN_SCREENSHOTS=true
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
// Löscht alle Dateien im Uploads-Verzeichnis
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
          // Rekursiv Verzeichnisse löschen
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
// Löscht alle Beschreibungs-Textdateien im Beschreibungs-Verzeichnis
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

    // Alle Screenshots beschreiben
    const descriptions = await describeAllScreenshots();

    // Sicherstellen, dass der descriptions Ordner existiert und per-frame descriptions speichern
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
        console.error('Beschreibung konnte nicht gespeichert werden', p, e);
      }
    }

    // Alle Beschreibungen mit dem summarizerService zusammenfassen
    const summary = await summarizeDescriptions(descriptions);

    // Speichern der endgültigen Zusammenfassung
    const summaryPath = path.join(descriptionsDir, `summary-${Date.now()}.txt`);
    try {
      fs.writeFileSync(summaryPath, summary, 'utf8');
      savedFiles.push(summaryPath);
    } catch (e) {
      console.error('Zusammenfassung konnte nicht gespeichert werden', summaryPath, e);
    }

    // Ergebnisse rendern
    const listItems = descriptions.map((d, i) => `<li><strong>Frame ${i + 1}:</strong> ${d}</li>`).join('\n');
    res.send(`
      <h1>Video-Zusammenfassung</h1>
      <h2>Kurze Zusammenfassung</h2>
      <p>${summary}</p>
      <h2>Bildbeschreibungen</h2>
      <ul>
        ${listItems}
      </ul>
      <a href="/">Zurück zum Upload</a>
    `);
  } catch (err) {
    console.error('Fehler bei der Verarbeitung:', err);
    res.status(500).send('Fehler bei der Videoverarbeitung.');
  } finally {
    if (CLEAN_SCREENSHOTS) {
      const screenshotsDir = path.join(__dirname, '..', 'screenshots');
      cleanupScreenshots(screenshotsDir);
    }
  }
});

module.exports = router;