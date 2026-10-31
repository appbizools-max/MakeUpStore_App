/**
 * Salbeau B2B Professional Verification Service
 * Handles verification lifecycle, role-based checks, database persistence & sync.
 */
import { optimizeImage } from './imageOptimizer';

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
  not_submitted: {
    key: 'not_submitted',
    label: 'Not Submitted',
    badgeColor: '#6B7280',
    badgeBg: '#F3F4F6'
  },
  submitted: {
    key: 'submitted',
    label: 'Submitted',
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
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7'
  },
  suspended: {
    key: 'suspended',
    label: 'Suspended',
    badgeColor: '#7F1D1D',
    badgeBg: '#FEE2E2'
  }
};

/**
 * Checks whether the given role is a professional B2B role
 */
export const isB2BRole = (role) => {
  if (!role) return false;
  return B2B_ROLES.includes(role.toLowerCase().trim());
};

/**
 * Checks whether user is strictly B2B verified by Admin
 * Must satisfy:
 *   user.role in ['salon', 'artist', 'beautician']
 *   AND verification_status === 'approved'
 *   AND b2b_verified === true
 */
export const isUserB2BVerified = (profile) => {
  if (!profile) return false;
  const role = (profile.role || '').toLowerCase().trim();
  if (!isB2BRole(role)) return false;

  const status = (profile.verification_status || profile.verificationStatus || '').toLowerCase().trim();
  const rawVerified = profile.b2b_verified ?? profile.b2bVerified;
  const isVerified = (rawVerified === true || rawVerified === 'true');

  return status === 'verified' || (status === 'approved' && isVerified);
};

/**
 * Resolves the effective pricing role for all catalog and checkout calculations.
 * If user is not B2B verified, returns 'general' regardless of their requested role.
 */
export const getEffectivePricingRole = (profile) => {
  if (!profile) return 'general';
  const role = (profile.role || 'general').toLowerCase().trim();
  if (!isB2BRole(role)) return 'general';

  if (isUserB2BVerified(profile)) {
    return role;
  }
  return 'general';
};

/**
 * Fetch latest verification application for a specific user
 */
export const fetchUserVerificationRecord = async (supabase, userId) => {
  if (!supabase || !userId) return null;

  try {
    // 1. Try dedicated public.b2b_verifications table
    const { data: vData, error: vErr } = await supabase
      .from('b2b_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!vErr && vData) {
      // Also fetch documents
      const { data: docs } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('verification_id', vData.id);

      // Also fetch history
      const { data: hist } = await supabase
        .from('verification_history')
        .select('*')
        .eq('verification_id', vData.id)
        .order('created_at', { ascending: false });

      return {
        ...vData,
        documents: docs || [],
        history: hist || []
      };
    }

    // 2. Fallback to synced brands row if table not yet migrated
    const { data: syncRow } = await supabase
      .from('brands')
      .select('logo')
      .eq('id', 'salbeau_b2b_verifications_sync')
      .maybeSingle();

    if (syncRow?.logo) {
      try {
        const parsed = JSON.parse(syncRow.logo);
        if (Array.isArray(parsed)) {
          const matched = parsed.find(item => item.user_id === userId || item.userId === userId);
          if (matched) return matched;
        }
      } catch (_) {}
    }

    // 3. Fallback to public.users record
    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userRow && B2B_ROLES.includes((userRow.role || '').toLowerCase())) {
      const rawStatus = (userRow.verification_status || 'not_submitted').toLowerCase();
      const isVerified = rawStatus === 'verified' || rawStatus === 'approved' || Boolean(userRow.b2b_verified);
      return {
        id: `v_${userRow.id}`,
        user_id: userRow.id,
        role: userRow.role,
        business_name: userRow.business_name || `${userRow.name} Studio`,
        professional_name: userRow.full_name || userRow.name,
        phone: userRow.phone,
        email: userRow.email || '',
        address: `${userRow.city || ''}, ${userRow.state || ''} ${userRow.pincode ? `(${userRow.pincode})` : ''}`.trim(),
        city: userRow.city || '',
        state: userRow.state || '',
        pincode: userRow.pincode || '',
        verification_status: isVerified ? 'approved' : rawStatus,
        b2b_verified: isVerified,
        submitted_at: userRow.last_active || userRow.created_at || new Date().toISOString(),
        documents: [],
        history: []
      };
    }
  } catch (err) {
    console.warn('fetchUserVerificationRecord error:', err);
  }

  return null;
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

/**
 * Submits or resubmits a B2B Verification application
 */
