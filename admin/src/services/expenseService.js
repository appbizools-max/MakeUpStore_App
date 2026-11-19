/**
 * Salbeau Business Expense Management Service
 * Dual-tier storage: Supabase table 'business_expenses' with fallback/backup in 'brands'
 * table (salbeau_business_expenses) and localStorage cache.
 */
import { supabase, supabaseAdmin } from '../config/supabase';

export const EXPENSE_CATEGORIES = [
  { id: 'purchasing', name: 'Product Purchasing & Stock', color: '#D81B60' },
  { id: 'packaging', name: 'Packaging Materials & Bags', color: '#8E24AA' },
  { id: 'transportation', name: 'Transportation & Logistics', color: '#1E88E5' },
  { id: 'delivery', name: 'Delivery Partner Payouts', color: '#00897B' },
  { id: 'salaries', name: 'Staff Salaries & Payroll', color: '#F4511E' },
  { id: 'rent', name: 'Rent & Facility Leases', color: '#6D4C41' },
  { id: 'utilities', name: 'Electricity, Water & Internet', color: '#FDD835' },
  { id: 'marketing', name: 'Marketing & Digital Ads', color: '#FB8C00' },
  { id: 'gateway', name: 'Payment Gateway & Bank Fees', color: '#546E7A' },
  { id: 'software', name: 'Software & Cloud Subscriptions', color: '#3949AB' },
  { id: 'office', name: 'Office Supplies & Maintenance', color: '#7CB342' },
  { id: 'miscellaneous', name: 'Miscellaneous Expenses', color: '#757575' }
];

export const PAYMENT_MODES = [
  'Bank Transfer / NEFT',
  'UPI / QR Code',
  'Company Debit / Credit Card',
  'Cash',
  'Cheque'
];

const STORAGE_KEY = 'salbeau_business_expenses_cache';
const BRAND_BACKUP_ID = 'salbeau_business_expenses';

// Initial seed expenses for first-time dashboard demonstration
export const INITIAL_EXPENSES = [
  {
    id: 'exp_001',
    title: 'Autumn Cosmetic Stock Procurements',
    category: 'purchasing',
    amount: 85000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    vendor: 'LuxeCosmo Wholesale Distributors',
    referenceNumber: 'INV-2026-9812',
    notes: 'Bulk purchase of luxury matte lipsticks and serums',
    createdBy: 'System Administrator',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp_002',
    title: 'Tamper-Evident Poly Bags & Bubble Wrap',
    category: 'packaging',
    amount: 12500,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'UPI / QR Code',
    vendor: 'PackWell Solutions Ltd',
    referenceNumber: 'UPI-PW-44810',
    notes: 'Branded Salbeau pink packing envelopes and void tape',
    createdBy: 'Store Manager',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp_003',
    title: 'Rider Fuel & Doorstep Delivery Dispatch Fees',
    category: 'delivery',
    amount: 18400,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'UPI / QR Code',
    vendor: 'CityFleet Logistics',
    referenceNumber: 'CF-DISPATCH-991',
    notes: 'Bi-weekly payout for metro hyperlocal delivery riders',
    createdBy: 'Operations Head',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp_004',
    title: 'Monthly Warehouse Hub Rent',
    category: 'rent',
    amount: 45000,
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    vendor: 'Apex Commercial Properties',
    referenceNumber: 'RENT-NOV-2026',
    notes: 'Main central fulfillment facility rent',
    createdBy: 'System Administrator',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp_005',
    title: 'Instagram & Google Ads Campaigns',
    category: 'marketing',
    amount: 22000,
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Company Debit / Credit Card',
    vendor: 'Meta & Google Ads India',
    referenceNumber: 'ADS-TXN-00384',
    notes: 'Salon B2B verification promotional campaign & Festive retail promo',
    createdBy: 'Growth Marketing Lead',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'exp_006',
    title: 'Payment Gateway Merchant Processing Fees',
    category: 'gateway',
    amount: 4650,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    vendor: 'Razorpay / UPI Settlement',
    referenceNumber: 'PG-DEDUCT-1102',
    notes: '2% standard gateway fee for card and netbanking transactions',
    createdBy: 'Finance Desk',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function fetchExpenses() {
  let expenses = [];

  // 1. Try fetching from Supabase table 'business_expenses'
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('business_expenses')
      .select('*')
      .order('date', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      expenses = data.map(item => ({
        id: item.id,
        title: item.title || item.name || 'Expense',
        category: item.category || 'miscellaneous',
        amount: Number(item.amount) || 0,
        date: item.date || item.created_at?.split('T')[0],
        paymentMethod: item.payment_method || item.paymentMethod || 'Bank Transfer / NEFT',
        vendor: item.vendor || item.vendor_name || '',
        referenceNumber: item.reference_number || item.referenceNumber || '',
        notes: item.notes || item.description || '',
        receiptUrl: item.receipt_url || item.receiptUrl || '',
        createdBy: item.created_by || item.createdBy || 'Administrator',
        createdAt: item.created_at || new Date().toISOString()
      }));
    }
  } catch (err) {
    // console.warn('Supabase business_expenses fetch notice:', err.message);
  }

  // 2. Fallback: Try fetching from 'brands' configuration document
  if (!expenses.length) {
    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('brands')
        .select('description')
        .eq('id', BRAND_BACKUP_ID)
        .maybeSingle();

      if (!error && data?.description) {
        const parsed = JSON.parse(data.description);
        if (Array.isArray(parsed) && parsed.length > 0) {
          expenses = parsed;
        }
      }
    } catch (err) {
      // console.warn('Brands backup expense fetch notice:', err.message);
    }
  }

  // 3. Fallback: LocalStorage
  if (!expenses.length) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          expenses = parsed;
        }
      }
    } catch (err) { }
  }

  // 4. Default Seed if entirely empty
  if (!expenses.length) {
    expenses = [...INITIAL_EXPENSES];
    saveExpensesToLocalAndBackup(expenses).catch(() => {});
  }

  return expenses;
}

