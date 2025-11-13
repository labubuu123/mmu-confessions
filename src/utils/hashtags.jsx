import React from 'react';
import { Link } from 'react-router-dom';

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
 * --- MODIFIED: Renders text with clickable hashtags ---
 * Renders text with hashtags wrapped in <Link> tags for React.
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
        result.push(<span key={`text-${index}`}>{part}</span>);
    }
    const tag = matches[index];
    if (tag) {
        const tagName = tag.slice(1).toLowerCase();
        result.push(
            <Link
                key={`tag-${index}`}
                to={`/search?tag=${tagName}`}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
            >
                {tag}
            </Link>
        );
    }
  });

  return result;
};