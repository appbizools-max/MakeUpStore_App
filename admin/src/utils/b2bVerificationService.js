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

/**
 * SEC-03: Generate a secure short-lived signed URL for private B2B verification documents.
 * Prevents unauthorized public leakage of sensitive business tax/ID documents.
 */
export const getVerificationDocumentSignedUrl = async (supabase, doc, expiresIn = 3600) => {
  if (!doc) return '';
  if (typeof doc === 'string' && (doc.startsWith('data:image/') || doc.startsWith('blob:'))) {
    return doc;
  }

  let rawPath = '';
  if (typeof doc === 'string') {
    rawPath = doc;
  } else if (typeof doc === 'object') {
    rawPath = doc.path || doc.file_path || doc.filePath || doc.file_url || doc.url || '';
  }

  if (!rawPath) return '';

  // If it's a signed URL already with a valid token, return it
  if (rawPath.includes('token=') && rawPath.startsWith('http')) {
    return rawPath;
  }

  // Extract storage path if a full Supabase URL was passed
  let cleanPath = rawPath;
  const bucketMarker = '/verification-docs/';
  if (cleanPath.includes(bucketMarker)) {
    cleanPath = cleanPath.substring(cleanPath.indexOf(bucketMarker) + bucketMarker.length).split('?')[0];
  } else if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    // External link
    return cleanPath;
  }

  try {
    if (supabase?.storage) {
      const { data, error } = await supabase.storage
        .from('verification-docs')
        .createSignedUrl(cleanPath, expiresIn);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    }
  } catch (err) {
    console.warn('Failed to generate signed document URL:', err);
  }

  return rawPath;
};

// ==============================================================================
// B2B SPECIALIZATIONS & EXPERIENCE MASTER ENGINE
// ==============================================================================

export const B2B_EXPERIENCE_OPTIONS = [
  'Fresher',
  '<1 Year',
  '1–3 Years',
  '3–5 Years',
  '5–10 Years',
  '10–15 Years',
  '15+ Years'
];

export const DEFAULT_SPECIALIZATIONS_MASTER = [
  // Salon
  { id: 'spec_salon_1', role: 'salon', name: 'Unisex Salon', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_2', role: 'salon', name: 'Women Salon', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_3', role: 'salon', name: "Men's Salon", isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_4', role: 'salon', name: 'Spa & Wellness', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_5', role: 'salon', name: 'Hair Studio', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_6', role: 'salon', name: 'Bridal Studio', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_7', role: 'salon', name: 'Nail Bar & Studio', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_salon_8', role: 'salon', name: 'Aesthetic Skin Clinic', isActive: true, isApproved: true, isCustom: false },
  // Makeup Artist
  { id: 'spec_artist_1', role: 'artist', name: 'Bridal Makeup', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_2', role: 'artist', name: 'Fashion & Editorial', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_3', role: 'artist', name: 'Freelance Artist', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_4', role: 'artist', name: 'Celebrity & TV', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_5', role: 'artist', name: 'Makeup Academy', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_6', role: 'artist', name: 'Party & Events', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_7', role: 'artist', name: 'Airbrush & HD Makeup', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_artist_8', role: 'artist', name: 'SFX & Theatrical Makeup', isActive: true, isApproved: true, isCustom: false },
  // Beautician
  { id: 'spec_beautician_1', role: 'beautician', name: 'Skin Care & Facial', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_2', role: 'beautician', name: 'Hair Styling & Color', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_3', role: 'beautician', name: 'Nail & Lash Art', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_4', role: 'beautician', name: 'Aesthetic & Laser', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_5', role: 'beautician', name: 'Freelance Beauty', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_6', role: 'beautician', name: 'Spa Therapist', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_7', role: 'beautician', name: 'Eyebrow & Microblading', isActive: true, isApproved: true, isCustom: false },
  { id: 'spec_beautician_8', role: 'beautician', name: 'Body Polishing & Waxing', isActive: true, isApproved: true, isCustom: false },
];

export const fetchSpecializationsMaster = async (supabaseClient) => {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('salbeau_b2b_specializations_master');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (supabaseClient) {
              fetchSpecializationsFromDb(supabaseClient).then(remote => {
                if (remote && remote.length) {
                  localStorage.setItem('salbeau_b2b_specializations_master', JSON.stringify(remote));
                }
              }).catch(() => {});
            }
            return parsed;
          }
        } catch (_) {}
      }
    }

    if (supabaseClient) {
      const remote = await fetchSpecializationsFromDb(supabaseClient);
      if (remote && remote.length) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('salbeau_b2b_specializations_master', JSON.stringify(remote));
        }
        return remote;
      }
    }
  } catch (err) {
    console.warn('fetchSpecializationsMaster error:', err);
  }

  return DEFAULT_SPECIALIZATIONS_MASTER;
};

