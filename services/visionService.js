const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Describe the first available screenshot. If the hardcoded file doesn't exist,
 * this searches for files matching shot-*.png (including variants with _n) and
 * uses the first one found.
 */
async function describeFirstScreenshot() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');

  // Prefer this legacy path if present
  const legacyPath = path.join(screenshotsDir, 'shot-001_1.png');
  let screenshotPath = null;

  if (fs.existsSync(legacyPath)) {
    screenshotPath = legacyPath;
  } else if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir)
      .filter(f => /^shot-\d+(?:_\d+)?\.png$/.test(f))
      .sort((a, b) => {
        const ma = a.match(/^shot-(\d+)(?:_(\d+))?\.png$/);
        const mb = b.match(/^shot-(\d+)(?:_(\d+))?\.png$/);
        const na = ma ? parseInt(ma[1], 10) : 0;
        const nb = mb ? parseInt(mb[1], 10) : 0;
        if (na !== nb) return na - nb;
        const sa = ma && ma[2] ? parseInt(ma[2], 10) : 0;
        const sb = mb && mb[2] ? parseInt(mb[2], 10) : 0;
        return sa - sb;
      });

    if (files.length > 0) {
      screenshotPath = path.join(screenshotsDir, files[0]);
    }
  }

  if (!screenshotPath) {
    throw new Error('No screenshot found to describe');
  }

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
  /**
   * Describe all screenshots found in screenshots/ and return an array of descriptions
   * in the same order as the sorted filenames.
   * This calls the local LLama-like API once per image (sequentially).
   * @returns {Promise<string[]>}
   */
  async describeAllScreenshots() {
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
      throw new Error('Screenshots directory does not exist');
    }

    const files = fs.readdirSync(screenshotsDir)
      .filter(f => /^shot-\d+(?:_\d+)?\.png$/.test(f))
      .sort((a, b) => {
        const ma = a.match(/^shot-(\d+)(?:_(\d+))?\.png$/);
        const mb = b.match(/^shot-(\d+)(?:_(\d+))?\.png$/);
        const na = ma ? parseInt(ma[1], 10) : 0;
        const nb = mb ? parseInt(mb[1], 10) : 0;
        if (na !== nb) return na - nb;
        const sa = ma && ma[2] ? parseInt(ma[2], 10) : 0;
        const sb = mb && mb[2] ? parseInt(mb[2], 10) : 0;
        return sa - sb;
      });

    if (files.length === 0) {
      throw new Error('No screenshots found to describe');
    }

    const descriptions = [];

    // Describe sequentially to avoid overloading local API
    for (const f of files) {
      const p = path.join(screenshotsDir, f);
      const imageBuffer = fs.readFileSync(p);
      const imageBase64 = imageBuffer.toString('base64');

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llava',
            prompt: `Describe this video frame concisely. Include objects, characters and actions. Filename: ${f}`,
            images: [imageBase64],
            stream: false,
          }),
        });

        const data = await response.json();
        const text = data.response || (Array.isArray(data.responses) && data.responses[0]) || '(no response)';
        descriptions.push(text);
      } catch (err) {
        descriptions.push(`(error describing ${f}: ${err.message})`);
      }
    }

    return descriptions;
  }
};
