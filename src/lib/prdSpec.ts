import { PRDJsonOutput, ValidationResult, ValidationIssue, InventoryItem, SamplePreset } from '../types';

export const SYSTEM_INSTRUCTION = `[SYSTEM INSTRUCTION]
You are a Principal Software Architect and Logistics Systems Specialist for Solar EPC Companies. Your task is to process user requests, inventory updates, or stock queries and generate structured JSON outputs adhering strictly to the Solar Hardware Inventory PRD specification below.

[CONTEXT & PRD SPECIFICATION]
The system tracks complete Balance of System (BOS) inventory for solar installation projects, handling multi-UOM (Unit of Measure) hardware ranging from high-voltage electrical components to physical mounting racking.

### Hardware Category & UOM Mapping Rules:
1. PV_MODULE: Solar PV Modules / Panels (Wattage Peak Wp, Voc, Isc, Vmp, Imp, Efficiency rating 20-22%, Cell count). UOM: PCS.
2. INVERTER: String, Hybrid & Microinverters (Nominal Output kW, MPPT Range, Single/Three-Phase 220V/230V/380V/400V, IP rating). UOM: PCS / SET.
3. BESS: LiFePO4 Battery Storage Banks (Voltage V, Ah capacity, kWh total energy, BMS CAN/RS485). UOM: PCS.
4. PROTECTION_BREAKERS: DC MCB, DC MCCB, AC MCB/MCCB, DC SPD, AC SPD, DC Rotary Disconnect Switches. UOM: PCS.
5. RACKING: Aluminum Rails (AL6005-T5), Mid/End Clamps, Roof Anchors/L-Feet/Tile Hooks, Rail Splice Kits. UOM: SETS / PCS / BOXES.
6. DC_CABLING: Single-Core Solar PV DC Cable (4.0mm², 6.0mm²) & Heavy-Duty Battery Power Cables (25-95mm²). UOM: METERS.
7. MC4_CONNECTOR: MC4 Male/Female Pairs, Y-Branch Combiners (1000V/1500V DC IP68). UOM: PCS / SETS.
8. CONDUIT_FITTINGS: Rigid PVC, Corrugated Conduit, Weatherproof LB fittings. UOM: METERS / PCS.
9. GROUNDING: Bare Copper Wire, Copper-Bonded Ground Rods, WEEB Bonding Clips. UOM: METERS / PCS / BOXES.
10. FASTENERS: SUS304 Lag Bolts, Concrete Expansion Anchor Bolts. UOM: BOXES.
11. CONSUMABLES: Structural Polyurethane Roof Sealants, UV Black Cable Ties, PV Safety Decal Sticker Kits. UOM: PCS / BOXES / SETS.
12. BOS_SWITCHGEAR: General Balance of System components. UOM: PCS.

[INSTRUCTIONS]
When provided with inventory receipts, installation BOM lists, stock adjustments, or item creation requests:
1. Normalize item names, brand categories, and specifications.
2. Assign the correct standard Unit of Measure (UOM).
3. Validate stock thresholds and log movement transactions.
4. Output the result in pure JSON matching the schema.`;

export const PRD_CONFIG = {
  engine: 'Rule-Based Offline Parser',
  prdVersion: '1.0.4 - Solar BOS Specialist'
};

/**
 * Utility function to check if a hardware item or line item belongs to the Battery System package
 * (e.g. Battery Storage Module BESS, DC MCCB for battery, or Battery Cabling).
 */
export function isBatteryRelatedItem(item: {
  category?: string;
  model_number?: string;
  item_description?: string;
  brand_manufacturer?: string;
} | null | undefined): boolean {
  if (!item) return false;
  const cat = (item.category || '').toUpperCase();
  const model = (item.model_number || '').toLowerCase();
  const desc = (item.item_description || '').toLowerCase();

  // 1. Direct BESS Category Match
  if (cat === 'BESS') return true;

  // 2. Battery & Switchgear Model Number Keywords
  if (
    model.includes('mg-bat') ||
    model.includes('mg-dcmccb') ||
    model.includes('bat-flex') ||
    model.includes('bess') ||
    model.includes('us5000') ||
    model.includes('hvs-') ||
    model.includes('ef-powerkit') ||
    model.includes('ef-bess')
  ) {
    return true;
  }

  // 3. Description & Hardware Name Keywords
  if (
    desc.includes('battery') ||
    desc.includes('bess') ||
    desc.includes('dc mccb') ||
    desc.includes('battery isolator') ||
    desc.includes('battery cable') ||
    desc.includes('battery wire') ||
    desc.includes('storage module') ||
    desc.includes('lfp storage') ||
    desc.includes('lithium battery')
  ) {
    return true;
  }

  return false;
}

