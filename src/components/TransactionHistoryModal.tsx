import React, { useState, useMemo } from 'react';
import { UserProfile, PRDJsonOutput, CategoryType } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  History, 
  Download, 
  Calendar, 
  RefreshCw, 
  Bookmark, 
  PackagePlus, 
  PackageMinus, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { validateAndDeduplicateAuditLogs, filterAuditLogs } from '../lib/auditValidator';

interface TransactionHistoryProps {
  logs: PRDJsonOutput[];
  currentUser?: UserProfile | null;
  onClearLogs?: () => void;
  onDeleteLog?: (index: number) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryProps> = ({
  logs,
  currentUser,
  onClearLogs,
  onDeleteLog
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'RESTOCK' | 'REMOVED' | 'RESERVATION' | 'SKU_ADDED' | 'SKU_DELETED' | 'AUDIT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CategoryType>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const isAdmin = currentUser?.username === 'admin' || currentUser?.role === 'System Administrator';

  // Step 1: Run Validator & Deduplicator Checker
  const validationResult = useMemo(() => {
    return validateAndDeduplicateAuditLogs(logs);
  }, [logs]);

  // Step 2: Apply Multi-Criteria Filters (Date, Category, TxType, Search)
  const filteredLogs = useMemo(() => {
    return filterAuditLogs(validationResult.cleanedLogs, {
      searchTerm: searchFilter,
      transactionType: activeFilterTab,
      category: selectedCategory,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  }, [validationResult.cleanedLogs, activeFilterTab, selectedCategory, startDate, endDate, searchFilter]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(validationResult.cleanedLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `solar_epc_audit_logs_verified_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearAllFilters = () => {
    setSearchFilter('');
    setActiveFilterTab('ALL');
    setSelectedCategory('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'RESTOCK':
      case 'INBOUND':
        return (
          <Badge variant="success" className="flex items-center space-x-1 py-1 px-2.5">
            <PackagePlus className="w-3.5 h-3.5 text-white" />
            <span>RESTOCKED / INBOUND</span>
          </Badge>
        );
      case 'REMOVED':
      case 'OUTBOUND':
        return (
          <Badge variant="danger" className="flex items-center space-x-1 py-1 px-2.5">
            <PackageMinus className="w-3.5 h-3.5 text-white" />
            <span>REMOVED / ISSUED</span>
          </Badge>
        );
      case 'RESERVATION':
        return (
          <Badge variant="warning" className="flex items-center space-x-1 py-1 px-2.5">
            <Bookmark className="w-3.5 h-3.5 text-white" />
            <span>RESERVATION</span>
          </Badge>
        );
      case 'SKU_ADDED':
        return (
          <Badge variant="default" className="flex items-center space-x-1 py-1 px-2.5">
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>SKU CREATED</span>
          </Badge>
        );
      case 'SKU_DELETED':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1 py-1 px-2.5">
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>SKU DELETED</span>
          </Badge>
        );
      case 'AUDIT':
      default:
        return (
          <Badge variant="outline" className="flex items-center space-x-1 py-1 px-2.5">
            <RefreshCw className="w-3.5 h-3.5 text-black" />
            <span>AUDIT / UPDATE</span>
          </Badge>
        );
    }
  };

  return (
    <div id="transaction-history-view" className="space-y-4 font-sans">
      {/* Header & Controls */}
      <Card className="bg-white border-zinc-200 p-4 sm:p-6 space-y-4 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-zinc-950 font-black text-lg">
              <History className="w-5 h-5 text-black" />
              <h2>Inventory Movement & Transaction Audit Trail</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Complete chronological audit trail recording restocks, stock removals, project allocations, item creations, and adjustments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Audit Checker Status Badge */}
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Logs ({validationResult.cleanedLogs.length})</span>
            </span>

            {validationResult.duplicateCountRemoved > 0 && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{validationResult.duplicateCountRemoved} Duplicates Deduplicated</span>
              </span>
            )}

            {validationResult.cleanedLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                className="flex items-center space-x-1.5 font-semibold text-xs rounded-xl"
              >
                <Download className="w-4 h-4 text-black" />
                <span>Export Audit JSON</span>
              </Button>
            )}

            {isAdmin && validationResult.cleanedLogs.length > 0 && onClearLogs && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all audit logs permanently?')) {
                    onClearLogs();
                  }
                }}
                className="flex items-center space-x-1.5 font-bold text-xs rounded-xl bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear All Audit Logs</span>
              </Button>
            )}
          </div>
        </div>

        {/* Multi-Criteria Filter Controls */}
        <div className="space-y-3 pt-3 border-t border-zinc-100">
          
          {/* Row 1: Transaction Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'ALL'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All Movements ({validationResult.cleanedLogs.length})
            </button>
            <button
              onClick={() => setActiveFilterTab('RESTOCK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'RESTOCK'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              + Restocked
            </button>
            <button
              onClick={() => setActiveFilterTab('REMOVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'REMOVED'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              - Removed / Got
            </button>
            <button
              onClick={() => setActiveFilterTab('RESERVATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'RESERVATION'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Reservations
            </button>
            <button
              onClick={() => setActiveFilterTab('SKU_ADDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'SKU_ADDED'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              SKU Created
            </button>
            <button
              onClick={() => setActiveFilterTab('SKU_DELETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'SKU_DELETED'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              SKU Deleted
            </button>
          </div>

          {/* Row 2: Category, Date Range & Free-text Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            
            {/* Category Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="ALL">All Hardware Categories</option>
                <option value="PV_MODULE">Solar PV Module (Panel)</option>
                <option value="INVERTER">Solar Inverter (On-Grid / Hybrid)</option>
                <option value="BESS">Battery Storage Bank (LiFePO4)</option>
                <option value="PROTECTION_BREAKERS">Protection & Circuit Breakers</option>
                <option value="RACKING">Structural Racking & Hardware</option>
                <option value="DC_CABLING">Solar DC & Battery Power Cabling</option>
                <option value="MC4_CONNECTOR">MC4 Connectors & Combiners</option>
                <option value="CONDUIT_FITTINGS">Electrical Conduits & Pipes</option>
                <option value="GROUNDING">Grounding & Bonding Gear</option>
                <option value="FASTENERS">Fasteners & Expansion Bolts</option>
                <option value="CONSUMABLES">Consumables & Sealants</option>
                <option value="BOS_SWITCHGEAR">BOS Switchgear & ATS</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                From Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-50 text-xs h-8"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                To Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-50 text-xs h-8"
              />
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                Search Items / Operators
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search item, operator..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 text-xs h-8 bg-zinc-50"
                />
              </div>
            </div>

          </div>

          {/* Active Filter Indicators */}
          {(searchFilter || selectedCategory !== 'ALL' || startDate || endDate || activeFilterTab !== 'ALL') && (
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center space-x-1.5 text-zinc-600">
                <Filter className="w-3.5 h-3.5 text-black" />
                <span>Showing <strong>{filteredLogs.length}</strong> of <strong>{validationResult.cleanedLogs.length}</strong> verified audit records</span>
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>
      </Card>

      {/* Audit Log Entries List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="bg-white border-zinc-200 p-12 text-center text-zinc-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="text-sm font-bold text-zinc-700">No matching audit trail records found.</p>
            <p className="text-xs text-zinc-500">
              Try adjusting your date range, category, or search filters above.
            </p>
          </Card>
        ) : (
          filteredLogs.map((log, idx) => (
            <Card
              key={idx}
              className="bg-white border-zinc-200 p-4 space-y-3 shadow-xs hover:border-zinc-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  {getTransactionBadge(log.inventory_event.transaction_type)}
                  {log.inventory_event.project_id && (
                    <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded border border-zinc-200">
                      Project: {log.inventory_event.project_id}
                    </span>
                  )}
                  {log.inventory_event.performed_by && (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold bg-zinc-900 text-white px-2.5 py-0.5 rounded-full border border-black shadow-xs">
                      <span>👤 {log.inventory_event.performed_by}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{new Date(log.inventory_event.timestamp).toLocaleString()}</span>
                  </div>
                  {isAdmin && onDeleteLog && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this audit log entry?')) {
                          onDeleteLog(idx);
                        }
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete audit entry (Admin only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notes Banner if present */}
              {log.inventory_event.notes && (
                <div className="flex items-start space-x-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800">
                  <FileText className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{log.inventory_event.notes}</span>
                </div>
              )}

              {/* Items in Movement Event */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {/* Mobile View (< md) */}
                <div className="block md:hidden divide-y divide-zinc-200">
                  {log.items?.map((item, itemIdx) => {
                    const chg = item.change_quantity ?? item.quantity;
                    const hasStockTrail = item.previous_stock !== undefined && item.new_stock !== undefined;

                    return (
                      <div key={itemIdx} className="p-3 text-xs space-y-1.5 font-sans bg-zinc-50/50">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-zinc-950 text-xs">{item.item_id}</span>
                          <span className="text-[10px] text-zinc-500">{item.category}</span>
                        </div>
                        <div className="font-semibold text-zinc-900 leading-snug">
                          {item.brand_manufacturer} - {item.item_description} ({item.model_number})
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-zinc-200/60">
                          <div>
                            <span className="text-zinc-500">Qty: </span>
                            {chg > 0 ? (
                              <span className="text-emerald-700 font-extrabold">+ {chg} {item.uom}</span>
                            ) : chg < 0 ? (
                              <span className="text-rose-700 font-extrabold">{chg} {item.uom}</span>
                            ) : (
                              <span className="text-zinc-700">{item.quantity} {item.uom}</span>
                            )}
                          </div>
                          <div className="text-zinc-600">
                            {hasStockTrail ? (
                              <span>Snapshot: {item.previous_stock} ➔ <strong className="text-zinc-950">{item.new_stock}</strong> {item.uom}</span>
                            ) : (
                              <span>Snapshot: {item.stock_levels?.current_stock ?? item.quantity} {item.uom}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View (md+) */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs text-zinc-800">
                    <thead className="bg-zinc-50 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="py-2 px-3">Item ID</th>
                        <th className="py-2 px-3">Brand & Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Movement Qty</th>
                        <th className="py-2 px-3">Stock Trail Snapshot</th>
                        <th className="py-2 px-3">Serials</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                      {log.items?.map((item, itemIdx) => {
                        const chg = item.change_quantity ?? item.quantity;
                        const hasStockTrail = item.previous_stock !== undefined && item.new_stock !== undefined;

                        return (
                          <tr key={itemIdx} className="hover:bg-zinc-50/50">
                            <td className="py-2.5 px-3 text-zinc-950 font-bold">{item.item_id}</td>
                            <td className="py-2.5 px-3 font-sans font-medium text-zinc-950">
                              {item.brand_manufacturer} - {item.item_description} ({item.model_number})
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">{item.category}</td>
                            <td className="py-2.5 px-3 font-bold">
                              {chg > 0 ? (
                                <span className="text-emerald-700 font-extrabold">+ {chg} {item.uom}</span>
                              ) : chg < 0 ? (
                                <span className="text-rose-700 font-extrabold">{chg} {item.uom}</span>
                              ) : (
                                <span className="text-zinc-700">{item.quantity} {item.uom}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">
                              {hasStockTrail ? (
                                <span>
                                  {item.previous_stock} ➔ <strong className="text-zinc-950">{item.new_stock}</strong> {item.uom}
                                </span>
                              ) : (
                                <span>{item.stock_levels?.current_stock ?? item.quantity} {item.uom}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {item.serial_numbers?.length ? `${item.serial_numbers.length} serials` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
