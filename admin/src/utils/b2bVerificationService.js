/**
 * Salbeau B2B Professional Verification Service (Admin Side)
 * Complete verification review engine, status transitions, history logging & realtime sync.
 */

export const B2B_ROLES = ['salon', 'artist', 'beautician'];
export const ALL_ROLES = ['general', 'salon', 'artist', 'beautician'];

export const ROLE_LABELS = {
  general: 'General User (B2C)',
  salon: 'Salon (B2B)',
  artist: 'Makeup Artist (B2B)',
  beautician: 'Beautician (B2B)'
};

export const ROLE_SHORT_TITLES = {
  general: 'General User',
  salon: 'Salon',
  artist: 'Makeup Artist',
  beautician: 'Beautician'
};

export const VERIFICATION_STATUSES = {
  all: {
    key: 'all',
    label: 'All Applications',
    badgeColor: '#4B5563',
    badgeBg: '#F3F4F6'
  },
  submitted: {
    key: 'submitted',
    label: 'Pending / Submitted',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7'
  },
  under_review: {
    key: 'under_review',
    label: 'Under Review',
    badgeColor: '#2563EB',
    badgeBg: '#DBEAFE'
  },
  approved: {
    key: 'approved',
    label: 'Approved',
    badgeColor: '#059669',
    badgeBg: '#D1FAE5'
  },
  rejected: {
    key: 'rejected',
    label: 'Rejected',
    badgeColor: '#DC2626',
    badgeBg: '#FEE2E2'
  },
  resubmission_required: {
    key: 'resubmission_required',
    label: 'Resubmission Required',
    badgeColor: '#EA580C',
    badgeBg: '#FFEDD5'
  },
  suspended: {
    key: 'suspended',
    label: 'Suspended',
    badgeColor: '#7F1D1D',
    badgeBg: '#FEE2E2'
  }
};

export const STANDARD_DOCUMENT_SLOTS = [
  { key: 'pan_card', label: 'PAN Card', hint: 'Personal or Business PAN card', required: false },
  { key: 'government_id', label: 'Aadhaar / Government ID', hint: 'Aadhaar, Voter ID, or Passport', required: false },
  { key: 'business_registration', label: 'Business Registration Certificate', hint: 'Shop & Establishment, MSME, or Udyam', required: false },
  { key: 'gst_certificate', label: 'GST Certificate', hint: 'Official GSTIN registration certificate', required: false },
  { key: 'professional_license', label: 'Professional License / Certificate', hint: 'Cosmetology diploma, salon license, or academy cert', required: false },
  { key: 'business_proof', label: 'Business Proof', hint: 'Electricity bill, rental agreement, or signage photo', required: false },
  { key: 'additional_document', label: 'Additional Document', hint: 'Any other relevant trade or portfolio document', required: false }
];

// Cache whether the dedicated table exists to avoid spamming the console with 404s
let isB2BTableAvailable = null;
let lastB2BTableCheckTime = 0;

/**
 * Fetch all B2B applications with associated documents, history, and user data.
 */
