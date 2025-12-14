import { environment } from '../../../environments/environment';

/**
 * Removes text between brackets (both square brackets [] and parentheses ())
 * @param text The text to process
 * @returns Text with bracket content removed
 */
function removeBracketContent(text: string): string {
  // Remove content in square brackets: [content]
  let result = text.replace(/\[[^\]]*\]/g, '');
  // Remove content in parentheses: (content)
  result = result.replace(/\([^)]*\)/g, '');
  return result;
}

/**
 * Removes artist separator text from the given text
 * @param text The text to process
 * @returns Text with separators removed
 */
function removeArtistSeparators(text: string): string {
  let result = text;
  const separators = environment.artistSeparators;

  // Sort separators by length (longest first) to avoid partial matches
  const sortedSeparators = [...separators].sort((a, b) => b.length - a.length);

  for (const separator of sortedSeparators) {
    // Escape special regex characters
    const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isWordSeparator = /^[a-zA-Z]+$/.test(separator);

    if (isWordSeparator) {
      // For word separators (feat, ft, featuring, and), use word boundaries
      // Allow optional spaces around the word
      const regex = new RegExp(`\\s*\\b${escaped}\\b\\s*`, 'gi');
      result = result.replace(regex, ' ');
    } else if (separator === ', ') {
      // Special handling for comma with space - also match comma with optional spaces
      const regex = /,\s*/g;
      result = result.replace(regex, ' ');
    } else {
      // For punctuation separators (&, /, \), match with optional spaces around them
      const regex = new RegExp(`\\s*${escaped}\\s*`, 'gi');
      result = result.replace(regex, ' ');
    }
  }

  return result;
}

/**
 * Removes remaster text patterns like "- 2016 Remaster" or "2016 Remaster"
 * @param text The text to process
 * @returns Text with remaster patterns removed
 */
function removeRemasterText(text: string): string {
  // Match patterns like:
  // - "- 2016 Remaster" or "-2016 Remaster"
  // - " 2016 Remaster" or "2016 Remaster"
  // - "2016 Remastered"
  // Handles optional dash, optional spaces, 4-digit year, optional spaces, and "Remaster" or "Remastered"
  const remasterPattern = /-?\s*\d{4}\s*(Remaster|Remastered)\b/gi;
  return text.replace(remasterPattern, '');
}

/**
 * Normalizes whitespace: collapses multiple spaces to single space and trims
 * @param text The text to normalize
 * @returns Text with normalized whitespace
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes text for title comparison
 * - Removes bracket content
 * - Removes remaster text (e.g., "- 2016 Remaster")
 * - Normalizes whitespace
 * - Converts to lowercase
 * @param text The text to normalize
 * @returns Normalized text for comparison
 */
export function normalizeTitleForComparison(text: string): string {
  let normalized = text;
  normalized = removeBracketContent(normalized);
  normalized = removeRemasterText(normalized);
  normalized = normalizeWhitespace(normalized);
  return normalized.toLowerCase();
}

/**
 * Normalizes text for artist comparison
 * - Removes bracket content
 * - Removes artist separators
 * - Normalizes whitespace
 * - Converts to lowercase
 * @param text The text to normalize
 * @returns Normalized text for comparison
 */
export function normalizeArtistForComparison(text: string): string {
  let normalized = text;
  normalized = removeBracketContent(normalized);
  normalized = removeArtistSeparators(normalized);
  normalized = normalizeWhitespace(normalized);
  return normalized.toLowerCase();
}

