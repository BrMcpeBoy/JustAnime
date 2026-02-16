/**
 * Converts Arabic numerals (0-9) to Khmer numerals (០-៩)
 * @param {number|string} num - The number to convert
 * @returns {string} - The converted number string
 */
export const toKhmerNumeral = (num) => {
  if (num === null || num === undefined || num === '') return '';
  
  const khmerNumerals = {
    '0': '០',
    '1': '១',
    '2': '២',
    '3': '៣',
    '4': '៤',
    '5': '៥',
    '6': '៦',
    '7': '៧',
    '8': '៨',
    '9': '៩'
  };
  
  return String(num).replace(/[0-9]/g, (digit) => khmerNumerals[digit]);
};

/**
 * Formats a number based on the current language
 * @param {number|string} num - The number to format
 * @param {string} language - The current language ('en' or 'km')
 * @returns {string} - The formatted number
 */
export const formatNumber = (num, language) => {
  // Handle null, undefined, or empty string
  if (num === null || num === undefined || num === '') return '';
  
  // Handle objects, arrays, or other non-primitive types
  if (typeof num === 'object') {
    console.warn('formatNumber received object:', num);
    return '';
  }
  
  // Convert to string safely
  const numStr = String(num);
  
  // Accept both 'km' and 'kh' for backward compatibility
  if (language === 'km' || language === 'kh') {
    return toKhmerNumeral(numStr);
  }
  
  return numStr;
};