export const fetchAllB2BVerifications = async (supabase) => {
  if (!supabase) return [];

  let verifications = [];

  // 1. Try dedicated public.b2b_verifications table if available or re-checking after 60s
  const shouldTryTable = isB2BTableAvailable !== false || (Date.now() - lastB2BTableCheckTime > 60000);

  if (shouldTryTable) {
    try {
      const { data: vData, error: vErr } = await supabase
        .from('b2b_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (vErr) {
        if (vErr.code === 'PGRST205' || vErr.message?.includes('schema cache') || vErr.message?.includes('not found')) {
          isB2BTableAvailable = false;
          lastB2BTableCheckTime = Date.now();
        }
      } else if (Array.isArray(vData)) {
        isB2BTableAvailable = true;
        if (vData.length > 0) {
          // Fetch documents & history in parallel
          const [docsRes, histRes] = await Promise.all([
            supabase.from('verification_documents').select('*'),
            supabase.from('verification_history').select('*').order('created_at', { ascending: false })
          ]);

          const docsByVId = {};
          (docsRes.data || []).forEach(doc => {
            if (!docsByVId[doc.verification_id]) docsByVId[doc.verification_id] = [];
            docsByVId[doc.verification_id].push(doc);
          });

          const histByVId = {};
          (histRes.data || []).forEach(h => {
            if (!histByVId[h.verification_id]) histByVId[h.verification_id] = [];
            histByVId[h.verification_id].push(h);
          });

          verifications = vData.map(v => ({
            ...v,
            documents: docsByVId[v.id] || [],
            history: histByVId[v.id] || []
          }));
        }
      }
    } catch (err) {
      isB2BTableAvailable = false;
      lastB2BTableCheckTime = Date.now();
    }
  }

  // 2. Also check fallback sync row in brands table
  try {
    const { data: syncRow } = await supabase
      .from('brands')
      .select('logo')
      .eq('id', 'salbeau_b2b_verifications_sync')
      .maybeSingle();

    if (syncRow?.logo) {
      const parsed = JSON.parse(syncRow.logo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge without duplicating IDs
        const existingIds = new Set(verifications.map(v => v.id));
        for (const item of parsed) {
          if (!existingIds.has(item.id)) {
            verifications.push(item);
            existingIds.add(item.id);
          }
        }
      }
    }
  } catch (e) {
    // Silent notice
  }

  // 3. Synthesize any registered users with role in ['salon', 'artist', 'beautician']
  // from public.users table so Admin sees real DB customer accounts immediately
  try {
    const { data: usersData } = await supabase.from('users').select('*');
    if (Array.isArray(usersData)) {
      const existingUserIds = new Set(verifications.map(v => v.user_id || v.userId));

      for (const u of usersData) {
        const uRole = (u.role || '').toLowerCase();
        if (B2B_ROLES.includes(uRole) && !existingUserIds.has(u.id)) {
          const rawStatus = (u.verification_status || 'submitted').toLowerCase();
          const isVerified = rawStatus === 'verified' || rawStatus === 'approved' || Boolean(u.b2b_verified);
          const normalizedStatus = isVerified ? 'approved' : (rawStatus === 'verified' ? 'approved' : (rawStatus || 'submitted'));

          verifications.push({
            id: `v_${u.id}`,
            user_id: u.id,
            role: uRole,
            business_name: u.business_name || `${u.name || 'Professional'} Studio`,
            professional_name: u.full_name || u.name,
            name: u.full_name || u.name,
            phone: u.phone,
            email: u.email || '',
            address: `${u.city || ''}, ${u.state || ''} ${u.pincode ? `(${u.pincode})` : ''}`.trim(),
            city: u.city || '',
            state: u.state || '',
            pincode: u.pincode || '',
            experience: '2+ Years',
            verification_status: normalizedStatus,
            b2b_verified: isVerified,
            submitted_at: u.last_active || u.created_at || new Date().toISOString(),
            documents: [],
            history: []
          });
        }
      }
    }
  } catch (e) {
    console.warn('Synthesize user verifications error:', e);
  }

  return verifications;
};

/**
 * Execute an Admin Action on an Application:
 * - 'approve'
 * - 'reject'
 * - 'resubmission_required'
 * - 'under_review'
 * - 'suspend'
 */
