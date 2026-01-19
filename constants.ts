
import { Apartment, MaintenanceItem, MaintenanceStandard, MaintenanceCategory } from './types';

// 초기 시연 및 DB 데이터 부재 시를 위한 시드 데이터 (Flat 필드 스키마 적용)
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
    lastRepairYear: 0, // 0으로 설정하여 단지 승인일을 따르도록 유도
    material: 19000,
    labor: 16000,
    expense: 3500
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
    lastRepairYear: 0,
    material: 14000,
    labor: 17500,
    expense: 3500
  }
];

export const APARTMENTS: Apartment[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: '꿈동산 아파트 (샘플)',
    approvalDate: '2015-03-12',
    planPeriod: 40,
    inflationRate: 2.5, 
    unitTypes: [
      { id: '22222222-2222-2222-2222-222222222221', type: '84A', privateArea: 84.9, commonArea: 25.1, households: 200 }
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

/**
 * 표준 데이터를 바탕으로 특정 단지의 초기 수선 항목을 생성합니다.
 * 하드코딩된 연도 대신 단지의 사용승인일을 기준으로 차기 수선년도를 계산합니다.
 */
export const generateInitialItemsForApt = (apt: Apartment, standards: MaintenanceStandard[]): MaintenanceItem[] => {
  const approvalYear = new Date(apt.approvalDate).getFullYear();
  
  return standards.map(std => {
    const cycle = Math.max(1, std.cycleYears);
    const repairCount = Math.round((apt.planPeriod / cycle) * (std.repairRate / 100) * 10) / 10;
    
    // 최종 수선년도가 0이거나 없을 경우 사용승인일로 대체
    const lastRepair = std.lastRepairYear && std.lastRepairYear > 0 
      ? std.lastRepairYear 
      : approvalYear;
      
    return {
      ...std,
      id: crypto.randomUUID(),
      apartmentId: apt.id,
      mainCategory: std.mainCategory || std.category || '건물외부',
      item: std.item || '미지정 항목',
      facilitySize: 0, 
      quantity: repairCount,
      lastRepairYear: lastRepair,
      nextRepairYear: lastRepair + cycle,
      estimatedCost: 0,
      isExecuted: false,
      status: '정상'
    };
  });
};
