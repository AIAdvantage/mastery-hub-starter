export function normalizePromptContext(content = {}) {
  return {
    prompts: Array.isArray(content?.prompts) ? content.prompts : [],
    challengePrompt: typeof content?.challengePrompt === "string" ? content.challengePrompt : "",
  };
}

export function parsePromptControlMarker(line = "") {
  const trimmed = String(line).trim();
  const promptMatch = trimmed.match(/^\[\[copy-prompt:([A-Za-z0-9]+)\]\]$/);
  if (promptMatch) return { type: "copy-prompt", prompt: promptMatch[1] };
  if (trimmed === "[[copy-challenge-prompt]]") return { type: "copy-challenge-prompt" };
  return null;
}

export function resolvePromptControl(control = {}, content = {}) {
  const promptContext = normalizePromptContext(content);

  if (control.type === "copy-challenge-prompt") {
    const text = promptContext.challengePrompt.trim();
    return text ? { title: "Challenge prompt", text } : null;
  }

  if (control.type !== "copy-prompt") return null;
  const promptNumber = String(control.prompt || "");
  return promptContext.prompts.find((prompt) => {
    const title = String(prompt?.title || "");
    return title.startsWith(`Prompt ${promptNumber}:`) || title.startsWith(`Prompt ${promptNumber} (`);
  }) || null;
}
