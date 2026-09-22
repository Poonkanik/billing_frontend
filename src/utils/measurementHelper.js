/**
 * Measurement Conversion and Billing Helper
 * Handles conversions between different measurement units and calculates amounts
 */

// Conversion factors to base units
const CONVERSIONS = {
  // Weight-based
  'KG/GM': {
    'KG': 1,
    'GM': 0.001,
  },
  // Volume-based
  'Litre/ML': {
    'Litre': 1,
    'ML': 0.001,
  },
  // Count-based
  'Piece': {
    'Piece': 1,
  },
  'Box': {
    'Box': 1,
  },
  'Packet': {
    'Packet': 1,
  },
};

// Base measurements for each measurement type
const BASE_MEASUREMENTS = {
  'KG/GM': 'KG',
  'Litre/ML': 'Litre',
  'Piece': 'Piece',
  'Box': 'Box',
  'Packet': 'Packet',
};

// Sub-units for each measurement type
const SUB_UNITS = {
  'KG/GM': ['KG', 'GM'],
  'Litre/ML': ['Litre', 'ML'],
  'Piece': ['Piece'],
  'Box': ['Box'],
  'Packet': ['Packet'],
};

/**
 * Convert quantity from one unit to base unit (KG, Litre, Piece, Box, Packet)
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - The unit to convert from (e.g., 'GM', 'ML', 'Piece')
 * @param {string} measurementType - The measurement type (e.g., 'KG/GM', 'Litre/ML', 'Piece')
 * @returns {number} Quantity in base unit
 */
export function convertToBaseUnit(quantity, fromUnit, measurementType) {
  const conversion = CONVERSIONS[measurementType];
  if (!conversion || !conversion[fromUnit]) {
    console.warn(`No conversion found for ${fromUnit} in ${measurementType}`);
    return quantity;
  }
  return quantity * conversion[fromUnit];
}

/**
 * Convert quantity from base unit to target unit
 * @param {number} quantity - The quantity in base unit
 * @param {string} toUnit - The target unit
 * @param {string} measurementType - The measurement type
 * @returns {number} Quantity in target unit
 */
export function convertFromBaseUnit(quantity, toUnit, measurementType) {
  const conversion = CONVERSIONS[measurementType];
  if (!conversion || !conversion[toUnit]) {
    console.warn(`No conversion found for ${toUnit} in ${measurementType}`);
    return quantity;
  }
  return quantity / conversion[toUnit];
}

/**
 * Calculate bill amount based on product rate and quantity
 * @param {number} pricePerUnit - Price per base unit (e.g., ₹300 per KG)
 * @param {number} quantity - Quantity entered
 * @param {string} unit - Unit of quantity (e.g., 'GM', 'ML')
 * @param {string} measurementType - Measurement type (e.g., 'KG/GM')
 * @returns {number} Calculated amount
 */
export function calculateAmount(pricePerUnit, quantity, unit, measurementType) {
  if (!quantity || quantity <= 0) return 0;
  
  const baseQuantity = convertToBaseUnit(quantity, unit, measurementType);
  return baseQuantity * pricePerUnit;
}

/**
 * Calculate amount with tax
 * @param {number} pricePerUnit - Price per base unit
 * @param {number} quantity - Quantity
 * @param {string} unit - Unit of measurement
 * @param {string} measurementType - Measurement type
 * @param {number} taxPercent - Tax percentage (CGST+SGST combined)
 * @returns {object} { amount, taxAmount, total }
 */
export function calculateAmountWithTax(pricePerUnit, quantity, unit, measurementType, taxPercent = 5) {
  const amount = calculateAmount(pricePerUnit, quantity, unit, measurementType);
  const taxAmount = (amount * taxPercent) / 100;
  const total = amount + taxAmount;
  
  return {
    amount,
    taxAmount,
    total,
    cgst: taxAmount / 2,
    sgst: taxAmount / 2,
  };
}

/**
 * Format measurement display for UI
 * @param {number} quantity - The quantity
 * @param {string} unit - The unit
 * @returns {string} Formatted display (e.g., "250 GM", "1.5 KG")
 */
export function formatMeasurement(quantity, unit) {
  if (!quantity) return `0 ${unit}`;
  const num = typeof quantity === 'number' ? quantity : parseFloat(quantity);
  if (isNaN(num)) return `0 ${unit}`;
  const roundedQty = num % 1 !== 0 ? num.toFixed(2) : num;
  return `${roundedQty} ${unit}`;
}

/**
 * Get available units for a measurement type
 * @param {string} measurementType - The measurement type
 * @returns {array} Array of available units
 */
export function getAvailableUnits(measurementType) {
  return SUB_UNITS[measurementType] || ['Piece'];
}

/**
 * Get base measurement for a measurement type
 * @param {string} measurementType - The measurement type
 * @returns {string} Base measurement (e.g., 'KG' for 'KG/GM')
 */
export function getBaseMeasurement(measurementType) {
  return BASE_MEASUREMENTS[measurementType] || 'Piece';
}

/**
 * Convert quantity display to base unit value for storage
 * @param {number} quantity - User input quantity
 * @param {string} unit - Selected unit
 * @param {string} measurementType - Measurement type
 * @returns {object} { baseQuantity, displayUnit, displayQty }
 */
export function processQuantityInput(quantity, unit, measurementType) {
  const baseQuantity = convertToBaseUnit(quantity, unit, measurementType);
  return {
    baseQuantity,
    displayUnit: unit,
    displayQty: quantity,
  };
}

/**
 * Validate if unit belongs to measurement type
 * @param {string} unit - Unit to validate
 * @param {string} measurementType - Measurement type
 * @returns {boolean} True if valid
 */
export function isValidUnit(unit, measurementType) {
  return SUB_UNITS[measurementType]?.includes(unit) || false;
}

/**
 * Get measurement display text
 * @param {string} measurementType - The measurement type
 * @returns {string} Display text (e.g., "Weight (KG/GM)")
 */
export function getMeasurementTypeDisplay(measurementType) {
  const displays = {
    'KG/GM': '⚖️ Weight (KG/GM)',
    'Litre/ML': '🧃 Volume (Litre/ML)',
    'Piece': '📦 Pieces',
    'Box': '📫 Boxes',
    'Packet': '🛍️ Packets',
  };
  return displays[measurementType] || measurementType;
}

/**
 * Get unit display with symbol
 * @param {string} unit - Unit to display
 * @returns {string} Unit with symbol
 */
export function getUnitDisplay(unit) {
  const displays = {
    'KG': 'KG',
    'GM': 'GM',
    'Litre': 'L',
    'ML': 'ML',
    'Piece': 'PC',
    'Box': 'BOX',
    'Packet': 'PKT',
  };
  return displays[unit] || unit;
}

export default {
  convertToBaseUnit,
  convertFromBaseUnit,
  calculateAmount,
  calculateAmountWithTax,
  formatMeasurement,
  getAvailableUnits,
  getBaseMeasurement,
  processQuantityInput,
  isValidUnit,
  getMeasurementTypeDisplay,
  getUnitDisplay,
};
