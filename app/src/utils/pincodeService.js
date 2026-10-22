/**
 * Pincode Lookup Service for Indian Postal Pincodes.
 * 
 * Uses the official India Post Pincode API (api.postalpincode.in).
 * Completely isolated so the provider or endpoint can be swapped or configured.
 * 
 * NOTE: Strict requirement - NO mock data, NO fallback defaults (no Bangalore/560102).
 */

const PINCODE_CACHE = new Map();

/**
 * Validates whether an input is a valid 6-digit Indian PIN code.
 * @param {string|number} pincode 
 * @returns {{ isValid: boolean, cleanPin: string }}
 */
export const validateIndianPincode = (pincode) => {
  const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  return {
    isValid: /^\d{6}$/.test(cleanPin),
    cleanPin
  };
};

/**
 * Performs a real API lookup for an Indian 6-digit PIN code.
 * 
 * @param {string|number} pincode 
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{
 *   success: boolean,
 *   pincode: string,
 *   city?: string,
 *   state?: string,
 *   locality?: string,
 *   localities?: string[],
 *   message?: string
 * }>}
 */
export const lookupIndianPincode = async (pincode, options = {}) => {
  const { isValid, cleanPin } = validateIndianPincode(pincode);

  if (!isValid) {
    return {
      success: false,
      pincode: cleanPin,
      message: 'Please enter a valid 6-digit PIN code.'
    };
  }

  // Check in-memory cache first to avoid redundant network round-trips
  if (PINCODE_CACHE.has(cleanPin)) {
    return PINCODE_CACHE.get(cleanPin);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const failResult = {
        success: false,
        pincode: cleanPin,
        message: "We couldn't find this pincode. Please check it or enter the address manually."
      };
      return failResult;
    }

    const data = await response.json();

    if (
      Array.isArray(data) &&
      data[0] &&
      data[0].Status === 'Success' &&
      Array.isArray(data[0].PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const postOffices = data[0].PostOffice;
      const primaryPO = postOffices[0];

      // Extract City/District
      const district = primaryPO.District || primaryPO.Division || primaryPO.Block || '';
      // Extract State
      const state = primaryPO.State || '';
      // Extract primary locality / area name
      const locality = primaryPO.Name ? primaryPO.Name.trim() : '';

      const localities = Array.from(
        new Set(postOffices.map((po) => po.Name && po.Name.trim()).filter(Boolean))
      );

      const successResult = {
        success: true,
        pincode: cleanPin,
        city: district,
        state: state,
        locality: locality,
        localities: localities,
        message: 'Address found'
      };

      PINCODE_CACHE.set(cleanPin, successResult);
      return successResult;
    }

    // Unsuccessful or no records
    const noResult = {
      success: false,
      pincode: cleanPin,
      message: "We couldn't find this pincode. Please check it or enter the address manually."
    };
    PINCODE_CACHE.set(cleanPin, noResult);
    return noResult;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        success: false,
        pincode: cleanPin,
        message: 'Pincode lookup timed out. Please enter your address manually.'
      };
    }

    return {
      success: false,
      pincode: cleanPin,
      message: "We couldn't find this pincode. Please check it or enter the address manually."
    };
  }
};
