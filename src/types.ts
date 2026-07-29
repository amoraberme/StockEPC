export type TransactionType = 
  | 'INBOUND' 
  | 'OUTBOUND' 
  | 'AUDIT' 
  | 'RESERVATION'
  | 'RESTOCK'
  | 'REMOVED'
  | 'SKU_ADDED'
  | 'SKU_DELETED';

export type CategoryType = 
  | 'PV_MODULE'
  | 'INVERTER'
  | 'BESS'
  | 'PROTECTION_BREAKERS'
  | 'RACKING'
  | 'DC_CABLING'
  | 'MC4_CONNECTOR'
  | 'CONDUIT_FITTINGS'
  | 'GROUNDING'
  | 'FASTENERS'
  | 'CONSUMABLES'
  | 'BOS_SWITCHGEAR';

export type UOMType = 'PCS' | 'METERS' | 'SPOOLS' | 'SETS' | 'BOXES';

export interface TechnicalSpecs {
  power_rating_w?: number;
  capacity_kw_kwh?: string;
  voltage_rating_v?: number;
  cable_cross_section_mm2?: number;
  amperage_rating_a?: number;
  phase?: string;
  ip_rating?: string;
  poles?: string;
  [key: string]: any;
}

export interface StockLevels {
  current_stock: number;
  allocated_stock: number;
  reorder_threshold: number;
  low_stock_alert: boolean;
}

export interface InventoryItem {
  item_id: string;
  brand_manufacturer: string;
  category: CategoryType;
  item_description: string;
  model_number: string;
  quantity: number;
  uom: UOMType;
  technical_specs: TechnicalSpecs;
  stock_levels: StockLevels;
  serial_numbers: string[];
  image_url?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: string;
  company?: string;
  contactNumber?: string;
  email: string;
  password?: string;
  avatarColor?: string;
}

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'admin',
    username: 'admin',
    fullName: 'System Administrator',
    role: 'System Administrator',
    company: 'M&G Non-Specialized Wholesale Trading',
    contactNumber: '09000000000',
    email: 'admin@mgsolar.com',
    password: 'Admin!Master2026#Mg',
    avatarColor: 'bg-rose-900'
  },
  {
    id: 'ryan',
    username: 'ryan',
    fullName: 'Ryan M. Castillo',
    role: 'Liaison Officer',
    company: 'M&G Non-Specialized Wholesale Trading',
    contactNumber: '09352956244',
    email: 'ry.manalo1111@gmail.com',
    password: 'R3an!Secure2026#Mg',
    avatarColor: 'bg-blue-900'
  },
  {
    id: 'renzel',
    username: 'renzel',
    fullName: 'Renzel G. Rongavilla',
    role: 'Liaison Officer',
    company: 'M&G Non-Specialized Wholesale Trading',
    contactNumber: '09299606023',
    email: 'rongavillarenzel.gs@gmail.com',
    password: 'R3nzel!Shield2026#Mg',
    avatarColor: 'bg-emerald-900'
  },
  {
    id: 'noel',
    username: 'noel',
    fullName: 'Noel Jayson E. Santos',
    role: 'Chief Operating Officer',
    company: 'M&G Non-Specialized Wholesale Trading',
    contactNumber: '09198718747',
    email: 'Santosnoel9999@gmail.com',
    password: 'N0el!Master2026#Mg',
    avatarColor: 'bg-amber-900'
  }
];

export const getStoredProfiles = (): UserProfile[] => {
  const saved = localStorage.getItem('solar_epc_user_profiles');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasAdmin = parsed.some((p: UserProfile) => p.username === 'admin');
        if (!hasAdmin) {
          const adminProfile = DEFAULT_PROFILES.find((p) => p.username === 'admin');
          if (adminProfile) {
            const merged = [adminProfile, ...parsed];
            localStorage.setItem('solar_epc_user_profiles', JSON.stringify(merged));
            return merged;
          }
        }
        return parsed;
      }
    } catch (e) {}
  }
  return DEFAULT_PROFILES;
};

export const updateProfilePasswordInStorage = (userId: string, newPassword: string): UserProfile | null => {
  const profiles = getStoredProfiles();
  const updatedProfiles = profiles.map(p => p.id === userId ? { ...p, password: newPassword } : p);
  localStorage.setItem('solar_epc_user_profiles', JSON.stringify(updatedProfiles));
  return updatedProfiles.find(p => p.id === userId) || null;
};

export interface InventoryEvent {
  transaction_type: TransactionType;
  project_id?: string;
  notes?: string;
  performed_by?: string;
  timestamp: string;
}

export interface AuditItemMovement extends InventoryItem {
  change_quantity?: number;
  previous_stock?: number;
  new_stock?: number;
}

export interface PRDJsonOutput {
  inventory_event: InventoryEvent;
  items: AuditItemMovement[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  itemId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  promptText: string;
}
