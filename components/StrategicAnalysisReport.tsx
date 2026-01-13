
import React, { useMemo } from 'react';
import { MaintenanceItem, Apartment } from '../types';

// Define the missing interface for component props
interface StrategicAnalysisReportProps {
  items: MaintenanceItem[];
  apartment: Apartment;
  startYear: number;
}

/**
 * 연도별 지출 흐름 분석을 위한 함수.
 * 마스터 계획의 'estimatedCost(만원)'를 'quantity(수선횟수)'로 나누어 해당 연도에 배분합니다.
 * 이를 통해 전체 합계가 마스터 계획표와 완벽히 일치하게 됩니다.
 */
const getAllocatedCostInYear = (item: MaintenanceItem, year: number, startYear: number) => {
  const cycle = Math.max(1, Number(item.cycleYears));
  const last = Number(item.lastRepairYear) || (startYear - 1);
  const quantity = Number(item.quantity) || 0;
  const totalEstimatedCostManWon = Number(item.estimatedCost) || 0;

  if (quantity <= 0 || totalEstimatedCostManWon <= 0) return 0;

  // 수선 주기에 해당하는 연도인지 확인
  if (year > last && (year - last) % cycle === 0) {
    // 마스터의 총 예산을 횟수로 나누어 균등 배분 (단위: 만원)
    return (totalEstimatedCostManWon / quantity) * 10000; // 원 단위 반환
  }
  return 0;
};

