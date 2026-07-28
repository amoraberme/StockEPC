import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Hash, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SerialNumbersModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaveSerials: (itemId: string, serials: string[]) => void;
}

export const SerialNumbersModal: React.FC<SerialNumbersModalProps> = ({
  item,
  onClose,
  onSaveSerials
}) => {
  if (!item) return null;

  const [serials, setSerials] = useState<string[]>(item.serial_numbers || []);
  const [newSerialInput, setNewSerialInput] = useState<string>('');

  const handleAddSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialInput.trim()) return;

    const trimmed = newSerialInput.trim().toUpperCase();
    if (serials.includes(trimmed)) {
      alert('Serial number already recorded in list.');
      return;
    }

    const updated = [trimmed, ...serials];
    setSerials(updated);
    setNewSerialInput('');
  };

  const handleRemoveSerial = (index: number) => {
    const updated = serials.filter((_, idx) => idx !== index);
    setSerials(updated);
  };

  const handleSave = () => {
    onSaveSerials(item.item_id, serials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-zinc-950">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Hash className="w-5 h-5 text-black shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 truncate">
                Serialized Hardware Tracking
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-mono truncate">
                {item.brand_manufacturer} {item.model_number} ({item.item_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-black rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          {/* Add Serial Form */}
          <form onSubmit={handleAddSerial} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              value={newSerialInput}
              onChange={(e) => setNewSerialInput(e.target.value)}
              placeholder="Scan or enter barcode / serial..."
              className="flex-1 font-mono font-bold uppercase text-xs"
            />
            <Button
              type="submit"
              className="bg-black hover:bg-zinc-800 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4 mr-1 text-white" />
              <span>Add Serial</span>
            </Button>
          </form>

          {/* Serials List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">
              <span>Recorded Serials ({serials.length})</span>
              <span>Stock: {item.stock_levels.current_stock} {item.uom}</span>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 max-h-52 sm:max-h-60 overflow-y-auto divide-y divide-zinc-200 space-y-1">
              {serials.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 font-mono">
                  No individual serial numbers registered for this item yet.
                </div>
              ) : (
                serials.map((sn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pt-1.5 pb-1.5 font-mono text-zinc-900 font-bold break-all"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
                      <span className="truncate">{sn}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSerial(idx)}
                      className="text-zinc-400 hover:text-rose-600 transition-colors p-1 shrink-0 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm" className="bg-black hover:bg-zinc-800 text-white font-bold text-xs">
              Save Serial Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
