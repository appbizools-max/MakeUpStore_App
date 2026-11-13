const fs = require('fs');
let code = fs.readFileSync('admin/src/components/governance/employees/EditEmployeePage.jsx', 'utf8');

if (!code.includes('branches = [],')) {
  code = code.replace(
    'updateEmployee',
    'branches = [],\n    updateEmployee'
  );
}

const target = '{/* Designation (Dropdown with exact 4 options) */}';
const block = `{/* Store / Branch Assignment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Store / Branch Assignment
            </label>
            <select
              value={formData.branch || ''}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-pink-200 text-xs font-extrabold text-gray-900 focus:border-[#CE4270] outline-none bg-white cursor-pointer shadow-2xs"
            >
              <option value="">Select Branch Assignment</option>
              {branches && branches.length > 0 ? (
                branches.filter(b => b.is_active !== false).map((b) => (
                  <option key={b.id || b.code} value={b.name}>
                    {b.name} ({b.code})
                  </option>
                ))
              ) : (
                <option value="" disabled>No branches configured — Add in Settings → Branch Management</option>
              )}
            </select>
          </div>

          {/* Designation (Dropdown with exact 4 options) */}`;

if (code.includes(target) && !code.includes('Store / Branch Assignment')) {
  code = code.replace(target, block);
}

fs.writeFileSync('admin/src/components/governance/employees/EditEmployeePage.jsx', code, 'utf8');
console.log('Successfully updated EditEmployeePage.jsx');