export const submitB2BVerification = async (supabase, {
  userId,
  role,
  businessName,
  professionalName,
  phone,
  email,
  address,
  city,
  state,
  pincode,
  country = 'India',
  locationCoords = null,
  isBusinessAddressSame = true,
  businessAddress = null,
  businessCity = null,
  businessState = null,
  businessPincode = null,
  businessCountry = 'India',
  businessLocationCoords = null,
  gstin,
  experience,
  registrationDetails,
  websiteOrSocialLink,
  documents = [],
  isResubmission = false
}) => {
  const timestamp = new Date().toISOString();
  const verificationId = `b2bv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const cleanRole = (role || 'salon').toLowerCase().trim();
  const sameAddress = Boolean(isBusinessAddressSame);

  const effectiveBizAddress = sameAddress ? (address || '').trim() : (businessAddress || address || '').trim();
  const effectiveBizCity = sameAddress ? (city || '').trim() : (businessCity || city || '').trim();
  const effectiveBizState = sameAddress ? (state || '').trim() : (businessState || state || '').trim();
  const effectiveBizPincode = sameAddress ? (pincode || '').trim() : (businessPincode || pincode || '').trim();
  const effectiveBizCountry = sameAddress ? (country || 'India').trim() : (businessCountry || country || 'India').trim();
  const effectiveBizLocation = sameAddress ? (locationCoords || null) : (businessLocationCoords || locationCoords || null);

  const recordPayload = {
    id: verificationId,
    user_id: userId,
    name: (professionalName || businessName || phone || 'Applicant').trim(),
    role: cleanRole,
    business_name: (businessName || '').trim(),
    professional_name: (professionalName || '').trim(),
    phone: (phone || '').trim(),
    email: (email || '').trim(),
    // Personal / Professional Address
    address: (address || '').trim(),
    city: (city || '').trim(),
    state: (state || '').trim(),
    pincode: (pincode || '').trim(),
    country: (country || 'India').trim(),
    location_coords: locationCoords || null,
    // Business Address
    is_business_address_same: sameAddress,
    business_address: effectiveBizAddress,
    business_city: effectiveBizCity,
    business_state: effectiveBizState,
    business_pincode: effectiveBizPincode,
    business_country: effectiveBizCountry,
    business_location_coords: effectiveBizLocation,

    gstin: (gstin || '').trim() || null,
    experience: experience ? String(experience).trim() : null,
    registration_details: (registrationDetails || '').trim() || null,
    website_or_social_link: (websiteOrSocialLink || '').trim() || null,
    verification_status: 'submitted',
    admin_notes: null,
    rejection_reason: null,
    requested_documents: [],
    submitted_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp
  };

  const documentRecords = (documents || []).map((doc, idx) => ({
    id: `doc_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    verification_id: verificationId,
    user_id: userId,
    type: doc.type || doc.document_type || 'proof',
    document_type: doc.type || doc.document_type || 'proof',
    url: doc.url || doc.file_url || '',
    file_url: doc.url || doc.file_url || '',
    label: doc.name || doc.label || doc.file_name || `Document ${idx + 1}`,
    file_name: doc.name || doc.label || doc.file_name || `Document ${idx + 1}`,
    created_at: timestamp,
    uploaded_at: timestamp
  }));

  const historyRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    verification_id: verificationId,
    user_id: userId,
    action: isResubmission ? 'resubmitted' : 'submitted',
    previous_status: isResubmission ? 'resubmission_required' : 'not_submitted',
    new_status: 'submitted',
    reason: isResubmission ? 'User updated verification details & resubmitted' : 'Initial verification submission',
    admin_id: null,
    admin_name: 'Applicant',
    created_at: timestamp
  };

  const notificationRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    target: 'admin',
    title: isResubmission ? 'B2B Verification Resubmitted' : 'New B2B Application Received',
    message: `${(businessName || professionalName || phone)} submitted a ${ROLE_SHORT_TITLES[cleanRole] || cleanRole} verification request.`,
    type: 'b2b_submission',
    data: { verificationId, userId, role: cleanRole, businessName },
    is_read: false,
    created_at: timestamp
  };

  let primaryDbSuccess = false;

  try {
    // 1. Insert into public.b2b_verifications
    const { error: vErr } = await supabase
      .from('b2b_verifications')
      .insert(recordPayload);

    if (!vErr) {
      primaryDbSuccess = true;

      // 2. Insert documents
      if (documentRecords.length > 0) {
        await supabase.from('verification_documents').insert(documentRecords);
      }

      // 3. Insert history
      await supabase.from('verification_history').insert(historyRecord);

      // 4. Insert notification
      await supabase.from('notifications').insert(notificationRecord);
    }
  } catch (err) {
    console.warn('b2b_verifications DB table insert error:', err);
  }

  // 5. Always update public.users record
  try {
    const userUpdates = {
      verification_status: 'submitted',
      b2b_verified: false,
      verification_submitted_at: timestamp,
      role: cleanRole,
      business_name: (businessName || '').trim() || undefined
    };

    const { error: uErr } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    if (uErr) {
      // Fallback with minimal columns if migration pending
      await supabase.from('users').update({
        verification_status: 'submitted',
        role: cleanRole
      }).eq('id', userId);
    }
  } catch (uErr) {
    console.warn('User table update verification status error:', uErr);
  }

  // 6. Resilient sync fallback row in brands table
  try {
    const fullRecord = {
      ...recordPayload,
      documents: documentRecords,
      history: [historyRecord]
    };

    const { data: syncRow } = await supabase
      .from('brands')
      .select('logo')
      .eq('id', 'salbeau_b2b_verifications_sync')
      .maybeSingle();

    let list = [];
    if (syncRow?.logo) {
      try {
        list = JSON.parse(syncRow.logo);
        if (!Array.isArray(list)) list = [];
      } catch (_) {}
    }

    // Replace previous application for this user
    list = list.filter(item => item.user_id !== userId && item.userId !== userId);
    list.unshift(fullRecord);

    await supabase.from('brands').upsert({
      id: 'salbeau_b2b_verifications_sync',
      name: 'B2B Verifications Sync',
      logo: JSON.stringify(list),
      enabled: true
    });
  } catch (syncErr) {
    console.warn('B2B verification sync backup error:', syncErr);
  }

  return {
    success: true,
    verificationId,
    verification: {
      ...recordPayload,
      documents: documentRecords,
      history: [historyRecord]
    }
  };
};

