import React, { useState, useEffect } from 'react';
import { InventoryItem, CategoryType, UOMType, UserProfile } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Box, Save, CheckCircle2, Image, Upload, Camera } from 'lucide-react';
import { compressImageToWebP } from '../lib/imageCompressor';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  existingItem?: InventoryItem | null;
  currentUser?: UserProfile | null;
}

interface CategoryConfig {
  label: string;
  fixedUom: UOMType;
  uomDisplayLabel: string;
  idPrefix: string;
  isMajorEquipment: boolean;
  needsModelNumber: boolean;
  defaultBrand: string;
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
    defaultBrand: 'Tongwei',
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
    defaultBrand: 'Sungrow',
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
    defaultBrand: 'Dyness',
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
    defaultBrand: 'Schneider Electric',
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
    defaultBrand: 'Clenergy',
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
    defaultBrand: 'CESC',
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
    defaultBrand: 'Stäubli',
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
    defaultBrand: 'Pipelife',
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
    defaultBrand: 'Southwire',
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
    defaultBrand: 'Fischer',
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
    defaultBrand: 'Chemlink M-1',
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
    defaultBrand: 'ATS Transfer',
    placeholderDesc: 'ATS (Automatic Transfer Switch) Dual Power Controller 100A 4P',
    placeholderModel: 'ATS-DUAL-100A'
  }
};

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingItem,
  currentUser
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

  // Sync initial or editing item
  useEffect(() => {
    if (existingItem) {
      setFormData(existingItem);
      setCategory(existingItem.category || 'PV_MODULE');
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
        technical_specs: {},
        stock_levels: {
          current_stock: 100,
          allocated_stock: 0,
          reorder_threshold: 20,
          low_stock_alert: false
        },
        serial_numbers: []
      });
    }
  }, [existingItem, isOpen]);

  if (!isOpen) return null;

  // Category switch handler: enforces strict UOM, auto SKU prefix
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
      uom: cfg.fixedUom,
      brand_manufacturer: brandToSet,
      item_description: existingItem ? prev.item_description : cfg.placeholderDesc,
      model_number: cfg.needsModelNumber ? (existingItem ? prev.model_number : (cfg.placeholderModel || '')) : 'N/A'
    }));
  };

  const currentCfg = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS['PV_MODULE'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const finalItemId = formData.item_id || `${currentCfg.idPrefix}${Math.floor(100 + Math.random() * 900)}`;
    const currentStock = Number(formData.stock_levels?.current_stock || 0);
    const allocatedStock = Number(existingItem?.stock_levels?.allocated_stock || 0);
    const reorderThreshold = Number(formData.stock_levels?.reorder_threshold || 10);
    const available = currentStock - allocatedStock;
    const isLow = available <= reorderThreshold;

    const itemToSave: InventoryItem = {
      item_id: finalItemId,
      category: category,
      brand_manufacturer: finalBrand,
      model_number: currentCfg.needsModelNumber ? (formData.model_number || 'N/A') : 'N/A',
      item_description: formData.item_description!,
      quantity: currentStock,
      uom: currentCfg.fixedUom,
      technical_specs: existingItem?.technical_specs || {},
      stock_levels: {
        current_stock: currentStock,
        allocated_stock: allocatedStock,
        reorder_threshold: reorderThreshold,
        low_stock_alert: isLow
      },
      serial_numbers: formData.serial_numbers || [],
      image_url: formData.image_url?.trim() || undefined,
      added_by: existingItem?.added_by || (currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'System Operator'),
      added_by_username: existingItem?.added_by_username || currentUser?.username || 'system'
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

          {/* Brand & Model Number */}
          <div className={`grid grid-cols-1 ${currentCfg.needsModelNumber ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Brand / Manufacturer {currentCfg.isMajorEquipment ? '*' : <span className="text-zinc-400 font-normal">(Optional)</span>}
              </label>
              <Input
                type="text"
                required={currentCfg.isMajorEquipment}
                value={formData.brand_manufacturer || ''}
                onChange={(e) => setFormData({ ...formData, brand_manufacturer: e.target.value })}
                placeholder={currentCfg.defaultBrand}
              />
            </div>

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

          {/* Stock Quantities matching Fixed UOM */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-100/60 p-4 rounded-xl border border-zinc-200">
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