const StrategicAnalysisReport: React.FC<StrategicAnalysisReportProps> = ({ items, apartment, startYear }) => {
  const planPeriod = apartment.planPeriod || 40;

  // 분석 시작 연도 설정 (최종 수선일 다음해 또는 계획 시작일 중 늦은 날)
  const effectiveAnalysisStartYear = useMemo(() => {
    const lastYears = items.map(i => Number(i.lastRepairYear) || 0).filter(y => y > 0);
    const maxLast = lastYears.length > 0 ? Math.max(...lastYears) : (startYear - 1);
    return Math.max(startYear, maxLast + 1);
  }, [items, startYear]);

  // 상위 10개 항목 (마스터의 estimatedCost 기준)
  const topItems = useMemo(() => {
    return items
      .map(item => ({ 
        ...item, 
        totalCostWon: (Number(item.estimatedCost) || 0) * 10000 
      }))
      .sort((a, b) => b.totalCostWon - a.totalCostWon)
      .slice(0, 10);
  }, [items]);

  // 단기 자금 흐름 (향후 10년)
  const shortTermFlow = useMemo(() => {
    const flows = [];
    for (let i = 0; i < 10; i++) {
      const year = effectiveAnalysisStartYear + i;
      const yearTotalWon = items.reduce((sum, item) => sum + getAllocatedCostInYear(item, year, startYear), 0);
      flows.push({ year, costManWon: Math.round(yearTotalWon / 10000) });
    }
    return flows;
  }, [items, effectiveAnalysisStartYear, startYear]);

  // 공정별 통계 (마스터의 estimatedCost 기준)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    items.forEach(item => {
      const costWon = (Number(item.estimatedCost) || 0) * 10000;
      stats[item.mainCategory] = (stats[item.mainCategory] || 0) + costWon;
    });
    
    const totalWon = Object.values(stats).reduce((a, b) => a + b, 0);
    
    return Object.entries(stats).map(([name, costWon]) => ({
      name,
      cost: costWon,
      percent: totalWon > 0 ? (costWon / totalWon) * 100 : 0
    })).sort((a, b) => b.cost - a.cost);
  }, [items]);

  const totalBudgetWon = useMemo(() => 
    items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0) * 10000
  , [items]);

  return (
    <div className="p-16 bg-white min-h-screen max-w-[1000px] mx-auto text-slate-900 leading-tight">
      <div className="border-b-[3px] border-black pb-6 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">[{apartment.name}] 예산 집행 전략 분석 리포트</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">단지코드</p>
          <p className="text-base font-black text-slate-500">{apartment.id.substring(0,8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter">총 계획 예산 규모</p>
          <p className="text-2xl font-black text-blue-700">₩{(totalBudgetWon / 100000000).toFixed(2)}억</p>
          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter italic">물가상승률: {apartment.inflationRate}% 반영됨</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter">상위 10개 항목 비중</p>
          <p className="text-2xl font-black text-slate-900">
            {totalBudgetWon > 0 ? ((topItems.reduce((s, i) => s + i.totalCostWon, 0) / totalBudgetWon) * 100).toFixed(1) : '0'}%
          </p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter">연평균 집행액</p>
          <p className="text-2xl font-black text-emerald-600">₩{(totalBudgetWon / planPeriod / 10000).toLocaleString(undefined, {maximumFractionDigits:0})}만</p>
        </div>
      </div>

      <div className="mb-14">
        <h2 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest border-l-[4px] border-slate-900 pl-3">
          1. 단기 자금 흐름 분석 ({effectiveAnalysisStartYear}-{effectiveAnalysisStartYear + 9})
        </h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead className="bg-slate-900 text-white">
            <tr className="h-9">
              {shortTermFlow.map(f => (
                <th key={f.year} className="border border-black font-black">{f.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="h-10 text-center font-bold">
              {shortTermFlow.map(f => (
                <td key={f.year} className={`border border-black px-1 font-mono ${f.costManWon > (totalBudgetWon / planPeriod / 10000) * 2 ? 'bg-red-50 text-red-600' : ''}`}>
                  {f.costManWon > 0 ? f.costManWon.toLocaleString() : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="text-[9px] text-slate-400 mt-2 font-medium leading-relaxed italic">
          * 붉은 색상은 평균 대비 2배 이상의 지출이 예상되는 해로 자금 확보 전략이 필요합니다. (단위: 만원)
        </p>
      </div>

      <div className="mb-14">
        <h2 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest border-l-[4px] border-slate-900 pl-3">
          2. 주요 집중 관리 대상 공사항목
        </h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead className="bg-slate-100 font-black">
            <tr className="h-10">
              <th className="border border-black w-12">순위</th>
              <th className="border border-black text-left px-4">공사항목</th>
              <th className="border border-black w-24">공정분류</th>
              <th className="border border-black w-20">주기(년)</th>
              <th className="border border-black w-32">누적 계획금액(원)</th>
              <th className="border border-black w-20">예산 비중</th>
            </tr>
          </thead>
          <tbody>
            {topItems.map((item, idx) => (
              <tr key={idx} className="h-9 text-center">
                <td className="border border-black font-black bg-slate-50">{idx + 1}</td>
                <td className="border border-black text-left px-4 font-bold">{item.item}</td>
                <td className="border border-black text-slate-500 text-[9px]">{item.mainCategory}</td>
                <td className="border border-black">{item.cycleYears}</td>
                <td className="border border-black text-right px-3 font-mono font-black text-blue-700 bg-blue-50/20">
                  {Math.round(item.totalCostWon).toLocaleString()}
                </td>
                <td className="border border-black font-bold">
                  {totalBudgetWon > 0 ? ((item.totalCostWon / totalBudgetWon) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <h2 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest border-l-[4px] border-slate-900 pl-3">
            3. 공정별 예산 배분 비중
          </h2>
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead className="bg-slate-100">
              <tr className="h-8">
                <th className="border border-black text-left px-3">공정 카테고리</th>
                <th className="border border-black w-20">비중 (%)</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat, idx) => (
                <tr key={idx} className="h-8">
                  <td className="border border-black px-3 font-bold">{cat.name}</td>
                  <td className="border border-black px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${cat.percent}%` }}></div>
                      </div>
                      <span className="w-8 text-right font-mono">{cat.percent.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-blue-900 text-white p-8 rounded-[2.5rem] flex flex-col justify-center shadow-xl">
           <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-4">관리 전략 제언</p>
           <p className="text-sm font-medium leading-relaxed italic opacity-90">
             "본 리포트 분석 결과, 마스터 계획표의 총 예산 ₩{(totalBudgetWon / 100000000).toFixed(2)}억 원을 기준으로 고액 지출이 집중된 공정에 대해 경쟁입찰 및 전문 감리를 도입하여 비용을 5~10% 절감할 경우, 전체 장기수선충당금의 약 ₩{Math.round(totalBudgetWon * 0.05 / 10000).toLocaleString()}만 원을 절약할 수 있는 경제적 효과가 기대됩니다."
           </p>
        </div>
      </div>

      <div className="mt-16 text-center text-[9px] text-slate-300 font-black uppercase tracking-widest border-t border-slate-100 pt-6">
        문서보안 | {apartment.name} 관리 전략 분석팀
      </div>
    </div>
  );
};

export default StrategicAnalysisReport;
