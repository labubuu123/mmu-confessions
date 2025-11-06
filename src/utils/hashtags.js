export function extractTags(text) {
    if (!text) return []
    const tags = Array.from(new Set((text.match(/#\w+/g) || []).map(t => t.slice(1).toLowerCase())))
    return tags
}
