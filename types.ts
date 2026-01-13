
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
  detail?: string; // DB 스키마 불일치로 인해 선택적 속성으로 변경
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

export interface AISuggestion {
  itemName: string;
  reason: string;
  complianceNote: string;
  recommendedYear: number;
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
