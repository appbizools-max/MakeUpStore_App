/**
 * Order ID Generation & Validation Utility
 * Format: DDMMYYYY-CC-OOOOO
 * - DDMMYYYY: Order creation date in Asia/Kolkata (IST)
 * - CC: Customer lifetime order count (never resets, min 2 digits padded)
 * - OOOOO: Global sequence for that day (resets to 00001 at 12:00 AM IST)
 */

export const getISTDateParts = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }
    const day = partMap.day || '01';
    const month = partMap.month || '01';
    const year = partMap.year || '2026';
    return {
      day,
      month,
      year,
      ddmmyyyy: `${day}${month}${year}`
    };
  } catch (err) {
    // Fallback if Intl fails
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = String(istDate.getUTCFullYear());
    return {
      day,
      month,
      year,
      ddmmyyyy: `${day}${month}${year}`
    };
  }
};

/**
 * Generates an Order ID in exact DDMMYYYY-CC-OOOOO format.
 * Checks both local orders and Supabase database to ensure global uniqueness and accurate sequence.
 */
export const generateSalbeauOrderId = async ({
  customerPhone,
  customerOrdersCount = 0,
  existingOrders = [],
  supabaseClient = null,
  creationDate = new Date()
}) => {
  const { ddmmyyyy } = getISTDateParts(creationDate);

  // 1. Calculate Customer Lifetime Count (CC)
  let lifetimeCount = Number(customerOrdersCount) || 0;

  if (supabaseClient && customerPhone) {
    try {
      const cleanPhone = String(customerPhone).trim();
      const { data, count, error } = await supabaseClient
        .from('orders')
        .select('id', { count: 'exact', head: false })
        .eq('phone', cleanPhone);

      if (!error && (data || count !== null)) {
        const dbCount = count !== null && count !== undefined ? count : (data ? data.length : 0);
        lifetimeCount = Math.max(lifetimeCount, dbCount);
      }
    } catch (e) {
      console.warn('Could not query customer lifetime orders from Supabase:', e);
    }
  }

  // If still 0, check existingOrders array locally
  if (lifetimeCount === 0 && Array.isArray(existingOrders) && customerPhone) {
    const cleanPhone = String(customerPhone).trim();
    const localUserOrders = existingOrders.filter(o => o.phone && String(o.phone).trim() === cleanPhone);
    lifetimeCount = localUserOrders.length;
  }

  const customerSeq = lifetimeCount + 1;
  const ccString = String(customerSeq).padStart(2, '0');

  // 2. Calculate Global Sequence for that day (OOOOO)
  let maxDaySeq = 0;

  // Check Supabase for orders matching today's DDMMYYYY prefix
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('id')
        .like('id', `${ddmmyyyy}-%`);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.id) {
            const parts = row.id.split('-');
            if (parts.length >= 3) {
              const seq = parseInt(parts[2], 10);
              if (!isNaN(seq) && seq > maxDaySeq) {
                maxDaySeq = seq;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not query daily order sequence from Supabase:', e);
    }
  }

  // Also verify against in-memory orders
  if (Array.isArray(existingOrders)) {
    for (const order of existingOrders) {
      if (order?.id && order.id.startsWith(ddmmyyyy)) {
        const parts = order.id.split('-');
        if (parts.length >= 3) {
          const seq = parseInt(parts[2], 10);
          if (!isNaN(seq) && seq > maxDaySeq) {
            maxDaySeq = seq;
          }
        }
      }
    }
  }

  const nextDaySeq = maxDaySeq + 1;
  const oooooString = String(nextDaySeq).padStart(5, '0');

  // Format: DDMMYYYY-CC-OOOOO
  return `${ddmmyyyy}-${ccString}-${oooooString}`;
};

/**
 * Validates if an Order ID conforms to DDMMYYYY-CC-OOOOO format.
 */
export const isValidOrderIdFormat = (orderId) => {
  if (!orderId || typeof orderId !== 'string') return false;
  const regex = /^\d{8}-\d{2,}-\d{5}$/;
  return regex.test(orderId);
};
