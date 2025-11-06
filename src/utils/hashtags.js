export function extractTags(text) {
    if (!text) return [];
    const matches = text.match(/#[\w]+/g);
    if (!matches) return [];
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}