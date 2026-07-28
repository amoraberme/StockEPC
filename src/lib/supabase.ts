import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, PRDJsonOutput } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

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

export async function saveSupabaseInventory(inventory: InventoryItem[]): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('inventory_items')
      .upsert(inventory, { onConflict: 'item_id' });

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
    return data.map((d) => d.log || d) as PRDJsonOutput[];
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

export const SUPABASE_RLS_SQL_SCRIPT = `-- ============================================================================
-- MG SOLAR EPC INVENTORY SYSTEM — SUPABASE ISOLATED RLS MIGRATION SCRIPT
-- Copy and run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ============================================================================

-- 1. Create Profiles Table (for Operator Auth & Tenant Mapping)
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

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Create Inventory Items Table with Isolated RLS
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT auth.uid(),
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
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON public.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON public.inventory_items(item_id);

-- Enable Isolated Row Level Security (RLS) on Inventory Items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolated Tenant Read Inventory" 
ON public.inventory_items FOR SELECT 
USING (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Isolated Tenant Insert Inventory" 
ON public.inventory_items FOR INSERT 
WITH CHECK (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Isolated Tenant Update Inventory" 
ON public.inventory_items FOR UPDATE 
USING (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Isolated Tenant Delete Inventory" 
ON public.inventory_items FOR DELETE 
USING (auth.uid() = tenant_id OR tenant_id IS NULL);

-- 3. Create Audit Logs Table with Isolated RLS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT auth.uid(),
  log JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for Audit Logs Querying
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- Enable Isolated Row Level Security (RLS) on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolated Tenant Read Audit Logs" 
ON public.audit_logs FOR SELECT 
USING (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Isolated Tenant Insert Audit Logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() = tenant_id OR tenant_id IS NULL);

CREATE POLICY "Isolated Tenant Delete Audit Logs" 
ON public.audit_logs FOR DELETE 
USING (auth.uid() = tenant_id OR tenant_id IS NULL);
`;
