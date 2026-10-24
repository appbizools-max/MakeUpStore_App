import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Palette,
  FolderPlus,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import HexColorPicker from '../common/HexColorPicker';
import {
  ATTRIBUTE_GROUPS,
  loadAttributeMasterFromDb,
  saveAttributeMasterToDb,
  loadCategoryAttributeMapFromDb,
  saveCategoryAttributeMapToDb
} from '../../utils/attributeMasterData';

export default function AttributesMasterPage({ categories = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('master'); // 'master' | 'category_mapping'
  const [attributes, setAttributes] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [notice, setNotice] = useState(null);

  // Modal states: Edit/Add Attribute
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [attrForm, setAttrForm] = useState({
    name: '',
    group: 'Appearance',
    inputType: 'select',
    status: 'active'
  });

  // Modal states: Manage Values
  const [managingValuesAttr, setManagingValuesAttr] = useState(null);
  const [newValueDraft, setNewValueDraft] = useState({ name: '', hexColor: '#C2477A', code: '' });

  // Load data on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      const [attrs, catMap] = await Promise.all([
        loadAttributeMasterFromDb(),
        loadCategoryAttributeMapFromDb()
      ]);
      if (mounted) {
        setAttributes(attrs);
        setCategoryMap(catMap);
        setIsLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotice({ message: msg, type });
    setTimeout(() => setNotice(null), 3000);
  };

  // Filtered attributes
  const filteredAttributes = useMemo(() => {
    return attributes.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'All' || a.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [attributes, searchQuery, selectedGroup]);

  // Open Add Attribute modal
  const handleOpenAddAttribute = () => {
    setEditingAttribute(null);
    setAttrForm({
      name: '',
      group: 'Appearance',
      inputType: 'select',
      status: 'active'
    });
    setIsAttributeModalOpen(true);
  };

  // Open Edit Attribute modal
  const handleOpenEditAttribute = (attr) => {
    setEditingAttribute(attr);
    setAttrForm({
      name: attr.name,
      group: attr.group,
      inputType: attr.inputType || 'select',
      status: attr.status || 'active'
    });
    setIsAttributeModalOpen(true);
  };

  // Save Attribute (Add or Edit)
  const handleSaveAttribute = async () => {
    if (!attrForm.name.trim()) return;
    let updated;
    if (editingAttribute) {
      updated = attributes.map(a =>
        a.id === editingAttribute.id ? { ...a, ...attrForm, name: attrForm.name.trim() } : a
      );
    } else {
      const newAttr = {
        id: `attr_${Date.now()}`,
        name: attrForm.name.trim(),
        group: attrForm.group,
        inputType: attrForm.inputType,
        status: attrForm.status,
        values: []
      };
      updated = [...attributes, newAttr];
    }

    setAttributes(updated);
    setIsAttributeModalOpen(false);
    await saveAttributeMasterToDb(updated);
    showNotification(editingAttribute ? 'Attribute updated successfully!' : 'New attribute added successfully!');
  };

  // Toggle Attribute Status (Active / Inactive)
  const handleToggleAttributeStatus = async (attrId) => {
    const updated = attributes.map(a =>
      a.id === attrId ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
    );
    setAttributes(updated);
    await saveAttributeMasterToDb(updated);
    showNotification('Attribute status toggled');
  };

  // Delete Attribute
  const handleDeleteAttribute = async (attrId) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    const updated = attributes.filter(a => a.id !== attrId);
    setAttributes(updated);
    await saveAttributeMasterToDb(updated);
    showNotification('Attribute deleted');
  };

  // Add new value to managingValuesAttr
  const handleAddValueToAttr = async () => {
    if (!managingValuesAttr || !newValueDraft.name.trim()) return;
    const valName = newValueDraft.name.trim();
    const newVal = {
      id: `val_${Date.now()}`,
      name: valName,
      ...(managingValuesAttr.inputType === 'color_swatch' ? { hexColor: newValueDraft.hexColor } : {}),
      ...(newValueDraft.code ? { code: newValueDraft.code.trim() } : {})
    };

    const updated = attributes.map(a => {
      if (a.id === managingValuesAttr.id) {
        const existing = a.values || [];
        return {
          ...a,
          values: [...existing, newVal]
        };
      }
      return a;
    });

    setAttributes(updated);
    setManagingValuesAttr(updated.find(a => a.id === managingValuesAttr.id));
    setNewValueDraft({ name: '', hexColor: '#C2477A', code: '' });
    await saveAttributeMasterToDb(updated);
    showNotification(`Added value "${valName}"`);
  };

  // Delete value from managingValuesAttr
  const handleDeleteValueFromAttr = async (valId) => {
    if (!managingValuesAttr) return;
    const updated = attributes.map(a => {
      if (a.id === managingValuesAttr.id) {
        return {
          ...a,
          values: (a.values || []).filter(v => (v.id ? v.id !== valId : v.name !== valId))
        };
      }
      return a;
    });

    setAttributes(updated);
    setManagingValuesAttr(updated.find(a => a.id === managingValuesAttr.id));
    await saveAttributeMasterToDb(updated);
  };

  // Toggle Category Attribute Mapping
  const handleToggleCategoryAttribute = async (categoryName, attributeName) => {
    const current = categoryMap[categoryName] || [];
    let updatedList;
    if (current.includes(attributeName)) {
      updatedList = current.filter(n => n !== attributeName);
    } else {
      updatedList = [...current, attributeName];
    }

    const updatedMap = {
      ...categoryMap,
      [categoryName]: updatedList
    };

    setCategoryMap(updatedMap);
    await saveCategoryAttributeMapToDb(updatedMap);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      {/* Alert Notice */}
      {notice && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs animate-fade-in ${
          notice.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-pink-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF2F5] border border-pink-100 text-[#C2477A] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-extrabold text-base text-gray-900 tracking-tight">
                Universal Attribute Master & Category Mappings
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF2F5] text-[#C2477A] border border-pink-100">
                {attributes.length} Attributes
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Manage product variant attributes (Shade, Finish, Volume, Formulation) and define category default suggestions.
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('master')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'master'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Attribute Master
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('category_mapping')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'category_mapping'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Category Attributes Mapping
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: ATTRIBUTE MASTER
          ===================================================================== */}
      {activeSubTab === 'master' && (
        <div className="space-y-4">
          {/* Controls: Search, Group Filter, Add Button */}
          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attribute name or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F8FAFC] border border-pink-100/80 outline-none focus:border-[#C2477A] focus:bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedGroup === 'All'
                      ? 'bg-[#C2477A] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({attributes.length})
                </button>
                {ATTRIBUTE_GROUPS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGroup(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedGroup === g
                        ? 'bg-[#C2477A] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAttribute}
              className="px-4 py-2 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span>Add Attribute</span>
            </button>
          </div>

          {/* Attributes Master Table */}
          <div className="overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF2F5] text-gray-900 uppercase font-black text-[11px] tracking-wider border-b border-pink-100">
                  <th className="py-3.5 px-4">ATTRIBUTE NAME</th>
                  <th className="py-3.5 px-3">ATTRIBUTE GROUP</th>
                  <th className="py-3.5 px-3">INPUT TYPE</th>
                  <th className="py-3.5 px-3 text-center">VALUES COUNT</th>
                  <th className="py-3.5 px-3 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttributes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                      No attributes found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredAttributes.map(attr => (
                    <tr key={attr.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {attr.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {attr.group}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                        {attr.inputType || 'select'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-[#C2477A] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                          {(attr.values || []).length} values
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAttributeStatus(attr.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-colors ${
                            attr.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {attr.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setManagingValuesAttr(attr)}
                            className="px-2.5 py-1 rounded-xl bg-[#FFF5F8] hover:bg-[#FDF2F8] text-black font-bold text-[11px] cursor-pointer shadow-2xs"
                            title="Manage Values"
                          >
                            Manage Values
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAttribute(attr)}
                            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 cursor-pointer"
                            title="Edit Attribute"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttribute(attr.id)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Attribute"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CATEGORY ATTRIBUTE MAPPING
          ===================================================================== */}
      {activeSubTab === 'category_mapping' && (
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                Category Suggested Attributes
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Check the attributes that should be suggested automatically when adding products in each category.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {categories.map(cat => {
              const catName = cat.name;
              const mapped = categoryMap[catName] || [];

              return (
                <div key={cat.id || catName} className="py-4 first:pt-0 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-gray-900 flex items-center gap-2">
                      <FolderPlus size={15} className="text-[#C2477A]" />
                      <span>{catName}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {mapped.length} suggested {mapped.length === 1 ? 'attribute' : 'attributes'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {attributes.map(attr => {
                      const isMapped = mapped.includes(attr.name);
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => handleToggleCategoryAttribute(catName, attr.name)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isMapped
                              ? 'bg-[#FFF5F8] text-black border-[#F8B4CB] shadow-2xs font-extrabold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>{isMapped ? '✓' : '+'}</span>
                          <span>{attr.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT ATTRIBUTE
          ===================================================================== */}
      {isAttributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-pink-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900 uppercase">
                {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Attribute Name <span className="text-[#C2477A]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finish, Shade, Coverage, Volume"
                  value={attrForm.name}
                  onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 outline-none focus:border-[#C2477A]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Attribute Group
                </label>
                <select
                  value={attrForm.group}
                  onChange={(e) => setAttrForm({ ...attrForm, group: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                >
                  {ATTRIBUTE_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Input Type
                </label>
                <select
                  value={attrForm.inputType}
                  onChange={(e) => setAttrForm({ ...attrForm, inputType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                >
                  <option value="select">Dropdown / Multi-Select</option>
                  <option value="color_swatch">Color Swatch (Hex / Shades)</option>
                  <option value="volume">Volume (ml / L)</option>
                  <option value="weight">Weight (g / kg)</option>
                  <option value="text">Custom Text</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Status
                </label>
                <select
                  value={attrForm.status}
                  onChange={(e) => setAttrForm({ ...attrForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none focus:border-[#C2477A]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-gray-600 font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttribute}
                disabled={!attrForm.name.trim()}
                className="px-5 py-2 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                Save Attribute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: MANAGE VALUES
          ===================================================================== */}
      {managingValuesAttr && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-pink-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 uppercase">
                  Manage Values: {managingValuesAttr.name}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  Add, view, and remove preconfigured values for this attribute
                </span>
              </div>
              <button
                type="button"
                onClick={() => setManagingValuesAttr(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Values List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
              {(managingValuesAttr.values || []).length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">
                  No preconfigured values yet. Add one below.
                </div>
              ) : (
                (managingValuesAttr.values || []).map((val, idx) => {
                  const valName = typeof val === 'object' ? val.name : val;
                  const hex = typeof val === 'object' ? val.hexColor : null;
                  const code = typeof val === 'object' ? val.code : null;

                  return (
                    <div
                      key={val.id || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        {hex && (
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                        )}
                        <span>{valName}</span>
                        {code && (
                          <span className="font-mono text-[10px] text-gray-400">({code})</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteValueFromAttr(val.id || valName)}
                        className="text-gray-400 hover:text-rose-600 cursor-pointer p-1"
                        title="Delete Value"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add New Value Form */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <span className="text-[11px] font-extrabold text-gray-700 uppercase block">
                + Add Value to {managingValuesAttr.name}
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Value name (e.g. Ruby Red, Matte, 100 ml)..."
                  value={newValueDraft.name}
                  onChange={(e) => setNewValueDraft({ ...newValueDraft, name: e.target.value })}
                  className="flex-1 p-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-[#C2477A]"
                />

                {managingValuesAttr.inputType === 'color_swatch' && (
                  <div className="w-36">
                    <HexColorPicker
                      value={newValueDraft.hexColor || '#C2477A'}
                      onChange={(hex, autoName) => {
                        setNewValueDraft({
                          ...newValueDraft,
                          hexColor: hex,
                          name: autoName || newValueDraft.name
                        });
                      }}
                      align="right"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddValueToAttr}
                  disabled={!newValueDraft.name.trim()}
                  className="px-4 py-2 rounded-xl bg-[#C2477A] hover:bg-[#b83760] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setManagingValuesAttr(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
