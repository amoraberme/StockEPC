import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, PRDJsonOutput } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://luapeehrbbivbtunsiip.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1YXBlZWhyYmJpdmJ0dW5zaWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0Njk4MTEsImV4cCI6MjA5MzA0NTgxMX0.HZH0quTzGZzCRceYhbgDDTaG40DWLtvehD_pVukY0S0';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// SUPABASE RLS DATA ACCESS HELPERS
// ============================================================================

export async function fetchSupabaseInventory(): Promise<InventoryItem[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch inventory error:', error.message);
      return null;
    }
    return data as InventoryItem[];
  } catch (err) {
    console.warn('Supabase request failed:', err);
    return null;
  }
}

export function mapItemToDbPayload(item: InventoryItem) {
  return {
    item_id: item.item_id,
    brand_manufacturer: item.brand_manufacturer || 'Standard EPC',
    category: item.category,
    model_number: item.model_number || 'N/A',
    item_description: item.item_description,
    quantity: Number(item.quantity || 0),
    uom: item.uom || 'PCS',
    technical_specs: item.technical_specs || {},
    stock_levels: item.stock_levels || {
      current_stock: Number(item.quantity || 0),
      allocated_stock: 0,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: Array.isArray(item.serial_numbers) ? item.serial_numbers : [],
    image_url: item.image_url || null,
    added_by: item.added_by || null,
    added_by_username: item.added_by_username || null,
    updated_at: new Date().toISOString()
  };
}

export async function saveSingleSupabaseItem(item: InventoryItem): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload = mapItemToDbPayload(item);
    const { error } = await supabase
      .from('inventory_items')
      .upsert([payload], { onConflict: 'item_id' });

    if (error) {
      console.warn('Supabase upsert single item error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save single item error:', err);
    return false;
  }
}

export async function saveSupabaseInventory(inventory: InventoryItem[]): Promise<boolean> {
  if (!supabase) return false;
  if (inventory.length === 0) return true;
  try {
    const payloads = inventory.map(mapItemToDbPayload);
    const { error } = await supabase
      .from('inventory_items')
      .upsert(payloads, { onConflict: 'item_id' });

    if (error) {
      console.warn('Supabase upsert inventory error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save error:', err);
    return false;
  }
}



export async function deleteSupabaseItem(itemId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('item_id', itemId);

    if (error) {
      console.warn('Supabase delete item error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete item error:', err);
    return false;
  }
}

export async function clearSupabaseInventory(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .neq('item_id', 'NON_EXISTENT_GUARD_ID');

    if (error) {
      console.warn('Supabase clear inventory error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase clear inventory error:', err);
    return false;
  }
}

import { validateAndDeduplicateAuditLogs } from './auditValidator';

export async function fetchSupabaseAuditLogs(): Promise<PRDJsonOutput[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch audit logs error:', error.message);
      return null;
    }
    const rawLogs = data.map((d) => d.log || d) as PRDJsonOutput[];
    const { cleanedLogs } = validateAndDeduplicateAuditLogs(rawLogs);
    return cleanedLogs;
  } catch (err) {
    console.warn('Supabase audit logs fetch error:', err);
    return null;
  }
}

export async function insertSupabaseAuditLog(log: PRDJsonOutput): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{ log, created_at: new Date().toISOString() }]);

    if (error) {
      console.warn('Supabase insert audit log error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase insert log error:', err);
    return false;
  }
}

export async function clearSupabaseAuditLogs(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .gt('created_at', '1970-01-01T00:00:00.000Z');

    if (error) {
      console.warn('Supabase clear audit logs error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase clear audit logs error:', err);
    return false;
  }
}


export const SUPABASE_RLS_SQL_SCRIPT = `-- ============================================================================
-- MG SOLAR EPC INVENTORY SYSTEM — SUPABASE GLOBAL DATABASE SCRIPT (NO RLS)
-- Project: MG Solar Inventory & Dispatch System
-- Description: Disables Row-Level Security (RLS) so all operators & global users share and view 100% of inventory items and audit logs.
-- Instructions: Copy and run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================================

-- 1. Create Profiles Table (Global Operator Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Warehouse Operator',
  company TEXT DEFAULT 'M&G Non-Specialized Wholesale Trading',
  contact_number TEXT,
  email TEXT NOT NULL,
  avatar_color TEXT DEFAULT 'bg-blue-900',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS on Profiles for Global Shared Access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create Inventory Items Table (Global Shared Catalog)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  item_id TEXT NOT NULL UNIQUE,
  brand_manufacturer TEXT NOT NULL,
  category TEXT NOT NULL,
  model_number TEXT DEFAULT 'N/A',
  item_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  uom TEXT NOT NULL DEFAULT 'PCS',
  technical_specs JSONB DEFAULT '{}'::jsonb,
  stock_levels JSONB NOT NULL,
  serial_numbers TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Fast Search & Category Filtering
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON public.inventory_items(item_id);

-- Disable RLS on Inventory Items so all users read/write globally
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;

-- 3. Create Audit Logs Table (Global Shared Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  log JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for Audit Logs Querying
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- Disable RLS on Audit Logs so all operators view all activity
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant full table permissions to anon and authenticated roles
GRANT ALL ON public.profiles TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.inventory_items TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, postgres, service_role;
`;
