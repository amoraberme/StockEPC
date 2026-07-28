import React, { useState } from 'react';
import { SYSTEM_INSTRUCTION, PRD_CONFIG } from '../lib/prdSpec';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Sliders, Copy, Check, Terminal, ShieldCheck } from 'lucide-react';

interface PrdSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrdSpecModal: React.FC<PrdSpecModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(SYSTEM_INSTRUCTION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-zinc-950">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Sliders className="w-5 h-5 text-black shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 truncate">
                Solar EPC Hardware Inventory PRD & System Parameters Config
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                Specification guidelines for Solar EPC Balance of System (BOS) inventory engine
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs">
          {/* Config Parameters Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <Card className="bg-zinc-50 p-3 border-zinc-200">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">
                Parser Engine
              </span>
              <span className="text-zinc-950 font-mono font-bold text-xs mt-1 block">
                {PRD_CONFIG.engine}
              </span>
            </Card>

            <Card className="bg-zinc-50 p-3 border-zinc-200">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-bold">
                PRD Version
              </span>
              <span className="text-zinc-950 font-mono font-bold text-xs mt-1 block">
                {PRD_CONFIG.prdVersion}
              </span>
            </Card>
          </div>

          {/* System Instructions Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-black" />
                <span>System Processing Rules</span>
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInstructions}
                className="h-8 text-xs font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Rules!' : 'Copy Rules Specification'}</span>
              </Button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-100 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
              {SYSTEM_INSTRUCTION}
            </div>
          </div>

          {/* PRD Rules Summary */}
          <Card className="bg-zinc-50 p-4 border-zinc-200 space-y-2">
            <div className="flex items-center space-x-2 text-zinc-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>Category & UOM Enforcements Summary</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-700 text-[11px]">
              <li><strong>PV Modules:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">PCS</code> with Watts (W) / kWp metadata.</li>
              <li><strong>Inverters & BESS:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">PCS</code> with kW capacity, phase type, and kWh storage metadata.</li>
              <li><strong>Cabling & Wiring:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">METERS</code> or <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">SPOOLS</code>. Must NOT be tracked in Pieces.</li>
              <li><strong>Connectors & Hardware:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">PCS</code> or <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">BOXES</code>.</li>
              <li><strong>Mounting Racking:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">SETS</code>, <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">RAILS</code>, or <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">PCS</code>.</li>
              <li><strong>BOS Switchgear:</strong> Tracked in <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono font-bold">PCS</code> (DC SPDs, Breakers, Combiner Boxes).</li>
            </ul>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              className="bg-black hover:bg-zinc-800 text-white font-bold"
            >
              Close Config Window
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
