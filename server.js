const express = require('express');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

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

app.listen(port, () => {
    console.log('Server listening on http://localhost:' + port);
});