const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));




module.exports = {
  
  /**
   * Beschreibt alle Screenshots im Screenshots-Ordner und gibt ein Array mit Beschreibungen zurück
   * in der gleichen Reihenfolge wie die sortierten Dateinamen.
   * Dies ruft die lokale LLama-ähnliche API nacheinander einmal pro Bild auf.
   * @returns {Promise<string[]>}
   */
  
  async describeAllScreenshots() {
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');

    if (!fs.existsSync(screenshotsDir)) {
      throw new Error('Screenshots-Verzeichnis existiert nicht');
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
      throw new Error('Keine Screenshots zum Beschreiben gefunden');
    }

    const descriptions = [];

    // Nacheinander beschreiben um die lokale API nicht zu überlasten
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
        const text = data.response || (Array.isArray(data.responses) && data.responses[0]) || '(keine Antwort)';
        descriptions.push(text);
      } catch (err) {
        descriptions.push(`(Fehler beim Beschreiben von ${f}: ${err.message})`);
      }
    }

    return descriptions;
  }
};
