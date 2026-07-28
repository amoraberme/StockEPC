import React, { useState, useMemo } from 'react';
import { PRDJsonOutput } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  History, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Bookmark, 
  PackagePlus, 
  PackageMinus, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface TransactionHistoryProps {
  logs: PRDJsonOutput[];
  onClearLogs?: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryProps> = ({
  logs,
  onClearLogs
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'RESTOCK' | 'REMOVED' | 'RESERVATION' | 'SKU_CHANGES'>('ALL');

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `solar_epc_inventory_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const txType = log.inventory_event.transaction_type;

      // Filter Tab
      if (activeFilterTab === 'RESTOCK' && txType !== 'RESTOCK' && txType !== 'INBOUND') return false;
      if (activeFilterTab === 'REMOVED' && txType !== 'REMOVED' && txType !== 'OUTBOUND') return false;
      if (activeFilterTab === 'RESERVATION' && txType !== 'RESERVATION') return false;
      if (activeFilterTab === 'SKU_CHANGES' && txType !== 'SKU_ADDED' && txType !== 'SKU_DELETED') return false;

      // Search Filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const eventNotes = log.inventory_event.notes?.toLowerCase() || '';
        const projId = log.inventory_event.project_id?.toLowerCase() || '';
        const operator = log.inventory_event.performed_by?.toLowerCase() || '';
        const matchesItem = log.items?.some(
          (i) =>
            i.item_id.toLowerCase().includes(query) ||
            i.brand_manufacturer.toLowerCase().includes(query) ||
            i.model_number.toLowerCase().includes(query) ||
            i.item_description.toLowerCase().includes(query)
        );

        return eventNotes.includes(query) || projId.includes(query) || operator.includes(query) || matchesItem;
      }

      return true;
    });
  }, [logs, activeFilterTab, searchFilter]);

  return (
    <div id="transaction-history-view" className="space-y-4 font-sans">
      {/* View Header */}
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

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Immutable Audit Trail Enforced</span>
            </span>

            {logs.length > 0 && (
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
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'ALL'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All Movements ({logs.length})
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
              onClick={() => setActiveFilterTab('SKU_CHANGES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilterTab === 'SKU_CHANGES'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Item Created/Deleted
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search audit trail..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 text-xs h-8 bg-zinc-50"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="bg-white border-zinc-200 p-12 text-center text-zinc-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="text-sm font-bold text-zinc-700">No matching audit trail records found.</p>
            <p className="text-xs text-zinc-500">
              Use the inventory action controls or checklist section to generate movement events.
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

                <div className="flex items-center space-x-1.5 text-xs text-zinc-500 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{new Date(log.inventory_event.timestamp).toLocaleString()}</span>
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
