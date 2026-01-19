
import React from 'react';
import { MaintenanceItem, Apartment } from '../types';

interface ItemDetailStatusReportProps {
  items: MaintenanceItem[];
  apartment: Apartment;
}

const ItemDetailStatusReport: React.FC<ItemDetailStatusReportProps> = ({ items, apartment }) => {
  return (
    <div className="mx-auto bg-white min-h-screen text-black p-8 md:p-16 max-w-[1000px] shadow-sm">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4 tracking-tighter inline-block border-b-[3px] border-black pb-2">
          {apartment.name} 항목별 상세현황
        </h1>
      </div>

      <div className="space-y-16">
        {items.map((item) => (
          <div key={item.id} className="pdf-no-break">
            <table className="w-full border-collapse border-[1.5px] border-black text-sm">
              <tbody>
                {/* 1열: 헤더 */}
                <tr className="h-10 text-center font-bold bg-white">
                  <td className="border border-black w-1/4">대분류</td>
                  <td className="border border-black w-1/4">중분류</td>
                  <td className="border border-black w-1/4">공사종별</td>
                  <td className="border border-black w-1/4">수선방법</td>
                </tr>
                {/* 2열: 데이터 */}
                <tr className="h-10 text-center">
                  <td className="border border-black">{item.mainCategory}</td>
                  <td className="border border-black">{item.subCategory}</td>
                  <td className="border border-black font-black">{item.item}</td>
                  <td className="border border-black">{item.method}</td>
                </tr>
                {/* 3열: 헤더 (수선주기, 수선율) */}
                <tr className="h-10 text-center font-bold bg-white">
                  <td className="border border-black" colSpan={2}>수선주기</td>
                  <td className="border border-black" colSpan={2}>수선율</td>
                </tr>
                {/* 4열: 데이터 */}
                <tr className="h-10 text-center">
                  <td className="border border-black font-bold" colSpan={2}>{item.cycleYears}년</td>
                  <td className="border border-black font-bold" colSpan={2}>{item.repairRate}%</td>
                </tr>
                {/* 5열: 데이터 (최종수선, 계획금액) */}
                <tr className="h-10">
                  <td className="border border-black text-center font-bold bg-white">최종 수선년도</td>
                  <td className="border border-black text-center font-bold">{item.lastRepairYear}년</td>
                  <td className="border border-black text-center font-bold bg-white">수선계획 금액</td>
                  <td className="border border-black text-right px-4 font-black">
                    {Math.round(Number(item.estimatedCost || 0) * 10000).toLocaleString()}원
                  </td>
                </tr>
                {/* 6열: 공사 예정년도 */}
                <tr className="h-10">
                  <td className="border border-black text-center font-bold bg-white">공사 예정년도</td>
                  <td className="border border-black text-left px-4 font-bold" colSpan={3}>
                    {item.nextRepairYear}년
                  </td>
                </tr>
                {/* 7열: 수선공사 설명 헤더 */}
                <tr className="h-10 text-center font-bold bg-white">
                  <td className="border border-black" colSpan={4}>수선공사 설명</td>
                </tr>
                {/* 8열: 수선공사 설명 데이터 */}
                <tr className="min-h-[80px]">
                  <td className="border border-black p-4 text-left align-top leading-relaxed" colSpan={4}>
                    {/* Fix: Property 'detail' does not exist on type 'MaintenanceItem'. Use 'remarks' only. */}
                    {item.remarks || '특이사항 없음'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-12 text-right text-[10px] text-slate-300 font-bold italic">
        {apartment.name} - 장기수선계획 시스템 생성 보고서
      </div>
    </div>
  );
};

export default ItemDetailStatusReport;
