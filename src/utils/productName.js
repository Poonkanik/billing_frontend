/**
 * Get the localized product name based on the current language.
 * Falls back to the English name if no translation exists.
 *
 * @param {Object} product - Product object with name and localNames fields
 * @param {string} lang - Language code (e.g., 'ta', 'hi', 'te')
 * @returns {string} - The localized product name
 */
export function getProductName(product, lang) {
  if (!product) return '';
  if (!lang || lang === 'en') return product.name;

  // localNames can be a Map (from Mongoose) or a plain object
  const localNames = product.localNames;
  if (!localNames) return product.name;

  // Handle both Map and plain object
  const localName = typeof localNames.get === 'function'
    ? localNames.get(lang)
    : localNames[lang];

  return localName || product.name;
}
