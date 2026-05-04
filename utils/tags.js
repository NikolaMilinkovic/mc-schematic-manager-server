function normalizeTags(rawTags) {
  const source = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === "string"
      ? rawTags.split(",")
      : [];

  const normalized = [];
  const seen = new Set();

  for (const value of source) {
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (!trimmed) continue;

    const normalizedKey = trimmed.toLowerCase();
    if (seen.has(normalizedKey)) continue;

    seen.add(normalizedKey);
    normalized.push(trimmed);
  }

  return normalized;
}

module.exports = {
  normalizeTags,
};
