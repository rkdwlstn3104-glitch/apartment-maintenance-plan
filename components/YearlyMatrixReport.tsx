
import React, { useMemo } from 'react';
import { MaintenanceItem, Apartment } from '../types';

interface YearlyMatrixReportProps {
  items: MaintenanceItem[];
  apartment: Apartment;
  startYear: number;
  customStartYear?: number;
  customEndYear?: number;
}

const CATEGORY_GROUPS = [
  { id: 1, name: '건물외부', categories: ['건물외부'] },
  { id: 2, name: '건물내부', categories: ['건물내부'] },
  { id: 3, name: '전기, 소화, 승강기 및 지능형 홈네트워크 설비', categories: ['전기/소방', '승강기', '홈네트워크'] },
  { id: 4, name: '급수, 가스, 배수, 환기설비', categories: ['급수/배수'] },
  { id: 5, name: '난방 및 급탕설비', categories: ['난방/급탕'] },
  { id: 6, name: '옥외 부대시설 및 옥외 복리시설', categories: ['옥외부대'] },
];

/**
 * 특정 연도에 발생하는 수선비용을 마스터 계획표의 'estimatedCost(만원)' 기준으로 산출합니다.
 */
const getAllocatedCostInYearManWon = (item: MaintenanceItem, year: number, startYear: number) => {
  const cycle = Math.max(1, Number(item.cycleYears));
  const last = Number(item.lastRepairYear) || (startYear - 1);
  const quantity = Number(item.quantity) || 0;
  const totalEstimatedCostManWon = Number(item.estimatedCost) || 0;

  if (quantity <= 0 || totalEstimatedCostManWon <= 0) return 0;

  if (year > last && (year - last) % cycle === 0) {
    // 마스터 데이터의 총액을 수선횟수로 나누어 배분 (단위: 만원)
    return totalEstimatedCostManWon / quantity;
  }
  return 0;
};

