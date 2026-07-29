import React, { useState, useEffect } from 'react';
import { InventoryItem, CategoryType, UOMType, TechnicalSpecs } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Box, Save, Zap, Info, CheckCircle2, Image, Upload, Link as LinkIcon, Camera } from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompressor';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  existingItem?: InventoryItem | null;
}

interface CategoryConfig {
  label: string;
  fixedUom: UOMType;
  uomDisplayLabel: string;
  idPrefix: string;
  isMajorEquipment: boolean; // Panels, Inverters, Battery Storage
  needsModelNumber: boolean;
  hasTechSpecs: boolean;
  defaultBrand: string;
  suggestedBrands: string[];
  placeholderDesc: string;
  placeholderModel?: string;
}

const CATEGORY_CONFIGS: Record<CategoryType, CategoryConfig> = {
  PV_MODULE: {
    label: 'Solar PV Module (Panel)',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pieces)',
    idPrefix: 'ITEM-PV-',
    isMajorEquipment: true,
    needsModelNumber: true,
    hasTechSpecs: true,
    defaultBrand: 'Tongwei',
    suggestedBrands: ['Tongwei', 'JA Solar', 'Runergy', 'Jinko Solar', 'Gokin', 'Longi', 'IAN Solar'],
    placeholderDesc: 'Tongwei 630W N-Type Monocrystalline Solar PV Panel',
    placeholderModel: 'TW-630W-TOPCON'
  },
  INVERTER: {
    label: 'Solar Inverter (On-Grid / Hybrid)',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pieces)',
    idPrefix: 'ITEM-INV-',
    isMajorEquipment: true,
    needsModelNumber: true,
    hasTechSpecs: true,
    defaultBrand: 'Sungrow',
    suggestedBrands: ['GoodWe', 'Solis', 'Hypontech', 'SolaX', 'FoxESS', 'Sunways', 'Sungrow', 'Anern'],
    placeholderDesc: 'Sungrow 10kW Three-Phase Hybrid Solar Inverter',
    placeholderModel: 'SH10RT-10K'
  },
  BESS: {
    label: 'Battery Storage Bank (LiFePO4)',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pieces)',
    idPrefix: 'ITEM-BESS-',
    isMajorEquipment: true,
    needsModelNumber: true,
    hasTechSpecs: true,
    defaultBrand: 'Dyness',
    suggestedBrands: ['Dyness', 'LiFePO4 Energy Storage', 'CATL', 'BYD', 'Pylontech'],
    placeholderDesc: 'Dyness 314Ah (51.2V) LiFePO4 Lithium Battery Storage Module',
    placeholderModel: 'DYN-314AH-51.2V'
  },
  PROTECTION_BREAKERS: {
    label: 'Protection, Breakers & Controls',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pieces)',
    idPrefix: 'ITEM-PROT-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: true,
    defaultBrand: 'Schneider Electric',
    suggestedBrands: ['DC MCCB (125A/250A)', 'AC MCB', 'AC SPD', 'DC SPD', 'Schneider Electric', 'Dehn'],
    placeholderDesc: 'DC MCCB 250A Molded Case Circuit Breaker for Battery Protection',
    placeholderModel: 'MCCB-DC-250A'
  },
  RACKING: {
    label: 'Structural Racking & Hardware',
    fixedUom: 'SETS',
    uomDisplayLabel: 'SETS / PCS / BOXES',
    idPrefix: 'ITEM-RACK-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Clenergy',
    suggestedBrands: ['Clenergy', 'K2 Systems', 'Aluminum PV Racking', 'Unirac', 'IronRidge'],
    placeholderDesc: 'PV-EZRack SolarTerrace Anodized Aluminum Mounting Rail 4200mm (AL6005-T5)',
    placeholderModel: 'ER-R-ST4200'
  },
  DC_CABLING: {
    label: 'Solar DC & Battery Cabling',
    fixedUom: 'METERS',
    uomDisplayLabel: 'METERS (m)',
    idPrefix: 'ITEM-CAB-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: true,
    defaultBrand: 'CESC',
    suggestedBrands: ['CESC', 'Prysmian', 'PV Solar Cable', 'Battery Cable', 'AC Wiring'],
    placeholderDesc: '6mm² Double-Insulated Halogen-Free Solar DC Cable - Black (1500V DC)',
    placeholderModel: 'H1Z2Z2-K 1X6-BLK'
  },
  MC4_CONNECTOR: {
    label: 'MC4 Connectors & Combiners',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pairs / Pieces)',
    idPrefix: 'ITEM-CONN-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Stäubli',
    suggestedBrands: ['Stäubli', 'MC4 50A Connectors', 'Amphenol'],
    placeholderDesc: 'MC4-Evo 2 Solar Male/Female Connector Pair 1500V DC (IP68)',
    placeholderModel: 'PV-KST4-EVO2'
  },
  CONDUIT_FITTINGS: {
    label: 'Conduits, Pipes & Raceways',
    fixedUom: 'METERS',
    uomDisplayLabel: 'METERS (m)',
    idPrefix: 'ITEM-COND-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Pipelife',
    suggestedBrands: ['Pipelife', 'HDPE Electrical', 'Cable Raceway', 'Rigid PVC'],
    placeholderDesc: '25mm Heavy-Duty Rigid UV-Stabilized PVC Electrical Conduit Pipe (3m)',
    placeholderModel: 'COND-PVC-25MM-3M'
  },
  GROUNDING: {
    label: 'Grounding & Bonding System',
    fixedUom: 'METERS',
    uomDisplayLabel: 'METERS (m)',
    idPrefix: 'ITEM-GND-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Southwire',
    suggestedBrands: ['Southwire', 'Erico Cadweld', 'Wiley WEEB', 'Grounding Lugs'],
    placeholderDesc: '14.0mm² Bare Solid Copper Earth Grounding Wire',
    placeholderModel: 'GND-COPPER-14MM'
  },
  FASTENERS: {
    label: 'Fasteners, Screws & Anchors',
    fixedUom: 'BOXES',
    uomDisplayLabel: 'BOXES (Standard Pack)',
    idPrefix: 'ITEM-FAST-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Fischer',
    suggestedBrands: ['Fischer', 'SUS304 Fasteners', 'Expansion Anchors'],
    placeholderDesc: 'SUS304 Stainless Hex Head Lag Bolts M8 x 80mm with EPDM Washer (Box of 100)',
    placeholderModel: 'FAST-LAG-M8X80'
  },
  CONSUMABLES: {
    label: 'Consumables & Wiring Blocks',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS / BOXES / SETS',
    idPrefix: 'ITEM-CONS-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'Chemlink M-1',
    suggestedBrands: ['Chemlink M-1', 'Panduit', 'SolarSafety'],
    placeholderDesc: 'Structural High-Modulus Polyurethane Waterproof Roof Adhesive Sealant 310ml',
    placeholderModel: 'CONS-SEALANT-M1'
  },
  BOS_SWITCHGEAR: {
    label: 'BOS Switchgear & ATS',
    fixedUom: 'PCS',
    uomDisplayLabel: 'PCS (Pieces)',
    idPrefix: 'ITEM-BOS-',
    isMajorEquipment: false,
    needsModelNumber: true,
    hasTechSpecs: false,
    defaultBrand: 'ATS Transfer',
    suggestedBrands: ['ATS Transfer', 'Enclosure Gear', 'Terminal Gear'],
    placeholderDesc: 'ATS (Automatic Transfer Switch) Dual Power Controller 100A 4P',
    placeholderModel: 'ATS-DUAL-100A'
  }
};

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingItem
}) => {
  const [category, setCategory] = useState<CategoryType>('PV_MODULE');
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    item_id: '',
    category: 'PV_MODULE',
    brand_manufacturer: '',
    model_number: '',
    item_description: '',
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 100,
      allocated_stock: 0,
      reorder_threshold: 20,
      low_stock_alert: false
    },
    serial_numbers: []
  });

  // Dynamic spec state variables for major items / cabling / protection
  const [powerRatingW, setPowerRatingW] = useState<string>('550');
  const [capacityKwKwh, setCapacityKwKwh] = useState<string>('');
  const [voltageRatingV, setVoltageRatingV] = useState<string>('');
  const [amperageRatingA, setAmperageRatingA] = useState<string>('');
  const [cableSectionMm2, setCableSectionMm2] = useState<string>('');
  const [phaseType, setPhaseType] = useState<string>('Three-Phase 380V/400V');
  const [ipRating, setIpRating] = useState<string>('IP65/IP66 Outdoor');
  const [polesCount, setPolesCount] = useState<string>('2P');

  // Sync initial or editing item
  useEffect(() => {
    if (existingItem) {
      setFormData(existingItem);
      setCategory(existingItem.category || 'PV_MODULE');
      
      const specs = existingItem.technical_specs || {};
      setPowerRatingW(specs.power_rating_w ? String(specs.power_rating_w) : '');
      setCapacityKwKwh(specs.capacity_kw_kwh || '');
      setVoltageRatingV(specs.voltage_rating_v ? String(specs.voltage_rating_v) : '');
      setAmperageRatingA(specs.amperage_rating_a ? String(specs.amperage_rating_a) : '');
      setCableSectionMm2(specs.cable_cross_section_mm2 ? String(specs.cable_cross_section_mm2) : '');
      setPhaseType(specs.phase || 'Three-Phase 380V/400V');
      setIpRating(specs.ip_rating || 'IP65/IP66 Outdoor');
      setPolesCount(specs.poles || '2P');
    } else {
      const cfg = CATEGORY_CONFIGS['PV_MODULE'];
      const newId = `${cfg.idPrefix}${Math.floor(100 + Math.random() * 900)}`;
      
      setCategory('PV_MODULE');
      setFormData({
        item_id: newId,
        category: 'PV_MODULE',
        brand_manufacturer: cfg.defaultBrand,
        model_number: cfg.placeholderModel,
        item_description: cfg.placeholderDesc,
        uom: cfg.fixedUom,
        technical_specs: { power_rating_w: 550 },
        stock_levels: {
          current_stock: 120,
          allocated_stock: 0,
          reorder_threshold: 20,
          low_stock_alert: false
        },
        serial_numbers: []
      });
      setPowerRatingW('550');
      setCapacityKwKwh('0.55 kWp');
      setVoltageRatingV('41.5');
      setAmperageRatingA('13.25');
      setCableSectionMm2('');
    }
  }, [existingItem, isOpen]);

  if (!isOpen) return null;

  // Category switch handler: enforces strict UOM, auto SKU prefix, and clears irrelevant fields
  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    const cfg = CATEGORY_CONFIGS[newCat] || CATEGORY_CONFIGS['PV_MODULE'];
    
    // Auto-generate unique SKU ID for the new category
    const autoSku = `${cfg.idPrefix}${Math.floor(100 + Math.random() * 900)}`;
    const brandToSet = cfg.isMajorEquipment ? cfg.defaultBrand : (formData.brand_manufacturer || cfg.defaultBrand);

    setFormData((prev) => ({
      ...prev,
      category: newCat,
      item_id: existingItem ? prev.item_id : autoSku,
      uom: cfg.fixedUom, // Enforce fixed UOM (no chooser)
      brand_manufacturer: brandToSet,
      item_description: existingItem ? prev.item_description : cfg.placeholderDesc,
      model_number: cfg.needsModelNumber ? (existingItem ? prev.model_number : (cfg.placeholderModel || '')) : 'N/A'
    }));

    // Reset tech specs
    if (!existingItem) {
      if (newCat === 'PV_MODULE') {
        setPowerRatingW('550');
        setCapacityKwKwh('0.55 kWp');
        setVoltageRatingV('41.5');
      } else if (newCat === 'INVERTER') {
        setPowerRatingW('10000');
        setCapacityKwKwh('10 kW Hybrid');
        setVoltageRatingV('1000');
        setPhaseType('Three-Phase 380V/400V');
      } else if (newCat === 'BESS') {
        setPowerRatingW('');
        setCapacityKwKwh('5.12 kWh LFP');
        setVoltageRatingV('48');
        setAmperageRatingA('100');
      } else if (newCat === 'DC_CABLING') {
        setPowerRatingW('');
        setCableSectionMm2('6');
        setVoltageRatingV('1500');
      } else if (newCat === 'PROTECTION_BREAKERS') {
        setVoltageRatingV('1000');
        setAmperageRatingA('32');
        setPolesCount('2P');
      }
    }
  };

  const currentCfg = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS['PV_MODULE'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Brand validation rule: strictly required for panels, inverters, and battery storage
    let finalBrand = formData.brand_manufacturer?.trim();
    if (!finalBrand) {
      if (currentCfg.isMajorEquipment) {
        alert(`Brand or Manufacturer is required for ${currentCfg.label}.`);
        return;
      }
      finalBrand = currentCfg.defaultBrand || 'Standard EPC';
    }

    if (!formData.item_description) {
      alert('Please fill in required field: Item Description.');
      return;
    }

    // Auto generate SKU if missing
    const finalItemId = formData.item_id || `${currentCfg.idPrefix}${Math.floor(100 + Math.random() * 900)}`;

    const currentStock = Number(formData.stock_levels?.current_stock || 0);
    const allocatedStock = Number(formData.stock_levels?.allocated_stock || 0);
    const reorderThreshold = Number(formData.stock_levels?.reorder_threshold || 10);
    const available = currentStock - allocatedStock;
    const isLow = available <= reorderThreshold;

    // Build specs only if category has technical specifications
    const builtSpecs: TechnicalSpecs = {};
    if (currentCfg.hasTechSpecs) {
      if (powerRatingW) builtSpecs.power_rating_w = Number(powerRatingW);
      if (capacityKwKwh) builtSpecs.capacity_kw_kwh = capacityKwKwh;
      if (voltageRatingV) builtSpecs.voltage_rating_v = Number(voltageRatingV);
      if (amperageRatingA) builtSpecs.amperage_rating_a = Number(amperageRatingA);
      if (cableSectionMm2) builtSpecs.cable_cross_section_mm2 = Number(cableSectionMm2);
      if (category === 'INVERTER') {
        builtSpecs.phase = phaseType;
        builtSpecs.ip_rating = ipRating;
      } else if (category === 'PROTECTION_BREAKERS') {
        builtSpecs.poles = polesCount;
      }
    }

    const itemToSave: InventoryItem = {
      item_id: finalItemId,
      category: category,
      brand_manufacturer: finalBrand,
      model_number: currentCfg.needsModelNumber ? (formData.model_number || 'N/A') : 'N/A',
      item_description: formData.item_description!,
      quantity: currentStock,
      uom: currentCfg.fixedUom, // Always strictly enforce category's fixed UOM
      technical_specs: builtSpecs,
      stock_levels: {
        current_stock: currentStock,
        allocated_stock: allocatedStock,
        reorder_threshold: reorderThreshold,
        low_stock_alert: isLow
      },
      serial_numbers: formData.serial_numbers || [],
      image_url: formData.image_url?.trim() || undefined
    };

    onSave(itemToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-950 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2 bg-black text-white rounded-xl shadow-xs shrink-0">
              <Box className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-950 leading-tight">
                {existingItem ? 'Edit Hardware Item' : 'Add New Hardware Item'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-500">
                Category-specific entry rules, fixed UOM metrics & auto Item ID allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          
          {/* Step 1: Category Selection */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1">
              Hardware Category *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
              className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black shadow-2xs"
            >
              <optgroup label="Primary Generating & Energy Storage (Major Equipment)">
                <option value="PV_MODULE">Solar PV Module (Panels)</option>
                <option value="INVERTER">Solar Inverter (String/Hybrid/Micro)</option>
                <option value="BESS">Battery Storage Bank (LiFePO4)</option>
              </optgroup>
              <optgroup label="Structural Racking & Hardware">
                <option value="RACKING">Structural Racking & Railings</option>
              </optgroup>
              <optgroup label="Protection, Cabling & Electrical">
                <option value="PROTECTION_BREAKERS">Protection & Circuit Breakers (DC/AC)</option>
                <option value="DC_CABLING">Solar DC & Battery Power Cabling</option>
                <option value="MC4_CONNECTOR">MC4 Connectors & Combiners</option>
                <option value="CONDUIT_FITTINGS">Electrical Conduits & Fittings</option>
              </optgroup>
              <optgroup label="Grounding, Fasteners & Consumables">
                <option value="GROUNDING">Grounding & Bonding Gear</option>
                <option value="FASTENERS">Fasteners & Expansion Bolts</option>
                <option value="CONSUMABLES">Consumables, Sealants & Decals</option>
                <option value="BOS_SWITCHGEAR">BOS Switchgear & Enclosures</option>
              </optgroup>
            </select>
          </div>

          {/* Quick Specifications Preset Bar */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Catalog Presets & Brand Models</span>
              </span>
              <span className="text-[10px] text-amber-700 font-normal">Click to auto-fill details</span>
            </div>

            {category === 'PV_MODULE' && (
              <div className="space-y-1.5 text-[10px]">
                <div className="flex flex-wrap gap-1">
                  <span className="font-bold text-zinc-700 mr-1 self-center">Tongwei:</span>
                  {['620W', '625W', '630W', '720W', '725W', '730W'].map((w) => (
                    <button
                      key={`tw-${w}`}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          brand_manufacturer: 'Tongwei (TW Solar)',
                          model_number: `TW-${w}-TOPCON`,
                          item_description: `Tongwei (TW Solar) ${w} High-Efficiency N-Type PV Module`
                        });
                        setPowerRatingW(w.replace('W', ''));
                        setCapacityKwKwh(`0.${w.replace('W', '')} kWp`);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer shadow-2xs"
                    >
                      TW {w}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="font-bold text-zinc-700 mr-1 self-center">JA Solar:</span>
                  {['625W', '630W', '720W'].map((w) => (
                    <button
                      key={`ja-${w}`}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          brand_manufacturer: 'JA Solar',
                          model_number: `JAM72S30-${w}/MR`,
                          item_description: `JA Solar ${w} Half-Cell Monocrystalline PV Module`
                        });
                        setPowerRatingW(w.replace('W', ''));
                        setCapacityKwKwh(`0.${w.replace('W', '')} kWp`);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer shadow-2xs"
                    >
                      JA {w}
                    </button>
                  ))}
                  <span className="font-bold text-zinc-700 ml-2 mr-1 self-center">Runergy:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        brand_manufacturer: 'Runergy',
                        model_number: 'HY-DH108N8-620W',
                        item_description: 'Runergy 620W N-Type Bifacial Mono Solar Module'
                      });
                      setPowerRatingW('620');
                      setCapacityKwKwh('0.62 kWp');
                    }}
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer shadow-2xs"
                  >
                    Runergy 620W
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="font-bold text-zinc-700 mr-1 self-center">Jinko / Longi / Gokin / IAN:</span>
                  {[
                    { brand: 'Jinko Solar', w: '640W' },
                    { brand: 'Jinko Solar', w: '725W' },
                    { brand: 'Gokin', w: '650W' },
                    { brand: 'Longi', w: '650W' },
                    { brand: 'IAN Solar', w: '660W' },
                    { brand: 'IAN Solar', w: '670W' }
                  ].map((p) => (
                    <button
                      key={`${p.brand}-${p.w}`}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          brand_manufacturer: p.brand,
                          model_number: `${p.brand.substring(0, 3).toUpperCase()}-${p.w}`,
                          item_description: `${p.brand} ${p.w} Monocrystalline PV Module`
                        });
                        setPowerRatingW(p.w.replace('W', ''));
                        setCapacityKwKwh(`0.${p.w.replace('W', '')} kWp`);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer shadow-2xs"
                    >
                      {p.brand} {p.w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {category === 'INVERTER' && (
              <div className="space-y-2 text-[10px]">
                <div>
                  <span className="font-bold text-emerald-800 block mb-1">On-Grid Inverters:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { b: 'GoodWe', kw: '1.5kW', w: 1500 },
                      { b: 'GoodWe', kw: '3kW', w: 3000 },
                      { b: 'GoodWe', kw: '6kW', w: 6000 },
                      { b: 'GoodWe', kw: '10kW', w: 10000 },
                      { b: 'Solis', kw: '5kW', w: 5000 },
                      { b: 'Solis', kw: '10kW', w: 10000 },
                      { b: 'Hypontech', kw: '8kW', w: 8000 },
                      { b: 'Hypontech', kw: '10.5kW', w: 10500 },
                      { b: 'SolaX', kw: '8kW', w: 8000 },
                      { b: 'FoxESS', kw: '8kW', w: 8000 },
                      { b: 'Sunways', kw: '10kW', w: 10000 },
                      { b: 'Sungrow', kw: '5kW', w: 5000 },
                      { b: 'Sungrow', kw: '10kW', w: 10000 }
                    ].map((inv) => (
                      <button
                        key={`ongrid-${inv.b}-${inv.kw}`}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            brand_manufacturer: inv.b,
                            model_number: `${inv.b.substring(0, 3).toUpperCase()}-OG-${inv.kw}`,
                            item_description: `${inv.b} ${inv.kw} On-Grid Solar Inverter`
                          });
                          setPowerRatingW(String(inv.w));
                          setCapacityKwKwh(`${inv.kw} On-Grid`);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-medium cursor-pointer shadow-2xs"
                      >
                        {inv.b} {inv.kw}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-blue-800 block mb-1">Hybrid Inverters:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { b: 'Anern', kw: '5kW', w: 5000 },
                      { b: 'Anern', kw: '12kW', w: 12000 },
                      { b: 'Anern', kw: '50kW', w: 50000 },
                      { b: 'Solis', kw: '6kW', w: 6000 },
                      { b: 'Solis', kw: '10kW', w: 10000 },
                      { b: 'GoodWe', kw: '10kW', w: 10000 },
                      { b: 'Sungrow', kw: '6kW', w: 6000 },
                      { b: 'Sungrow', kw: '8kW', w: 8000 },
                      { b: 'Sungrow', kw: '10kW', w: 10000 }
                    ].map((inv) => (
                      <button
                        key={`hybrid-${inv.b}-${inv.kw}`}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            brand_manufacturer: inv.b,
                            model_number: `${inv.b.substring(0, 3).toUpperCase()}-HYB-${inv.kw}`,
                            item_description: `${inv.b} ${inv.kw} Hybrid Storage Solar Inverter`
                          });
                          setPowerRatingW(String(inv.w));
                          setCapacityKwKwh(`${inv.kw} Hybrid`);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium cursor-pointer shadow-2xs"
                      >
                        {inv.b} {inv.kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {category === 'BESS' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Dyness',
                      model_number: 'DYN-314AH-51.2V',
                      item_description: 'Dyness / LiFePO4 Energy Storage 314Ah (51.2V) Lithium Battery Module'
                    });
                    setCapacityKwKwh('16.07 kWh (314Ah)');
                    setVoltageRatingV('51.2');
                    setAmperageRatingA('314');
                  }}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-amber-100 text-zinc-900 border border-amber-300 font-bold cursor-pointer shadow-2xs"
                >
                  🔋 Dyness 314Ah (51.2V) LiFePO4 Module
                </button>
              </div>
            )}

            {category === 'PROTECTION_BREAKERS' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'DC MCCB Protection',
                      model_number: 'MCCB-DC-125A',
                      item_description: 'DC MCCB 125A Molded Case Circuit Breaker for Battery Protection'
                    });
                    setAmperageRatingA('125');
                    setVoltageRatingV('1000');
                    setPolesCount('2P');
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  DC MCCB 125A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'DC MCCB Protection',
                      model_number: 'MCCB-DC-250A',
                      item_description: 'DC MCCB 250A Molded Case Circuit Breaker for Battery Protection'
                    });
                    setAmperageRatingA('250');
                    setVoltageRatingV('1000');
                    setPolesCount('2P');
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  DC MCCB 250A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Schneider Electric',
                      model_number: 'AC-SPD-T2-4P',
                      item_description: 'AC Surge Protection Device (AC SPD) 4P Type 2'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  AC SPD
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Dehn',
                      model_number: 'DC-SPD-1000V',
                      item_description: 'DC Surge Protection Device (DC SPD) 1000V DC'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  DC SPD
                </button>
              </div>
            )}

            {category === 'RACKING' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {['Heavy-Duty Aluminum Railings', 'Mid Clamps', 'End Clamps', 'L-Foot Brackets / Fasteners'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        brand_manufacturer: 'Aluminum PV Racking',
                        item_description: item
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            )}

            {category === 'DC_CABLING' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'PV Solar Cable',
                      item_description: 'DC / PV Wires (UV-resistant Red & Black) 6mm²'
                    });
                    setCableSectionMm2('6');
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  UV-Resistant DC PV Wire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Battery Cable',
                      item_description: 'Battery Power Cables: Heavy-duty Red & Black Battery Interconnect Cables'
                    });
                    setCableSectionMm2('35');
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  Heavy-duty Battery Cables
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'AC Wiring',
                      item_description: 'THHN AC Wires (Copper Conductor)'
                    });
                    setCableSectionMm2('10');
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  AC Wires
                </button>
              </div>
            )}

            {category === 'MC4_CONNECTOR' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'MC4 Connectors',
                      item_description: 'MC4 50A Heavy Duty Solar Connectors (Male & Female Pair)'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  MC4 50A Connectors
                </button>
              </div>
            )}

            {category === 'CONDUIT_FITTINGS' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'HDPE Electrical',
                      item_description: 'HDPE Flexible Conduits / Hose'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  HDPE Flexible Conduits / Hose
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Cable Raceway',
                      item_description: '2-Meter Cable Raceway Conduits'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  2-Meter Cable Raceway Conduits
                </button>
              </div>
            )}

            {category === 'GROUNDING' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {['Grounding Lugs', 'Ground Wire (30m Rolls)', 'Ground Rod with Heavy-Duty Clamp'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        brand_manufacturer: 'Grounding System',
                        item_description: g
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            )}

            {category === 'BOS_SWITCHGEAR' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Enclosure',
                      item_description: 'Breaker Box Enclosures (IP65 Surface Mount)'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  Breaker Box Enclosures
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'ATS Transfer',
                      item_description: 'ATS (Automatic Transfer Switch) Dual Power Controller'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  ATS (Automatic Transfer Switch)
                </button>
              </div>
            )}

            {category === 'CONSUMABLES' && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      brand_manufacturer: 'Terminal Gear',
                      item_description: 'Terminal Lugs & Terminal Blocks Assortment'
                    });
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-zinc-800 border border-amber-200 font-medium cursor-pointer"
                >
                  Terminal Lugs & Terminal Blocks
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-100/80 rounded-xl border border-zinc-200">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-500 font-medium">Item ID:</span>
              <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-zinc-200 text-xs">
                {formData.item_id || `${currentCfg.idPrefix}AUTO`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500 font-medium">Fixed Metric (UOM):</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 text-xs flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentCfg.uomDisplayLabel}</span>
              </span>
            </div>
          </div>

          {/* Brand & Model Number (Only shown if category requires/uses it) */}
          <div className={`grid grid-cols-1 ${currentCfg.needsModelNumber ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-800">
                  Brand / Manufacturer {currentCfg.isMajorEquipment ? '*' : <span className="text-zinc-400 font-normal">(Optional)</span>}
                </label>
              </div>
              <Input
                type="text"
                required={currentCfg.isMajorEquipment}
                value={formData.brand_manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, brand_manufacturer: e.target.value })}
                placeholder={currentCfg.defaultBrand}
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {currentCfg.suggestedBrands.slice(0, 4).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, brand_manufacturer: b })}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium cursor-pointer transition-colors"
                  >
                    + {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Number is ONLY rendered for categories that actually use model numbers (e.g. PV, Inverter, BESS, Breakers). Hidden for Railings, Fasteners, Cables, Consumables! */}
            {currentCfg.needsModelNumber && (
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Model Number
                </label>
                <Input
                  type="text"
                  value={formData.model_number || ''}
                  onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                  placeholder={currentCfg.placeholderModel || 'Model / Part #'}
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-zinc-800 mb-1">
              Item Description & Specification Title *
            </label>
            <Input
              type="text"
              required
              value={formData.item_description || ''}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              placeholder={currentCfg.placeholderDesc}
              className="font-medium"
            />
          </div>

          {/* Product Image / Visual Asset Section */}
          <div className="bg-zinc-50/90 p-3.5 sm:p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-zinc-900 text-xs flex items-center space-x-1.5">
                <Image className="w-4 h-4 text-black" />
                <span>Product Image / Photo</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-medium">Camera capture or file upload</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Preview Thumbnail Box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border-2 border-dashed border-zinc-300 shrink-0 overflow-hidden relative flex flex-col items-center justify-center shadow-2xs group">
                {formData.image_url ? (
                  <>
                    <img
                      src={formData.image_url}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white p-1 rounded-full text-xs shadow-md cursor-pointer transition-colors"
                      title="Remove Image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-zinc-400">
                    <Camera className="w-6 h-6 mx-auto mb-1 text-zinc-300" />
                    <span className="text-[9px] font-bold block text-zinc-500">No Photo</span>
                    <span className="text-[8px] text-zinc-400 block">Take photo or upload</span>
                  </div>
                )}
              </div>

              {/* Camera & File Upload Action Grid */}
              <div className="flex-1 space-y-2 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Direct Camera Capture Button */}
                  <label className="flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-3 py-2.5 rounded-xl cursor-pointer shadow-2xs transition-all active:scale-95 border border-amber-400">
                    <Camera className="w-4 h-4 text-black" />
                    <span>Open Camera Directly</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const webpDataUrl = await compressImageToWebP(file, 20 * 1024);
                            setFormData((prev) => ({ ...prev, image_url: webpDataUrl }));
                          } catch (err) {
                            console.error('Image compression error:', err);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({ ...prev, image_url: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>

                  {/* 2. Browse Image File Button */}
                  <label className="flex items-center justify-center space-x-1.5 bg-black hover:bg-zinc-800 text-white font-bold text-xs px-3 py-2.5 rounded-xl cursor-pointer shadow-2xs transition-all active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Browse Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const webpDataUrl = await compressImageToWebP(file, 20 * 1024);
                            setFormData((prev) => ({ ...prev, image_url: webpDataUrl }));
                          } catch (err) {
                            console.error('Image compression error:', err);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData((prev) => ({ ...prev, image_url: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {formData.image_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 w-full mt-1"
                  >
                    Clear Selected Photo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specifications (Only rendered for PV Modules, Inverters, BESS, Breakers, and Cabling. REMOVED for Railings/Racking, Fasteners, Consumables, Connectors) */}
          {currentCfg.hasTechSpecs && (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 block text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-black" />
                  <span>Technical Specifications ({currentCfg.label})</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">Hardware Ratings</span>
              </div>

              {category === 'PV_MODULE' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Wattage Peak (Wp)</label>
                    <Input
                      type="number"
                      value={powerRatingW}
                      onChange={(e) => setPowerRatingW(e.target.value)}
                      placeholder="550"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Capacity Rating</label>
                    <Input
                      type="text"
                      value={capacityKwKwh}
                      onChange={(e) => setCapacityKwKwh(e.target.value)}
                      placeholder="0.55 kWp"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Max Vmp / Voc (V)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={voltageRatingV}
                      onChange={(e) => setVoltageRatingV(e.target.value)}
                      placeholder="41.5"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Imp Current (A)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amperageRatingA}
                      onChange={(e) => setAmperageRatingA(e.target.value)}
                      placeholder="13.25"
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              {category === 'INVERTER' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Power Output (W)</label>
                    <Input
                      type="number"
                      value={powerRatingW}
                      onChange={(e) => setPowerRatingW(e.target.value)}
                      placeholder="10000"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Grid Phase</label>
                    <select
                      value={phaseType}
                      onChange={(e) => setPhaseType(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs font-semibold"
                    >
                      <option value="Single-Phase 220V/230V">Single-Phase 220V/230V</option>
                      <option value="Three-Phase 380V/400V">Three-Phase 380V/400V</option>
                      <option value="Microinverter">Microinverter AC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Max DC Voltage (V)</label>
                    <Input
                      type="number"
                      value={voltageRatingV}
                      onChange={(e) => setVoltageRatingV(e.target.value)}
                      placeholder="1000"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">IP Rating</label>
                    <Input
                      type="text"
                      value={ipRating}
                      onChange={(e) => setIpRating(e.target.value)}
                      placeholder="IP65/IP66"
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              {category === 'BESS' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Capacity (kWh)</label>
                    <Input
                      type="text"
                      value={capacityKwKwh}
                      onChange={(e) => setCapacityKwKwh(e.target.value)}
                      placeholder="5.12 kWh LFP"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Nominal Voltage (V)</label>
                    <Input
                      type="number"
                      value={voltageRatingV}
                      onChange={(e) => setVoltageRatingV(e.target.value)}
                      placeholder="48"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Capacity (Ah)</label>
                    <Input
                      type="number"
                      value={amperageRatingA}
                      onChange={(e) => setAmperageRatingA(e.target.value)}
                      placeholder="100"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Chemistry</label>
                    <Input
                      type="text"
                      disabled
                      value="LiFePO4 (LFP)"
                      className="font-mono bg-zinc-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              {category === 'DC_CABLING' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Cross Section (mm²)</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={cableSectionMm2}
                      onChange={(e) => setCableSectionMm2(e.target.value)}
                      placeholder="6.0"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Voltage Rating (V DC)</label>
                    <Input
                      type="number"
                      value={voltageRatingV}
                      onChange={(e) => setVoltageRatingV(e.target.value)}
                      placeholder="1500"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Standard Unit</label>
                    <Input
                      type="text"
                      disabled
                      value="Measured in METERS"
                      className="font-mono bg-zinc-100 font-semibold text-emerald-700"
                    />
                  </div>
                </div>
              )}

              {category === 'PROTECTION_BREAKERS' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Rated Voltage (V)</label>
                    <Input
                      type="number"
                      value={voltageRatingV}
                      onChange={(e) => setVoltageRatingV(e.target.value)}
                      placeholder="1000"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Rated Amperage (A)</label>
                    <Input
                      type="number"
                      value={amperageRatingA}
                      onChange={(e) => setAmperageRatingA(e.target.value)}
                      placeholder="32"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Poles Configuration</label>
                    <select
                      value={polesCount}
                      onChange={(e) => setPolesCount(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl p-2 text-xs font-semibold"
                    >
                      <option value="1P">1P (Single Pole)</option>
                      <option value="2P">2P (Double Pole)</option>
                      <option value="3P">3P (Three Pole)</option>
                      <option value="4P">4P (Four Pole)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1 font-semibold">Standards</label>
                    <Input
                      type="text"
                      disabled
                      value="IEC 60947-2 / TUV"
                      className="font-mono bg-zinc-100 font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Quantities matching Fixed UOM */}
          <div className="grid grid-cols-3 gap-4 bg-zinc-100/60 p-4 rounded-xl border border-zinc-200">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Current Stock ({currentCfg.fixedUom}) *
              </label>
              <Input
                type="number"
                min="0"
                required
                value={formData.stock_levels?.current_stock ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_levels: {
                      ...formData.stock_levels!,
                      current_stock: Number(e.target.value)
                    }
                  })
                }
                className="font-mono font-bold text-sm bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Allocated ({currentCfg.fixedUom})
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock_levels?.allocated_stock ?? 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_levels: {
                      ...formData.stock_levels!,
                      allocated_stock: Number(e.target.value)
                    }
                  })
                }
                className="font-mono bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Reorder Threshold
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock_levels?.reorder_threshold ?? 10}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_levels: {
                      ...formData.stock_levels!,
                      reorder_threshold: Number(e.target.value)
                    }
                  })
                }
                className="font-mono bg-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-200 bg-white shrink-0 sticky bottom-0">
            <div className="flex items-center space-x-1 text-[11px] text-zinc-500">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                Quantity is measured in <span className="font-bold font-mono text-zinc-800">{currentCfg.fixedUom}</span>.
              </span>
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white font-bold cursor-pointer shadow-sm text-xs flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4 mr-1.5 text-white" />
                <span>Save Hardware Item</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
