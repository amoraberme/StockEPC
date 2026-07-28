import React, { useState } from 'react';
import { Button } from './ui/button';
import { Database, ShieldCheck, Copy, Check, Cloud, HardDrive, RefreshCw, AlertTriangle, ArrowUpRight, X } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_RLS_SQL_SCRIPT, saveSupabaseInventory, insertSupabaseAuditLog } from '../lib/supabase';
import { InventoryItem, PRDJsonOutput } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  auditLogs: PRDJsonOutput[];
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  inventory,
  auditLogs
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_RLS_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMigrateToSupabase = async () => {
    if (!isConfigured) {
      setMigrationStatus('❌ Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file first.');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('Syncing local inventory items and audit logs to Supabase Cloud...');

    try {
      const invOk = await saveSupabaseInventory(inventory);
      let logsOk = true;

      for (const log of auditLogs) {
        const ok = await insertSupabaseAuditLog(log);
        if (!ok) logsOk = false;
      }

      if (invOk && logsOk) {
        setMigrationStatus(`✅ Migration successful! Transferred ${inventory.length} SKUs and ${auditLogs.length} audit logs to Supabase with isolated RLS.`);
      } else {
        setMigrationStatus('⚠️ Migration completed with minor warnings. Check Supabase console or network output.');
      }
    } catch (err: any) {
      setMigrationStatus(`❌ Migration failed: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between pr-8">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Supabase Cloud Integration & Isolated RLS</span>
            </h3>
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              isConfigured
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}>
              {isConfigured ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              {isConfigured ? 'Supabase Connected' : 'Local File DB Active'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Easily connect your local MG Solar Inventory system to Supabase Postgres with isolated tenant Row Level Security (RLS).
          </p>
        </div>

        <div className="space-y-6 pt-1 text-xs">
          {/* Current Engine Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border space-y-1.5 ${
              !isConfigured ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>1. Local File DB Engine</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Active. Writes to <code className="text-amber-300 font-mono">data/inventory_db.json</code>. 100% functional offline without cloud keys.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1.5 ${
              isConfigured ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>2. Supabase Cloud DB</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isConfigured ? 'Connected & ready for live cloud queries.' : 'Add VITE_SUPABASE_URL to .env to activate cloud sync.'}
              </p>
            </div>
          </div>

          {/* Migration SQL Generator & Copy */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Isolated RLS Migration SQL Script</span>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySql}
                className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white text-xs h-8 px-3 rounded-xl cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied SQL!' : 'Copy RLS Script'}
              </Button>
            </div>
            <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-mono text-zinc-300 max-h-40 overflow-y-auto leading-tight selection:bg-emerald-900 selection:text-white">
              {SUPABASE_RLS_SQL_SCRIPT}
            </pre>
          </div>

          {/* Quick Migration Action Button */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Push Local Data to Supabase Cloud</h4>
                <p className="text-[11px] text-zinc-400">
                  Transfers {inventory.length} local inventory items and {auditLogs.length} audit logs into Supabase.
                </p>
              </div>
              <Button
                onClick={handleMigrateToSupabase}
                disabled={isMigrating || !isConfigured}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer shrink-0 shadow-lg"
              >
                {isMigrating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />}
                {isMigrating ? 'Migrating...' : 'Migrate to Cloud'}
              </Button>
            </div>

            {migrationStatus && (
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-200 font-mono">
                {migrationStatus}
              </div>
            )}
          </div>

          {/* Environment Variables Guide */}
          <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-1.5 text-amber-200/90 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>How to connect Supabase credentials in local environment (.env):</span>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-amber-900/60 font-mono text-[10px] text-zinc-300 space-y-1">
              <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY="your-anon-key-here"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