const fetchSpecializationsFromDb = async (supabaseClient) => {
  try {
    const { data, error } = await supabaseClient
      .from('brands')
      .select('logo')
      .eq('id', 'salbeau_b2b_specializations_master')
      .maybeSingle();

    if (!error && data?.logo) {
      const parsed = JSON.parse(data.logo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        const existingNames = new Set(parsed.map(p => `${p.role}:${(p.name || '').toLowerCase()}`));
        DEFAULT_SPECIALIZATIONS_MASTER.forEach(def => {
          if (!existingNames.has(`${def.role}:${def.name.toLowerCase()}`)) {
            merged.push(def);
          }
        });
        return merged;
      }
    }
  } catch (e) {
    console.warn('Error reading specializations from DB:', e);
  }
  return DEFAULT_SPECIALIZATIONS_MASTER;
};

export const saveSpecializationsMaster = async (supabaseClient, list) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('salbeau_b2b_specializations_master', JSON.stringify(list));
  }

  if (!supabaseClient) return list;

  try {
    await supabaseClient.from('brands').upsert({
      id: 'salbeau_b2b_specializations_master',
      name: 'B2B Specializations Master',
      brand_name: 'B2B Specializations Master',
      logo: JSON.stringify(list),
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Error saving specializations to DB:', e);
  }

  return list;
};

export const suggestSpecialization = async (supabaseClient, { name, role, suggestedBy = 'User' }) => {
  const currentList = await fetchSpecializationsMaster(supabaseClient);
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Specialization name cannot be empty');

  const duplicate = currentList.find(
    s => s.role === role && s.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  if (duplicate) {
    return { item: duplicate, isDuplicate: true };
  }

  const newEntry = {
    id: `spec_sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    role: role || 'salon',
    isActive: true,
    isApproved: false,
    isCustom: true,
    suggestedBy: suggestedBy || 'User',
    createdAt: new Date().toISOString()
  };

  const updated = [newEntry, ...currentList];
  await saveSpecializationsMaster(supabaseClient, updated);
  return { item: newEntry, isDuplicate: false, updatedList: updated };
};

export const adminAddSpecialization = async (supabaseClient, { name, role }) => {
  const currentList = await fetchSpecializationsMaster(supabaseClient);
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Specialization name is required');

  const duplicate = currentList.find(
    s => s.role === role && s.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Specialization "${cleanName}" already exists for ${role}.`);
  }

  const newEntry = {
    id: `spec_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    role: role || 'salon',
    isActive: true,
    isApproved: true,
    isCustom: false,
    suggestedBy: 'Admin',
    createdAt: new Date().toISOString()
  };

  const updated = [newEntry, ...currentList];
  await saveSpecializationsMaster(supabaseClient, updated);
  return updated;
};

export const adminUpdateSpecialization = async (supabaseClient, id, updates) => {
  const currentList = await fetchSpecializationsMaster(supabaseClient);
  
  if (updates.name) {
    const cleanName = updates.name.trim();
    const target = currentList.find(s => s.id === id);
    const targetRole = updates.role || target?.role;
    const dup = currentList.find(
      s => s.id !== id && s.role === targetRole && s.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (dup) {
      throw new Error(`Another specialization with name "${cleanName}" already exists for this role.`);
    }
    updates.name = cleanName;
  }

  const updated = currentList.map(s => {
    if (s.id === id) {
      return { ...s, ...updates, updatedAt: new Date().toISOString() };
    }
    return s;
  });

  await saveSpecializationsMaster(supabaseClient, updated);
  return updated;
};

export const adminDeleteSpecialization = async (supabaseClient, id) => {
  const currentList = await fetchSpecializationsMaster(supabaseClient);
  const updated = currentList.filter(s => s.id !== id);
  await saveSpecializationsMaster(supabaseClient, updated);
  return updated;
};
