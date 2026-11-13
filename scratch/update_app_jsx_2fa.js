import fs from 'fs';

const path = 'admin/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add lazy import
const importTarget = "const UpiPaymentVerificationPage = React.lazy(() => import('./components/payments/UpiPaymentVerificationPage'));";
const importReplacement = "const UpiPaymentVerificationPage = React.lazy(() => import('./components/payments/UpiPaymentVerificationPage'));\nconst Security2FASettingsPage = React.lazy(() => import('./components/security/Security2FASettingsPage'));";

if (content.includes(importTarget)) {
  content = content.replace(importTarget, importReplacement);
} else {
  console.log('importTarget not found');
}

// 2. Add Tab Title
const titleTarget = "{activeTab === 'branches' && 'Branch Management — Store Locations'}";
const titleReplacement = "{activeTab === 'branches' && 'Branch Management — Store Locations'}\n                  {activeTab === 'security_2fa' && 'Security & Two-Factor Authentication (2FA) — Gateway Protection'}";

if (content.includes(titleTarget)) {
  content = content.replace(titleTarget, titleReplacement);
} else {
  console.log('titleTarget not found');
}

// 3. Add Tab Module Rendering
const renderTarget = `{/* UPI PAYMENT VERIFICATION MODULE */}
          {activeTab === 'upi_verification' && (
            <React.Suspense fallback={<PageLoadingFallback />}>
              <UpiPaymentVerificationPage />
            </React.Suspense>
          )}`;

const renderReplacement = `{/* UPI PAYMENT VERIFICATION MODULE */}
          {activeTab === 'upi_verification' && (
            <React.Suspense fallback={<PageLoadingFallback />}>
              <UpiPaymentVerificationPage />
            </React.Suspense>
          )}

          {/* SECURITY & 2FA MODULE */}
          {activeTab === 'security_2fa' && (
            <React.Suspense fallback={<PageLoadingFallback />}>
              <Security2FASettingsPage
                currentAuthUser={currentAuthUser}
                onBackToSettings={() => navigateToTab('settings')}
              />
            </React.Suspense>
          )}`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
if (normalizedContent.includes(renderTarget)) {
  const newNormalized = normalizedContent.replace(renderTarget, renderReplacement);
  // Restore \r\n if needed
  content = newNormalized.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated App.jsx with 2FA module');
} else {
  console.log('renderTarget not found');
}

