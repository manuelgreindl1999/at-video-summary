const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function describeFirstScreenshot() {
  const screenshotPath = path.join(__dirname, '..', 'screenshots', 'shot-001_1.png');

  const imageBuffer = fs.readFileSync(screenshotPath);
  const imageBase64 = imageBuffer.toString('base64');

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llava',
      prompt: 'Describe what happens in this video frame very precisely. Explain what characters are on there and what they are doing',
      images: [imageBase64],
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response || '(no response field)';
}

module.exports = {
  describeFirstScreenshot,
};