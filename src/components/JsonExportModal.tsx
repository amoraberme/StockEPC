import React, { useState, useMemo } from 'react';
import { InventoryItem, TransactionType, PRDJsonOutput } from '../types';
import { validatePRDJson } from '../lib/prdSpec';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { FileJson, Copy, Check, Download, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface JsonExportViewProps {
  items: InventoryItem[];
}

export const JsonExportView: React.FC<JsonExportViewProps> = ({ items }) => {
  const [transactionType, setTransactionType] = useState<TransactionType>('AUDIT');
  const [projectId, setProjectId] = useState<string>('PROJ-SOLAR-AUDIT-2026');
  const [copied, setCopied] = useState<boolean>(false);

  // Build current event JSON
  const prdJsonPayload: PRDJsonOutput = useMemo(() => {
    return {
      inventory_event: {
        transaction_type: transactionType,
        project_id: projectId || undefined,
        timestamp: new Date().toISOString()
      },
      items: items
    };
  }, [items, transactionType, projectId]);

  // Run validation
  const validationResult = useMemo(() => {
    return validatePRDJson(prdJsonPayload);
  }, [prdJsonPayload]);

  const jsonString = useMemo(() => {
    return JSON.stringify(prdJsonPayload, null, 2);
  }, [prdJsonPayload]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `solar_inventory_prd_${transactionType}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="prd-json-view" className="space-y-6">
      {/* Top Controls Banner */}
      <Card className="bg-white border-zinc-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-zinc-950 font-black text-lg">
              <FileJson className="w-5 h-5 text-black" />
              <h2>PRD Specification JSON Payload Generator</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Generate structured, standard-compliant PRD JSON events representing current active warehouse stock or audit state.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="font-semibold text-xs"
            >
              {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </Button>

            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-black hover:bg-zinc-800 text-white font-bold"
            >
              <Download className="w-4 h-4 mr-1 text-white" />
              <span>Download .json File</span>
            </Button>
          </div>
        </div>

        {/* Transaction Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Transaction Event Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-950 font-mono font-bold focus:outline-none focus:border-black"
            >
              <option value="AUDIT">AUDIT (Warehouse Stock Count)</option>
              <option value="INBOUND">INBOUND (Shipment Receipt)</option>
              <option value="OUTBOUND">OUTBOUND (Dispatch / Shipping)</option>
              <option value="RESERVATION">RESERVATION (Project Allocations)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Project ID (Optional)
            </label>
            <Input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. PROJ-SOLAR-ALPHA"
              className="font-mono bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">
              Validation Compliance
            </label>
            <div className={`p-2.5 rounded-xl border flex items-center space-x-2 font-bold ${
              validationResult.isValid
                ? 'bg-zinc-100 border-zinc-300 text-zinc-950'
                : 'bg-zinc-900 text-white border-black'
            }`}>
              {validationResult.isValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <span>PRD Spec Compliant</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{validationResult.issues.length} Issues Detected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Issue Alerts */}
      {validationResult.issues.length > 0 && (
        <Card className="bg-white border-zinc-200 p-4 space-y-2 text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
            PRD Compliance Checker Output:
          </span>
          <div className="space-y-1">
            {validationResult.issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg flex items-start space-x-2 bg-zinc-100 text-zinc-900 border border-zinc-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-900" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Code Editor Preview */}
      <Card className="bg-white border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3 text-xs text-zinc-500 font-mono">
          <span>payload_spec.json</span>
          <span>{items.length} items formatted</span>
        </div>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-100 leading-relaxed overflow-x-auto no-scrollbar max-h-[500px]">
          <pre>{jsonString}</pre>
        </div>
      </Card>
    </div>
  );
};
