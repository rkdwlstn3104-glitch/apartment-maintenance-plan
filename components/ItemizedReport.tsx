
import React from 'react';
import { MaintenanceItem, Apartment } from '../types';

interface ItemizedReportProps {
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

const ItemizedReport: React.FC<ItemizedReportProps> = ({ items, apartment, startYear }) => {
  const planPeriod = apartment.planPeriod || 40;
  const endYear = startYear + planPeriod - 1;

  return (
    <div className="p-16 bg-white min-h-screen max-w-[1000px] mx-auto text-slate-900 leading-tight">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-black mb-4 tracking-tighter inline-block border-b-[4px] border-slate-900 pb-2">
          {apartment.name} 공종별 상세 내역서
        </h1>
        <p className="text-lg font-bold text-slate-600 mt-4">
          수선계획기간 : <span className="text-blue-600">{startYear}년 ~ {endYear}년 ({planPeriod}년간)</span>
        </p>
      </div>

      {CATEGORY_GROUPS.map(group => {
        const groupItems = items.filter(item => group.categories.includes(item.mainCategory));
        if (groupItems.length === 0) return null;

        return (
          <div key={group.id} className="mb-14">
            <div className="bg-[#0f172a] text-white px-5 py-3 font-black text-base flex justify-between items-center rounded-t-sm">
              <span>■ {group.name}</span>
            </div>
            <table className="w-full border-collapse border-2 border-black text-[11px]">
              <thead className="bg-slate-100 font-black">
                <tr className="h-11">
                  <th className="border border-black px-2">공사종별</th>
                  <th className="border border-black w-20">방법</th>
                  <th className="border border-black w-14">주기</th>
                  <th className="border border-black w-16">수선횟수</th>
                  <th className="border border-black w-16">수량</th>
                  <th className="border border-black w-14">단위</th>
                  <th className="border border-black w-28">조정단가 (원)</th>
                  <th className="border border-black w-32">수선금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map(item => {
                  const pvWon = Math.round((Number(item.unitPrice) || 0) * 10000);
                  const fvWon = Math.round(pvWon * (1 + (apartment.inflationRate / 100)));
                  const repairCount = Number(item.quantity) || 0;
                  const totalCostWon = (Number(item.estimatedCost) || 0) * 10000;

                  return (
                    <tr key={item.id} className="h-10 text-center hover:bg-slate-50 transition-colors">
                      <td className="border border-black text-left px-4 font-bold text-slate-900">{item.item}</td>
                      <td className="border border-black text-slate-700">{item.method}</td>
                      <td className="border border-black text-slate-700">{item.cycleYears}년</td>
                      <td className="border border-black font-mono text-blue-600 font-bold">{repairCount.toLocaleString()}</td>
                      <td className="border border-black font-mono">{Number(item.facilitySize || 0).toLocaleString()}</td>
                      <td className="border border-black text-slate-500">{item.unit}</td>
                      <td className="border border-black text-right px-3 font-mono font-black">{fvWon.toLocaleString()}</td>
                      <td className="border border-black text-right px-3 font-mono font-black text-blue-800 bg-slate-50/50">
                        {Math.round(totalCostWon).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr className="h-10">
                  <td colSpan={7} className="border border-black text-right px-4 text-xs">해당 공정 소계 (Sum)</td>
                  <td className="border border-black text-right px-3 font-mono text-blue-900">
                    {Math.round(groupItems.reduce((sum, item) => sum + ((Number(item.estimatedCost) || 0) * 10000), 0)).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      <div className="mt-20 border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium">
        <p>* 위 내역은 장기수선계획 수립 기준 및 물가상승률({apartment.inflationRate}%)이 반영된 최종 집행 예정 금액입니다.</p>
        <p className="italic font-bold">Apartment Management Pro System</p>
      </div>
    </div>
  );
};

export default ItemizedReport;