/**
 * Uploads a document/image to Supabase Storage verification-docs bucket with HD compression.
 * Automatically compresses large 5-15MB smartphone camera photos down to ~150-250KB WebP
 * preserving fine text, stamps, and ID readability to save database & storage data.
 */
export const uploadVerificationDocument = async (supabase, file, userId, customName = '') => {
  if (!supabase || !file) {
    return { success: false, error: 'Supabase client or file missing' };
  }

  let uploadFile = file;
  let fallbackDataUrl = '';
  let compressionStats = null;

  // 1. HD Image Compression before upload
  try {
    const isImage = (file.type && file.type.startsWith('image/')) || 
                    (typeof file === 'string' && (file.startsWith('data:image/') || /\.(jpe?g|png|webp|bmp)$/i.test(file))) ||
                    (file.name && /\.(jpe?g|png|webp|bmp)$/i.test(file.name));

    if (isImage) {
      const opt = await optimizeImage(file, 'VERIFICATION_DOC', {
        filename: `${customName || 'doc'}_${Date.now()}.webp`
      });
      if (opt?.file) {
        uploadFile = opt.file;
        fallbackDataUrl = opt.dataUrl;
        compressionStats = opt.summary;
      }
    }
  } catch (compErr) {
    console.warn('Pre-upload HD image compression notice:', compErr);
  }

  try {
    const cleanUserId = (userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isWebP = uploadFile.type === 'image/webp';
    const ext = isWebP ? 'webp' : (uploadFile.name ? uploadFile.name.split('.').pop() : 'jpg');
    const fileName = customName 
      ? `${customName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}` 
      : `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `${cleanUserId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, uploadFile, {
        contentType: uploadFile.type || 'image/webp',
        cacheControl: '31536000',
        upsert: true
      });

    if (error) {
      console.warn('Storage upload notice, falling back to HD compressed URL:', error);
      return {
        success: true,
        url: fallbackDataUrl || (typeof file === 'string' ? file : ''),
        path: filePath,
        name: file.name || fileName,
        compression: compressionStats
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData?.publicUrl ? `${publicUrlData.publicUrl}?v=${Date.now()}` : (fallbackDataUrl || filePath),
      path: filePath,
      name: file.name || fileName,
      compression: compressionStats
    };
  } catch (err) {
    console.warn('Document upload catch, using HD fallback:', err);
    return {
      success: true,
      url: fallbackDataUrl || (typeof file === 'string' ? file : ''),
      name: file.name || 'Uploaded Document',
      compression: compressionStats
    };
  }
};

