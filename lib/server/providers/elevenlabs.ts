const elevenLabsBaseUrl = "https://api.elevenlabs.io/v1";

export async function validateElevenLabsKey(apiKey: string) {
  const response = await fetch(`${elevenLabsBaseUrl}/user`, {
    headers: { "xi-api-key": apiKey }
  });

  if (!response.ok) {
    return { valid: false, message: `ElevenLabs rejected the key (${response.status}).` };
  }

  return { valid: true, message: "ElevenLabs key is valid." };
}

export async function generateMusicTrack({
  apiKey,
  prompt,
  durationSeconds = 180
}: {
  apiKey: string;
  prompt: string;
  durationSeconds?: number;
}) {
  const response = await fetch(`${elevenLabsBaseUrl}/music`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: Math.round(durationSeconds * 1000)
    })
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs music generation failed (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}