const YearlyMatrixReport: React.FC<YearlyMatrixReportProps> = ({ items, apartment, startYear, customStartYear, customEndYear }) => {
  const planPeriod = apartment.planPeriod || 40;
  const planEndYear = startYear + planPeriod - 1;

  // 출력 시작 연도 결정 (Props가 있으면 사용, 없으면 자동 계산)
  const effectiveGridStartYear = useMemo(() => {
    if (customStartYear) return customStartYear;
    
    const lastYears = items.map(i => Number(i.lastRepairYear) || 0).filter(y => y > 0);
    const maxLast = lastYears.length > 0 ? Math.max(...lastYears) : (startYear - 1);
    return Math.max(startYear, maxLast + 1);
  }, [items, startYear, customStartYear]);

  // 출력 종료 연도 결정
  const effectiveGridEndYear = useMemo(() => {
    if (customEndYear) return customEndYear;
    return planEndYear;
  }, [planEndYear, customEndYear]);

  // 가시적 연도 리스트 생성
  const visibleYears = useMemo(() => {
    const years: number[] = [];
    for (let y = effectiveGridStartYear; y <= effectiveGridEndYear; y++) {
      years.push(y);
    }
    return years;
  }, [effectiveGridStartYear, effectiveGridEndYear]);

  // 연도를 20개 단위로 청킹 (A3 가로 인쇄 최적화)
  const yearChunks = useMemo(() => {
    const chunks: number[][] = [];
    for (let i = 0; i < visibleYears.length; i += 20) {
      chunks.push(visibleYears.slice(i, i + 20));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [visibleYears]);

  const colWidths = {
    subCategory: '4%',
    item: '8.5%',
    method: '2%',
    cycle: '2%',
    rate: '2%',
    last: '3%',
    oneTime: '3%',
    totalPlan: '3.5%',
    remarks: '8%',
    year: '3.1%'
  };

  return (
    <div className="bg-white text-slate-900" style={{ width: '100%', minHeight: '210mm' }}>
      {yearChunks.map((years, chunkIdx) => {
        const pageProcessedGroups = CATEGORY_GROUPS.map(group => {
          const groupItems = items.filter(item => group.categories.includes(item.mainCategory));
          const yearlyCosts = years.map(year => 
            groupItems.reduce((sum, item) => sum + getAllocatedCostInYearManWon(item, year, startYear), 0)
          );
          // 그룹별 총 예산은 마스터의 estimatedCost 합계
          const globalTotalForItems = groupItems.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
          return { ...group, items: groupItems, globalTotal: globalTotalForItems, yearlyCosts };
        });

        const pageGrandYearlyTotals = years.map((_, i) => pageProcessedGroups.reduce((sum, g) => sum + g.yearlyCosts[i], 0));
        
        return (
          <div key={chunkIdx} className="p-8 page-break-after-always" style={{ pageBreakAfter: 'always', margin: '0 auto' }}>
            <div className="mb-4 flex justify-between items-end border-b-2 border-black pb-2">
              <div className="text-[8.5pt] font-black text-slate-500 w-[20%]">
                출력구간: {effectiveGridStartYear}~{effectiveGridEndYear}년<br/>
                계획종료: {planEndYear}년
              </div>
              <h1 className="text-2xl font-black text-center flex-1">
                {apartment.name} 연도별 집행계획표
              </h1>
              <div className="w-[20%]"></div>
            </div>

            <table className="w-full border-collapse border-2 border-black table-fixed" style={{ fontSize: '7pt' }}>
              <thead>
                <tr className="bg-slate-50 h-10">
                  <th style={{ width: colWidths.subCategory }} className="border border-black" rowSpan={2}>중분류</th>
                  <th style={{ width: colWidths.item }} className="border border-black" rowSpan={2}>공사종별</th>
                  <th style={{ width: colWidths.method }} className="border border-black" rowSpan={2}>방법</th>
                  <th style={{ width: colWidths.cycle }} className="border border-black" rowSpan={2}>주기</th>
                  <th style={{ width: colWidths.rate }} className="border border-black" rowSpan={2}>수선율</th>
                  <th style={{ width: colWidths.last }} className="border border-black" rowSpan={2}>최종</th>
                  <th style={{ width: colWidths.oneTime }} className="border border-black" rowSpan={2}>1회비용<br/>(만원)</th>
                  <th style={{ width: colWidths.totalPlan }} className="border border-black" rowSpan={2}>누적계획<br/>(만원)</th>
                  <th style={{ width: colWidths.remarks }} className="border border-black" rowSpan={2}>비고</th>
                  <th className="border border-black" colSpan={20}>
                    연도별 수선계획 집행 금액 (단위: 만원)
                  </th>
                </tr>
                <tr className="bg-slate-50 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <th key={i} style={{ width: colWidths.year }} className="border border-black font-black bg-white">
                      {years[i] || ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageProcessedGroups.map(group => group.items.length > 0 && (
                  <React.Fragment key={group.id}>
                    <tr className="h-8 bg-slate-50/50 font-black border-t-[1.5px] border-black">
                      <td className="border border-black text-left px-2" colSpan={6}>
                        ■ {group.name}
                      </td>
                      <td className="border border-black text-right px-1 font-mono text-[6.5pt]">
                        -
                      </td>
                      <td className="border border-black text-right px-1 font-mono bg-amber-50/50">
                        {Math.round(group.globalTotal).toLocaleString()}
                      </td>
                      <td className="border border-black bg-slate-50"></td>
                      {Array.from({ length: 20 }).map((_, idx) => (
                        <td key={idx} className="border border-black text-right px-1 font-mono text-blue-700 bg-blue-50/5">
                          {group.yearlyCosts[idx] > 0 ? Math.round(group.yearlyCosts[idx]).toLocaleString() : ''}
                        </td>
                      ))}
                    </tr>
                    {group.items.map(item => {
                      const costs = years.map(y => getAllocatedCostInYearManWon(item, y, startYear));
                      const totalEstimatedCost = Number(item.estimatedCost) || 0;
                      const quantity = Number(item.quantity) || 1;
                      const oneTimeManWon = quantity > 0 ? totalEstimatedCost / quantity : 0;
                      
                      return (
                        <tr key={item.id} className="h-auto text-center hover:bg-slate-50 transition-colors">
                          <td className="border border-black text-slate-400 px-1 truncate py-1">{item.subCategory}</td>
                          <td className="border border-black text-left px-1.5 truncate font-bold py-1">{item.item}</td>
                          <td className="border border-black text-slate-500 py-1">{item.method.substring(0,2)}</td>
                          <td className="border border-black py-1">{item.cycleYears}</td>
                          <td className="border border-black py-1">{item.repairRate}</td>
                          <td className="border border-black text-blue-300 font-mono py-1">
                            {item.lastRepairYear || (startYear - 1)}
                          </td>
                          <td className="border border-black text-right px-1 font-mono text-slate-500 py-1">
                            {Math.round(oneTimeManWon).toLocaleString()}
                          </td>
                          <td className="border border-black text-right px-1 font-black bg-slate-50/20 py-1">
                            {Math.round(totalEstimatedCost).toLocaleString()}
                          </td>
                          <td className="border border-black text-left px-1.5 text-[6.5pt] text-slate-600 whitespace-normal break-all leading-tight py-1" title={item.remarks}>
                            {item.remarks || ''}
                          </td>
                          {Array.from({ length: 20 }).map((_, idx) => (
                            <td key={idx} className={`border border-black text-right px-1 font-mono ${costs[idx] > 0 ? 'text-blue-600 font-black' : 'text-slate-100'}`}>
                              {costs[idx] > 0 ? Math.round(costs[idx]).toLocaleString() : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                <tr className="bg-slate-900 text-white h-10 font-black text-center border-t-2 border-black">
                  <td className="border border-black" colSpan={7}>합계 (단위: 만원)</td>
                  <td className="border border-black text-right px-1 text-emerald-400">
                    {Math.round(items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0)).toLocaleString()}
                  </td>
                  <td className="border border-black"></td>
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <td key={idx} className="border border-black text-right px-1 font-mono text-blue-300 bg-slate-800">
                      {pageGrandYearlyTotals[idx] > 0 ? Math.round(pageGrandYearlyTotals[idx]).toLocaleString() : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default YearlyMatrixReport;
