import fs from 'fs';
import path from 'path';

const targetFilePath = path.resolve('admin/src/components/products/BulkProductEntryModal.jsx');
let content = fs.readFileSync(targetFilePath, 'utf8');

const startMarker = "className={`group divide-x divide-slate-100 min-h-[64px]";
const endMarker = "INLINE EXPANDED ROW DETAIL PANEL";

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Start marker not found!");
  process.exit(1);
}

// Find the '>' ending the <tr ...>
const trCloseTagIndex = content.indexOf('>', startIndex);
if (trCloseTagIndex === -1) {
  console.error("<tr close tag not found!");
  process.exit(1);
}

const endIndex = content.indexOf(endMarker, trCloseTagIndex);
if (endIndex === -1) {
  console.error("End marker not found!");
  process.exit(1);
}

// Find the last </tr> before the end marker
const lastTrIndex = content.lastIndexOf('</tr>', endIndex);
if (lastTrIndex === -1 || lastTrIndex < trCloseTagIndex) {
  console.error("Closing </tr> not found!");
  process.exit(1);
}

const replacementCells = `
                        {/* Column 0A: # */}
                        {isColVisible('index') && (
                          <td className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 text-center font-mono font-bold text-slate-700 text-xs bg-slate-100 border-r border-slate-200">
                            {row._rowIndex}
                          </td>
                        )}

                        {/* Column 0B: Checkbox */}
                        {isColVisible('select') && (
                          <td className="w-[50px] min-w-[50px] max-w-[50px] px-2 py-3 text-center bg-slate-100 border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectRow(row._id)}
                              className="w-4 h-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                        )}

                        {/* =========================================================
                            GROUP 1: PRODUCT MASTER IDENTIFICATION (Cols 1-10)
                            ========================================================= */}

                        {/* Column 1: Barcode */}
                        {isColVisible('barcode') && (
                          <td className="min-w-[210px] px-3 py-2 font-mono bg-white border-r border-slate-300 shadow-2xs">
                            <div className="relative flex items-center">
                              <input
                                id={\`cell_barcode_\${row._id}\`}
                                type="text"
                                value={row.barcode || ''}
                                onChange={(e) => handleCellChange(row._id, 'barcode', e.target.value)}
                                onBlur={(e) => handleLookupRowBarcode(row._id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleLookupRowBarcode(row._id, e.target.value);
                                  handleCellKeyDown(e, row._id, 'barcode');
                                }}
                                placeholder="Enter barcode..."
                                className={\`w-full h-9 pl-2.5 pr-7 bg-white border rounded-lg font-mono text-xs font-bold outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-normal \${row._fieldErrors?.barcode
                                    ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 text-rose-900'
                                    : 'border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                                  }\`}
                              />
                              <button
                                type="button"
                                onClick={() => handleLookupRowBarcode(row._id, row.barcode)}
                                title="Scan / Search Barcode"
                                className="absolute right-2 text-slate-400 hover:text-indigo-600 cursor-pointer p-1"
                              >
                                <ScanBarcode className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Product Matching Options */}
                            {row._matchingOption && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-xl text-[11px] shadow-sm animate-in fade-in">
                                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 mb-1.5 leading-tight">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Found in Catalog: "{row._matchingOption.existingProduct.name}"</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyMatchingOption(row._id, 'api')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer text-center transition-colors shadow-2xs"
                                  >
                                    Use API Data
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyMatchingOption(row._id, 'update')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer text-center transition-colors shadow-2xs"
                                  >
                                    Update Existing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyMatchingOption(row._id, 'variant')}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer text-center transition-colors shadow-2xs"
                                  >
                                    Create Variant
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyMatchingOption(row._id, 'manual')}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10.5px] font-bold cursor-pointer text-center transition-colors shadow-2xs"
                                  >
                                    Manual Entry
                                  </button>
                                </div>
                              </div>
                            )}

                            {row._fieldErrors?.barcode && (
                              <div className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1 mt-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{row._fieldErrors.barcode}</span>
                              </div>
                            )}
                            {row.barcodeStatus === 'detected' && !row._fieldErrors?.barcode && !row._matchingOption && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                                <Check className="w-3 h-3" /> Detected
                              </span>
                            )}
                            {row.barcodeStatus === 'searching' && !row._fieldErrors?.barcode && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Searching...
                              </span>
                            )}
                            {row.barcodeStatus === 'not_found' && !row._fieldErrors?.barcode && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
                                ⚠ New Barcode
                              </span>
                            )}
                          </td>
                        )}

                        {/* Column 2: Image Preview & Search */}
                        {isColVisible('images') && (
                          <td className="min-w-[105px] px-2 py-2 text-center bg-white">
                            <div
                              onClick={() => {
                                setExpandedRowId(row._id);
                                setActiveDetailTab('Images');
                              }}
                              className="inline-flex items-center justify-center gap-1 cursor-pointer group/img"
                              title="Manage Product Images"
                            >
                              <div className="w-11 h-11 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-2xs group-hover/img:border-indigo-500 transition-colors">
                                {row.images && row.images[0] ? (
                                  <img src={row.images[0]} alt="Product" className="w-full h-full object-cover" />
                                ) : (
                                  <Plus className="w-5 h-5 text-slate-400 group-hover/img:text-indigo-600" />
                                )}
                              </div>
                              {row.images && row.images.length > 1 && (
                                <span className="text-xs font-black text-slate-600 font-mono">
                                  +{row.images.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <a
                                href={\`https://www.google.com/search?tbm=isch&q=\${encodeURIComponent(\`\${row.brand || ''} \${row.name || ''} \${row.shade || ''}\`.trim() || 'Cosmetics')}\`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Search Images on Google in new tab"
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
                              >
                                Google ↗
                              </a>
                            </div>
                          </td>
                        )}

                        {/* Column 3: Parent SKU */}
                        {isColVisible('parentSku') && (
                          <td className="min-w-[170px] px-2.5 py-2 font-mono bg-white">
                            <input
                              id={\`cell_parentSku_\${row._id}\`}
                              type="text"
                              value={row.parentSku || ''}
                              onChange={(e) => handleCellChange(row._id, 'parentSku', e.target.value.toUpperCase())}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'parentSku')}
                              placeholder="e.g. LAK-MATTE-LIP"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 4: Product Name */}
                        {isColVisible('name') && (
                          <td className="min-w-[320px] px-3 py-2 bg-white">
                            <div className="flex items-center gap-1.5">
                              {row.parentId && (
                                <span className="text-pink-600 text-xs font-bold font-mono shrink-0 select-none flex items-center gap-0.5" title="Child Variant">
                                  <GitBranch className="w-3.5 h-3.5" />
                                  {isLastChild ? '└─' : '├─'}
                                </span>
                              )}
                              {!row.parentId && hasChildren && (
                                <span className="text-indigo-700 text-xs font-bold shrink-0 select-none mr-0.5" title="Parent Product">
                                  ▾
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <ProductNameCell
                                  id={\`cell_name_\${row._id}\`}
                                  row={row}
                                  onNameChange={(val) => handleCellChange(row._id, 'name', val)}
                                  onApplyExistingProduct={(prod) => {
                                    setRows(prev => prev.map(r => {
                                      if (r._id !== row._id) return r;
                                      const merged = {
                                        ...r,
                                        name: prod.name,
                                        brand: prod.brandName || prod.brand || r.brand,
                                        category: prod.category || r.category,
                                        subcategory: prod.subcategory || r.subcategory,
                                        mrp: prod.mrp || r.mrp,
                                        images: prod.image ? [prod.image] : r.images,
                                        description: prod.description || r.description,
                                        highlights: prod.highlights || r.highlights
                                      };
                                      return autoEnrichRowWithDescriptionAndHighlights(merged);
                                    }));
                                    setBulkNotice({ type: 'success', text: \`Loaded catalog information for "\${prod.name}"\` });
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, row._id, 'name')}
                                  existingProducts={existingProducts}
                                />
                              </div>
                            </div>
                            {row._fieldErrors?.name && (
                              <div className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1 mt-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{row._fieldErrors.name}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[10.5px] font-bold mt-1 pl-1">
                              {row.parentId ? (
                                <span className="text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  Variant {row.parentSku ? \`of \${row.parentSku}\` : ''}
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                    Parent {row.parentSku ? \`(\${row.parentSku})\` : ''} {hasChildren ? \`• \${childCount} variant\${childCount > 1 ? 's' : ''}\` : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddChildRow(row)}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-0.5 cursor-pointer hover:underline"
                                    title="Add a variant under this parent product"
                                  >
                                    <Plus className="w-3 h-3" /> Add Variant
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Column 5: Product Type */}
                        {isColVisible('productType') && (
                          <td className="min-w-[160px] px-2.5 py-2 bg-white">
                            <input
                              id={\`cell_productType_\${row._id}\`}
                              type="text"
                              value={row.productType || ''}
                              onChange={(e) => handleCellChange(row._id, 'productType', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'productType')}
                              placeholder="e.g. Lipstick / Serum"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 6: Category */}
                        {isColVisible('category') && (
                          <td className="min-w-[200px] px-3 py-2 bg-white">
                            <SearchableCombobox
                              id={\`cell_category_\${row._id}\`}
                              value={row.category || ''}
                              onChange={(val) => handleCellChange(row._id, 'category', val)}
                              onCreateNew={handleCreateCategory}
                              onNextFocus={() => focusField(row._id, 'subcategory')}
                              options={availableCategories}
                              placeholder="Select Category"
                              searchPlaceholder="Search category..."
                              manualLabel="Enter Category"
                            />
                            {row._fieldErrors?.category && (
                              <div className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1 mt-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{row._fieldErrors.category}</span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Column 7: Subcategory */}
                        {isColVisible('subcategory') && (
                          <td className="min-w-[200px] px-3 py-2 bg-white">
                            <SearchableCombobox
                              id={\`cell_subcategory_\${row._id}\`}
                              value={row.subcategory || ''}
                              onChange={(val) => handleCellChange(row._id, 'subcategory', val)}
                              onCreateNew={(sub) => handleCreateSubcategory(row.category, sub)}
                              onNextFocus={() => focusField(row._id, 'brand')}
                              options={getSubcategoriesForCategory(row.category)}
                              placeholder={row.category ? "Select Subcategory" : "Select Category First"}
                              searchPlaceholder="Search subcategory..."
                              manualLabel="Enter Subcategory"
                              disabled={!row.category}
                            />
                          </td>
                        )}

                        {/* Column 8: Brand */}
                        {isColVisible('brand') && (
                          <td className="min-w-[190px] px-3 py-2 bg-white">
                            <SearchableCombobox
                              id={\`cell_brand_\${row._id}\`}
                              value={row.brand || ''}
                              onChange={(val) => handleCellChange(row._id, 'brand', val)}
                              onCreateNew={handleCreateBrand}
                              onNextFocus={() => focusField(row._id, 'description')}
                              options={availableBrands}
                              placeholder="Select Brand"
                              searchPlaceholder="Search brand..."
                              manualLabel="Add New Brand"
                            />
                            {row._fieldErrors?.brand && (
                              <div className="text-[10.5px] font-bold text-rose-600 flex items-center gap-1 mt-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{row._fieldErrors.brand}</span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Column 9: Product Description */}
                        {isColVisible('description') && (
                          <td className="min-w-[280px] px-2.5 py-2 bg-white">
                            <div className="relative w-full">
                              <textarea
                                id={\`cell_description_\${row._id}\`}
                                rows={2}
                                value={row.description || ''}
                                onChange={(e) => handleCellChange(row._id, 'description', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCellKeyDown(e, row._id, 'description');
                                  }
                                }}
                                placeholder="Enter product description..."
                                className="w-full h-9 py-1 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 leading-normal resize-none focus:h-24 focus:absolute focus:top-0 focus:left-0 focus:z-30 focus:shadow-xl transition-all"
                              />
                            </div>
                          </td>
                        )}

                        {/* Column 10: Highlights */}
                        {isColVisible('highlights') && (
                          <td className="min-w-[240px] px-2.5 py-2 bg-white">
                            <input
                              id={\`cell_highlights_\${row._id}\`}
                              type="text"
                              value={Array.isArray(row.highlights) ? row.highlights.join('; ') : (row.highlights || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                const list = val.split(';').map(s => s.trim()).filter(Boolean);
                                handleCellChange(row._id, 'highlights', list);
                              }}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'highlights')}
                              placeholder="e.g. Matte Finish; Waterproof"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
                            />
                          </td>
                        )}

                        {/* =========================================================
                            GROUP 2: VARIANT DETAILS & IDENTIFICATION (Cols 11-16)
                            ========================================================= */}

                        {/* Column 11: Variant SKU */}
                        {isColVisible('variantSku') && (
                          <td className="min-w-[160px] px-2.5 py-2 font-mono bg-[#FFF8FA]">
                            <input
                              id={\`cell_variantSku_\${row._id}\`}
                              type="text"
                              value={row.variantSku || ''}
                              onChange={(e) => handleCellChange(row._id, 'variantSku', e.target.value.toUpperCase())}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'variantSku')}
                              placeholder="e.g. LAK-MATTE-01"
                              className="w-full h-9 px-2.5 py-1.5 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-mono font-bold text-pink-950 outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-100 shadow-2xs placeholder:text-pink-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 12: Variant Name */}
                        {isColVisible('variantName') && (
                          <td className="min-w-[160px] px-2.5 py-2 bg-[#FFF8FA]">
                            <input
                              id={\`cell_variantName_\${row._id}\`}
                              type="text"
                              value={row.variantName || ''}
                              onChange={(e) => handleCellChange(row._id, 'variantName', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'variantName')}
                              placeholder="e.g. Red Carpet"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 13: Shade Name */}
                        {isColVisible('shade') && (
                          <td className="min-w-[180px] px-2.5 py-2 bg-[#FFF8FA]">
                            {rowHasShades ? (
                              <ShadeNameCell
                                id={\`cell_shade_\${row._id}\`}
                                row={row}
                                onShadeChange={(val) => {
                                  setRows(prev => prev.map(r => r._id === row._id ? {
                                    ...r,
                                    shade: val,
                                    _manualShadeEdited: Boolean(val && val.trim().length > 0),
                                    updatedAt: new Date().toISOString()
                                  } : r));
                                }}
                                onApplyShade={(shadeObj) => {
                                  setRows(prev => prev.map(r => r._id === row._id ? {
                                    ...r,
                                    shade: shadeObj.name,
                                    hexColor: shadeObj.hex || r.hexColor,
                                    rgb: shadeObj.hex ? hexToRgbString(shadeObj.hex) : r.rgb,
                                    images: shadeObj.image && (!r.images || r.images.length === 0) ? [shadeObj.image] : r.images,
                                    _manualShadeEdited: true,
                                    updatedAt: new Date().toISOString()
                                  } : r));
                                  setBulkNotice({ type: 'success', text: \`Loaded shade details for "\${shadeObj.name}"\` });
                                }}
                                onKeyDown={(e) => handleCellKeyDown(e, row._id, 'shade')}
                                existingProducts={existingProducts}
                              />
                            ) : (
                              <div className="h-9 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-400 flex items-center justify-center italic">
                                N/A (Non-Shade)
                              </div>
                            )}
                          </td>
                        )}

                        {/* Column 14: Shade Code */}
                        {isColVisible('shadeCode') && (
                          <td className="min-w-[110px] px-2 py-2 font-mono bg-[#FFF8FA]">
                            <input
                              id={\`cell_shadeCode_\${row._id}\`}
                              type="text"
                              value={row.shadeCode || ''}
                              onChange={(e) => handleCellChange(row._id, 'shadeCode', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'shadeCode')}
                              placeholder="01"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Swatch & HEX Helper */}
                        {isColVisible('swatch') && (
                          <td className="min-w-[180px] px-2.5 py-2 bg-[#FFF8FA]">
                            {rowHasShades ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={row.hexColor || '#C2182B'}
                                  onInput={(e) => handleColorSwatchChange(row._id, e.target.value)}
                                  onChange={(e) => handleColorSwatchChange(row._id, e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0 shadow-2xs shrink-0"
                                  title="Click or drag to pick swatch color in real-time"
                                />
                                <div className="flex flex-col text-left leading-tight select-all">
                                  <span className="font-mono text-xs font-black text-slate-900">
                                    {row.hexColor || '—'}
                                  </span>
                                  <span className="font-mono text-[10.5px] font-bold text-slate-700">
                                    {row.rgb || (row.hexColor ? hexToRgbString(row.hexColor) : '—')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-9 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-400 flex items-center justify-center italic">
                                —
                              </div>
                            )}
                          </td>
                        )}

                        {/* Column 15: Size or Weight */}
                        {isColVisible('size') && (
                          <td className="min-w-[130px] px-2.5 py-2 font-medium bg-[#FFF8FA]">
                            <input
                              id={\`cell_size_\${row._id}\`}
                              type="text"
                              value={row.size || ''}
                              onChange={(e) => handleCellChange(row._id, 'size', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'size')}
                              placeholder="e.g. 5.6ml, 30g"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 16: Variant Barcode */}
                        {isColVisible('variantBarcode') && (
                          <td className="min-w-[170px] px-2.5 py-2 font-mono bg-[#FFF8FA]">
                            <input
                              id={\`cell_variantBarcode_\${row._id}\`}
                              type="text"
                              value={row.variantBarcode || ''}
                              onChange={(e) => handleCellChange(row._id, 'variantBarcode', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'variantBarcode')}
                              placeholder="Child Barcode"
                              className="w-full h-9 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* =========================================================
                            GROUP 3: FOUR-TIER ROLE-BASED PRICING (Cols 17-21)
                            ========================================================= */}

                        {/* Column 17: MRP */}
                        {isColVisible('mrp') && (
                          <td className="min-w-[130px] px-2.5 py-2 text-right font-mono bg-[#FAF5FF]">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-slate-400 font-bold text-xs">₹</span>
                              <input
                                id={\`cell_mrp_\${row._id}\`}
                                type="number"
                                min="0"
                                step="1"
                                value={row.mrp !== undefined && row.mrp !== null ? row.mrp : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || (Number(val) >= 0 && !isNaN(Number(val)))) {
                                    handleCellChange(row._id, 'mrp', val);
                                  }
                                }}
                                onKeyDown={(e) => handleCellKeyDown(e, row._id, 'mrp')}
                                placeholder="0"
                                className={\`w-full h-9 pl-5 pr-2 py-1.5 text-right bg-white border rounded-lg text-xs font-mono font-black outline-none shadow-2xs \${row._fieldErrors?.mrp
                                    ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200 text-rose-900'
                                    : 'border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                                  }\`}
                              />
                            </div>
                            {row._fieldErrors?.mrp && (
                              <div className="text-[10px] font-bold text-rose-600 mt-1">{row._fieldErrors.mrp}</div>
                            )}
                          </td>
                        )}

                        {/* Column 18: General User Price */}
                        {isColVisible('generalPrice') && (
                          <td className="min-w-[140px] px-2 py-2 font-mono bg-[#FAF5FF]">
                            <div className="flex items-center gap-1">
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-1.5 text-slate-400 font-bold text-[11px]">₹</span>
                                <input
                                  id={\`cell_generalPrice_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  value={row.generalPrice !== undefined && row.generalPrice !== null ? row.generalPrice : (row.mrp ? rowPrices.genP : '')}
                                  onChange={(e) => handleCellChange(row._id, 'generalPrice', e.target.value)}
                                  placeholder="₹"
                                  title="General Selling Price (₹)"
                                  className="w-full h-9 pl-4 pr-1 text-right bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                              </div>
                              <div className="relative flex items-center w-14">
                                <input
                                  id={\`cell_generalDiscount_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={row.generalDiscount !== undefined && row.generalDiscount !== null ? row.generalDiscount : ''}
                                  onChange={(e) => handleCellChange(row._id, 'generalDiscount', e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, row._id, 'generalDiscount')}
                                  placeholder="0"
                                  title="General Discount %"
                                  className="w-full h-9 pr-3.5 pl-1 text-right bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                                <span className="absolute right-1 text-slate-400 font-bold text-[10px]">%</span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Column 19: Salon Price */}
                        {isColVisible('salonPrice') && (
                          <td className="min-w-[140px] px-2 py-2 font-mono bg-[#FAF5FF]">
                            <div className="flex items-center gap-1">
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-1.5 text-purple-400 font-bold text-[11px]">₹</span>
                                <input
                                  id={\`cell_salonPrice_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  value={row.salonPrice !== undefined && row.salonPrice !== null ? row.salonPrice : (row.mrp ? rowPrices.salonP : '')}
                                  onChange={(e) => handleCellChange(row._id, 'salonPrice', e.target.value)}
                                  placeholder="₹"
                                  title="Salon Owner Price (₹)"
                                  className="w-full h-9 pl-4 pr-1 text-right bg-purple-50/50 border border-purple-200 rounded-lg text-xs font-mono font-black text-purple-950 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
                                />
                              </div>
                              <div className="relative flex items-center w-14">
                                <input
                                  id={\`cell_salonDiscount_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={row.salonDiscount !== undefined && row.salonDiscount !== null ? row.salonDiscount : ''}
                                  onChange={(e) => handleCellChange(row._id, 'salonDiscount', e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, row._id, 'salonDiscount')}
                                  placeholder="0"
                                  title="Salon Discount %"
                                  className="w-full h-9 pr-3.5 pl-1 text-right bg-purple-50/50 border border-purple-200 rounded-lg text-xs font-mono font-bold text-purple-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
                                />
                                <span className="absolute right-1 text-purple-400 font-bold text-[10px]">%</span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Column 20: Makeup Artist Price */}
                        {isColVisible('artistPrice') && (
                          <td className="min-w-[140px] px-2 py-2 font-mono bg-[#FAF5FF]">
                            <div className="flex items-center gap-1">
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-1.5 text-blue-400 font-bold text-[11px]">₹</span>
                                <input
                                  id={\`cell_artistPrice_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  value={row.artistPrice !== undefined && row.artistPrice !== null ? row.artistPrice : (row.mrp ? rowPrices.artistP : '')}
                                  onChange={(e) => handleCellChange(row._id, 'artistPrice', e.target.value)}
                                  placeholder="₹"
                                  title="Makeup Artist Price (₹)"
                                  className="w-full h-9 pl-4 pr-1 text-right bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                              </div>
                              <div className="relative flex items-center w-14">
                                <input
                                  id={\`cell_artistDiscount_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={row.artistDiscount !== undefined && row.artistDiscount !== null ? row.artistDiscount : ''}
                                  onChange={(e) => handleCellChange(row._id, 'artistDiscount', e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, row._id, 'artistDiscount')}
                                  placeholder="0"
                                  title="Artist Discount %"
                                  className="w-full h-9 pr-3.5 pl-1 text-right bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                                <span className="absolute right-1 text-blue-400 font-bold text-[10px]">%</span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Column 21: Beautician Price */}
                        {isColVisible('beauticianPrice') && (
                          <td className="min-w-[140px] px-2 py-2 font-mono bg-[#FAF5FF]">
                            <div className="flex items-center gap-1">
                              <div className="relative flex items-center flex-1">
                                <span className="absolute left-1.5 text-amber-400 font-bold text-[11px]">₹</span>
                                <input
                                  id={\`cell_beauticianPrice_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  value={row.beauticianPrice !== undefined && row.beauticianPrice !== null ? row.beauticianPrice : (row.mrp ? rowPrices.beauticianP : '')}
                                  onChange={(e) => handleCellChange(row._id, 'beauticianPrice', e.target.value)}
                                  placeholder="₹"
                                  title="Beautician Price (₹)"
                                  className="w-full h-9 pl-4 pr-1 text-right bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                              </div>
                              <div className="relative flex items-center w-14">
                                <input
                                  id={\`cell_beauticianDiscount_\${row._id}\`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={row.beauticianDiscount !== undefined && row.beauticianDiscount !== null ? row.beauticianDiscount : ''}
                                  onChange={(e) => handleCellChange(row._id, 'beauticianDiscount', e.target.value)}
                                  onKeyDown={(e) => handleCellKeyDown(e, row._id, 'beauticianDiscount')}
                                  placeholder="0"
                                  title="Beautician Discount %"
                                  className="w-full h-9 pr-3.5 pl-1 text-right bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                                <span className="absolute right-1 text-amber-400 font-bold text-[10px]">%</span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* =========================================================
                            GROUP 4: CATEGORY & COSMETIC ATTRIBUTES (Cols 22-24)
                            ========================================================= */}

                        {/* Column 22: Finish */}
                        {isColVisible('finish') && (
                          <td className="min-w-[140px] px-2.5 py-2 bg-[#F0FDF4]">
                            <input
                              id={\`cell_finish_\${row._id}\`}
                              type="text"
                              value={row.finish || ''}
                              onChange={(e) => handleCellChange(row._id, 'finish', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'finish')}
                              placeholder="e.g. Matte / Dewy"
                              className="w-full h-9 px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-emerald-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 23: Skin Type */}
                        {isColVisible('skinType') && (
                          <td className="min-w-[140px] px-2.5 py-2 bg-[#F0FDF4]">
                            <input
                              id={\`cell_skinType_\${row._id}\`}
                              type="text"
                              value={row.skinType || ''}
                              onChange={(e) => handleCellChange(row._id, 'skinType', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'skinType')}
                              placeholder="e.g. All / Oily"
                              className="w-full h-9 px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-emerald-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* Column 24: Coverage */}
                        {isColVisible('coverage') && (
                          <td className="min-w-[140px] px-2.5 py-2 bg-[#F0FDF4]">
                            <input
                              id={\`cell_coverage_\${row._id}\`}
                              type="text"
                              value={row.coverage || ''}
                              onChange={(e) => handleCellChange(row._id, 'coverage', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row._id, 'coverage')}
                              placeholder="e.g. Full / Medium"
                              className="w-full h-9 px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 shadow-2xs placeholder:text-emerald-400 placeholder:font-normal"
                            />
                          </td>
                        )}

                        {/* =========================================================
                            GROUP 5: PUBLICATION & CONTROLS (Cols 25-27)
                            ========================================================= */}

                        {/* Column 25: Product Image URL */}
                        {isColVisible('productImageUrl') && (
                          <td className="min-w-[190px] px-2.5 py-2 font-mono bg-slate-50">
                            <div className="relative flex items-center">
                              <input
                                id={\`cell_productImageUrl_\${row._id}\`}
                                type="url"
                                value={row.productImageUrl || (row.images && row.images[0]) || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleCellChange(row._id, 'productImageUrl', val);
                                  if (val && (!row.images || row.images.length === 0)) {
                                    handleCellChange(row._id, 'images', [val]);
                                  }
                                }}
                                onKeyDown={(e) => handleCellKeyDown(e, row._id, 'productImageUrl')}
                                placeholder="https://..."
                                className="w-full h-9 pl-2.5 pr-7 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
                              />
                              {Boolean(row.productImageUrl || (row.images && row.images[0])) && (
                                <a
                                  href={row.productImageUrl || row.images[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open Image URL"
                                  className="absolute right-2 text-slate-400 hover:text-indigo-600"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Column 26: Product Active */}
                        {isColVisible('productActive') && (
                          <td className="w-28 min-w-[110px] px-2 py-2 text-center bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleCellChange(row._id, 'productActive', row.productActive === false ? true : false)}
                              className={\`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 mx-auto \${
                                row.productActive !== false
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                              }\`}
                              title="Toggle Product Active status"
                            >
                              {row.productActive !== false ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>TRUE</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />
                                  <span>FALSE</span>
                                </>
                              )}
                            </button>
                          </td>
                        )}

                        {/* Column 27: Variant Active */}
                        {isColVisible('variantActive') && (
                          <td className="w-28 min-w-[110px] px-2 py-2 text-center bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleCellChange(row._id, 'variantActive', row.variantActive === false ? true : false)}
                              className={\`px-3 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 mx-auto \${
                                row.variantActive !== false
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                              }\`}
                              title="Toggle Variant Active status"
                            >
                              {row.variantActive !== false ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>TRUE</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />
                                  <span>FALSE</span>
                                </>
                              )}
                            </button>
                          </td>
                        )}

                        {/* Status Dropdown */}
                        {isColVisible('status') && (
                          <td className="w-32 min-w-[130px] px-2 py-2 text-center bg-slate-50">
                            <select
                              value={row.status || 'draft'}
                              onChange={(e) => handleCellChange(row._id, 'status', e.target.value)}
                              className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none cursor-pointer focus:border-indigo-600 shadow-2xs"
                            >
                              <option value="ready">Ready</option>
                              <option value="draft">Draft</option>
                              <option value="review">Needs Review</option>
                              <option value="error">Error</option>
                              <option value="ai_analyzed">AI Analyzed</option>
                            </select>
                          </td>
                        )}

                        {/* Actions */}
                        {isColVisible('actions') && (
                          <td className="w-32 min-w-[125px] px-2 py-2 text-center bg-slate-50">
                            <div className="flex items-center justify-center gap-1 text-slate-400">
                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : row._id)}
                                title={isExpanded ? "Collapse Details" : "View / Edit Full Details"}
                                className={\`p-1.5 rounded-lg transition-colors cursor-pointer \${isExpanded ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'
                                  }\`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(row._id)}
                                title="Duplicate Row"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-purple-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row._id)}
                                title="Delete Row"
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      `;

const newContent = content.slice(0, trCloseTagIndex + 1) + replacementCells + content.slice(lastTrIndex);
fs.writeFileSync(targetFilePath, newContent, 'utf8');
console.log("Successfully aligned BulkProductEntryModal tbody row cells 1:1 with canonical columns!");
