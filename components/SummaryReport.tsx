
import React, { useMemo } from 'react';
import { MaintenanceItem, Apartment } from '../types';

interface SummaryReportProps {
  items: MaintenanceItem[];
  apartment: Apartment;
  startYear: number;
}

const CATEGORY_GROUPS = [
  { id: 1, name: '건물외부', categories: ['건물외부'] },
  { id: 2, name: '건물내부', categories: ['건물내부'] },
  { id: 3, name: '전기, 소화, 승강기 및 지능형 홈네트워크 설비', categories: ['전기/소방', '승강기', '홈네트워크'] },
  { id: 4, name: '급수, 가스, 배수, 환기설비', categories: ['급수/배수'] },
  { id: 5, name: '난방 및 급탕설비', categories: ['난방/급탕'] },
  { id: 6, name: '옥외 부대시설 및 옥외 복리시설', categories: ['옥외부대'] },
];

const SummaryReport: React.FC<SummaryReportProps> = ({ items, apartment, startYear }) => {
  const planPeriod = apartment.planPeriod || 40;
  const planMonths = planPeriod * 12;
  
  const totalHouseholds = useMemo(() => 
    apartment.unitTypes?.reduce((sum, ut) => sum + (Number(ut.households) || 0), 0) || 0
  , [apartment]);

  const totalSupplyArea = useMemo(() => 
    apartment.unitTypes?.reduce((sum, ut) => sum + ((Number(ut.privateArea) + Number(ut.supplyArea)) * Number(ut.households) || 0), 0) || 0
  , [apartment]);

  const section1Data = useMemo(() => {
    return CATEGORY_GROUPS.map(group => {
      // 1. 해당 그룹에 속하는 항목 필터링
      const groupItems = items.filter(item => group.categories.includes(item.mainCategory));
      
      // 2. 이미 계산된 estimatedCost(만원 단위)를 합산 (계산 로직 중복 및 불일치 방지)
      const totalCost = groupItems.reduce((sum, item) => {
        const costManWon = Number(item.estimatedCost) || 0;
        return sum + (costManWon * 10000);
      }, 0);

      const monthlyAccrual = totalCost / planMonths;
      const m2Price = totalSupplyArea > 0 ? monthlyAccrual / totalSupplyArea : 0;
      const householdPrice = totalHouseholds > 0 ? monthlyAccrual / totalHouseholds : 0;

      return { ...group, totalCost, monthlyAccrual, m2Price, householdPrice };
    });
  }, [items, planMonths, totalSupplyArea, totalHouseholds]);

  const totalAllCost = useMemo(() => section1Data.reduce((s, g) => s + g.totalCost, 0), [section1Data]);

  const section2DetailedData = useMemo(() => {
    if (!apartment.annualRates || apartment.annualRates.length === 0) return [];
    
    return apartment.annualRates.map(ar => {
      const [startYearStr, startMonthStr] = (ar.startPeriod || "2025-01").split('-');
      const [endYearStr, endMonthStr] = (ar.endPeriod || "2035-12").split('-');
      const start = new Date(parseInt(startYearStr), parseInt(startMonthStr) - 1, 1);
      const end = new Date(parseInt(endYearStr), parseInt(endMonthStr) - 1, 1);
      
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      const years = months / 12; 
      const intervalRate = (Number(ar.rate) || 0) / 100;

      const categoryBreakdown = section1Data.map(cat => {
        // 해당 기간 적립해야 할 금액 = 전체 공정 총액 * 구간 적립율
        const numerator = cat.totalCost * intervalRate;
        // 분모: 해당 면적 * 12개월 * 해당 기간(년)
        const denominator = totalSupplyArea * 12 * years;
        
        const m2Price = denominator > 0 ? numerator / denominator : 0;
        const monthlyAccrual = m2Price * totalSupplyArea;
        const householdPrice = totalHouseholds > 0 ? monthlyAccrual / totalHouseholds : 0;

        return {
          categoryName: cat.name,
          periodCost: numerator,
          monthlyAccrual,
          m2Price,
          householdPrice
        };
      });

      const intervalTotalCost = totalAllCost * intervalRate;
      const intervalM2Price = (totalSupplyArea * 12 * years) > 0 
        ? intervalTotalCost / (totalSupplyArea * 12 * years) 
        : 0;

      return {
        ...ar,
        months,
        years,
        categoryBreakdown,
        intervalTotalCost,
        intervalM2Price,
        intervalMonthlyAccrual: intervalM2Price * totalSupplyArea
      };
    });
  }, [apartment.annualRates, section1Data, totalAllCost, totalSupplyArea, totalHouseholds]);

  return (
    <div className="mx-auto bg-white min-h-screen text-slate-900 leading-tight p-8 md:p-16 max-w-[1000px] shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-3">{apartment.name} 장기수선계획 총괄 요약표</h1>
        <div className="h-0.5 border-b-2 border-double border-black w-full"></div>
      </div>

      <div className="mb-10 border-2 border-black rounded-[1.5rem] p-6 grid grid-cols-4 text-center items-center bg-slate-50/50">
        <div className="border-r border-slate-200">
          <p className="text-slate-400 text-[9px] font-black mb-1 uppercase tracking-tighter">단지명</p>
          <p className="text-sm font-black">{apartment.name}</p>
        </div>
        <div className="border-r border-slate-200">
          <p className="text-slate-400 text-[9px] font-black mb-1 uppercase tracking-tighter">총 세대수</p>
          <p className="text-sm font-black">{totalHouseholds.toLocaleString()} 세대</p>
        </div>
        <div className="border-r border-slate-200">
          <p className="text-slate-400 text-[9px] font-black mb-1 uppercase tracking-tighter">총 공급면적</p>
          <p className="text-sm font-black">{totalSupplyArea.toLocaleString()} m²</p>
        </div>
        <div>
          <p className="text-slate-400 text-[9px] font-black mb-1 uppercase tracking-tighter">계획 기간</p>
          <p className="text-sm font-black text-blue-600">{planPeriod}년 ({startYear} ~ {startYear + planPeriod - 1})</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-base font-black flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-slate-900"></div>
          1. 공정별 수선계획 요약
        </h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead className="bg-[#0f172a] text-white">
            <tr className="h-10">
              <th className="border border-black w-10">번호</th>
              <th className="border border-black">공정 대분류</th>
              <th className="border border-black w-32">계획금액 합계 (원)</th>
              <th className="border border-black w-36">월 적립금액</th>
              <th className="border border-black w-20">m² 단가</th>
              <th className="border border-black w-28">월 세대 단가</th>
            </tr>
          </thead>
          <tbody>
            {section1Data.map((g, i) => (
              <tr key={g.id} className="h-9 text-center font-bold">
                <td className="border border-black bg-slate-50">{i + 1}</td>
                <td className="border border-black text-left px-3 font-medium">{g.name}</td>
                <td className="border border-black text-right px-3 font-mono">{Math.round(g.totalCost).toLocaleString()}</td>
                <td className="border border-black text-right px-3 font-mono text-blue-600">{Math.round(g.monthlyAccrual).toLocaleString()}</td>
                <td className="border border-black text-right px-3 font-mono text-slate-500">{g.m2Price.toFixed(2)}</td>
                <td className="border border-black text-right px-3 font-mono">{Math.round(g.householdPrice).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="h-10 bg-slate-50 font-black text-center">
              <td colSpan={2} className="border border-black">전체 합계</td>
              <td className="border border-black text-right px-3">{Math.round(totalAllCost).toLocaleString()}</td>
              <td className="border border-black text-right px-3 text-blue-600">{(totalAllCost / planMonths).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
              <td className="border border-black text-right px-3 text-slate-400">{(totalAllCost / planMonths / (totalSupplyArea || 1)).toFixed(2)}</td>
              <td className="border border-black text-right px-3">{(totalAllCost / planMonths / (totalHouseholds || 1)).toLocaleString(undefined, {maximumFractionDigits:0})}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-12">
        <h2 className="text-base font-black flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-slate-900"></div>
          2. 장기수선충당금 적립 계획 (구간별/공정별 상세)
        </h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead className="bg-[#0f172a] text-white">
            <tr className="h-10">
              <th className="border border-black w-10">번호</th>
              <th className="border border-black">적립 구간 / 공정 대분류</th>
              <th className="border border-black w-32">구간 계획금액 (원)</th>
              <th className="border border-black w-36">월 적립금액 (원)</th>
              <th className="border border-black w-20">월간 m² 단가</th>
              <th className="border border-black w-28">월 세대 단가 (원)</th>
            </tr>
          </thead>
          <tbody>
            {section2DetailedData.length > 0 ? (
              section2DetailedData.map((interval, intIdx) => (
                <React.Fragment key={interval.id}>
                  <tr className="h-10 bg-slate-800 text-white font-black">
                    <td className="border border-black text-center">{intIdx + 1}</td>
                    <td className="border border-black px-4" colSpan={5}>
                      적립 구간: <span className="text-blue-300">{interval.startPeriod} ~ {interval.endPeriod}</span> ({interval.months}개월) 
                      <span className="mx-4 text-slate-400">|</span> 
                      적립 요율: <span className="text-emerald-400 text-[11px]">{interval.rate}%</span>
                    </td>
                  </tr>
                  {interval.categoryBreakdown.map((cat, catIdx) => (
                    <tr key={catIdx} className="h-8 text-center font-bold">
                      <td className="border border-black bg-slate-50 text-slate-400">{intIdx + 1}-{catIdx + 1}</td>
                      <td className="border border-black text-left px-4 font-medium text-slate-700">{cat.categoryName}</td>
                      <td className="border border-black text-right px-3 font-mono">{Math.round(cat.periodCost).toLocaleString()}</td>
                      <td className="border border-black text-right px-3 font-mono text-blue-600">{Math.round(cat.monthlyAccrual).toLocaleString()}</td>
                      <td className="border border-black text-right px-3 font-mono text-slate-300">{cat.m2Price.toFixed(2)}</td>
                      <td className="border border-black text-right px-3 font-mono">{Math.round(cat.householdPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="h-10 bg-blue-50/50 font-black text-center">
                    <td colSpan={2} className="border border-black text-blue-800">구간 소계</td>
                    <td className="border border-black text-right px-3">{Math.round(interval.intervalTotalCost).toLocaleString()}</td>
                    <td className="border border-black text-right px-3 text-blue-600">{Math.round(interval.intervalMonthlyAccrual).toLocaleString()}</td>
                    <td className="border border-black text-right px-3 text-emerald-600 bg-emerald-50/50">{interval.intervalM2Price.toFixed(2)}</td>
                    <td className="border border-black text-right px-3">{Math.round(interval.intervalMonthlyAccrual / (totalHouseholds || 1)).toLocaleString()}</td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="h-20 text-center text-slate-400 italic font-bold">
                  단지 정보 관리에서 '연차별 충당금 적립요율'을 설정해야 상세 계획이 표시됩니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10 p-5 border border-slate-200 rounded-[1.5rem] bg-slate-50/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fas fa-calculator text-blue-500"></i> 산출 근거 및 공식
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-800 italic">
          <div className="text-sm font-bold">월간 m²당 단가 =</div>
          <div className="flex flex-col items-center">
            <div className="px-4 pb-0.5 border-b border-slate-900 text-sm font-bold text-center">
              수선비 총액 × 해당 기간 적립요율
            </div>
            <div className="px-4 pt-0.5 text-sm font-bold text-center">
              총 공급면적 × 12 × 적립요율 적용기간(년)
            </div>
          </div>
        </div>
        <div className="mt-4 text-[8px] text-slate-400 font-medium leading-relaxed text-center">
          * 본 공식은 공동주택관리법 시행규칙 [별표 1의 2] '장기수선충당금의 적립금액 산정방법'에 근거합니다.<br/>
          * 수선비 총액은 계획기간 중의 수선비 총합계액(물가상승률 반영)을 의미합니다.
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center text-[9px] text-slate-400 font-medium border-t border-slate-100 pt-3">
        <p>* 모든 단가 산정은 공동주택관리법 시행규칙의 법정 산정 공식을 준수합니다.</p>
        <p className="italic text-slate-300">아파트 관리 Pro 시스템 생성 보고서</p>
      </div>
    </div>
  );
};

export default SummaryReport;
