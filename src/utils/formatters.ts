/**
 * Formats a number as currency with appropriate abbreviations for large values
 * @param value The number to format
 * @param currency The currency symbol to use (default: $)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency = '$'): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  // Handle large numbers with abbreviations
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${currency}${(value / 1_000_000_000_000).toFixed(2)}T`;
  } else if (Math.abs(value) >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${currency}${(value / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${currency}${(value / 1_000).toFixed(2)}K`;
  }

  // Format normal numbers
  return `${currency}${value.toFixed(2)}`;
};

/**
 * Formats a number with appropriate abbreviations for large values
 * @param value The number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  // Handle large numbers with abbreviations
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(decimals)}T`;
  } else if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }

  // Format normal numbers
  return value.toFixed(decimals);
};

/**
 * Formats a number as a percentage
 * @param value The decimal value to format as percentage (0.1 = 10%)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number, decimals = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  // Handle decimal percentages (convert 0.10 to 10%)
  let percentValue = value;
  if (Math.abs(value) < 1 && !Number.isInteger(value * 100)) {
    percentValue = value * 100;
  }
  
  return `${percentValue.toFixed(decimals)}%`;
}; 