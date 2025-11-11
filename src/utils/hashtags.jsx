import React from 'react';

export function extractTags(text) {
    if (!text) return [];
    const matches = text.match(/#[\w]+/g);
    if (!matches) return [];
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

const HASHTAG_REGEX = /#[\w\u0590-\u05FF]+/g;

/**
 * Extracts unique hashtags with the '#' prefix for the form preview.
 * @param {string} text
 * @returns {string[]}
 */
export const extractHashtagsForPreview = (text) => {
  if (!text) return [];
  const matches = text.match(HASHTAG_REGEX);
  return matches ? [...new Set(matches)] : [];
};

/**
 * Renders text with hashtags wrapped in <strong> tags for React.
 * This splits the text into an array of strings and React elements.
 * @param {string} text
 * @returns {Array<string | React.ReactElement>}
 */
export const renderTextWithHashtags = (text) => {
  if (!text) return null;

  const parts = text.split(HASHTAG_REGEX);
  const matches = text.match(HASHTAG_REGEX) || [];

  const result = [];
  
  parts.forEach((part, index) => {
    if (part) {
        result.push(part);
    }
    const tag = matches[index];
    if (tag) {
        result.push(
            <strong key={`tag-${index}`} className="font-bold text-indigo-600 dark:text-indigo-400">
                {tag}
            </strong>
        );
    }
  });

  return result;
};