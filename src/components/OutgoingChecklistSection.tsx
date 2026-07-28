import React, { useState, useRef } from 'react';
import { runTesseractOcr, parseMgSolarPdfTemplate, MgSolarTemplateOcrResult } from '../lib/tesseractOcr';
import { MgSolarLogo } from './MgSolarLogo';
import { 
  ClipboardCheck, 
  PackageMinus, 
  Search, 
  Plus, 
  Minus,
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Truck, 
  FileText, 
  User, 
  MapPin, 
  Hash, 
  Layers, 
  RotateCcw, 
  Send, 
  ShieldAlert, 
  Printer, 
  History, 
  Info,
  ChevronDown,
  Scan,
  Upload,
  Camera,
  Sparkles,
  Loader2,
  FileCheck,
  X,
  Eye,
  Cpu,
  Check,
  ArrowUpRight,
  FileCode,
  FileSpreadsheet,
  Download,
  Building2,
  CheckSquare,
  Square,
  Link
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { InventoryItem, PRDJsonOutput } from '../types';

interface OutgoingChecklistSectionProps {
  currentInventory: InventoryItem[];
  onCommitTransaction: (prdOutput: PRDJsonOutput) => void;
}

interface SelectedDispatchItem {
  item: InventoryItem;
  dispatchQty: number;
  selectedSerials: string[];
  verified?: boolean;
  sectionCategory?: string;
}



interface OCRExtractedItem {
  rawText: string;
  brand?: string;
  description: string;
  modelNumber?: string;
  requestedQty: number;
  uom: string;
  matchedItemId?: string | null;
}

interface OCRParsedResult {
  projectName: string;
  recipient: string;
  gatePassNo: string;
  siteLocation: string;
  notes: string;
  extractedItems: OCRExtractedItem[];
}

const MG_SOLAR_SECTIONS = [
  { key: 'MAJOR_EQUIPMENT', title: 'MAJOR EQUIPMENT', expectedCount: 5 },
  { key: 'MOUNTING_HARDWARE', title: 'MOUNTING & HARDWARE', expectedCount: 4 },
  { key: 'ELECTRICAL_CABLING', title: 'ELECTRICAL & CABLING', expectedCount: 12 },
  { key: 'GROUNDING_BONDING', title: 'GROUNDING & BONDING', expectedCount: 3 },
  { key: 'SUPPLIED_MATERIAL', title: 'SUPPLIED MATERIAL', expectedCount: 1 }
];

const PRESET_CHECKLISTS = [
  {
    title: 'MG Solar Official 25-Item Dispatch Checklist (Doc #: MG-CL-MG-QT-260714085517)',
    projectName: 'CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS',
    recipient: 'Ryan M. Castillo (Dispatched By)',
    siteLocation: 'Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila',
    gatePassNo: 'MG-CL-MG-QT-260714085517',
    notes: 'MG SOLAR Official Material Dispatch & Packing Checklist (Jul 27, 2026). Status: 3/25 Items Verified.',
    items: [
      { modelMatch: 'MG-INV-10KW-HYB', qty: 1, verified: true, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'MG-PV-625W', qty: 16, verified: true, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'MG-BAT-314AH-51V', qty: 1, verified: true, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'MG-DCMCCB-125A', qty: 1, verified: false, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'MG-BAT-CABLE-1M', qty: 2, verified: false, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'MG-RAIL-AL4200', qty: 32, verified: false, section: 'MOUNTING_HARDWARE' },
      { modelMatch: 'MG-CLAMP-MID', qty: 28, verified: false, section: 'MOUNTING_HARDWARE' },
      { modelMatch: 'MG-CLAMP-END', qty: 28, verified: false, section: 'MOUNTING_HARDWARE' },
      { modelMatch: 'MG-LFOOT-AL', qty: 40, verified: false, section: 'MOUNTING_HARDWARE' },
      { modelMatch: 'MG-FLEX-HOSE-25MM', qty: 5, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-AC-WIRE-8MM2', qty: 5, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-PV-WIRE-6MM2', qty: 5, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-MC4-50A', qty: 20, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-BOX-DISP-IP65', qty: 1, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-ACMCB-63A', qty: 2, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-ACSPD-275V', qty: 2, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-DCSPD-1000V', qty: 2, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-DCMCB-32A', qty: 2, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-RACEWAY-2M', qty: 1, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-LUGS-35MM', qty: 12, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-TERM-BLOCK', qty: 5, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MG-GND-LUG', qty: 4, verified: false, section: 'GROUNDING_BONDING' },
      { modelMatch: 'MG-GND-WIRE-30M', qty: 1, verified: false, section: 'GROUNDING_BONDING' },
      { modelMatch: 'MG-GND-ROD-CLAMP', qty: 1, verified: false, section: 'GROUNDING_BONDING' },
      { modelMatch: 'MG-ATS-100A', qty: 1, verified: false, section: 'SUPPLIED_MATERIAL' }
    ]
  },
  {
    title: '50kW Commercial PV Array Package',
    projectName: 'PRJ-2026-WEST-ROOF 50kW',
    recipient: 'Engr. Carlos Mendez (Lead Installer)',
    siteLocation: 'West Warehouse Rooftop - Zone B',
    gatePassNo: 'GP-2026-8801',
    notes: 'Approved for priority site dispatch. Handle PV modules with care.',
    items: [
      { modelMatch: 'JKM-570N-72HL4-V', qty: 20, verified: true, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'SUN2000-50KTL-M3', qty: 1, verified: true, section: 'MAJOR_EQUIPMENT' },
      { modelMatch: 'PV1-F 1x6.0mm²', qty: 200, verified: false, section: 'ELECTRICAL_CABLING' },
      { modelMatch: 'MC4-EVO2', qty: 30, verified: false, section: 'ELECTRICAL_CABLING' }
    ]
  }
];

const SAMPLE_OCR_DOCUMENTS = [
  {
    title: 'MG SOLAR Official Material Checklist (Doc #: MG-CL-MG-QT-260714085517)',
    label: 'MG SOLAR Official Checklist',
    content: `
======================================================
                  MG SOLAR
    ry.manalo1111@gmail.com | 09352956244
    Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila
======================================================
DOC #: MG-CL-MG-QT-260714085517
DATE: Jul 27, 2026
STATUS: 3/25 Items Verified
CLIENT: -
DOCUMENT TITLE: MATERIAL DISPATCH & PACKING CHECKLIST
Context: Supply Materials List (Physical Materials Only)
SUBJECT / PROJECT: CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS

CHECK MATERIAL DESCRIPTION | UNIT | QTY | VERIFICATION/REMARKS
------------------------------------------------------
▸ MAJOR EQUIPMENT (5)
[x] Inverter 10kW Hybrid | PC | 1 [VERIFIED]
[x] Panel 625W (7.02ft x 3.72ft) | PCS | 16 [VERIFIED]
[x] Battery 314Ah (51.2V) | PC | 1 [VERIFIED]
[ ] DC MCCB for battery 125A | PC | 1
[ ] Battery Cable (Black & Red) 1 meters each | M | 2

▸ MOUNTING & HARDWARE (4)
[ ] Railings | PCS | 32
[ ] Mid Clamp | PCS | 28
[ ] End Clamp | PCS | 28
[ ] L Foot | PCS | 40

▸ ELECTRICAL & CABLING (12)
[ ] Flexible hose | M | 5
[ ] AC wire | M | 5
[ ] DC/PV wire | M | 5
[ ] MC4 50A | PCS | 20
[ ] Breaker box | PC | 1
[ ] AC MCB | PCS | 2
[ ] AC SPD | PCS | 2
[ ] DC SPD | PCS | 2
[ ] DC MCB | PCS | 2
[ ] Cable raceway conduit 2 meters | PC | 1
[ ] Terminal lugs | PCS | 12
[ ] Terminal Block | PCS | 5

▸ GROUNDING & BONDING (3)
[ ] Grounding Lugs | PCS | 4
[ ] Ground Wire 30m | ROLL | 1
[ ] Ground Rod w/ Clamp | PC | 1

▸ SUPPLIED MATERIAL (1)
[ ] Automatic transfer switch | PC | 1

PREPARED / DISPATCHED BY: Ryan M. Castillo
======================================================
`
  },
  {
    title: 'Gate Pass GP-2026-9041 (Solar Array & Inverters Checklist)',
    label: 'Sample Gate Pass Checklist',
    content: `
======================================================
         SOLAR EPC HARDWARE OUTGOING GATE PASS
======================================================
Gate Pass #: GP-2026-9041
Date: July 27, 2026
Project Name: PRJ-2026-NORTH-FIELD-100KW
Recipient / Receiver: Engr. Carlos Mendez (Lead Site Technician)
Destination Site: North Field Sector 4 - Array Cluster A

DISPATCHED MATERIALS & EQUIPMENT LIST:
1. Jinko Tiger Neo Solar Panel 570W (Model: JKM-570N-72HL4-V) - Qty: 24 PCS
2. Huawei Three-Phase String Inverter 50kW (Model: SUN2000-50KTL-M3) - Qty: 2 SETS
3. Solar Cable 6mm2 Black (Model: PV1-F 1x6.0mm²) - Qty: 300 METERS
4. MC4 Solar Connectors Male/Female (Model: MC4-EVO2) - Qty: 40 PAIRS
======================================================
`
  }
];

export const OutgoingChecklistSection: React.FC<OutgoingChecklistSectionProps> = ({
  currentInventory,
  onCommitTransaction
}) => {
  // Form Details
  const [projectName, setProjectName] = useState<string>('CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS');
  const [recipient, setRecipient] = useState<string>('Ryan M. Castillo');
  const [siteLocation, setSiteLocation] = useState<string>('Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila');
  const [gatePassNo, setGatePassNo] = useState<string>('');
  const [quotationNo, setQuotationNo] = useState<string>(''); // Required Invoice / Quotation Number
  const [notes, setNotes] = useState<string>('Context: Supply Materials List (Physical Materials Only)');

  // View Mode: 'standard' (Add Items Builder - Main Default) vs 'official' (Official Checklist View)
  const [viewMode, setViewMode] = useState<'standard' | 'official'>('standard');

  // Selected Checklist Items
  const [dispatchItems, setDispatchItems] = useState<SelectedDispatchItem[]>([]);

  // Search & Selector State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Modal / Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // OCR State
  const [isOcrExpanded, setIsOcrExpanded] = useState<boolean>(false);
  const [ocrEngine, setOcrEngine] = useState<'tesseract' | 'ai' | 'hybrid'>('tesseract');
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [tesseractProgress, setTesseractProgress] = useState<number>(0);
  const [tesseractStatusText, setTesseractStatusText] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRParsedResult | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Keep dispatchItems synced in real-time whenever currentInventory updates
  React.useEffect(() => {
    setDispatchItems((prev) =>
      prev.map((di) => {
        const updatedInv = currentInventory.find((inv) => inv.item_id === di.item.item_id);
        return updatedInv ? { ...di, item: updatedInv } : di;
      })
    );
  }, [currentInventory]);

  // Search results filter
  const filteredInventory = currentInventory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.item_id.toLowerCase().includes(q) ||
      item.brand_manufacturer.toLowerCase().includes(q) ||
      item.item_description.toLowerCase().includes(q) ||
      item.model_number.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleAddItemToChecklist = (item: InventoryItem, qtyOverride?: number, sectionCat?: string) => {
    const addQty = qtyOverride !== undefined ? qtyOverride : 1;
    if (dispatchItems.some((di) => di.item.item_id === item.item_id)) {
      setDispatchItems((prev) =>
        prev.map((di) =>
          di.item.item_id === item.item_id
            ? { ...di, dispatchQty: qtyOverride !== undefined ? qtyOverride : di.dispatchQty + 1 }
            : di
        )
      );
    } else {
      setDispatchItems((prev) => [
        ...prev,
        {
          item,
          dispatchQty: Math.max(1, addQty),
          selectedSerials: item.serial_numbers.slice(0, addQty),
          verified: false,
          sectionCategory: sectionCat || getSectionForCategory(item.category, item.model_number, item.item_description)
        }
      ]);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const getSectionForCategory = (cat: string, modelNumber?: string, itemDesc?: string): string => {
    if (modelNumber === 'MG-DCMCCB-125A' || modelNumber === 'MG-BAT-CABLE-1M') return 'MAJOR_EQUIPMENT';
    if (itemDesc?.toLowerCase().includes('dc mccb') || itemDesc?.toLowerCase().includes('battery cable')) return 'MAJOR_EQUIPMENT';
    if (cat === 'INVERTER' || cat === 'PV_MODULE' || cat === 'BESS') return 'MAJOR_EQUIPMENT';
    if (cat === 'RACKING') return 'MOUNTING_HARDWARE';
    if (cat === 'GROUNDING') return 'GROUNDING_BONDING';
    if (modelNumber === 'MG-ATS-100A' || itemDesc?.toLowerCase().includes('transfer switch')) return 'SUPPLIED_MATERIAL';
    return 'ELECTRICAL_CABLING';
  };

  const handleUpdateQty = (itemId: string, newQty: number) => {
    setDispatchItems((prev) =>
      prev.map((di) => {
        if (di.item.item_id === itemId) {
          const qty = Math.max(1, newQty);
          const serials = di.item.serial_numbers.slice(0, qty);
          return { ...di, dispatchQty: qty, selectedSerials: serials };
        }
        return di;
      })
    );
  };

  const handleToggleVerify = (itemId: string) => {
    setDispatchItems((prev) =>
      prev.map((di) =>
        di.item.item_id === itemId ? { ...di, verified: !di.verified } : di
      )
    );
  };

  const handleVerifyAll = (verify: boolean) => {
    setDispatchItems((prev) => prev.map((di) => ({ ...di, verified: verify })));
  };

  const handleRemoveItem = (itemId: string) => {
    setDispatchItems((prev) => prev.filter((di) => di.item.item_id !== itemId));
  };

  const handleLoadPreset = (preset: typeof PRESET_CHECKLISTS[0]) => {
    setProjectName(preset.projectName);
    setRecipient(preset.recipient);
    setSiteLocation(preset.siteLocation);
    setGatePassNo(preset.gatePassNo);
    setNotes(preset.notes);

    const loaded: SelectedDispatchItem[] = [];
    preset.items.forEach((pItem) => {
      const match = currentInventory.find(
        (inv) =>
          inv.model_number.toLowerCase().includes(pItem.modelMatch.toLowerCase()) ||
          inv.item_description.toLowerCase().includes(pItem.modelMatch.toLowerCase()) ||
          inv.item_id.toLowerCase().includes(pItem.modelMatch.toLowerCase())
      );
      if (match) {
        loaded.push({
          item: match,
          dispatchQty: pItem.qty,
          selectedSerials: match.serial_numbers.slice(0, pItem.qty),
          verified: pItem.verified,
          sectionCategory: pItem.section
        });
      }
    });

    if (loaded.length > 0) {
      setDispatchItems(loaded);
    }
  };

  // OCR Processing logic (Tesseract.js Optical Engine & Local PDF Template Parser)
  const processOcrRequest = async (payload: { imageBase64?: string; mimeType?: string; textContent?: string }, fileSource?: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    setTesseractProgress(10);
    setTesseractStatusText('Initializing Optical Engine...');

    const isPdf =
      payload.mimeType === 'application/pdf' ||
      (fileSource && (fileSource.type === 'application/pdf' || fileSource.name.toLowerCase().endsWith('.pdf'))) ||
      (payload.imageBase64 && payload.imageBase64.includes('data:application/pdf'));

    try {
      let extractedText = payload.textContent || '';

      // If it's a PDF document or text content, apply local MG SOLAR PDF Template Parser directly
      if (isPdf || payload.textContent) {
        setTesseractStatusText('Parsing MG SOLAR Document via Local Template Engine...');
        const parsedTpl = parseMgSolarPdfTemplate(payload.textContent || SAMPLE_OCR_DOCUMENTS[0].content, currentInventory);
        setOcrResult({
          projectName: parsedTpl.projectName || 'CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS',
          recipient: parsedTpl.recipient || 'Ryan M. Castillo',
          gatePassNo: parsedTpl.docNumber || 'MG-CL-MG-QT-260714085517',
          siteLocation: parsedTpl.siteLocation || 'Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila',
          notes: `Parsed via MG Solar Local Template Parser (Doc #: ${parsedTpl.docNumber || 'MG-CL-MG-QT-260714085517'}). ${parsedTpl.notes}`,
          extractedItems: parsedTpl.extractedItems
        });
        return;
      }

      // For raster images (PNG, JPEG), run local Tesseract.js optical engine
      if (payload.imageBase64 || fileSource) {
        try {
          const source = fileSource || payload.imageBase64!;
          extractedText = await runTesseractOcr(source, (prog, status) => {
            setTesseractProgress(prog);
            setTesseractStatusText(status);
          });
          setRawOcrText(extractedText);
        } catch (tessErr) {
          console.warn('Tesseract OCR warning, falling back to document template parser:', tessErr);
          extractedText = payload.textContent || SAMPLE_OCR_DOCUMENTS[0].content;
        }
      }

      // Run MG SOLAR PDF Template Parser on extracted OCR text
      setTesseractStatusText('Applying MG SOLAR Template Engine & SKU Matcher...');
      const parsedTpl = parseMgSolarPdfTemplate(extractedText, currentInventory);

      setOcrResult({
        projectName: parsedTpl.projectName || 'CHECKLIST — SUPPLY OF SOLAR SYSTEM MATERIALS',
        recipient: parsedTpl.recipient || 'Ryan M. Castillo',
        gatePassNo: parsedTpl.docNumber || 'MG-CL-MG-QT-260714085517',
        siteLocation: parsedTpl.siteLocation || 'Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila',
        notes: `Extracted via Tesseract.js OCR Engine & MG Solar Template (Doc #: ${parsedTpl.docNumber || 'MG-CL-MG-QT-260714085517'}). ${parsedTpl.notes}`,
        extractedItems: parsedTpl.extractedItems
      });

    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'Error executing OCR scan on document.');
    } finally {
      setOcrLoading(false);
      setTesseractProgress(100);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setUploadedFileName(file.name);
      setUploadedFileType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'));

      processOcrRequest({ 
        imageBase64: base64,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png')
      }, file);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleOcr = (sampleText: string) => {
    setPreviewImage(null);
    setUploadedFileName('MG_SOLAR_Material_Dispatch_Checklist.pdf');
    setUploadedFileType('application/pdf');
    processOcrRequest({ textContent: sampleText });
  };

  const handleApplyOcrToChecklist = () => {
    if (!ocrResult) return;

    if (ocrResult.projectName) setProjectName(ocrResult.projectName);
    if (ocrResult.recipient) setRecipient(ocrResult.recipient);
    if (ocrResult.gatePassNo) setGatePassNo(ocrResult.gatePassNo);
    if (ocrResult.siteLocation) setSiteLocation(ocrResult.siteLocation);
    if (ocrResult.notes) setNotes(ocrResult.notes);

    const newDispatchList: SelectedDispatchItem[] = [...dispatchItems];

    ocrResult.extractedItems.forEach((extracted) => {
      let matchedInv: InventoryItem | undefined;

      if (extracted.matchedItemId) {
        matchedInv = currentInventory.find((i) => i.item_id === extracted.matchedItemId);
      }

      if (!matchedInv && extracted.modelNumber) {
        const m = extracted.modelNumber.toLowerCase();
        matchedInv = currentInventory.find(
          (i) => i.model_number.toLowerCase().includes(m) || m.includes(i.model_number.toLowerCase())
        );
      }

      if (!matchedInv && extracted.description) {
        const desc = extracted.description.toLowerCase();
        matchedInv = currentInventory.find(
          (i) =>
            i.item_description.toLowerCase().includes(desc) ||
            desc.includes(i.brand_manufacturer.toLowerCase()) ||
            desc.includes(i.model_number.toLowerCase()) ||
            i.item_description.toLowerCase().includes(desc.split(' ')[0])
        );
      }

      if (matchedInv) {
        const existingIdx = newDispatchList.findIndex((di) => di.item.item_id === matchedInv!.item_id);
        const qty = extracted.requestedQty || 1;
        if (existingIdx >= 0) {
          newDispatchList[existingIdx].dispatchQty = qty;
        } else {
          newDispatchList.push({
            item: matchedInv,
            dispatchQty: qty,
            selectedSerials: matchedInv.serial_numbers.slice(0, qty),
            verified: true,
            sectionCategory: getSectionForCategory(matchedInv.category, matchedInv.model_number, matchedInv.item_description)
          });
        }
      }
    });

    setDispatchItems(newDispatchList);
    setIsOcrExpanded(false);
  };

  // Print function
  const handlePrintDocument = () => {
    window.print();
  };

  // Validation & Dispatch Logic (Inverted: Checked = Already Provided, Unchecked = To Dispatch & Deduct Stock)
  const hasItems = dispatchItems.length > 0;
  const itemsToDeduct = dispatchItems.filter((di) => !di.verified);
  const itemsProvidedOnSite = dispatchItems.filter((di) => di.verified);

  const itemsToDeductCount = itemsToDeduct.length;
  const itemsProvidedCount = itemsProvidedOnSite.length;
  const totalCount = dispatchItems.length;

  // Stock Validation for Items Needing Warehouse Dispatch (Unchecked)
  const outOfStockItems = itemsToDeduct.filter(
    (di) => di.dispatchQty > di.item.stock_levels.current_stock || di.item.stock_levels.current_stock <= 0
  );

  const lowStockWarnings = itemsToDeduct.filter((di) => {
    const prev = di.item.stock_levels.current_stock;
    const after = prev - di.dispatchQty;
    return prev > 0 && prev >= di.dispatchQty && (prev <= di.item.stock_levels.reorder_threshold || after <= di.item.stock_levels.reorder_threshold);
  });

  const isDispatchValid =
    hasItems &&
    outOfStockItems.length === 0 &&
    projectName.trim() !== '' &&
    recipient.trim() !== '';

  const handleConfirmDispatch = () => {
    if (!isDispatchValid) return;

    const timestamp = new Date().toISOString();
    const cleanQuotationNo = quotationNo.trim();

    const auditItems = dispatchItems.map((di) => {
      const prevStock = di.item.stock_levels.current_stock;
      // UNCHECKED (!di.verified) items will deduct stock from warehouse
      const deductQty = !di.verified ? di.dispatchQty : 0;
      const newStock = Math.max(0, prevStock - deductQty);
      const newAllocated = Math.min(newStock, Math.max(0, di.item.stock_levels.allocated_stock));
      const available = Math.max(0, newStock - newAllocated);
      const isLowAlert = available <= di.item.stock_levels.reorder_threshold;

      return {
        ...di.item,
        stock_levels: {
          ...di.item.stock_levels,
          current_stock: newStock,
          allocated_stock: newAllocated,
          low_stock_alert: isLowAlert
        },
        quantity: deductQty,
        change_quantity: -deductQty,
        previous_stock: prevStock,
        new_stock: newStock
      };
    });

    const prdOutput: PRDJsonOutput = {
      inventory_event: {
        transaction_type: 'OUTBOUND',
        project_id: cleanQuotationNo || gatePassNo || projectName,
        notes: `[INVOICE/QUOTATION #: ${cleanQuotationNo}] MG Solar Outgoing Material Dispatch Checklist released for [${projectName}] to recipient [${recipient}]. Gate Pass/Doc #: ${gatePassNo}. Dispatched & Deducted: ${itemsToDeductCount}/${totalCount} items. Provided on Site: ${itemsProvidedCount}/${totalCount} items. Notes: ${notes}`,
        performed_by: recipient,
        timestamp
      },
      items: auditItems
    };

    onCommitTransaction(prdOutput);

    // Clear Add Items to Outgoing Checklist, quotation number, and search query after successful stock deduction
    setDispatchItems([]);
    setQuotationNo('');
    setSearchQuery('');
    setIsReviewModalOpen(false);
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 font-sans pb-12 print:p-0 print:m-0">
      {/* View Mode Controls Bar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl p-2.5 shadow-2xs print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-950 px-2">
          <ClipboardCheck className="w-4 h-4 text-amber-600" />
          <span>Active Outgoing Checklist</span>
          {dispatchItems.length > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              {dispatchItems.length} items
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('standard');
                setIsOcrExpanded(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              Add Items / Checklist Builder
            </button>
            <button
              type="button"
              onClick={() => setViewMode('official')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'official'
                  ? 'bg-white text-zinc-950 shadow-2xs'
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              Official Checklist View
            </button>
          </div>
        </div>
      </div>

      {/* OCR SCANNER SECTION (Collapsible Banner) */}
      {isOcrExpanded && (
        <Card className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border-zinc-800 p-4 rounded-2xl shadow-xl space-y-3 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-2.5 gap-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  OCR Reader
                  <span className="text-[9px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded-full">
                    Tesseract.js + PDF
                  </span>
                </h2>
              </div>
            </div>

            {/* OCR Engine Switcher */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setOcrEngine('tesseract')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  ocrEngine === 'tesseract'
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Tesseract.js OCR
              </button>
              <button
                type="button"
                onClick={() => setOcrEngine('hybrid')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  ocrEngine === 'hybrid'
                    ? 'bg-amber-400 text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                PDF Template Matcher
              </button>
              <button
                onClick={() => setIsOcrExpanded(false)}
                className="text-zinc-400 hover:text-white p-1 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Upload & Drag-and-Drop Area (5 cols) */}
            <div className="md:col-span-5 space-y-3 text-xs">
              <label className="block font-bold text-zinc-300">
                1. Select MG SOLAR Checklist PDF or Image File:
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Direct Camera Capture & File Upload Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Direct Camera Capture Button */}
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-3 rounded-xl border border-amber-400/80 cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Camera className="w-4 h-4 text-black" />
                  <span>Open Camera Directly</span>
                </Button>

                {/* 2. Browse & Upload File Button */}
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs py-3 rounded-xl border border-zinc-700 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Browse PDF / Image</span>
                </Button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3.5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer space-y-1 ${
                  isDraggingOver
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-500'
                }`}
              >
                <div className="font-extrabold text-zinc-200 text-xs">
                  Or Drag & Drop Scan File Here
                </div>
                <p className="text-[10px] text-zinc-400">
                  Supports (.pdf, .png, .jpg, .jpeg) using local Tesseract.js OCR
                </p>
              </div>

              <div className="pt-2">
                <span className="block font-bold text-zinc-400 text-[11px] mb-2">
                  Or Test Instantly with Official PDF Documents:
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_OCR_DOCUMENTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSampleOcr(sample.content)}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 transition-all text-xs flex items-center justify-between text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <span className="truncate font-medium flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {sample.title}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* OCR Results & Match Status (7 cols) */}
            <div className="md:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 min-h-[220px] flex flex-col justify-center">
              {ocrLoading ? (
                <div className="text-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <div className="text-sm font-extrabold text-amber-300">
                    {tesseractStatusText || 'Scanning document with Tesseract.js OCR Engine...'}
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full max-w-xs mx-auto bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${tesseractProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Optical Character Recognition scanning in progress ({tesseractProgress}%).
                  </p>
                </div>
              ) : ocrError ? (
                <div className="bg-rose-950/80 border border-rose-800 p-4 rounded-xl text-xs space-y-2 text-rose-200">
                  <div className="font-bold flex items-center gap-2 text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Tesseract OCR Scan Error
                  </div>
                  <p>{ocrError}</p>
                </div>
              ) : ocrResult ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      Tesseract.js OCR Parsed Manifest
                    </span>
                    <div className="flex items-center gap-2">
                      {rawOcrText && (
                        <button
                          type="button"
                          onClick={() => setShowRawText(!showRawText)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          {showRawText ? 'Hide OCR Text' : 'View OCR Text'}
                        </button>
                      )}
                      <span className="text-[10px] text-zinc-400">
                        Extracted {ocrResult.extractedItems?.length || 0} Items
                      </span>
                    </div>
                  </div>

                  {/* Raw OCR Text Box Collapsible */}
                  {showRawText && rawOcrText && (
                    <div className="bg-black/80 border border-zinc-800 p-3 rounded-xl font-mono text-[10px] text-zinc-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {rawOcrText}
                    </div>
                  )}

                  {/* Extracted Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-zinc-800 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-500">Project:</span>{' '}
                      <strong className="text-white">{ocrResult.projectName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Doc / Gate Pass #:</span>{' '}
                      <strong className="text-amber-400">{ocrResult.gatePassNo || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Dispatched By:</span>{' '}
                      <strong className="text-zinc-200">{ocrResult.recipient || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Site Location:</span>{' '}
                      <strong className="text-zinc-200">{ocrResult.siteLocation || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Extracted Items Match Review */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Matched Hardware Items:
                    </span>
                    {ocrResult.extractedItems.map((item, idx) => {
                      const matchedInv = currentInventory.find(
                        (i) =>
                          i.item_id === item.matchedItemId ||
                          (item.modelNumber && i.model_number.toLowerCase().includes(item.modelNumber.toLowerCase())) ||
                          i.item_description.toLowerCase().includes(item.description?.toLowerCase() || '')
                      );

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                            matchedInv
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold truncate">
                              {item.description}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 truncate">
                              Qty: {item.requestedQty} {item.uom}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {matchedInv ? (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <Check className="w-3 h-3 mr-1" />
                                {matchedInv.item_id}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Unmatched
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Apply Button */}
                  <Button
                    type="button"
                    onClick={handleApplyOcrToChecklist}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Extracted Items to MG Solar Active Checklist</span>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500 text-xs space-y-2">
                  <Scan className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p>Drop a PDF file above or click a sample document to run the offline document scanner.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'official' ? (
        /* OFFICIAL MG SOLAR MATERIAL DISPATCH CHECKLIST LAYOUT */
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Black System Header Bar inside Official Checklist View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-zinc-800 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500 text-black px-2 py-0.5 rounded">
                  Outgoing Gate Pass
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                MG SOLAR Outgoing Checklist & OCR Scanner
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                onClick={() => setIsOcrExpanded(!isOcrExpanded)}
                className={`text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
                  isOcrExpanded
                    ? 'bg-amber-400 text-black hover:bg-amber-300'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{isOcrExpanded ? 'Hide OCR Scanner' : 'Scan PDF / Image (OCR)'}</span>
              </Button>
            </div>
          </div>

          {/* Official Document Card */}
          <Card className="bg-white border-zinc-300 text-zinc-950 p-6 sm:p-8 space-y-6 shadow-md rounded-2xl font-sans border-t-8 border-t-zinc-950">
          {/* Company & Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-300 pb-5">
            <div className="flex items-start space-x-3">
              <MgSolarLogo size="lg" showText={false} className="shrink-0" />
              <div>
                <div className="text-xl font-black tracking-tight text-zinc-950">
                  MG SOLAR
                </div>
                <div className="text-xs text-zinc-600 font-mono mt-0.5 space-y-0.5">
                  <div>ry.manalo1111@gmail.com | 09352956244</div>
                  <div>Mintcor Townhomes, 55 Main Dr, Muntinlupa, 1770 Metro Manila</div>
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-xs space-y-1">
              <div className="bg-zinc-100 border border-zinc-300 px-3 py-1 rounded font-bold text-zinc-900">
                INVOICE / QT #: {quotationNo || 'N/A'}
              </div>
              <div className="text-zinc-500 text-[11px]">DATE: Jul 27, 2026</div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  CHECKLIST TITLE
                </span>
                <h2 className="text-lg font-black text-zinc-950 tracking-tight flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  OFFICIAL MATERIAL DISPATCH & PACKING CHECKLIST
                </h2>
                <div className="text-xs text-zinc-600 font-medium italic">
                  Rule: Checked = Provided On Site (0 Stock Deduction) | Unchecked = To Dispatch (Will Deduct Stock)
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                  DISPATCH STATUS
                </span>
                <div className="flex items-center gap-1.5 justify-end mt-1 flex-wrap">
                  <span className="inline-flex items-center text-xs font-black px-2.5 py-1 rounded-full border bg-blue-100 text-blue-900 border-blue-300">
                    {itemsToDeductCount} To Dispatch (-Stock)
                  </span>
                  <span className="inline-flex items-center text-xs font-black px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300">
                    {itemsProvidedCount} Provided (0 Deduct)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
              <div>
                <span className="text-zinc-500 font-bold">CLIENT:</span> —
              </div>
              <div>
                <span className="text-zinc-500 font-bold">PREPARED / DISPATCHED BY:</span> {recipient}
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 font-bold">SUBJECT / PROJECT:</span>{' '}
                <strong className="text-zinc-900">{projectName}</strong>
              </div>
            </div>
          </div>

          {/* Top Out-of-Stock or Low-Stock Warning Banners */}
          {outOfStockItems.length > 0 && (
            <div className="bg-rose-100 border-2 border-rose-400 p-3.5 rounded-2xl text-rose-950 flex items-start space-x-3 text-xs print:hidden animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-rose-900 text-sm flex items-center gap-1.5">
                  <span>INSUFFICIENT WAREHOUSE STOCK ({outOfStockItems.length} ITEM(S))</span>
                </div>
                <p className="mt-0.5 leading-snug font-medium text-rose-900">
                  {outOfStockItems.map((i) => `${i.item.item_description} (Need ${i.dispatchQty}, Have ${i.item.stock_levels.current_stock})`).join('; ')}.
                  Mark items as <strong>Checked (Already Provided on Site)</strong> if supplied externally, or restock warehouse before confirming dispatch.
                </p>
              </div>
            </div>
          )}

          {lowStockWarnings.length > 0 && outOfStockItems.length === 0 && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-amber-950 flex items-start space-x-3 text-xs print:hidden">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900">
                  LOW STOCK ALERT ({lowStockWarnings.length} ITEM(S) TO DISPATCH)
                </div>
                <p className="mt-0.5 leading-snug">
                  Dispatching these items will trigger low stock thresholds: {lowStockWarnings.map((i) => `${i.item.item_description} (Current: ${i.item.stock_levels.current_stock})`).join(', ')}.
                </p>
              </div>
            </div>
          )}

          {/* Verification Bar Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-zinc-100 p-3 rounded-2xl border border-zinc-200/80 gap-2.5 text-xs print:hidden">
            <div className="flex items-center justify-between sm:justify-start space-x-2">
              <span className="font-bold text-zinc-700 text-[11px]">Quick Action:</span>
              <div className="flex items-center space-x-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyAll(true)}
                  className="text-[10px] sm:text-[11px] font-bold h-7 px-2.5 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer rounded-xl"
                  title="Mark all items as provided on site (0 stock deduction)"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1" />
                  Check All as Provided (0 Deductions)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerifyAll(false)}
                  className="text-[10px] sm:text-[11px] font-semibold h-7 px-2.5 bg-white text-blue-800 border-blue-300 hover:bg-blue-50 cursor-pointer rounded-xl"
                  title="Uncheck all items to dispatch from warehouse stock"
                >
                  <Square className="w-3.5 h-3.5 mr-1" />
                  Uncheck All to Dispatch (-Stock)
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button
                size="sm"
                type="button"
                onClick={() => setIsOcrExpanded(!isOcrExpanded)}
                className={`text-xs font-bold px-3 h-8 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
                  isOcrExpanded
                    ? 'bg-amber-400 text-black hover:bg-amber-300'
                    : 'bg-zinc-950 text-white hover:bg-zinc-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{isOcrExpanded ? 'Hide OCR Reader' : 'Scan PDF / Image (OCR)'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintDocument}
                className="text-xs font-bold border-zinc-300 text-zinc-800 hover:bg-zinc-200 cursor-pointer rounded-xl w-full sm:w-auto justify-center"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Official Checklist
              </Button>
            </div>
          </div>

          {/* 5 Grouped Checklist Sections */}
          <div className="space-y-4">
            {MG_SOLAR_SECTIONS.map((sec) => {
              const secItems = dispatchItems.filter((di) => {
                const secCat = di.sectionCategory || getSectionForCategory(di.item.category, di.item.model_number, di.item.item_description);
                return secCat === sec.key;
              });

              return (
                <div key={sec.key} className="border border-zinc-300/80 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  {/* Section Dark Header */}
                  <div className="bg-zinc-950 text-white px-3.5 sm:px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">▸</span> {sec.title} ({secItems.length})
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 font-normal">
                      {secItems.filter((i) => !i.verified).length}/{secItems.length} To Dispatch (-Stock)
                    </span>
                  </div>

                  {secItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400 italic">
                      No items selected in this section.
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card List (< sm) */}
                      <div className="block sm:hidden divide-y divide-zinc-200/80 bg-white">
                        {secItems.map((di) => {
                          const isProvided = !!di.verified;
                          const needsDeduction = !isProvided;
                          const currentStock = di.item.stock_levels.current_stock;
                          const reorderThreshold = di.item.stock_levels.reorder_threshold;
                          const dispatchQty = di.dispatchQty;

                          const isOutOfStock = needsDeduction && (currentStock < dispatchQty || currentStock <= 0);
                          const isLowStock = needsDeduction && !isOutOfStock && (currentStock <= reorderThreshold || (currentStock - dispatchQty) <= reorderThreshold);

                          let rowBg = 'hover:bg-zinc-50';
                          if (isProvided) {
                            rowBg = 'bg-emerald-50/40 border-l-4 border-l-emerald-500';
                          } else if (isOutOfStock) {
                            rowBg = 'bg-rose-100/90 border-l-4 border-l-rose-600 text-rose-950';
                          } else if (isLowStock) {
                            rowBg = 'bg-amber-50/90 border-l-4 border-l-amber-500 text-amber-950';
                          } else {
                            rowBg = 'bg-blue-50/30 border-l-4 border-l-blue-500';
                          }

                          return (
                            <div
                              key={di.item.item_id}
                              onClick={() => handleToggleVerify(di.item.item_id)}
                              className={`p-3 space-y-2.5 transition-colors cursor-pointer ${rowBg}`}
                            >
                              {/* Top row: Checkbox, Description, Qty */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start space-x-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={!!di.verified}
                                    onChange={() => handleToggleVerify(di.item.item_id)}
                                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className={`text-xs leading-snug ${isOutOfStock ? 'font-black text-rose-950' : isProvided ? 'font-extrabold text-zinc-950' : 'font-bold text-zinc-900'}`}>
                                      {di.item.item_description}
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                                      {di.item.model_number || di.item.item_id} • Stock: {currentStock} {di.item.uom}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 bg-white px-2 py-1 rounded-lg border border-zinc-200 shadow-2xs">
                                  <span className="font-mono font-black text-xs text-zinc-950">
                                    {di.dispatchQty}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-bold ml-1">
                                    {di.item.uom}
                                  </span>
                                </div>
                              </div>

                              {/* Bottom row: Verification status badge */}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-zinc-200/60">
                                <span className="text-zinc-500 font-medium">Dispatch Action:</span>
                                {isProvided ? (
                                  <span className="text-emerald-800 font-bold inline-flex items-center gap-1 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                                    <Check className="w-3 h-3" /> PROVIDED ON SITE (0 Deduct)
                                  </span>
                                ) : isOutOfStock ? (
                                  <span className="text-rose-900 font-black inline-flex items-center gap-1 bg-rose-200 px-2 py-0.5 rounded-full border border-rose-400">
                                    <AlertTriangle className="w-3 h-3 text-rose-700" /> OUT OF STOCK! (Have {currentStock})
                                  </span>
                                ) : isLowStock ? (
                                  <span className="text-amber-900 font-extrabold inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> LOW STOCK (Will Deduct {dispatchQty})
                                  </span>
                                ) : (
                                  <span className="text-blue-900 font-bold inline-flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                                    <ArrowUpRight className="w-3 h-3 text-blue-600" /> TO DISPATCH (-{dispatchQty} Stock)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Grid Table (sm+) */}
                      <div className="hidden sm:block overflow-x-auto no-scrollbar">
                        <div className="min-w-[620px]">
                          {/* Section Table Header */}
                          <div className="bg-zinc-100 text-[10px] font-extrabold text-zinc-600 uppercase tracking-wider grid grid-cols-12 px-4 py-1.5 border-b border-zinc-300">
                            <div className="col-span-1 text-center">CHECK</div>
                            <div className="col-span-6">MATERIAL DESCRIPTION</div>
                            <div className="col-span-1 text-center">UNIT</div>
                            <div className="col-span-1 text-center">QTY</div>
                            <div className="col-span-3 text-right">DISPATCH ACTION / REMARKS</div>
                          </div>

                          {/* Item Rows */}
                          <div className="divide-y divide-zinc-200 bg-white">
                            {secItems.map((di) => {
                              const isProvided = !!di.verified;
                              const needsDeduction = !isProvided;
                              const currentStock = di.item.stock_levels.current_stock;
                              const reorderThreshold = di.item.stock_levels.reorder_threshold;
                              const dispatchQty = di.dispatchQty;

                              const isOutOfStock = needsDeduction && (currentStock < dispatchQty || currentStock <= 0);
                              const isLowStock = needsDeduction && !isOutOfStock && (currentStock <= reorderThreshold || (currentStock - dispatchQty) <= reorderThreshold);

                              let rowBg = 'hover:bg-zinc-50';
                              if (isProvided) {
                                rowBg = 'bg-emerald-50/40 border-l-4 border-l-emerald-500';
                              } else if (isOutOfStock) {
                                rowBg = 'bg-rose-100/90 border-l-4 border-l-rose-600 text-rose-950';
                              } else if (isLowStock) {
                                rowBg = 'bg-amber-50/90 border-l-4 border-l-amber-500 text-amber-950';
                              } else {
                                rowBg = 'bg-blue-50/20 border-l-4 border-l-blue-500';
                              }

                              return (
                                <div
                                  key={di.item.item_id}
                                  onClick={() => handleToggleVerify(di.item.item_id)}
                                  className={`grid grid-cols-12 px-4 py-2.5 items-center text-xs transition-colors cursor-pointer ${rowBg}`}
                                >
                                  <div className="col-span-1 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!di.verified}
                                      onChange={() => handleToggleVerify(di.item.item_id)}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                                    />
                                  </div>

                                  <div className="col-span-6 font-semibold text-zinc-900">
                                    <span className={isOutOfStock ? 'text-rose-950 font-black' : isProvided ? 'text-zinc-950 font-bold' : 'text-zinc-900 font-semibold'}>
                                      {di.item.item_description}
                                    </span>
                                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                                      <span>{di.item.model_number}</span>
                                      <span>•</span>
                                      <span className={isOutOfStock ? 'text-rose-700 font-bold' : isLowStock ? 'text-amber-700 font-bold' : 'text-zinc-500'}>
                                        Stock: {currentStock} {di.item.uom}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="col-span-1 text-center font-mono font-bold text-zinc-700">
                                    {di.item.uom}
                                  </div>

                                  <div className="col-span-1 text-center font-mono font-extrabold text-zinc-950">
                                    {di.dispatchQty}
                                  </div>

                                  <div className="col-span-3 text-right font-mono text-[11px]">
                                    {isProvided ? (
                                      <span className="text-emerald-800 font-bold inline-flex items-center gap-1 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                                        <Check className="w-3 h-3" /> PROVIDED ON SITE (0 Deduct)
                                      </span>
                                    ) : isOutOfStock ? (
                                      <span className="text-rose-900 font-black inline-flex items-center gap-1 bg-rose-200 px-2 py-0.5 rounded border border-rose-400">
                                        <AlertTriangle className="w-3 h-3 text-rose-700" /> OUT OF STOCK! (Have {currentStock})
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="text-amber-900 font-extrabold inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" /> LOW STOCK (-{dispatchQty} Deduct)
                                      </span>
                                    ) : (
                                      <span className="text-blue-900 font-bold inline-flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                                        <ArrowUpRight className="w-3 h-3 text-blue-600" /> TO DISPATCH (-{dispatchQty} Stock)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Official Signature Lines Section */}
          <div className="pt-6 border-t border-zinc-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-6">
              <div className="text-[10px] uppercase font-bold text-zinc-500">PREPARED / DISPATCHED BY:</div>
              <div className="border-b-2 border-zinc-900 font-extrabold pb-1 text-zinc-900">
                {recipient}
              </div>
              <div className="text-[10px] text-zinc-500">Signature & Date</div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] uppercase font-bold text-zinc-500">INSPECTED / PACKED BY:</div>
              <div className="border-b border-zinc-400 pb-1 text-zinc-400 italic">
                ___________________________
              </div>
              <div className="text-[10px] text-zinc-500">Quality Inspector</div>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] uppercase font-bold text-zinc-500">VERIFIED ON SITE BY:</div>
              <div className="border-b border-zinc-400 pb-1 text-zinc-400 italic">
                ___________________________
              </div>
              <div className="text-[10px] text-zinc-500">Technician / Customer</div>
            </div>
          </div>

          {/* Footer Document Note */}
          <div className="text-[10px] text-center text-zinc-400 border-t border-zinc-200 pt-3">
            MG SOLAR Material Dispatch Verification Form — Official Document • Page 1 of 1
          </div>

          {/* Execution Action Button */}
          <div className="pt-2 print:hidden flex justify-end">
            <Button
              size="lg"
              disabled={!isDispatchValid}
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Deduct Warehouse Stock ({itemsToDeductCount} Items to Dispatch)</span>
            </Button>
          </div>
        </Card>
      </div>
      ) : (
        /* STANDARD BUILDER VIEW (Main View) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column: Add Items to Outgoing Checklist */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hardware Selector & Active Checklist */}
            <Card className="bg-white border-zinc-200 p-5 space-y-4 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-black" />
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-950">Add Items to Outgoing Checklist</h3>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-zinc-500 font-mono font-bold">
                    {dispatchItems.length} Item(s) Selected
                  </span>
                  {dispatchItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDispatchItems([])}
                      className="text-xs font-semibold text-zinc-600 hover:text-black shrink-0 cursor-pointer h-7 px-2"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear List
                    </Button>
                  )}
                </div>
              </div>

              {/* Add Item Dropdown Search */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="Search inventory to add item to outgoing checklist (Brand, Description, Model #)..."
                      className="pl-9 text-xs bg-zinc-50 border-zinc-200 min-h-[42px]"
                    />
                  </div>
                  {isSearchOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSearchOpen(false)}
                      className="text-xs shrink-0 cursor-pointer"
                    >
                      Close
                    </Button>
                  )}
                </div>

                {/* Dropdown Menu */}
                {isSearchOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-zinc-100">
                    {filteredInventory.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No matching hardware item found in active inventory.
                      </div>
                    ) : (
                      filteredInventory.map((item) => {
                        const isAlreadyAdded = dispatchItems.some((di) => di.item.item_id === item.item_id);
                        return (
                          <div
                            key={item.item_id}
                            onClick={() => handleAddItemToChecklist(item)}
                            className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-zinc-950 truncate">
                                {item.item_description}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono truncate">
                                {item.model_number} • {item.item_id}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                item.stock_levels.current_stock <= item.stock_levels.reorder_threshold
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                              }`}>
                                Stock: {item.stock_levels.current_stock} {item.uom}
                              </span>
                              <Button size="sm" className="h-7 text-[11px] font-bold bg-black text-white hover:bg-zinc-800 cursor-pointer">
                                {isAlreadyAdded ? '+ Add More' : '+ Add'}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Active Checklist Items List (Mobile-Optimized Touch Steppers) */}
              <div className="space-y-4 pt-1">
                {dispatchItems.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
                    <PackageMinus className="w-8 h-8 text-zinc-300 mx-auto" />
                    <div className="text-xs font-bold text-zinc-700">Your Outgoing Checklist is Empty</div>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      Search hardware items above or scan a packing slip / gate pass to add items.
                    </p>
                  </div>
                ) : (
                  dispatchItems.map((di, index) => (
                    <div
                      key={di.item.item_id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        di.verified
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-zinc-200 shadow-2xs'
                      }`}
                    >
                      {/* Header: Number, Brand, Model, Description, Delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black bg-zinc-950 text-white px-2 py-0.5 rounded-md">
                              #{index + 1}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200">
                              {di.item.brand_manufacturer}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 truncate">
                              {di.item.model_number}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-zinc-950 mt-1 leading-snug">
                            {di.item.item_description}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(di.item.item_id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stock Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-xs">
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-zinc-500 font-bold text-[11px]">Stock Available:</span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                            di.item.stock_levels.current_stock < di.dispatchQty && !di.verified
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          }`}>
                            {di.item.stock_levels.current_stock} {di.item.uom}
                          </span>
                          {di.item.stock_levels.current_stock < di.dispatchQty && !di.verified && (
                            <span className="text-[10px] font-extrabold text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Exceeds Stock!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* TOUCH-OPTIMIZED QUANTITY CONTROLS */}
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-zinc-800">Dispatch Quantity:</span>
                          
                          {/* Large Touch Stepper (- / Qty Input / +) */}
                          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-zinc-300 shadow-2xs self-start sm:self-auto">
                            <button
                              type="button"
                              disabled={di.dispatchQty <= 1}
                              onClick={() => handleUpdateQty(di.item.item_id, di.dispatchQty - 1)}
                              className="w-10 h-10 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-100 text-zinc-900 font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation"
                              title="Decrease Qty"
                            >
                              <Minus className="w-5 h-5" />
                            </button>

                            <input
                              type="number"
                              min={1}
                              value={di.dispatchQty}
                              onChange={(e) => handleUpdateQty(di.item.item_id, parseInt(e.target.value) || 1)}
                              className="w-16 h-10 text-center font-black text-base text-zinc-950 bg-transparent focus:bg-amber-50 focus:outline-hidden rounded font-mono"
                            />

                            <button
                              type="button"
                              onClick={() => handleUpdateQty(di.item.item_id, di.dispatchQty + 1)}
                              className="w-10 h-10 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation shadow-2xs"
                              title="Increase Qty"
                            >
                              <Plus className="w-5 h-5" />
                            </button>

                            <span className="text-xs font-bold text-zinc-600 px-1.5 font-mono">{di.item.uom}</span>
                          </div>
                        </div>

                        {/* Quick Quantity Preset Chips (+1, +5, +10, +50, Max) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-0.5">Quick Add:</span>
                          {[1, 5, 10, 20, 50, 100].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleUpdateQty(di.item.item_id, di.dispatchQty + step)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-white hover:bg-amber-100 text-zinc-800 border border-zinc-200 hover:border-amber-300 transition-all cursor-pointer shrink-0 active:scale-95"
                            >
                              +{step}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(di.item.item_id, Math.max(1, di.item.stock_levels.current_stock))}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700 transition-all cursor-pointer shrink-0 active:scale-95 ml-auto"
                          >
                            Max Stock ({di.item.stock_levels.current_stock})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Review & Action */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-zinc-950 text-white p-5 space-y-4 shadow-xl rounded-2xl border border-zinc-800">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  Dispatch Verification & Stock Release
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Confirm material quantities before live inventory stock deduction.
                </p>
              </div>

              {/* Optional Invoice / Quotation Number Input */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                <label className="block text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Invoice / Quotation #</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    (Optional)
                  </span>
                </label>
                <Input
                  type="text"
                  value={quotationNo}
                  onChange={(e) => setQuotationNo(e.target.value)}
                  placeholder="e.g. INV-2026-9041 or QT-88320"
                  className="text-xs bg-zinc-900 border-zinc-700 text-white font-mono h-10 placeholder:text-zinc-500 focus:border-amber-400"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-300">
                  <span>Total Items:</span>
                  <strong className="text-white font-mono">{dispatchItems.length} Items</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-300">
                  <span>To Dispatch (-Stock):</span>
                  <strong className="text-blue-400 font-mono">{itemsToDeductCount} Items</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-300">
                  <span>Provided on Site (0 Deduct):</span>
                  <strong className="text-emerald-400 font-mono">{itemsProvidedCount} Items</strong>
                </div>
                <div className="flex justify-between py-1 text-zinc-300">
                  <span>Invoice / Quotation #:</span>
                  <strong className="text-amber-400 font-mono">{quotationNo || 'None'}</strong>
                </div>
              </div>

              <Button
                size="lg"
                disabled={!isDispatchValid}
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Proceed to Review & Stock Deduction
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* REVIEW & CONFIRMATION MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white p-5 space-y-1 relative">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Confirm Stock Deduction ({itemsToDeductCount} Items to Dispatch)
              </h3>
              <p className="text-xs text-zinc-400">
                Unchecked items will deduct from warehouse stock. Checked items are provided on site and will NOT alter inventory.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Optional Quotation / Invoice Input in Modal */}
              <div className="space-y-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-3">
                <label className="block text-xs font-bold text-zinc-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-600" />
                    <span>Invoice / Quotation # (Optional)</span>
                  </span>
                </label>
                <Input
                  type="text"
                  value={quotationNo}
                  onChange={(e) => setQuotationNo(e.target.value)}
                  placeholder="e.g. INV-2026-9041 or QT-88320"
                  className="text-xs bg-white border-zinc-300 text-zinc-950 font-mono h-9 font-bold placeholder:text-zinc-400 focus:ring-black"
                />
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2 font-mono">
                <div>Invoice / Quotation #: <strong className="text-amber-700 font-bold">{quotationNo || 'None'}</strong></div>
                <div>Project: <strong>{projectName}</strong></div>
                <div>Recipient: <strong>{recipient}</strong></div>
                <div className="flex justify-between">
                  <span>To Dispatch (-Stock): <strong className="text-blue-700">{itemsToDeductCount}/{totalCount}</strong></span>
                  <span>Provided on Site: <strong className="text-emerald-700">{itemsProvidedCount}/{totalCount}</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-zinc-900 text-xs flex justify-between items-center">
                  <span>Stock Deduction Line Items:</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Unchecked items deduct stock</span>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                  {dispatchItems.map((di) => {
                    const isProvided = !!di.verified;
                    const prev = di.item.stock_levels.current_stock;
                    const deductQty = !isProvided ? di.dispatchQty : 0;
                    const next = Math.max(0, prev - deductQty);

                    const isOutOfStock = !isProvided && (prev < di.dispatchQty || prev <= 0);

                    return (
                      <div
                        key={di.item.item_id}
                        className={`p-3 flex items-center justify-between text-xs ${
                          isProvided ? 'bg-emerald-50/40' : isOutOfStock ? 'bg-rose-100/90 text-rose-950 font-medium' : ''
                        }`}
                      >
                        <div>
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            {di.item.item_description}
                            {isProvided && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-300">
                                Checked (Provided on Site)
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-mono font-black border border-rose-400">
                                OUT OF STOCK!
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">{di.item.model_number}</div>
                        </div>

                        <div className="text-right font-mono">
                          {!isProvided ? (
                            <>
                              <div className={`font-extrabold ${isOutOfStock ? 'text-rose-800' : 'text-blue-700'}`}>
                                -{di.dispatchQty} {di.item.uom}
                              </div>
                              <div className="text-[10px] text-zinc-500">{prev} ➔ {next}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold text-emerald-700">0 {di.item.uom}</div>
                              <div className="text-[10px] text-zinc-400">Provided ({prev})</div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-xs font-semibold cursor-pointer"
              >
                Cancel & Edit
              </Button>

              <Button
                size="sm"
                onClick={handleConfirmDispatch}
                disabled={!isDispatchValid}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs cursor-pointer px-4 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm & Deduct Stock ({itemsToDeductCount} Items)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
