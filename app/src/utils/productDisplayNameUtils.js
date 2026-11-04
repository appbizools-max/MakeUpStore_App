/**
 * Salbeau Beauty App — Product Display Name Sanitizer
 * 
 * Ensures customer-facing screens display clean, luxury cosmetic product names
 * without automatically generated sequential numbering (e.g. "Product 001", "Product 002", "#001").
 * Internal SKUs, IDs, and barcodes in database and Admin Panel remain completely untouched.
 */

export const cleanProductDisplayName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();

  // Remove patterns like:
  // - "Lakmé Lipstick - Product 001" -> "Lakmé Lipstick"
  // - "Product 001: M.A.C Liquid Lip" -> "M.A.C Liquid Lip"
  // - "Kay Beauty Compact (Product 002)" -> "Kay Beauty Compact"
  // - "Maybelline Foundation #001" -> "Maybelline Foundation"
  // - "Product 003" -> "Product 003" (fallback if solely the name)
  let cleaned = trimmed
    // Remove parenthetical (Product 001) or [Product 001]
    .replace(/\s*[\(\[\{]\s*(?:Product|Prod|Item)?\s*#?0*\d{1,5}\s*[\)\]\}]/gi, '')
    // Remove separator + Product 001 at the end: " - Product 001", " | Product 002", " • Product 003"
    .replace(/\s*[\-_|•~:]\s*(?:Product|Prod|Item)?\s*#?0*\d{1,5}\s*$/gi, '')
    // Remove trailing "Product 001" or "#001"
    .replace(/\s+\b(?:Product|Prod)\s*#?0*\d{1,5}\b\s*$/gi, '')
    // Remove prefix "Product 001 - " or "Product 001: "
    .replace(/^(?:Product|Prod|Item)\s*#?0*\d{1,5}(?:\s*[:\-_|•]\s*|\s+)/gi, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If the product was strictly named "Product 001" and stripping emptied it, keep trimmed original
  return cleaned.length > 0 ? cleaned : trimmed;
};

export default cleanProductDisplayName;

