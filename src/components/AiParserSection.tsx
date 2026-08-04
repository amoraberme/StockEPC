import React, { useState } from 'react';
import { InventoryItem, PRDJsonOutput, TransactionType } from '../types';
import { SAMPLE_PRESETS, parseRawTextToPRD, validatePRDJson, isBatteryRelatedItem } from '../lib/prdSpec';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Terminal, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Database,
  RefreshCw,
  Zap,
  ZapOff,
  Sliders,
  BookmarkCheck
} from 'lucide-react';

interface AiParserSectionProps {
  onCommitTransaction: (prdOutput: PRDJsonOutput) => void;
  currentInventory: InventoryItem[];
}

export const AiParserSection: React.FC<AiParserSectionProps> = ({
  onCommitTransaction,
  currentInventory
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_PRESETS[0].id);
  const [rawText, setRawText] = useState<string>(SAMPLE_PRESETS[0].promptText);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedOutput, setParsedOutput] = useState<PRDJsonOutput | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [committedSuccess, setCommittedSuccess] = useState<boolean>(false);

  // Handle selecting preset
  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(preset.id);
      setRawText(preset.promptText);
      setParsedOutput(null);
      setParseError(null);
      setCommittedSuccess(false);
    }
  };

  // Run Rule-Based Parsing
  const handleRunParser = async () => {
    if (!rawText.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setCommittedSuccess(false);

    try {
      const result = await parseRawTextToPRD(rawText);
      setParsedOutput(result);
    } catch (err: any) {
      console.error('Parser Error:', err);
      setParseError(err.message || 'Failed to process raw text into PRD JSON specification structure.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCopyJson = () => {
    if (!parsedOutput) return;
    navigator.clipboard.writeText(JSON.stringify(parsedOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommitToStock = () => {
    if (!parsedOutput) return;
    onCommitTransaction(parsedOutput);
    setCommittedSuccess(true);
    setTimeout(() => setCommittedSuccess(false), 4000);
  };

  const handleExcludeBatteryFromPrd = () => {
    if (!parsedOutput) return;
    const filteredItems = parsedOutput.items.filter((item) => !isBatteryRelatedItem(item));
    setParsedOutput({
      ...parsedOutput,
      inventory_event: {
        ...parsedOutput.inventory_event,
        notes: `${parsedOutput.inventory_event.notes || ''} [Note: Battery Subsystem Package Excluded]`
      },
      items: filteredItems
    });
  };

  // Validation output
  const validationResult = parsedOutput ? validatePRDJson(parsedOutput) : null;

  return (
    <div id="rule-parser-workspace" className="space-y-6">
      {/* Overview Banner */}
      <Card className="bg-white border-zinc-200">
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-zinc-950 font-black text-base">
                <Terminal className="w-5 h-5 text-black" />
                <h2>PRD Compliant Text Parser & Normalizer</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Converts unformatted packing lists, supplier GRNs, dispatch manifests, and email text into strict PRD-structured JSON with auto-assigned Category and UOM.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-[10px] py-1 font-mono border-zinc-300">
                Offline Local Engine
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preset Scenario Selectors */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 flex items-center space-x-1.5">
          <FileText className="w-4 h-4 text-zinc-900" />
          <span>Select Sample Solar EPC Scenarios & Manifest Text</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-zinc-300' : 'text-zinc-500'
                  }`}>
                    Scenario
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="font-bold text-xs">{preset.title}</div>
                <p className={`text-[11px] mt-1 line-clamp-2 ${
                  isSelected ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Raw Input and Output Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <Card className="bg-white border-zinc-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-zinc-900" />
                <span>Raw Unstructured Inventory Manifest Text</span>
              </label>

              <button
                onClick={() => setRawText('')}
                className="text-[11px] text-zinc-500 hover:text-black transition-colors"
              >
                Clear Text
              </button>
            </div>

            <Textarea
              id="textarea-raw-inventory"
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw packing list, delivery invoice, or warehouse scan text here..."
              className="p-3.5 bg-zinc-50 border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black font-mono leading-relaxed"
            />
          </div>

          {/* Run Action */}
          <div className="pt-2">
            <Button
              id="btn-run-rule-parser"
              onClick={handleRunParser}
              disabled={isParsing || !rawText.trim()}
              className="w-full bg-black hover:bg-zinc-800 text-white font-bold h-11 text-xs shadow-md flex items-center justify-center space-x-2"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing PRD Extraction Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Parse & Standardize into PRD JSON</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output Column */}
        <Card className="bg-white border-zinc-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-zinc-900" />
                <span className="text-xs font-bold text-zinc-900">
                  Standardized PRD JSON Output
                </span>
              </div>

              {parsedOutput && (
                <div className="flex items-center space-x-2">
                  {parsedOutput.items.some((i) => isBatteryRelatedItem(i)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExcludeBatteryFromPrd}
                      className="h-7 text-[11px] px-2.5 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer"
                      title="Exclude battery module, DC MCCB breaker, and battery cabling from PRD items"
                    >
                      <ZapOff className="w-3.5 h-3.5 mr-1 text-amber-700" />
                      <span>Exclude Battery Package</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJson}
                    className="h-7 text-[11px] px-2.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-zinc-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Error view */}
            {parseError && (
              <div className="p-3 rounded-xl bg-zinc-900 text-white text-xs border border-zinc-800 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Parsing Error</span>
                </div>
                <p className="text-zinc-300 text-[11px] font-mono">{parseError}</p>
              </div>
            )}

            {/* Validation alerts */}
            {validationResult && (
              <div className={`p-3 rounded-xl text-xs border flex items-center space-x-2 ${
                validationResult.isValid
                  ? 'bg-zinc-100 border-zinc-300 text-zinc-900 font-bold'
                  : 'bg-zinc-900 text-white border-black font-semibold'
              }`}>
                {validationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>PRD Standard Validation: 100% Compliant (Enforced Category & UOM)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{validationResult.issues.length} Validation Warnings Detected</span>
                  </>
                )}
              </div>
            )}

            {/* Output json viewer */}
            {parsedOutput ? (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-100 leading-relaxed overflow-x-auto no-scrollbar max-h-[320px]">
                <pre>{JSON.stringify(parsedOutput, null, 2)}</pre>
              </div>
            ) : (
              <div className="h-64 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
                <Terminal className="w-8 h-8 text-zinc-300" />
                <p className="text-xs font-medium text-zinc-600">No output generated yet.</p>
                <p className="text-[11px] text-zinc-400">
                  Click 'Parse & Standardize into PRD JSON' to run the extraction model.
                </p>
              </div>
            )}
          </div>

          {/* Commit Action */}
          {parsedOutput && (
            <div className="pt-2">
              <Button
                id="btn-commit-stock-change"
                onClick={handleCommitToStock}
                disabled={committedSuccess}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold h-11 text-xs shadow-md flex items-center justify-center space-x-2"
              >
                {committedSuccess ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-white" />
                    <span>Committed & Inventory Stock Updated!</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-white" />
                    <span>Commit Transaction Event to Active Stock</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
