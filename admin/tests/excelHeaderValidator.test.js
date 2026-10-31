import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  REQUIRED_HEADERS,
  DEFAULT_GST_SLAB,
  validateExcelHeaders,
  selectUploadSheet
} from '../src/services/excelHeaderValidator.js';

describe('Strict Excel Header Validator (18-column Template)', () => {
  it('1. All 18 correct → passes', () => {
    const headers = [...REQUIRED_HEADERS];
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, true);
    assert.equal(res.missing.length, 0);
    assert.equal(res.extra.length, 0);
    assert.equal(res.duplicates.length, 0);
  });

  it('2. Columns in a different order → passes', () => {
    // Reverse the order of columns
    const reversed = [...REQUIRED_HEADERS].reverse();
    const res = validateExcelHeaders(reversed);
    assert.equal(res.isValid, true);
    assert.equal(res.missing.length, 0);
    assert.equal(res.extra.length, 0);
    assert.equal(res.duplicates.length, 0);
  });

  it('3. One header missing (MRP) → fails, message lists MRP', () => {
    const headers = REQUIRED_HEADERS.filter(h => h !== 'MRP');
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, false);
    assert.equal(res.missing.includes('MRP'), true);
    assert.match(res.errors.join('; '), /Missing columns.*MRP/);
  });

  it('4. Extra column "Remarks" → fails, message lists Remarks', () => {
    const headers = [...REQUIRED_HEADERS, 'Remarks'];
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, false);
    assert.equal(res.extra.includes('Remarks'), true);
    assert.match(res.errors.join('; '), /Extra columns not allowed.*Remarks/);
  });

  it('5. "Product Name" instead of "PRODUCT_NAME" → fails with missing + extra + hint', () => {
    const headers = REQUIRED_HEADERS.map(h => (h === 'PRODUCT_NAME' ? 'Product Name' : h));
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, false);
    assert.equal(res.missing.includes('PRODUCT_NAME'), true);
    assert.equal(res.extra.includes('Product Name'), true);
    // Should have hint: Did you mean PRODUCT_NAME?
    assert.equal(res.hints.some(hint => hint.includes('PRODUCT_NAME')), true);
  });

  it('6. Duplicate "MRP" → fails', () => {
    const headers = [...REQUIRED_HEADERS, 'MRP'];
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, false);
    assert.equal(res.duplicates.includes('MRP'), true);
    assert.match(res.errors.join('; '), /Duplicate columns.*MRP/);
  });

  it('7. Header with trailing space " MRP " → passes', () => {
    const headers = REQUIRED_HEADERS.map(h => (h === 'MRP' ? '  MRP  ' : h));
    const res = validateExcelHeaders(headers);
    assert.equal(res.isValid, true);
    assert.equal(res.missing.length, 0);
    assert.equal(res.extra.length, 0);
  });

  it('8. Empty file → fails', () => {
    // Completely empty array or sheet
    const resEmptyArray = validateExcelHeaders([]);
    assert.equal(resEmptyArray.isValid, false);
    assert.equal(resEmptyArray.isEmpty, true);

    // Empty worksheet
    const emptyWs = XLSX.utils.aoa_to_sheet([]);
    const resEmptyWs = validateExcelHeaders(emptyWs);
    assert.equal(resEmptyWs.isValid, false);
    assert.equal(resEmptyWs.isEmpty, true);
  });

  it('9. File with both sheets → only "Bulk Product Upload" is read', () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Field Guide (notes only)
    const fieldGuideWs = XLSX.utils.aoa_to_sheet([
      ['Field Guide Notes', 'Do not import this sheet'],
      ['Column 1', 'Some note']
    ]);
    XLSX.utils.book_append_sheet(wb, fieldGuideWs, 'Field Guide');

    // Sheet 2: Bulk Product Upload (real upload sheet)
    const uploadWs = XLSX.utils.aoa_to_sheet([
      [...REQUIRED_HEADERS],
      ['8901234567890', '', 'SKU-01', 'Test Product', 'Makeup', 'Lips', 'BrandX', 'V-01', 'Red', '#FF0000', '5g', 500, 450, 350, 320, 300, 'TRUE', 'active']
    ]);
    XLSX.utils.book_append_sheet(wb, uploadWs, 'Bulk Product Upload');

    const selection = selectUploadSheet(wb);
    assert.equal(selection.sheetName, 'Bulk Product Upload');
    assert.notEqual(selection.worksheet, null);

    const validation = validateExcelHeaders(selection.worksheet);
    assert.equal(validation.isValid, true);
  });

  it('10. Default GST Slab constant is defined as 18', () => {
    assert.equal(DEFAULT_GST_SLAB, 18);
  });
});
