const elevenLabsBaseUrl = "https://api.elevenlabs.io/v1";

export async function validateElevenLabsKey(apiKey: string) {
  const response = await fetch(`${elevenLabsBaseUrl}/user/subscription`, {
    headers: { "xi-api-key": apiKey }
  });

  if (!response.ok) {
    return { valid: false, message: `ElevenLabs rejected the key (${response.status}).` };
  }

  const subscription = await response.json();
  return { valid: true, message: formatElevenLabsUsage(subscription) };
}

function formatElevenLabsUsage(subscription: {
  tier?: string;
  character_count?: number;
  character_limit?: number;
  max_credit_limit_extension?: number | "unlimited" | null;
}) {
  const tier = subscription.tier ? `${subscription.tier} plan` : "Plan active";
  const characterCount = subscription.character_count;
  const characterLimit = subscription.character_limit;
  const hasUsage = typeof characterCount === "number" && typeof characterLimit === "number";

  if (!hasUsage) {
    return `ElevenLabs key is valid. ${tier}.`;
  }

  const used = characterCount.toLocaleString();
  const limit = characterLimit.toLocaleString();
  const extension =
    subscription.max_credit_limit_extension === "unlimited"
      ? " Unlimited overage available."
      : typeof subscription.max_credit_limit_extension === "number" && subscription.max_credit_limit_extension > 0
        ? ` ${subscription.max_credit_limit_extension.toLocaleString()} extra credits available.`
        : "";

  return `ElevenLabs key is valid. ${tier}. Usage: ${used} / ${limit} characters.${extension}`;
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
