// Cyrillic to Latin transliteration map
const cyrillicMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO',
  'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
};

/**
 * Transliterates Cyrillic characters to Latin
 */
function transliterateCyrillic(str: string): string {
  return str.split('').map(char => cyrillicMap[char] || char).join('');
}

/**
 * Generates a slug from a given string
 * @param input - The string to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 100)
 * @returns A URL-friendly slug
 */
export function generateSlug(input: string, maxLength = 100): string {
  if (!input) return '';

  // Transliterate Cyrillic to Latin
  let slug = transliterateCyrillic(input);

  // Convert to lowercase
  slug = slug.toLowerCase();

  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');

  // Remove special characters (keep only alphanumeric, hyphens)
  slug = slug.replace(/[^a-z0-9\-]/g, '');

  // Remove consecutive hyphens
  slug = slug.replace(/-{2,}/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Truncate to maxLength
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Ensure we don't end with a hyphen after truncation
    slug = slug.replace(/-+$/, '');
  }

  return slug;
}
