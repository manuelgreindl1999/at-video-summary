const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const port = 3000;

// Variable to set in which frequency screenshots should be taken
const time_between_screenshots = 5;

// Destination for uploaded videos
const upload = multer({ dest: 'uploads/' });


// Starting page (display index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload route
app.post('/upload', upload.single('video'), (req, res) => {
  console.log('Video uploaded', req.file);

  // Folder for FFmpeg (input & output)
  const inputPath = req.file.path;
  const outputFolder = path.join(__dirname, 'screenshots');

  let responseSent = false;

  ffmpeg(inputPath)
    .on('end', () => {
      console.log('Screenshots created');
      if (!responseSent) {
        responseSent = true;
        res.send('Video uploaded and screenshots created');
      }
    })
    .on('error', (err) => {
      console.error('FFmpeg-Error:', err);
      if (!responseSent) {
        responseSent = true;
        res.status(500).send('Error while creating screenshots.');
      }
    })
    .screenshots({
      timestamps: ['00:00:01.000', '00:00:03.000', '00:00:05.000'],
      filename: 'shot-%03d.png',
      folder: outputFolder,
      size: '640x?'
    });
});

// Test-Route: send one screenshot to LLaVA
app.get('/describe-first-screenshot', async (req, res) => {
  try {
    const screenshotPath = path.join(__dirname, 'screenshots', 'shot-001_3.png');

    const imageBuffer = fs.readFileSync(screenshotPath);
    const imageBase64 = imageBuffer.toString('base64');

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: 'Describe this video frame in a concise sentence.',
        images: [imageBase64],
        stream: false
      })
    });

    const data = await response.json();
    res.send(`<pre>${data.response}</pre>`);
  } catch (err) {
    console.error('Error calling LLaVA:', err);
    res.status(500).send('Error calling LLaVA.');
  }
});

app.listen(port, () => {
    console.log('Server listening on http://localhost:' + port);
});