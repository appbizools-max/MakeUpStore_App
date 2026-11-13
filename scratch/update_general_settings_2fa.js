import fs from 'fs';

const path = 'admin/src/components/settings/GeneralSettingsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `        {/* 5. POLICIES & CANCELLATIONS TAB */}
        {activeTab === 'policies' && (`;

const replacement = `        {/* 6. SECURITY & 2FA TAB */}
        {activeTab === 'security_2fa' && (
          <Security2FASettingsPage
            currentAuthUser={currentAuthUser}
            onBackToSettings={() => setActiveTab('store_info')}
          />
        )}

        {/* 5. POLICIES & CANCELLATIONS TAB */}
        {activeTab === 'policies' && (`;

const modalSnippet = `      </div>

      {/* ── TWO-FACTOR AUTHENTICATION SECURITY GATE MODAL ── */}
      <PaymentSecurityGateModal
        isOpen={is2FAGateOpen}
        onClose={() => setIs2FAGateOpen(false)}
        currentAuthUser={currentAuthUser}
        onSuccess={() => {
          setIs2FAGateOpen(false);
          setActiveTab('payments');
        }}
        onNavigateToSetup2FA={() => {
          setIs2FAGateOpen(false);
          setActiveTab('security_2fa');
        }}
        targetSectionName="Payment Modes & UPI Gateway"
      />
    </div>`;

let norm = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (norm.includes(normTarget)) {
  norm = norm.replace(normTarget, normReplacement);
  console.log('Added Security & 2FA tab content');
} else {
  console.log('Target for tab content not found');
}

const normClosing = "      </div>\n    </div>";
if (norm.includes(normClosing)) {
  norm = norm.replace(normClosing, modalSnippet);
  console.log('Added PaymentSecurityGateModal snippet');
} else {
  console.log('Closing tag not found');
}

content = norm.replace(/\n/g, '\r\n');
fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating GeneralSettingsPage.jsx');