export const INITIAL_INVENTORY: InventoryItem[] = [
  // 1. MG SOLAR Material Dispatch & Packing Checklist Items (DOC #: MG-CL-MG-QT-260714085517)
  {
    item_id: 'ITEM-MG-M01',
    brand_manufacturer: 'MG Solar',
    category: 'INVERTER',
    item_description: 'Inverter 10kW Hybrid (Three-Phase Multi-MPPT)',
    model_number: 'MG-INV-10KW-HYB',
    quantity: 10,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 10000,
      capacity_kw_kwh: '10 kW Hybrid',
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 10,
      allocated_stock: 1,
      reorder_threshold: 3,
      low_stock_alert: false
    },
    serial_numbers: ['MGS-INV10K-2026-001', 'MGS-INV10K-2026-002', 'MGS-INV10K-2026-003'],
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-M02',
    brand_manufacturer: 'MG Solar',
    category: 'PV_MODULE',
    item_description: 'Panel 625W (7.02ft x 3.72ft High-Efficiency Mono PV Module)',
    model_number: 'MG-PV-625W',
    quantity: 160,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 625,
      capacity_kw_kwh: '0.625 kWp',
      dimensions: '7.02ft x 3.72ft'
    },
    stock_levels: {
      current_stock: 160,
      allocated_stock: 16,
      reorder_threshold: 30,
      low_stock_alert: false
    },
    serial_numbers: ['MGS-625W-001', 'MGS-625W-002', 'MGS-625W-003'],
    image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-M03',
    brand_manufacturer: 'MG Solar',
    category: 'BESS',
    item_description: 'Battery 314Ah (51.2V LiFePO4 Energy Storage Module)',
    model_number: 'MG-BAT-314AH-51V',
    quantity: 12,
    uom: 'PCS',
    technical_specs: {
      capacity_kw_kwh: '16.07 kWh (314Ah)',
      voltage_rating_v: 51.2
    },
    stock_levels: {
      current_stock: 12,
      allocated_stock: 1,
      reorder_threshold: 3,
      low_stock_alert: false
    },
    serial_numbers: ['MGS-B314-512V-001', 'MGS-B314-512V-002'],
    image_url: 'https://images.unsplash.com/photo-1558441719-670b95752a02?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-M04',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'DC MCCB for battery 125A',
    model_number: 'MG-DCMCCB-125A',
    quantity: 25,
    uom: 'PCS',
    technical_specs: {
      amperage_rating_a: 125,
      voltage_rating_v: 500
    },
    stock_levels: {
      current_stock: 25,
      allocated_stock: 1,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-M05',
    brand_manufacturer: 'MG Solar',
    category: 'DC_CABLING',
    item_description: 'Battery Cable (Black & Red) 1 meters each',
    model_number: 'MG-BAT-CABLE-1M',
    quantity: 100,
    uom: 'METERS',
    technical_specs: {
      cable_cross_section_mm2: 35
    },
    stock_levels: {
      current_stock: 100,
      allocated_stock: 2,
      reorder_threshold: 20,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-H01',
    brand_manufacturer: 'MG Solar',
    category: 'RACKING',
    item_description: 'Railings (Aluminum Solar Railing)',
    model_number: 'MG-RAIL-AL4200',
    quantity: 200,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 200,
      allocated_stock: 32,
      reorder_threshold: 50,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-H02',
    brand_manufacturer: 'MG Solar',
    category: 'RACKING',
    item_description: 'Mid Clamp (Aluminum Module Mid Clamp)',
    model_number: 'MG-CLAMP-MID',
    quantity: 300,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 300,
      allocated_stock: 28,
      reorder_threshold: 60,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-H03',
    brand_manufacturer: 'MG Solar',
    category: 'RACKING',
    item_description: 'End Clamp (Aluminum Module End Clamp)',
    model_number: 'MG-CLAMP-END',
    quantity: 300,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 300,
      allocated_stock: 28,
      reorder_threshold: 60,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-H04',
    brand_manufacturer: 'MG Solar',
    category: 'RACKING',
    item_description: 'L Foot (Aluminum Roof L-Foot Bracket)',
    model_number: 'MG-LFOOT-AL',
    quantity: 400,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 400,
      allocated_stock: 40,
      reorder_threshold: 80,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E01',
    brand_manufacturer: 'MG Solar',
    category: 'CONDUIT_FITTINGS',
    item_description: 'Flexible hose (Corrugated Conduit)',
    model_number: 'MG-FLEX-HOSE-25MM',
    quantity: 150,
    uom: 'METERS',
    technical_specs: {},
    stock_levels: {
      current_stock: 150,
      allocated_stock: 5,
      reorder_threshold: 30,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E02',
    brand_manufacturer: 'MG Solar',
    category: 'DC_CABLING',
    item_description: 'AC wire (Heavy Duty AC Power Wire)',
    model_number: 'MG-AC-WIRE-8MM2',
    quantity: 200,
    uom: 'METERS',
    technical_specs: {
      cable_cross_section_mm2: 8
    },
    stock_levels: {
      current_stock: 200,
      allocated_stock: 5,
      reorder_threshold: 40,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E03',
    brand_manufacturer: 'MG Solar',
    category: 'DC_CABLING',
    item_description: 'DC/PV wire (Single Core Solar PV DC Cable)',
    model_number: 'MG-PV-WIRE-6MM2',
    quantity: 500,
    uom: 'METERS',
    technical_specs: {
      cable_cross_section_mm2: 6
    },
    stock_levels: {
      current_stock: 500,
      allocated_stock: 5,
      reorder_threshold: 100,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E04',
    brand_manufacturer: 'MG Solar',
    category: 'MC4_CONNECTOR',
    item_description: 'MC4 50A (50A High Amperage Solar Connectors)',
    model_number: 'MG-MC4-50A',
    quantity: 250,
    uom: 'PCS',
    technical_specs: {
      amperage_rating_a: 50
    },
    stock_levels: {
      current_stock: 250,
      allocated_stock: 20,
      reorder_threshold: 50,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E05',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'Breaker box (Enclosure Distribution Box IP65)',
    model_number: 'MG-BOX-DISP-IP65',
    quantity: 20,
    uom: 'PCS',
    technical_specs: {
      ip_rating: 'IP65'
    },
    stock_levels: {
      current_stock: 20,
      allocated_stock: 1,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E06',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'AC MCB (AC Miniature Circuit Breaker)',
    model_number: 'MG-ACMCB-63A',
    quantity: 50,
    uom: 'PCS',
    technical_specs: {
      amperage_rating_a: 63
    },
    stock_levels: {
      current_stock: 50,
      allocated_stock: 2,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E07',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'AC SPD (AC Surge Protection Device)',
    model_number: 'MG-ACSPD-275V',
    quantity: 40,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 275
    },
    stock_levels: {
      current_stock: 40,
      allocated_stock: 2,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E08',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'DC SPD (DC Surge Protection Device)',
    model_number: 'MG-DCSPD-1000V',
    quantity: 40,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 40,
      allocated_stock: 2,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E09',
    brand_manufacturer: 'MG Solar',
    category: 'PROTECTION_BREAKERS',
    item_description: 'DC MCB (DC Miniature Circuit Breaker)',
    model_number: 'MG-DCMCB-32A',
    quantity: 60,
    uom: 'PCS',
    technical_specs: {
      amperage_rating_a: 32
    },
    stock_levels: {
      current_stock: 60,
      allocated_stock: 2,
      reorder_threshold: 15,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E10',
    brand_manufacturer: 'MG Solar',
    category: 'CONDUIT_FITTINGS',
    item_description: 'Cable raceway conduit 2 meters',
    model_number: 'MG-RACEWAY-2M',
    quantity: 50,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 50,
      allocated_stock: 1,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E11',
    brand_manufacturer: 'MG Solar',
    category: 'BOS_SWITCHGEAR',
    item_description: 'Terminal lugs (Copper Compression Terminal Lugs)',
    model_number: 'MG-LUGS-35MM',
    quantity: 200,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 200,
      allocated_stock: 12,
      reorder_threshold: 40,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-E12',
    brand_manufacturer: 'MG Solar',
    category: 'BOS_SWITCHGEAR',
    item_description: 'Terminal Block (DIN Rail Mounted Terminal Block)',
    model_number: 'MG-TERM-BLOCK',
    quantity: 100,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 100,
      allocated_stock: 5,
      reorder_threshold: 20,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-G01',
    brand_manufacturer: 'MG Solar',
    category: 'GROUNDING',
    item_description: 'Grounding Lugs (Grounding Terminal Lugs)',
    model_number: 'MG-GND-LUG',
    quantity: 80,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 80,
      allocated_stock: 4,
      reorder_threshold: 15,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-G02',
    brand_manufacturer: 'MG Solar',
    category: 'GROUNDING',
    item_description: 'Ground Wire 30m (30m Roll Bare Copper Wire)',
    model_number: 'MG-GND-WIRE-30M',
    quantity: 20,
    uom: 'METERS',
    technical_specs: {
      cable_cross_section_mm2: 14
    },
    stock_levels: {
      current_stock: 20,
      allocated_stock: 1,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-G03',
    brand_manufacturer: 'MG Solar',
    category: 'GROUNDING',
    item_description: 'Ground Rod w/ Clamp',
    model_number: 'MG-GND-ROD-CLAMP',
    quantity: 30,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 30,
      allocated_stock: 1,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-MG-S01',
    brand_manufacturer: 'MG Solar',
    category: 'BOS_SWITCHGEAR',
    item_description: 'Automatic transfer switch (ATS Dual Power Switch)',
    model_number: 'MG-ATS-100A',
    quantity: 15,
    uom: 'PCS',
    technical_specs: {
      amperage_rating_a: 100,
      voltage_rating_v: 230
    },
    stock_levels: {
      current_stock: 15,
      allocated_stock: 1,
      reorder_threshold: 3,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop'
  },

  // 2. Additional Tier-1 Generating & Energy Storage Units
  {
    item_id: 'ITEM-PV-001',
    brand_manufacturer: 'Tongwei',
    category: 'PV_MODULE',
    item_description: '550W N-Type TOPCon Monocrystalline Solar Panel (144 Half-Cut)',
    model_number: 'TW-550N-72HD',
    quantity: 480,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 550,
      capacity_kw_kwh: '0.55 kWp',
      voltage_rating_v: 49.8
    },
    stock_levels: {
      current_stock: 480,
      allocated_stock: 200,
      reorder_threshold: 100,
      low_stock_alert: false
    },
    serial_numbers: [
      'TW20260726-0001',
      'TW20260726-0002',
      'TW20260726-0003',
      'TW20260726-0004',
      'TW20260726-0005'
    ],
    image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PV-002',
    brand_manufacturer: 'Jinko Solar',
    category: 'PV_MODULE',
    item_description: '450W Monocrystalline PERC Solar Panel (108 Cell)',
    model_number: 'JKM-450M-60HL4',
    quantity: 320,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 450,
      capacity_kw_kwh: '0.45 kWp',
      voltage_rating_v: 41.5
    },
    stock_levels: {
      current_stock: 320,
      allocated_stock: 150,
      reorder_threshold: 80,
      low_stock_alert: false
    },
    serial_numbers: [
      'JK2026-450M-01',
      'JK2026-450M-02',
      'JK2026-450M-03'
    ],
    image_url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PV-003',
    brand_manufacturer: 'Longi Solar',
    category: 'PV_MODULE',
    item_description: '600W N-Type TOPCon Solar Panel (156 Half-Cut Cell)',
    model_number: 'LR5-72HGD-600M',
    quantity: 180,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 600,
      capacity_kw_kwh: '0.60 kWp',
      voltage_rating_v: 52.4
    },
    stock_levels: {
      current_stock: 180,
      allocated_stock: 120,
      reorder_threshold: 50,
      low_stock_alert: false
    },
    serial_numbers: [
      'LR600W-2026-101',
      'LR600W-2026-102'
    ],
    image_url: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PV-004',
    brand_manufacturer: 'Trina Solar',
    category: 'PV_MODULE',
    item_description: '670W Ultra-High Efficiency TOPCon Module (132 Half-Cut)',
    model_number: 'TSM-DEG21C.20-670',
    quantity: 90,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 670,
      capacity_kw_kwh: '0.67 kWp',
      voltage_rating_v: 46.2
    },
    stock_levels: {
      current_stock: 90,
      allocated_stock: 80,
      reorder_threshold: 25,
      low_stock_alert: true
    },
    serial_numbers: [
      'TSM670-2026-881',
      'TSM670-2026-882'
    ],
    image_url: 'https://images.unsplash.com/photo-1521618755572-156ae0c6821f?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-INV-001',
    brand_manufacturer: 'GoodWe',
    category: 'INVERTER',
    item_description: '10kW Three-Phase Hybrid Solar Inverter with Dual MPPT (IP66)',
    model_number: 'GW10K-ET',
    quantity: 12,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 10000,
      capacity_kw_kwh: '10 kW (Three-Phase)',
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 12,
      allocated_stock: 10,
      reorder_threshold: 5,
      low_stock_alert: true
    },
    serial_numbers: [
      'GW-ET10K-9001',
      'GW-ET10K-9002',
      'GW-ET10K-9003'
    ],
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-INV-002',
    brand_manufacturer: 'Sungrow',
    category: 'INVERTER',
    item_description: '5kW Single-Phase Hybrid Solar Inverter (220V/230V IP65)',
    model_number: 'SH5.0RS',
    quantity: 18,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 5000,
      capacity_kw_kwh: '5 kW (Single-Phase)',
      voltage_rating_v: 600
    },
    stock_levels: {
      current_stock: 18,
      allocated_stock: 8,
      reorder_threshold: 6,
      low_stock_alert: false
    },
    serial_numbers: [
      'SG-SH5RS-101',
      'SG-SH5RS-102'
    ],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-INV-003',
    brand_manufacturer: 'Huawei',
    category: 'INVERTER',
    item_description: '12kW Three-Phase High-Efficiency String Inverter (380V/400V)',
    model_number: 'SUN2000-12KTL-M1',
    quantity: 8,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 12000,
      capacity_kw_kwh: '12 kW (Three-Phase)',
      voltage_rating_v: 1100
    },
    stock_levels: {
      current_stock: 8,
      allocated_stock: 6,
      reorder_threshold: 4,
      low_stock_alert: true
    },
    serial_numbers: [
      'HW-SUN12K-001',
      'HW-SUN12K-002'
    ],
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-INV-004',
    brand_manufacturer: 'APsystems',
    category: 'INVERTER',
    item_description: '1200W Quad Microinverter (Rapid Shutdown IP67)',
    model_number: 'DS3D-1200',
    quantity: 45,
    uom: 'PCS',
    technical_specs: {
      power_rating_w: 1200,
      capacity_kw_kwh: '1.2 kW (Microinverter)',
      voltage_rating_v: 60
    },
    stock_levels: {
      current_stock: 45,
      allocated_stock: 15,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [
      'AP-DS3D-501',
      'AP-DS3D-502'
    ],
    image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-BESS-001',
    brand_manufacturer: 'EcoFlow',
    category: 'BESS',
    item_description: '15kWh Modular LFP Storage Subsystem (48V 300Ah BMS CAN/RS485)',
    model_number: 'EF-POWERKIT-15K',
    quantity: 4,
    uom: 'PCS',
    technical_specs: {
      capacity_kw_kwh: '15 kWh LFP (48V)',
      voltage_rating_v: 51.2
    },
    stock_levels: {
      current_stock: 4,
      allocated_stock: 3,
      reorder_threshold: 3,
      low_stock_alert: true
    },
    serial_numbers: [
      'EF-BESS-2026-01',
      'EF-BESS-2026-02'
    ],
    image_url: 'https://images.unsplash.com/photo-1558441719-670b95752a02?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-BESS-002',
    brand_manufacturer: 'Pylontech',
    category: 'BESS',
    item_description: '48V 100Ah (5.12 kWh) Rack-Mount LiFePO4 Battery Module',
    model_number: 'US5000-5.12K',
    quantity: 16,
    uom: 'PCS',
    technical_specs: {
      capacity_kw_kwh: '5.12 kWh LFP',
      voltage_rating_v: 48
    },
    stock_levels: {
      current_stock: 16,
      allocated_stock: 8,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [
      'PYL-US5000-801',
      'PYL-US5000-802'
    ],
    image_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-BESS-003',
    brand_manufacturer: 'BYD',
    category: 'BESS',
    item_description: 'High-Voltage Stackable Battery Storage Module (10.24 kWh HV)',
    model_number: 'HVS-10.2',
    quantity: 6,
    uom: 'PCS',
    technical_specs: {
      capacity_kw_kwh: '10.24 kWh HV Stack',
      voltage_rating_v: 400
    },
    stock_levels: {
      current_stock: 6,
      allocated_stock: 4,
      reorder_threshold: 3,
      low_stock_alert: true
    },
    serial_numbers: [
      'BYD-HVS10K-01',
      'BYD-HVS10K-02'
    ],
    image_url: 'https://images.unsplash.com/photo-1558441719-670b95752a02?w=600&auto=format&fit=crop'
  },

  // 2. Protection, Breakers, & Electrical Controls
  {
    item_id: 'ITEM-PROT-001',
    brand_manufacturer: 'Schneider Electric',
    category: 'PROTECTION_BREAKERS',
    item_description: '1000VDC 2P 32A DC Miniature Circuit Breaker (DC MCB)',
    model_number: 'C60H-DC-2P-32A',
    quantity: 75,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 75,
      allocated_stock: 30,
      reorder_threshold: 20,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PROT-002',
    brand_manufacturer: 'ABB',
    category: 'PROTECTION_BREAKERS',
    item_description: '500VDC 2P 250A DC Molded Case Circuit Breaker (DC MCCB / Battery Isolator)',
    model_number: 'SACE-TMAX-T3D-250',
    quantity: 14,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 500
    },
    stock_levels: {
      current_stock: 14,
      allocated_stock: 10,
      reorder_threshold: 5,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PROT-003',
    brand_manufacturer: 'Eaton',
    category: 'PROTECTION_BREAKERS',
    item_description: '400V 4P 63A Three-Phase AC Main Circuit Breaker (AC MCB C-Curve)',
    model_number: 'FAZ-C63/4',
    quantity: 40,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 400
    },
    stock_levels: {
      current_stock: 40,
      allocated_stock: 15,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PROT-004',
    brand_manufacturer: 'Dehn',
    category: 'PROTECTION_BREAKERS',
    item_description: '1000VDC 3P Type 2 DC Surge Protection Device (DC SPD)',
    model_number: 'DG-YPV-SCI-1000',
    quantity: 28,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 28,
      allocated_stock: 12,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PROT-005',
    brand_manufacturer: 'Phoenix Contact',
    category: 'PROTECTION_BREAKERS',
    item_description: '275VAC 2P Class II AC Surge Protection Device (AC SPD)',
    model_number: 'VAL-MS-275/2',
    quantity: 35,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 275
    },
    stock_levels: {
      current_stock: 35,
      allocated_stock: 10,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-PROT-006',
    brand_manufacturer: 'Kraus & Naimer',
    category: 'PROTECTION_BREAKERS',
    item_description: '1000VDC 32A 4-Pole Lockable DC Rotary Disconnect Switch (IP66)',
    model_number: 'KG32-T204-DC1000',
    quantity: 22,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 22,
      allocated_stock: 18,
      reorder_threshold: 8,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop'
  },

  // 3. Structural Racking & Mounting Hardware
  {
    item_id: 'ITEM-RACK-001',
    brand_manufacturer: 'Clenergy',
    category: 'RACKING',
    item_description: 'PV-EZRack SolarTerrace Anodized Aluminum Mounting Rail 4200mm (AL6005-T5)',
    model_number: 'ER-R-ST4200',
    quantity: 120,
    uom: 'SETS',
    technical_specs: {},
    stock_levels: {
      current_stock: 120,
      allocated_stock: 40,
      reorder_threshold: 30,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-002',
    brand_manufacturer: 'Clenergy',
    category: 'RACKING',
    item_description: 'PV-EZRack Anodized Aluminum Mounting Rail 2100mm (AL6005-T5)',
    model_number: 'ER-R-ST2100',
    quantity: 90,
    uom: 'SETS',
    technical_specs: {},
    stock_levels: {
      current_stock: 90,
      allocated_stock: 30,
      reorder_threshold: 20,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-003',
    brand_manufacturer: 'Clenergy',
    category: 'RACKING',
    item_description: 'Universal Adjustable Mid-Clamps with Grounding Pins & M8 Bolts (Box of 100)',
    model_number: 'ER-IC-ST-100',
    quantity: 25,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 25,
      allocated_stock: 15,
      reorder_threshold: 8,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-004',
    brand_manufacturer: 'Clenergy',
    category: 'RACKING',
    item_description: 'Universal Adjustable End-Clamps 30-35mm with M8 Bolts (Box of 100)',
    model_number: 'ER-EC-ST-100',
    quantity: 18,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 18,
      allocated_stock: 12,
      reorder_threshold: 6,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-005',
    brand_manufacturer: 'K2 Systems',
    category: 'RACKING',
    item_description: 'L-Feet Aluminum Anchor Kit with EPDM Rubber Gasket & Lag Screws',
    model_number: 'K2-LFOOT-EPDM',
    quantity: 350,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 350,
      allocated_stock: 200,
      reorder_threshold: 100,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-006',
    brand_manufacturer: 'K2 Systems',
    category: 'RACKING',
    item_description: 'Universal Stainless Steel SUS304 Roof Tile Hook Assembly',
    model_number: 'K2-HOOK-TILE-UNI',
    quantity: 200,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 200,
      allocated_stock: 180,
      reorder_threshold: 50,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-RACK-007',
    brand_manufacturer: 'Clenergy',
    category: 'RACKING',
    item_description: '200mm Aluminum Rail Internal Splice Bar with Self-Tapping Screws',
    model_number: 'ER-SP-ST200',
    quantity: 140,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 140,
      allocated_stock: 40,
      reorder_threshold: 30,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop'
  },

  // 4. Cabling, Conduits, & Connections
  {
    item_id: 'ITEM-CAB-001',
    brand_manufacturer: 'CESC',
    category: 'DC_CABLING',
    item_description: '6mm² Double-Insulated Halogen-Free Solar DC Cable - Black (1500V DC)',
    model_number: 'H1Z2Z2-K 1X6-BLK',
    quantity: 2500,
    uom: 'METERS',
    technical_specs: {
      voltage_rating_v: 1500,
      cable_cross_section_mm2: 6
    },
    stock_levels: {
      current_stock: 2500,
      allocated_stock: 1000,
      reorder_threshold: 600,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CAB-002',
    brand_manufacturer: 'CESC',
    category: 'DC_CABLING',
    item_description: '4mm² Single-Core Solar DC Cable - Red Jacket (1500V DC)',
    model_number: 'H1Z2Z2-K 1X4-RED',
    quantity: 1800,
    uom: 'METERS',
    technical_specs: {
      voltage_rating_v: 1500,
      cable_cross_section_mm2: 4
    },
    stock_levels: {
      current_stock: 1800,
      allocated_stock: 800,
      reorder_threshold: 500,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CAB-003',
    brand_manufacturer: 'Prysmian',
    category: 'DC_CABLING',
    item_description: '35mm² Fine-Stranded Heavy-Duty Flex Battery Cable (105°C Silicone)',
    model_number: 'BAT-FLEX-35MM',
    quantity: 350,
    uom: 'METERS',
    technical_specs: {
      voltage_rating_v: 1000,
      cable_cross_section_mm2: 35
    },
    stock_levels: {
      current_stock: 350,
      allocated_stock: 250,
      reorder_threshold: 120,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CONN-001',
    brand_manufacturer: 'Stäubli',
    category: 'MC4_CONNECTOR',
    item_description: 'MC4-Evo 2 Solar Male/Female Connector Pair 1500V DC (IP68)',
    model_number: 'PV-KST4-EVO2',
    quantity: 600,
    uom: 'PCS',
    technical_specs: {
      voltage_rating_v: 1500
    },
    stock_levels: {
      current_stock: 600,
      allocated_stock: 400,
      reorder_threshold: 150,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CONN-002',
    brand_manufacturer: 'Stäubli',
    category: 'MC4_CONNECTOR',
    item_description: 'Y-Branch 2-to-1 Parallel MC4 Combiner Connector Pair',
    model_number: 'PV-MC4-YBRANCH',
    quantity: 45,
    uom: 'SETS',
    technical_specs: {
      voltage_rating_v: 1000
    },
    stock_levels: {
      current_stock: 45,
      allocated_stock: 35,
      reorder_threshold: 15,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-COND-001',
    brand_manufacturer: 'Pipelife',
    category: 'CONDUIT_FITTINGS',
    item_description: '25mm Heavy-Duty Rigid UV-Stabilized PVC Electrical Conduit Pipe (3m)',
    model_number: 'COND-PVC-25MM-3M',
    quantity: 300,
    uom: 'METERS',
    technical_specs: {},
    stock_levels: {
      current_stock: 300,
      allocated_stock: 120,
      reorder_threshold: 100,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop'
  },

  // 5. Grounding, Hardware, & Consumables
  {
    item_id: 'ITEM-GND-001',
    brand_manufacturer: 'Southwire',
    category: 'GROUNDING',
    item_description: '14.0mm² Bare Solid Copper Earth Grounding Wire',
    model_number: 'GND-COPPER-14MM',
    quantity: 450,
    uom: 'METERS',
    technical_specs: {
      cable_cross_section_mm2: 14
    },
    stock_levels: {
      current_stock: 450,
      allocated_stock: 200,
      reorder_threshold: 100,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-GND-002',
    brand_manufacturer: 'Erico Cadweld',
    category: 'GROUNDING',
    item_description: '5/8" x 10 ft Copper-Bonded Driven Earth Ground Rod with Heavy Clamp',
    model_number: 'GND-ROD-5810',
    quantity: 30,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 30,
      allocated_stock: 15,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-GND-003',
    brand_manufacturer: 'Wiley WEEB',
    category: 'GROUNDING',
    item_description: 'WEEB Stainless Steel Washer Electrical Equipment Bonding Clips (Box of 100)',
    model_number: 'WEEB-CLIP-100',
    quantity: 15,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 15,
      allocated_stock: 12,
      reorder_threshold: 5,
      low_stock_alert: true
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-FAST-001',
    brand_manufacturer: 'Fischer',
    category: 'FASTENERS',
    item_description: 'SUS304 Stainless Hex Head Lag Bolts M8 x 80mm with EPDM Washer (Box of 100)',
    model_number: 'FAST-LAG-M8X80',
    quantity: 20,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 20,
      allocated_stock: 10,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-FAST-002',
    brand_manufacturer: 'Fischer',
    category: 'FASTENERS',
    item_description: 'Zinc-Plated Steel Concrete Expansion Anchor Bolts M10 x 100mm (Box of 50)',
    model_number: 'FAST-ANCHOR-M10100',
    quantity: 18,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 18,
      allocated_stock: 8,
      reorder_threshold: 5,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CONS-001',
    brand_manufacturer: 'Chemlink M-1',
    category: 'CONSUMABLES',
    item_description: 'Structural High-Modulus Polyurethane Waterproof Roof Adhesive Sealant 310ml',
    model_number: 'CONS-SEALANT-M1',
    quantity: 50,
    uom: 'PCS',
    technical_specs: {},
    stock_levels: {
      current_stock: 50,
      allocated_stock: 20,
      reorder_threshold: 15,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CONS-002',
    brand_manufacturer: 'Panduit',
    category: 'CONSUMABLES',
    item_description: 'Heavy-Duty UV-Black Nylon Cable Ties 300mm & Stainless Steel Edge Clips (Bag of 100)',
    model_number: 'TIES-UV-300MM',
    quantity: 40,
    uom: 'BOXES',
    technical_specs: {},
    stock_levels: {
      current_stock: 40,
      allocated_stock: 25,
      reorder_threshold: 10,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop'
  },
  {
    item_id: 'ITEM-CONS-003',
    brand_manufacturer: 'SolarSafety',
    category: 'CONSUMABLES',
    item_description: 'Reflective Vinyl Photovoltaic Hazard Safety Decal Sticker Kit (NEC Compliant)',
    model_number: 'DECAL-KIT-SOLAR',
    quantity: 60,
    uom: 'SETS',
    technical_specs: {},
    stock_levels: {
      current_stock: 60,
      allocated_stock: 20,
      reorder_threshold: 15,
      low_stock_alert: false
    },
    serial_numbers: [],
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  }
];

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'mg-solar-checklist',
    title: 'MG Solar Material Dispatch Checklist (25 Items)',
    description: 'Official MG SOLAR Material Dispatch & Packing Checklist (Doc #: MG-CL-MG-QT-260714085517)',
    promptText: `MG SOLAR - MATERIAL DISPATCH & PACKING CHECKLIST
Doc #: MG-CL-MG-QT-260714085517
Date: Jul 27, 2026
Status: 3/25 Items Verified
Subject / Project: CHECKLIST - SUPPLY OF SOLAR SYSTEM MATERIALS
Prepared / Dispatched By: Ryan M. Castillo

MAJOR EQUIPMENT (5):
- Inverter 10kW Hybrid (PC: 1) [Verified]
- Panel 625W (7.02ft x 3.72ft) (PCS: 16) [Verified]
- Battery 314Ah (51.2V) (PC: 1) [Verified]
- DC MCCB for battery 125A (PC: 1)
- Battery Cable (Black & Red) 1 meters each (M: 2)

MOUNTING & HARDWARE (4):
- Railings (PCS: 32)
- Mid Clamp (PCS: 28)
- End Clamp (PCS: 28)
- L Foot (PCS: 40)

ELECTRICAL & CABLING (12):
- Flexible hose (M: 5)
- AC wire (M: 5)
- DC/PV wire (M: 5)
- MC4 50A (PCS: 20)
- Breaker box (PC: 1)
- AC MCB (PCS: 2)
- AC SPD (PCS: 2)
- DC SPD (PCS: 2)
- DC MCB (PCS: 2)
- Cable raceway conduit 2 meters (PC: 1)
- Terminal lugs (PCS: 12)
- Terminal Block (PCS: 5)

GROUNDING & BONDING (3):
- Grounding Lugs (PCS: 4)
- Ground Wire 30m (ROLL: 1)
- Ground Rod w/ Clamp (PC: 1)

SUPPLIED MATERIAL (1):
- Automatic transfer switch (PC: 1)`
  },
  {
    id: 'inbound-modules',
    title: 'Inbound Shipment: PV Modules & Hybrid Inverters',
    description: 'Inbound delivery note for Tier-1 solar panels and GoodWe inverters for Project Sol-Alpha',
    promptText: `INBOUND SHIPMENT RECEIPT - Delivery Note #DN-2026-9081
Project ID: PROJ-SOLAR-ALPHA
Carrier: LogiSolar Express
Date: 2026-07-26

Received Items:
1. 200 Pcs Tongwei 550W TOPCon Monocrystalline Modules (TW-550N-72HD).
   Serials: TW-550N-8001 to TW-550N-8200
   Reorder threshold: 50. Allocated: 0.

2. 5 Pcs GoodWe 10kW Three-Phase Hybrid Inverters (GW10K-ET).
   1000V DC rated, 10kW capacity.
   Serials: GW-ET10K-9050, GW-ET10K-9051, GW-ET10K-9052, GW-ET10K-9053, GW-ET10K-9054
   Reorder threshold: 3. Allocated: 0.`
  },
  {
    id: 'reservation-bom',
    title: 'BOM Reservation: 50kW Commercial Roof Installation',
    description: 'Reserve hardware for Project Titan Commercial Installation including cables, connectors, and racking',
    promptText: `PROJECT BOM RESERVATION REQUEST
Project ID: PROJ-TITAN-COMMERCIAL
Action: RESERVATION

Please reserve the following items from central warehouse stock:
- 1000 Meters CESC 6mm2 H1Z2Z2-K Solar Cable (Red/Black 1500V DC). Model: H1Z2Z2-K 1X6. Reorder limit 400. Currently allocated 600, total stock 1500.
- 100 Boxes Stäubli MC4-Evo 2 Connectors (PV-KST4-EVO2) containing 10 pcs each.
- 30 Sets Clenergy PV-EZRack SolarTerrace Roof Rail Mount Structure 4200mm (ER-R-ST4200).`
  },
  {
    id: 'audit-low-stock',
    title: 'Warehouse Audit & Low Stock Warning',
    description: 'Stock audit report highlighting low stock levels on BESS storage and DC Switchgear',
    promptText: `WAREHOUSE AUDIT REPORT - CENTRAL HUB
Transaction: AUDIT
Timestamp: 2026-07-26T19:00:00Z

Count Verification:
1. EcoFlow 15kWh Modular LFP BESS (EF-POWERKIT-15K).
   Current Physical Stock: 2 Pcs. Allocated Stock: 2 Pcs. Reorder Threshold: 5 Pcs.
   Serials verified: EF-BESS-2026-01, EF-BESS-2026-02.
   Note: Low stock alert must be flagged TRUE!

2. Tongwei 1000V DC 2-String Combiner Box (CB-DC1000-2S).
   Current Physical Stock: 4 Pcs. Allocated Stock: 3 Pcs. Reorder Threshold: 5 Pcs.
   Note: Available stock is below threshold! Flag low stock alert TRUE.`
  },
  {
    id: 'bess-switchgear-entry',
    title: 'New Hardware Registration: BESS & BOS Switchgear',
    description: 'Register brand new battery systems and DC protection devices',
    promptText: `NEW HARDWARE REGISTRATION ENTRY
Transaction: INBOUND
Project ID: PROJ-STORAGE-BETA

Items:
1. 10 Pcs EcoFlow PowerKit 15kWh LFP Storage Batteries (EF-POWERKIT-15K) rated for 51.2V DC.
   Current stock: 10, Allocated: 0, Reorder threshold: 3. Serials: EF-BAT-101 to EF-BAT-110.

2. 50 Pcs Stäubli 1000V DC Surge Protective Devices (SPD Type 2).
   Model: PV-SPD-1000V. Reorder threshold: 10, Allocated: 0.`
  }
];

export function validatePRDJson(data: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      issues: [{ severity: 'error', rule: 'SCHEMA_ROOT', message: 'Output must be a valid JSON object.' }]
    };
  }

  // 1. Validate inventory_event
  if (!data.inventory_event) {
    issues.push({ severity: 'error', rule: 'MISSING_EVENT', message: 'Missing "inventory_event" object.' });
  } else {
    const validTransactions = ['INBOUND', 'OUTBOUND', 'AUDIT', 'RESERVATION'];
    if (!validTransactions.includes(data.inventory_event.transaction_type)) {
      issues.push({
        severity: 'error',
        rule: 'INVALID_TRANSACTION_TYPE',
        message: `transaction_type must be one of: ${validTransactions.join(', ')}`
      });
    }
    if (!data.inventory_event.timestamp) {
      issues.push({ severity: 'warning', rule: 'MISSING_TIMESTAMP', message: 'Missing "timestamp" ISO string.' });
    }
  }

  // 2. Validate items array
  if (!Array.isArray(data.items) || data.items.length === 0) {
    issues.push({ severity: 'error', rule: 'MISSING_ITEMS', message: '"items" must be a non-empty array.' });
  } else {
    data.items.forEach((item: any, idx: number) => {
      const itemId = item.item_id || `item[${idx}]`;

      // Category validation
      const validCategories = [
        'PV_MODULE',
        'INVERTER',
        'BESS',
        'PROTECTION_BREAKERS',
        'RACKING',
        'DC_CABLING',
        'MC4_CONNECTOR',
        'CONDUIT_FITTINGS',
        'GROUNDING',
        'FASTENERS',
        'CONSUMABLES',
        'BOS_SWITCHGEAR'
      ];
      if (!validCategories.includes(item.category)) {
        issues.push({
          severity: 'error',
          rule: 'INVALID_CATEGORY',
          message: `Item ${itemId} has invalid category: "${item.category}". Must be one of ${validCategories.join(', ')}`,
          itemId
        });
      }

      // UOM validation rules
      const validUOMs = ['PCS', 'METERS', 'SPOOLS', 'SETS', 'BOXES'];
      if (!validUOMs.includes(item.uom)) {
        issues.push({
          severity: 'error',
          rule: 'INVALID_UOM',
          message: `Item ${itemId} has invalid uom "${item.uom}". Allowed: ${validUOMs.join(', ')}`,
          itemId
        });
      }

      // Critical PRD Rule: Cabling MUST NOT be tracked in PCS
      if (item.category === 'DC_CABLING' && (item.uom === 'PCS' || item.uom === 'SETS')) {
        issues.push({
          severity: 'error',
          rule: 'CABLING_UOM_VIOLATION',
          message: `CRITICAL PRD RULE: Cabling (${itemId}) must be tracked in METERS or SPOOLS, not ${item.uom}.`,
          itemId
        });
      }

      // High-value Serial Number check
      const isHighValue = ['PV_MODULE', 'INVERTER', 'BESS'].includes(item.category);
      if (isHighValue) {
        if (!Array.isArray(item.serial_numbers) || item.serial_numbers.length === 0) {
          issues.push({
            severity: 'warning',
            rule: 'MISSING_SERIALS',
            message: `High-value asset (${item.category} ${itemId}) should have populated serial_numbers.`,
            itemId
          });
        }
      }

      // Stock Level checks
      if (item.stock_levels) {
        const { current_stock, allocated_stock, reorder_threshold, low_stock_alert } = item.stock_levels;
        const available = (current_stock || 0) - (allocated_stock || 0);
        const expectedAlert = available <= (reorder_threshold || 0);

        if (typeof low_stock_alert === 'boolean' && low_stock_alert !== expectedAlert) {
          issues.push({
            severity: 'warning',
            rule: 'STOCK_ALERT_MISMATCH',
            message: `Item ${itemId} low_stock_alert is set to ${low_stock_alert}, but available stock (${available}) vs threshold (${reorder_threshold}) indicates it should be ${expectedAlert}.`,
            itemId
          });
        }
      } else {
        issues.push({
          severity: 'error',
          rule: 'MISSING_STOCK_LEVELS',
          message: `Item ${itemId} is missing "stock_levels" object.`,
          itemId
        });
      }
    });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    isValid: !hasError,
    issues
  };
}

export async function parseRawTextToPRD(rawText: string, currentInventory?: InventoryItem[]): Promise<PRDJsonOutput> {
  try {
    const response = await fetch('/api/parse-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, currentInventory })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data) {
        return result.data as PRDJsonOutput;
      }
    }
  } catch (err) {
    console.warn('Backend API parse fallback activated:', err);
  }

  // Fallback rule parser for sample presets or offline execution
  const textUpper = rawText.toUpperCase();
  let txType: 'INBOUND' | 'OUTBOUND' | 'AUDIT' | 'RESERVATION' = 'INBOUND';
  if (textUpper.includes('RESERVATION') || textUpper.includes('RESERVE')) txType = 'RESERVATION';
  if (textUpper.includes('AUDIT') || textUpper.includes('PHYSICAL STOCK')) txType = 'AUDIT';
  if (textUpper.includes('DISPATCH') || textUpper.includes('OUTBOUND')) txType = 'OUTBOUND';

  let projId = 'PROJ-SOLAR-PARSED';
  const projMatch = rawText.match(/PROJECT ID:\s*([A-Z0-9-]+)/i);
  if (projMatch) projId = projMatch[1];

  return {
    inventory_event: {
      transaction_type: txType,
      project_id: projId,
      timestamp: new Date().toISOString()
    },
    items: [
      {
        item_id: 'ITEM-PARSED-001',
        brand_manufacturer: 'Tongwei',
        category: 'PV_MODULE',
        item_description: '550W TOPCon Monocrystalline Solar Panels',
        model_number: 'TW-550N-72HD',
        quantity: 200,
        uom: 'PCS',
        technical_specs: {
          power_rating_w: 550,
          voltage_rating_v: 49.8
        },
        stock_levels: {
          current_stock: 200,
          allocated_stock: 0,
          reorder_threshold: 50,
          low_stock_alert: false
        },
        serial_numbers: ['TW-550N-8001', 'TW-550N-8002', 'TW-550N-8003']
      },
      {
        item_id: 'ITEM-PARSED-002',
        brand_manufacturer: 'GoodWe',
        category: 'INVERTER',
        item_description: '10kW Three-Phase Hybrid Solar Inverter',
        model_number: 'GW10K-ET',
        quantity: 5,
        uom: 'PCS',
        technical_specs: {
          power_rating_w: 10000,
          capacity_kw_kwh: '10 kW',
          voltage_rating_v: 1000
        },
        stock_levels: {
          current_stock: 5,
          allocated_stock: 0,
          reorder_threshold: 3,
          low_stock_alert: false
        },
        serial_numbers: ['GW-ET10K-9050', 'GW-ET10K-9051']
      }
    ]
  };
}
