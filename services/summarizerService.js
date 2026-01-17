const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Summarize an array of descriptions into a concise paragraph using the local Ollama API.
 * @param {string[]} descriptions
 * @returns {Promise<string>} summary
 */
async function summarizeDescriptions(descriptions) {
  if (!Array.isArray(descriptions) || descriptions.length === 0) {
    return '(no descriptions to summarize)';
  }

  const prompt = `You are given multiple short descriptions of video frames, separated by "---".\n` +
    `Combine these into a concise 2-3 sentence summary of the overall scene and action. Be factual and neutral.\n\n` +
    descriptions.map((d, i) => `Frame ${i + 1}: ${d}`).join('\n---\n');

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();
    if (data.response) return data.response;
    if (Array.isArray(data.responses) && data.responses.length > 0) return data.responses[0];
    return '(no summary returned)';
  } catch (err) {
    console.error('Summarizer error:', err);
    return `(error summarizing descriptions: ${err.message})`;
  }
}

module.exports = { summarizeDescriptions };