export const updateVerificationStatus = async (supabase, {
  verificationId,
  userId,
  action, // 'approved', 'rejected', 'resubmission_required', 'under_review', 'suspended'
  reason = '',
  adminNotes = '',
  requestedDocuments = [],
  adminUser = { id: 'admin', name: 'Salbeau Admin' }
}) => {
  const timestamp = new Date().toISOString();
  const newStatus = action;
  const isApproved = action === 'approved';

  // 1. Log history
  const historyRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    verification_id: verificationId,
    user_id: userId,
    action: action,
    new_status: newStatus,
    reason: reason || adminNotes || `Admin action: ${action}`,
    admin_id: adminUser?.id || 'admin',
    admin_name: adminUser?.name || 'Salbeau Admin',
    created_at: timestamp
  };

  // 2. Notification payload for Customer
  const docLabels = requestedDocuments.map(k => {
    const found = STANDARD_DOCUMENT_SLOTS.find(s => s.key === k);
    return found ? found.label : k;
  });

  const notificationTitles = {
    approved: 'Congratulations! Your B2B Account is Verified',
    rejected: 'Professional Verification Update',
    resubmission_required: docLabels.length > 0 ? 'Documents Requested by Verification Desk' : 'Verification Update Required',
    suspended: 'Professional Account Suspended',
    under_review: 'Verification Under Review'
  };

  const notificationMessages = {
    approved: 'Your professional credentials have been approved! B2B wholesale pricing is now active on your account.',
    rejected: `Your verification could not be approved. Reason: ${reason || 'Details could not be verified.'}`,
    resubmission_required: docLabels.length > 0
      ? `Please upload your ${docLabels.join(', ')} to complete verification. Note: ${reason || 'Required for business approval.'}`
      : `Please update your information: ${reason || 'Additional documents or corrections needed.'}`,
    suspended: `Your professional B2B pricing has been suspended. Reason: ${reason || 'Admin administrative review.'}`,
    under_review: 'Our verification team is currently reviewing your submitted professional documents.'
  };

  const customerNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    target: 'customer',
    title: notificationTitles[action] || 'Verification Status Updated',
    message: notificationMessages[action] || `Your verification status changed to ${action}.`,
    type: `b2b_${action}`,
    data: { verificationId, status: newStatus, reason, action, requestedDocuments },
    is_read: false,
    created_at: timestamp
  };

  // 3. Update public.b2b_verifications
  try {
    const vUpdates = {
      verification_status: newStatus,
      admin_notes: adminNotes || null,
      rejection_reason: (action === 'rejected' || action === 'resubmission_required') ? reason : null,
      requested_documents: requestedDocuments || [],
      reviewed_at: timestamp,
      reviewed_by: adminUser?.name || 'Salbeau Admin',
      updated_at: timestamp
    };

    await supabase
      .from('b2b_verifications')
      .update(vUpdates)
      .eq('id', verificationId);

    // Insert history
    await supabase.from('verification_history').insert(historyRecord);

    // Insert customer notification
    await supabase.from('notifications').insert(customerNotification);
  } catch (err) {
    console.warn('b2b_verifications DB table update error:', err);
  }

  // 4. Update public.users table (The single source of truth for B2B Pricing eligibility)
  try {
    const userUpdates = {
      verification_status: newStatus,
      b2b_verified: isApproved,
      verified_by: isApproved ? (adminUser?.name || 'Salbeau Admin') : null,
      verification_approved_at: isApproved ? timestamp : null,
      verification_rejected_at: (action === 'rejected' || action === 'resubmission_required') ? timestamp : null
    };

    const { error: uErr } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    if (uErr) {
      // Fallback update if new columns not yet migrated
      await supabase.from('users').update({
        verification_status: newStatus
      }).eq('id', userId);
    }
  } catch (uErr) {
    console.warn('User table update verification status error:', uErr);
  }

  // 5. Update fallback sync row in brands
  try {
    const { data: syncRow } = await supabase
      .from('brands')
      .select('logo')
      .eq('id', 'salbeau_b2b_verifications_sync')
      .maybeSingle();

    if (syncRow?.logo) {
      let list = JSON.parse(syncRow.logo);
      if (Array.isArray(list)) {
        list = list.map(item => {
          if (item.id === verificationId || item.user_id === userId || item.userId === userId) {
            return {
              ...item,
              verification_status: newStatus,
              b2b_verified: isApproved,
              rejection_reason: (action === 'rejected' || action === 'resubmission_required') ? reason : null,
              requested_documents: requestedDocuments || [],
              admin_notes: adminNotes || item.admin_notes,
              reviewed_at: timestamp,
              reviewed_by: adminUser?.name || 'Salbeau Admin',
              history: [historyRecord, ...(item.history || [])]
            };
          }
          return item;
        });

        await supabase.from('brands').upsert({
          id: 'salbeau_b2b_verifications_sync',
          name: 'B2B Verifications Sync',
          logo: JSON.stringify(list),
          enabled: true
        });
      }
    }
  } catch (e) {
    console.warn('Sync row fallback update error:', e);
  }

  return {
    success: true,
    verificationId,
    newStatus,
    b2bVerified: isApproved,
    historyRecord
  };
};