export async function saveExpensesToLocalAndBackup(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) { }

  // Backup to 'brands' document table
  try {
    const client = supabaseAdmin || supabase;
    await client
      .from('brands')
      .upsert({
        id: BRAND_BACKUP_ID,
        name: 'Salbeau Business Expenses Backup',
        description: JSON.stringify(expenses),
        updated_at: new Date().toISOString()
      });
  } catch (err) { }
}

export async function addExpense(expenseData, user = null) {
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: expenseData.title.trim(),
    category: expenseData.category || 'miscellaneous',
    amount: Number(expenseData.amount) || 0,
    date: expenseData.date || new Date().toISOString().split('T')[0],
    paymentMethod: expenseData.paymentMethod || 'Bank Transfer / NEFT',
    vendor: (expenseData.vendor || '').trim(),
    referenceNumber: (expenseData.referenceNumber || '').trim(),
    notes: (expenseData.notes || '').trim(),
    receiptUrl: expenseData.receiptUrl || '',
    createdBy: user?.fullName || user?.email || 'Administrator',
    createdAt: new Date().toISOString()
  };

  // Try direct table insertion
  try {
    const client = supabaseAdmin || supabase;
    await client.from('business_expenses').insert([{
      id: newExpense.id,
      title: newExpense.title,
      category: newExpense.category,
      amount: newExpense.amount,
      date: newExpense.date,
      payment_method: newExpense.paymentMethod,
      vendor: newExpense.vendor,
      reference_number: newExpense.referenceNumber,
      notes: newExpense.notes,
      receipt_url: newExpense.receiptUrl,
      created_by: newExpense.createdBy,
      created_at: newExpense.createdAt
    }]);
  } catch (err) { }

  // Update in-memory & backup storage
  const current = await fetchExpenses();
  const updated = [newExpense, ...current];
  await saveExpensesToLocalAndBackup(updated);

  return { success: true, expense: newExpense, allExpenses: updated };
}

export async function updateExpense(id, updatedFields) {
  // Try table update
  try {
    const client = supabaseAdmin || supabase;
    await client.from('business_expenses').update({
      title: updatedFields.title,
      category: updatedFields.category,
      amount: Number(updatedFields.amount),
      date: updatedFields.date,
      payment_method: updatedFields.paymentMethod,
      vendor: updatedFields.vendor,
      reference_number: updatedFields.referenceNumber,
      notes: updatedFields.notes,
      receipt_url: updatedFields.receiptUrl
    }).eq('id', id);
  } catch (err) { }

  const current = await fetchExpenses();
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        ...updatedFields,
        amount: Number(updatedFields.amount) || item.amount
      };
    }
    return item;
  });

  await saveExpensesToLocalAndBackup(updated);
  return { success: true, allExpenses: updated };
}

export async function deleteExpense(id) {
  try {
    const client = supabaseAdmin || supabase;
    await client.from('business_expenses').delete().eq('id', id);
  } catch (err) { }

  const current = await fetchExpenses();
  const updated = current.filter(item => item.id !== id);
  await saveExpensesToLocalAndBackup(updated);
  return { success: true, allExpenses: updated };
}
