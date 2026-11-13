import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  Smartphone,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  History,
  FileText,
  Check
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../../config/supabase';
import {
  getAdminSecurityProfile,
  generateTotpSecret,
  generateOtpAuthUri,
  getQrCodeImageUrl,
  verifyTotpCode,
  verifyAdminPassword,
  generateRecoveryCodes,
  sha256Hash,
  logSecurityAuditEvent,
  TOTP_TIME_STEP_SECONDS,
  getRemainingTotpSeconds
} from '../../utils/totpSecurityEngine';

export default function Security2FASettingsPage({ currentAuthUser, onBackToSettings }) {
  const adminEmail = currentAuthUser?.email || 'admin@salbeau.com';
  const DB_CLIENT = supabaseAdmin || supabase;

  // Active Security Profile
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Setup Wizard State: 'idle' | 'scanning' | 'verify' | 'recovery_codes'
  const [setupStep, setSetupStep] = useState('idle');
  const [stagedSecret, setStagedSecret] = useState('');
  const [stagedOtpAuthUri, setStagedOtpAuthUri] = useState('');
  const [stagedQrUrl, setStagedQrUrl] = useState('');
  const [testCodeInput, setTestCodeInput] = useState('');
  const [stagedRecoveryCodes, setStagedRecoveryCodes] = useState([]);
  const [recoveryCodesSaved, setRecoveryCodesSaved] = useState(false);

  // Action States
  const [isActivating, setIsActivating] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  // Disable 2FA Modal / State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  // 30-Second Countdown Meter
  const [secondsRemaining, setSecondsRemaining] = useState(getRemainingTotpSeconds());

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(getRemainingTotpSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch security profile and audit logs
  const loadProfileAndLogs = async () => {
    setIsLoading(true);
    try {
      const secProfile = await getAdminSecurityProfile(adminEmail);
      setProfile(secProfile);

      // Load Recent Audit Logs
      setIsLoadingLogs(true);
      const { data: logs, error: logsError } = await DB_CLIENT
        .from('admin_2fa_audit_logs')
        .select('*')
        .eq('admin_email', (adminEmail || 'admin@salbeau.com').toLowerCase())
        .order('created_at', { ascending: false })
        .limit(20);

      if (!logsError && logs) {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error loading 2FA profile:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadProfileAndLogs();
  }, [adminEmail]);

  // ── START 2FA SETUP WIZARD ──
  const handleInitiate2FASetup = () => {
    setSetupError('');
    setSetupSuccess('');
    setTestCodeInput('');
    setRecoveryCodesSaved(false);

    // 1. Generate unique 160-bit RFC 4648 Base32 Secret
    const secret = generateTotpSecret();
    const uri = generateOtpAuthUri({
      email: adminEmail,
      secret,
      issuer: 'Salbeau'
    });
    const qrUrl = getQrCodeImageUrl(uri, 280);

    setStagedSecret(secret);
    setStagedOtpAuthUri(uri);
    setStagedQrUrl(qrUrl);
    setSetupStep('scanning');

    logSecurityAuditEvent({
      adminId: profile?.user_id || 'admin_root',
      adminEmail,
      action: '2FA_SETUP_INITIATED',
      status: 'SUCCESS'
    });
  };

  // ── VERIFY FIRST OTP BEFORE ACTIVATION ──
  const handleVerifyFirstOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = testCodeInput.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setSetupError('Please enter the 6-digit code shown in your authenticator app.');
      return;
    }

    setIsActivating(true);
    setSetupError('');

    try {
      const result = await verifyTotpCode(cleanCode, stagedSecret, 1);
      if (!result.valid) {
        setSetupError('Incorrect code. Please check Google or Microsoft Authenticator and try again.');
        return;
      }

      // Generate 8 Backup Recovery Codes
      const rawRecoveryCodes = generateRecoveryCodes(8);
      setStagedRecoveryCodes(rawRecoveryCodes);
      setSetupStep('recovery_codes');
    } catch (err) {
      setSetupError(err.message || 'OTP verification failed.');
    } finally {
      setIsActivating(false);
    }
  };

  // ── CONFIRM & SAVE 2FA IN SUPABASE ──
  const handleFinalize2FAActivation = async () => {
    if (!recoveryCodesSaved) {
      setSetupError('Please confirm that you have saved your emergency recovery codes.');
      return;
    }

    setIsActivating(true);
    setSetupError('');

    try {
      // Hash all recovery codes with SHA-256 before saving to database
      const hashedRecoveryCodes = await Promise.all(
        stagedRecoveryCodes.map(async (code) => ({
          hash: await sha256Hash(code),
          used: false,
          created_at: new Date().toISOString()
        }))
      );

      const updatePayload = {
        totp_secret: stagedSecret,
        is_2fa_enabled: true,
        recovery_codes: hashedRecoveryCodes,
        failed_attempts: 0,
        locked_until: null,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await DB_CLIENT
        .from('admin_security_profiles')
        .update(updatePayload)
        .eq('admin_email', adminEmail);

      if (error) throw error;

      await logSecurityAuditEvent({
        adminId: profile?.user_id || 'admin_root',
        adminEmail,
        action: '2FA_ENABLED',
        status: 'SUCCESS',
        details: { provider: 'Google/Microsoft Authenticator', recoveryCount: 8 }
      });

      setSetupSuccess('Two-Factor Authentication activated successfully! Payment gateways are now fully protected.');
      setSetupStep('idle');
      setStagedSecret(''); // Wipe secret from memory
      setStagedQrUrl('');
      await loadProfileAndLogs();
    } catch (err) {
      setSetupError(err.message || 'Failed to activate 2FA.');
    } finally {
      setIsActivating(false);
    }
  };

  // ── DISABLE 2FA HANDLER ──
  const handleDisable2FA = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!disablePassword.trim() || !disableTotpCode.trim()) {
      setDisableError('Please enter both your admin password and current authenticator code.');
      return;
    }

    setIsDisabling(true);
    setDisableError('');

    try {
      // 1. Verify Password
      const passRes = await verifyAdminPassword(adminEmail, disablePassword, profile);
      if (!passRes.success) {
        setDisableError(passRes.reason || 'Incorrect administrator password.');
        return;
      }

      // 2. Verify Current TOTP Code
      const totpRes = await verifyTotpCode(disableTotpCode, profile.totp_secret, 1);
      if (!totpRes.valid) {
        setDisableError('Invalid authenticator code. Please check your app.');
        return;
      }

      // 3. Disable in DB
      const { error } = await DB_CLIENT
        .from('admin_security_profiles')
        .update({
          is_2fa_enabled: false,
          totp_secret: null,
          recovery_codes: [],
          updated_at: new Date().toISOString()
        })
        .eq('admin_email', adminEmail);

      if (error) throw error;

      await logSecurityAuditEvent({
        adminId: profile?.user_id || 'admin_root',
        adminEmail,
        action: '2FA_DISABLED',
        status: 'SUCCESS'
      });

      setIsDisableModalOpen(false);
      setDisablePassword('');
      setDisableTotpCode('');
      setSetupSuccess('Two-Factor Authentication has been disabled.');
      await loadProfileAndLogs();
    } catch (err) {
      setDisableError(err.message || 'Failed to disable 2FA.');
    } finally {
      setIsDisabling(false);
    }
  };

  // ── COPY SECRET KEY TO CLIPBOARD ──
  const handleCopySecret = () => {
    navigator.clipboard.writeText(stagedSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // ── DOWNLOAD RECOVERY CODES ──
  const handleDownloadRecoveryCodes = () => {
    const textContent = [
      '================================================================',
      'SALBEAU BEAUTY — EMERGENCY 2FA BACKUP RECOVERY CODES',
      '================================================================',
      `Account: ${adminEmail}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Keep these codes safe! Each code can be used ONCE to access your',
      'admin account and payment configurations if you lose your phone.',
      '',
      ...stagedRecoveryCodes.map((code, idx) => `${idx + 1}. ${code}`),
      '',
      'Store in a password manager or safe physical location.',
      '================================================================'
    ].join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salbeau_2fa_recovery_codes_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setRecoveryCodesSaved(true);
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(stagedRecoveryCodes.join('\n'));
    setCopiedRecovery(true);
    setRecoveryCodesSaved(true);
    setTimeout(() => setCopiedRecovery(false), 2500);
  };

  const remainingRecoveryCount = Array.isArray(profile?.recovery_codes)
    ? profile.recovery_codes.filter(rc => !rc.used).length
    : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-[#D81B60] text-white flex items-center justify-center font-bold shadow-sm">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Security & Two-Factor Authentication</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Protect payment gateways, UPI credentials, and administrative operations with RFC 6238 TOTP authentication.
            </p>
          </div>
        </div>

        {typeof onBackToSettings === 'function' && (
          <button
            type="button"
            onClick={onBackToSettings}
            className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            ← Back to Settings
          </button>
        )}
      </div>

      {/* ── ALERTS ── */}
      {setupSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{setupSuccess}</span>
        </div>
      )}

      {/* ── MAIN 2FA STATUS & CONFIGURATION CARD ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Security Status</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-lg font-black text-gray-900">
                {profile?.is_2fa_enabled ? 'Authenticator App (TOTP) Active' : 'Two-Factor Authentication Disabled'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  profile?.is_2fa_enabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {profile?.is_2fa_enabled ? (
                  <>
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Protected</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={14} className="text-rose-600" />
                    <span>Vulnerable</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div>
            {profile?.is_2fa_enabled ? (
              <button
                type="button"
                onClick={() => {
                  setDisableError('');
                  setDisablePassword('');
                  setDisableTotpCode('');
                  setIsDisableModalOpen(true);
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Disable 2FA Protection
              </button>
            ) : setupStep === 'idle' ? (
              <button
                type="button"
                onClick={handleInitiate2FASetup}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-[#D81B60] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <KeyRound size={15} />
                <span>Enable Two-Factor Authentication (2FA)</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* ── ACTIVE 2FA METRICS ── */}
        {profile?.is_2fa_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">Authenticator</span>
              <span className="text-sm font-black text-purple-950 mt-1 block">Google / Microsoft Authenticator</span>
              <span className="text-[10px] text-purple-700/80 font-medium">Standard RFC 6238 (30s Time-Step)</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Backup Recovery Codes</span>
              <span className="text-sm font-black text-emerald-950 mt-1 block">
                {remainingRecoveryCount} of 8 Codes Remaining
              </span>
              <span className="text-[10px] text-emerald-700/80 font-medium">One-time emergency access keys</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">Last Verification</span>
              <span className="text-sm font-black text-gray-900 mt-1 block">
                {profile?.last_verified_at ? new Date(profile.last_verified_at).toLocaleDateString() : 'Active Session'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">Failed Attempts: {profile?.failed_attempts || 0} / 5</span>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SETUP WIZARD: STEP 1 (SCAN QR CODE & SECRET)                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        {setupStep === 'scanning' && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/60 via-pink-50/30 to-white border border-purple-200 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-black text-purple-950">
                  Step 1: Link Authenticator App via QR Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSetupStep('idle')}
                className="text-xs text-gray-500 hover:text-gray-800 font-bold underline cursor-pointer"
              >
                Cancel Setup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-purple-200 shadow-md">
                  <img
                    src={stagedQrUrl}
                    alt="Salbeau 2FA QR Code"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                </div>
                <span className="text-[11px] text-purple-800 font-bold mt-2 flex items-center gap-1">
                  <QrCode size={13} />
                  <span>Scan with Google Authenticator or Microsoft Authenticator</span>
                </span>
              </div>

              {/* Instructions & Secret Key */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Quick Setup Guide</h4>
                  <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 font-medium leading-relaxed">
                    <li>
                      Open <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or your preferred authenticator app on your phone.
                    </li>
                    <li>Tap the <strong>+ (Add)</strong> button and choose <strong>"Scan a QR code"</strong>.</li>
                    <li>Point your camera at the QR code on the left.</li>
                    <li>If camera scan is unavailable, enter the secret key below manually.</li>
                  </ol>
                </div>

                {/* Manual Secret Key */}
                <div className="p-3.5 bg-white rounded-xl border border-purple-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Manual Entry Secret Key (Never Share)
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-purple-950 tracking-widest break-all">
                      {stagedSecret}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>

                {/* Input verification test code */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Enter the 6-Digit Code displayed in your Authenticator App:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      value={testCodeInput}
                      onChange={(e) => setTestCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 482910"
                      className="w-48 px-4 py-2.5 rounded-xl border-2 border-purple-300 font-mono font-black text-sm text-purple-950 outline-none focus:border-purple-600 bg-white tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyFirstOtp}
                      disabled={isActivating || testCodeInput.trim().length !== 6}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isActivating ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {setupError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span>{setupError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SETUP WIZARD: STEP 2 (SAVE BACKUP RECOVERY CODES)              */}
        {/* ───────────────────────────────────────────────────────────── */}
        {setupStep === 'recovery_codes' && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-purple-50/20 to-white border border-emerald-200 space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-100">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-black text-emerald-950">
                Step 2: Save Emergency Backup Recovery Codes
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl font-medium">
              If you lose access to your phone or authenticator app, these emergency backup codes are the only way to recover access to your payment configurations. Each code can only be used once.
            </p>

            {/* Grid of Recovery Codes */}
            <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stagedRecoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center font-mono font-bold text-xs text-gray-900 tracking-wider shadow-2xs select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadRecoveryCodes}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Codes (.txt)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyRecoveryCodes}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedRecovery ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedRecovery ? 'Copied to Clipboard' : 'Copy All Codes'}</span>
              </button>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={recoveryCodesSaved}
                onChange={(e) => setRecoveryCodesSaved(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-gray-800">
                I have securely saved these 8 recovery codes in a safe place.
              </span>
            </label>

            {setupError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSetupStep('scanning')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleFinalize2FAActivation}
                disabled={isActivating || !recoveryCodesSaved}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isActivating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Activating Protection...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Complete & Activate 2FA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SECURITY AUDIT LOGS TABLE ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Security Verification Audit Trail</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Immutable event logs for payment gateway access, 2FA verifications, and failed attempts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProfileAndLogs}
            className="p-1.5 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-medium">
            No audit records yet. All security verification attempts will appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Details / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-gray-900">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 truncate max-w-xs text-[11px]">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: DISABLE 2FA CONFIRMATION ── */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Disable Two-Factor Authentication</h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Requires current password and live authenticator OTP.
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-800 bg-rose-50/80 p-3 rounded-xl border border-rose-200 leading-relaxed">
              ⚠️ Warning: Disabling 2FA leaves your payment gateway and UPI configuration vulnerable to unauthorized changes.
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter login password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Current 6-Digit Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={disableTotpCode}
                  onChange={(e) => setDisableTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 529103"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold outline-none focus:border-rose-500 text-center tracking-widest"
                />
              </div>

              {disableError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                  {disableError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisableModalOpen(false)}
                  disabled={isDisabling}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabling || !disablePassword.trim() || disableTotpCode.length !== 6}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isDisabling ? 'Verifying...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

