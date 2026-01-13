
import { Apartment, MaintenanceItem, MaintenanceStandard, MaintenanceCategory } from './types';

// 초기 시연 및 DB가 비었을 때를 위한 시드 데이터 (Single Source of Truth는 DB가 됨)
export const DEFAULT_SEED_STANDARDS: MaintenanceStandard[] = [
  {
    id: crypto.randomUUID(),
    code: '01-01',
    mainCategory: '건물외부',
    subCategory: '지붕',
    category: '건물외부',
    item: '아스팔트 싱글 잇기',
    method: '전면교체',
    unit: 'm2',
    unitPrice: 3.85,
    repairRate: 100,
    cycleYears: 20,
    lastRepairYear: 2025,
    breakdown: { material: 19000, labor: 16000, expense: 3500 }
  },
  {
    id: crypto.randomUUID(),
    code: '01-06',
    mainCategory: '건물외부',
    subCategory: '지붕',
    category: '건물외부',
    item: '지붕 방수층 (우레탄)',
    method: '전면수리',
    unit: 'm2',
    unitPrice: 3.5,
    repairRate: 100,
    cycleYears: 15,
    lastRepairYear: 2025,
    breakdown: { material: 14000, labor: 17500, expense: 3500 }
  },
  {
    id: crypto.randomUUID(),
    code: '02-01',
    mainCategory: '건물외부',
    subCategory: '외부',
    category: '건물외부',
    item: '외벽 도장 (수성페인트)',
    method: '전면도장',
    unit: 'm2',
    unitPrice: 0.65,
    repairRate: 100,
    cycleYears: 6,
    lastRepairYear: 2025,
    breakdown: { material: 2600, labor: 3200, expense: 700 }
  },
  {
    id: crypto.randomUUID(),
    code: '06-01',
    mainCategory: '전기/소방',
    subCategory: '전기설비',
    category: '전기/소방',
    item: '변압기',
    method: '전면교체',
    unit: 'kVA',
    unitPrice: 2.5,
    repairRate: 100,
    cycleYears: 25,
    lastRepairYear: 2025,
    breakdown: { material: 15000, labor: 8000, expense: 2000 }
  }
];

export const APARTMENTS: Apartment[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: '꿈동산 아파트',
    approvalDate: '2015-03-12',
    planPeriod: 40,
    inflationRate: 2.5, 
    unitTypes: [
      { id: '22222222-2222-2222-2222-222222222221', type: 'A', privateArea: 84.9, supplyArea: 25.1, households: 200 },
      { id: '22222222-2222-2222-2222-222222222222', type: 'B', privateArea: 59.9, supplyArea: 18.5, households: 300 }
    ],
    annualRates: []
  }
];

export const CATEGORIES: MaintenanceCategory[] = [
  '건물외부', '건물내부', '전기/소방', '승강기', '홈네트워크', '급수/배수', '난방/급탕', '옥외부대'
];

export const SUB_CATEGORIES_MAP: Record<MaintenanceCategory, string[]> = {
  '건물외부': ['지붕', '외부', '창호'],
  '건물내부': ['천장', '벽체', '바닥'],
  '전기/소방': ['전기설비', '소방설비'],
  '승강기': ['승강기'],
  '홈네트워크': ['지능형홈네트워크'],
  '급수/배수': ['급수설비', '배수설비'],
  '난방/급탕': ['난방설비', '급탕설비'],
  '옥외부대': ['복리시설', '도로및주차장', '조경시설']
};

export const SUB_CATEGORY_CODES: Record<string, string> = {
  '지붕': '01', '외부': '02', '창호': '03', '천장': '04', '벽체': '05', '바닥': '06',
  '전기설비': '06', '소방설비': '07', '승강기': '09', '지능형홈네트워크': '10',
  '급수설비': '11', '배수설비': '12', '난방설비': '15', '급탕설비': '16',
  '복리시설': '18', '도로및주차장': '19', '조경시설': '20'
};

export const REPAIR_METHODS = ['전면교체', '부분수리', '전면수리', '전면도장', '부분수선'];
export const UNITS = ['m2', 'm', '개', '개소', 'kVA', '면', 'kW', '회로', '대', '식', '세대', 'm3', 'kcal'];

// 동적 기준 데이터를 기반으로 항목을 생성하는 핵심 함수
export const generateInitialItemsForApt = (apt: Apartment, standards: MaintenanceStandard[]): MaintenanceItem[] => {
  return standards.map(std => {
    const cycle = Math.max(1, std.cycleYears);
    const repairCount = Math.round((apt.planPeriod / cycle) * (std.repairRate / 100) * 10) / 10;
    
    return {
      ...std,
      id: crypto.randomUUID(),
      apartmentId: apt.id,
      facilitySize: 0, 
      quantity: repairCount,
      lastRepairYear: std.lastRepairYear || 2025,
      nextRepairYear: (std.lastRepairYear || 2025) + cycle,
      estimatedCost: 0,
      status: '정상',
      isManual: false
    };
  });
};

export const getInitialItems = (): MaintenanceItem[] => {
  return generateInitialItemsForApt(APARTMENTS[0], DEFAULT_SEED_STANDARDS);
};
