
export type MaintenanceCategory = 
  | '건물외부' 
  | '건물내부' 
  | '전기/소방' 
  | '승강기'
  | '홈네트워크'
  | '급수/배수' 
  | '난방/급탕' 
  | '옥외부대';

export interface UnitType {
  id: string;
  type: string;
  privateArea: number; 
  supplyArea: number; 
  households: number; 
}

export interface AnnualRate {
  id: string;
  startPeriod: string; 
  endPeriod: string;   
  rate: number;
}

export interface Apartment {
  id: string;
  name: string;
  approvalDate: string; 
  planPeriod: number; 
  planStartYear?: number; 
  inflationRate: number; 
  unitTypes: UnitType[];
  annualRates?: AnnualRate[];
}

export interface CostBreakdown {
  material: number; 
  labor: number;    
  expense: number;  
}

export interface MaintenanceStandard {
  id: string;
  code: string;
  mainCategory: MaintenanceCategory; 
  subCategory: string;              
  category: MaintenanceCategory;     
  item: string;
  detail?: string; 
  method: string;
  unit: string;      
  unitPrice: number; 
  breakdown: CostBreakdown; 
  repairRate: number; 
  cycleYears: number; 
  lastRepairYear: number; 
  remarks?: string; 
}

export interface MaintenanceItem extends MaintenanceStandard {
  apartmentId: string;
  facilitySize: number;  
  quantity: number;      
  nextRepairYear: number;
  estimatedCost: number;  
  actualCost?: number;    
  actualRepairYear?: number;
  isExecuted?: boolean;   
  isManual?: boolean; 
  status: '정상' | '검토필요' | '긴급';
}

export interface MaintenanceHistory {
  id: string;
  itemId: string;
  apartmentId: string;
  itemName: string;
  executionYear: number;
  executionDate: string;
  plannedCost: number; 
  actualCost: number;   
  contractor: string;
  remarks: string;
  createdAt: string;
}

export interface PlanSnapshot {
  id: string;
  apartmentId: string;
  versionName: string;
  createdAt: string;
  itemCount: number;
  totalCost: number;
  items: MaintenanceItem[];
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: string;
}

export interface AISuggestion {
  itemName: string;
  reason: string;
  complianceNote: string;
  recommendedYear: number;
}

// --- Database Row Types (snake_case) ---

export interface DBApartment {
  id: string;
  name: string;
  approval_date: string;
  plan_period: number;
  inflation_rate: number;
  created_at?: string;
}

export interface DBUnitType {
  id: string;
  apartment_id: string;
  type: string;
  private_area: number;
  common_area: number;
  households: number;
  created_at?: string;
}

export interface DBAnnualRate {
  id: string;
  apartment_id: string;
  start_period: string;
  end_period: string;
  rate: number;
  created_at?: string;
}

export interface DBMaintenanceStandard {
  id: string;
  code: string;
  category: MaintenanceCategory;
  sub_category: string;
  item: string;
  method: string;
  unit: string;
  unit_price: number;
  repair_rate: number;
  cycle_years: number;
  last_repair_year: number;
  material: number;
  labor: number;
  expense: number;
  created_at?: string;
}

export interface DBMaintenanceItem extends DBMaintenanceStandard {
  apartment_id: string;
  facility_size: number;
  quantity: number;
  next_repair_year: number;
  estimated_cost: number;
  status: string;
  is_executed: boolean;
  is_manual: boolean;
  actual_cost: number;
  remarks: string;
}

export interface DBMaintenanceHistory {
  id: string;
  item_id: string;
  apartment_id: string;
  item_name: string;
  execution_year: number;
  execution_date: string;
  planned_cost: number;
  actual_cost: number;
  contractor: string;
  remarks: string;
  created_at?: string;
}

export interface DBPlanSnapshot {
  id: string;
  apartment_id: string;
  version_name: string;
  item_count: number;
  total_cost: number;
  items: DBMaintenanceItem[];
  created_at?: string;
}
