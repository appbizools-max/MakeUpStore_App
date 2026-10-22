import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Ban,
  MessageCircle,
  ExternalLink,
  Tag,
  Building2,
  RefreshCw
} from 'lucide-react';
import { ROLE_SHORT_TITLES, isUserB2BVerified } from '../utils/b2bVerificationService';

export const VerificationStatusScreen = () => {
  const {
    userRole,
    userProfile,
    userVerificationRecord,
    loadUserB2BVerification,
    setCurrentScreen
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      loadUserB2BVerification(userProfile.id);
    }
  }, [userProfile?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserB2BVerification(userProfile?.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const status = (userProfile?.verificationStatus || userVerificationRecord?.verification_status || 'submitted').toLowerCase();
  const effectiveRole = userRole || userProfile?.role || 'salon';
  const roleTitle = ROLE_SHORT_TITLES[effectiveRole] || effectiveRole;
  const isApproved = status === 'approved' && isUserB2BVerified(userProfile);
  const isResubmission = status === 'resubmission_required' || status === 'rejected';
  const isSuspended = status === 'suspended';
  const isPending = status === 'submitted' || status === 'under_review';

  const documents = userVerificationRecord?.documents || [];
  const submittedDate = userVerificationRecord?.submitted_at
    ? new Date(userVerificationRecord.submitted_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    : 'Recently';

  const rejectionReason = userProfile?.rejectionReason || userVerificationRecord?.rejection_reason || 'Please update your business document details.';

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#FCE4EC] sticky top-0 z-30 px-6 py-3.5 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-9 h-9 rounded-full bg-[#FFF0F5] hover:bg-[#FDE2EC] flex items-center justify-center text-[#C2477A] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-sm font-black text-[#3A2430]">
            Professional Account Verification
          </h1>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <h2
            style={{ fontFamily: "'Great Vibes', cursive" }}
            className="text-4xl text-[#C2477A] font-normal tracking-wide drop-shadow-sm mb-1"
          >
            Salbeau
          </h2>
          <p className="text-xs text-[#8C7078] font-bold tracking-wider uppercase">
            {roleTitle} Verification Hub
          </p>
        </div>

        {/* 1. UNDER REVIEW / PENDING */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 mb-6 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Clock size={32} />
            </div>

            <span className="bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-block mb-3">
              Under Review
            </span>

            <h3 className="text-xl font-black text-blue-950 mb-2">
              Your Professional Account is Under Review
            </h3>

            <p className="text-xs text-blue-800 leading-relaxed max-w-md mx-auto mb-6 font-medium">
              Your professional account details have been submitted successfully. Our team is reviewing your documents and verifying your credentials.
            </p>

            <div className="bg-white rounded-2xl p-5 border border-blue-100 max-w-md mx-auto text-left space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-blue-50">
                <span className="text-stone-500 font-medium">Applied Account Role</span>
                <span className="font-bold text-stone-900">{roleTitle}</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-2 border-b border-blue-50">
                <span className="text-stone-500 font-medium">Submission Date</span>
                <span className="font-bold text-stone-900">{submittedDate}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Current Catalog Pricing</span>
                <span className="font-bold text-amber-600">Standard Retail (Until Approved)</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. RESUBMISSION REQUIRED */}
        {isResubmission && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-8 mb-6 shadow-xs">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <AlertTriangle size={32} />
              </div>

              <span className="bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-block mb-2">
                Verification Update Required
              </span>

              <h3 className="text-xl font-black text-amber-950">
                Action Required On Your Application
              </h3>
            </div>

            {/* Admin Reason Box */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200 mb-6 shadow-2xs">
              <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-1">
                Admin Review Note / Revision Request:
              </h4>
              <p className="text-xs text-stone-800 font-semibold leading-relaxed">
                "{rejectionReason}"
              </p>
            </div>

            <button
              onClick={() => setCurrentScreen('b2b_verification')}
              className="w-full bg-[#C2477A] hover:bg-[#a83765] text-white py-4 rounded-full font-black text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Update Details & Resubmit</span>
            </button>
          </div>
        )}

        {/* 3. APPROVED */}
        {isApproved && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-8 mb-6 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <ShieldCheck size={36} />
            </div>

            <span className="bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-block mb-2">
              Verified B2B Professional
            </span>

            <h3 className="text-xl font-black text-emerald-950 mb-1">
              Account Approved & Verified!
            </h3>

            <p className="text-xs text-emerald-800 font-medium max-w-md mx-auto mb-6">
              Exclusive {roleTitle} wholesale pricing and bulk quantity tier discounts are now fully activated.
            </p>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 max-w-md mx-auto mb-6 text-left shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-emerald-900 font-black text-xs">
                <Tag size={16} className="text-emerald-600" />
                <span>{roleTitle} Pricing Activated</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                You can now purchase products directly at exclusive B2B wholesale prices with bulk quantity tier volume savings.
              </p>
            </div>

            <button
              onClick={() => setCurrentScreen('home')}
              className="w-full bg-[#C2477A] hover:bg-[#a83765] text-white py-4 rounded-full font-black text-sm shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              Explore Products with {roleTitle} Pricing
            </button>
          </div>
        )}

        {/* 4. SUSPENDED */}
        {isSuspended && (
          <div className="bg-rose-50 border border-rose-300 rounded-3xl p-8 mb-6 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Ban size={32} />
            </div>

            <span className="bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-block mb-2">
              Account Suspended
            </span>

            <h3 className="text-xl font-black text-rose-950 mb-2">
              B2B Professional Pricing Suspended
            </h3>

            <p className="text-xs text-rose-800 max-w-md mx-auto mb-6 leading-relaxed">
              Your professional pricing access has been temporarily suspended by the administrator. Regular catalog pricing remains active.
            </p>

            <a
              href="https://wa.me/919876543210?text=Inquiry%20regarding%20suspended%20B2B%20verification"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white py-3 px-6 rounded-full font-bold text-xs shadow-md transition-all"
            >
              <MessageCircle size={16} />
              <span>Contact Salbeau Support Desk</span>
            </a>
          </div>
        )}

        {/* DOCUMENTS LIST */}
        {documents.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 mb-6 shadow-xs">
            <h4 className="text-xs font-black text-[#3A2430] uppercase tracking-wider mb-4 pb-2 border-b border-stone-100">
              Submitted Verification Documents ({documents.length})
            </h4>

            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.file_url || doc.url}
                      alt={doc.file_name || doc.name}
                      className="w-11 h-11 rounded-xl object-cover bg-stone-200 border border-stone-200"
                    />
                    <div>
                      <h5 className="text-xs font-black text-stone-900">{doc.file_name || doc.name}</h5>
                      <span className="text-[10px] font-bold text-stone-500 uppercase mt-0.5 block">
                        {(doc.document_type || doc.type || 'proof').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPORT / CONTACT */}
        <div className="bg-[#FFF5F8] border border-[#FCE4EC] rounded-3xl p-6 mb-6 shadow-xs">
          <h4 className="text-xs font-black text-[#3A2430] mb-1">
            Need Help With Your Professional Account?
          </h4>
          <p className="text-xs text-[#8C7078] mb-4 leading-relaxed">
            Our verification desk is available Monday to Saturday to assist you with document requirements.
          </p>

          <a
            href="https://wa.me/919876543210?text=Hello%20Salbeau%20Support,%20I%20have%20an%20inquiry%20regarding%20my%20B2B%20verification"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-[#C2477A] text-[#C2477A] hover:bg-[#C2477A] hover:text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all"
          >
            <MessageCircle size={15} />
            <span>Chat with Salbeau Verification Team</span>
          </a>
        </div>

        {/* CONTINUE TO CATALOG */}
        {!isApproved && (
          <div className="text-center">
            <button
              onClick={() => setCurrentScreen('home')}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
            >
              Continue to Retail Catalog →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
