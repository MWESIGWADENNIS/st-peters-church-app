/**
 * Utility to parse strings like "John 3:16" or "Genesis 1"
 * and return components for deep linking to the Bible page.
 */
export const parseBibleReference = (ref: string) => {
  if (!ref) return null;
  
  // Basic regex to extract book name and chapter
  // Pattern: (Book Name) (Chapter)(:)(Verse-range)
  // We mainly care about Book and Chapter for our current Bible implementation
  const regex = /^([\d\s]*[a-zA-Z\s]+)\s+(\d+)/;
  const match = ref.match(regex);
  
  if (match) {
    return {
      book: match[1].trim(),
      chapter: match[2].trim()
    };
  }
  
  return null;
};

export const getBibleLink = (ref: string) => {
  const parsed = parseBibleReference(ref);
  if (parsed) {
    return `/bible?b=${encodeURIComponent(parsed.book)}&c=${encodeURIComponent(parsed.chapter)}`;
  }
  return '/bible';
};
