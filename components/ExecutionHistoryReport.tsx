
import React, { useMemo } from 'react';
import { MaintenanceHistory, Apartment } from '../types';

interface ExecutionHistoryReportProps {
  histories: MaintenanceHistory[];
  apartment: Apartment;
}

const ExecutionHistoryReport: React.FC<ExecutionHistoryReportProps> = ({ histories, apartment }) => {
  const currentHistories = useMemo(() => {
    return [...histories]
      .filter(h => h.apartmentId === apartment.id)
      .sort((a, b) => b.executionDate.localeCompare(a.executionDate));
  }, [histories, apartment.id]);

  if (!currentHistories || currentHistories.length === 0) {
    return (
      <div className="p-20 bg-white min-h-[800px] flex flex-col items-center justify-center text-slate-400">
        <i className="fas fa-book-open text-6xl mb-6 opacity-20"></i>
        <h2 className="text-xl font-black">집행 이력이 없습니다</h2>
        <p className="mt-2 text-sm font-bold">등록된 공사 집행 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-16 bg-white min-h-screen max-w-[1000px] mx-auto text-slate-900 leading-tight">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">
          {apartment.name} 공 사 집 행 이 력 대 장
        </h1>
        <div className="h-0.5 border-b-2 border-double border-black w-full"></div>
      </div>

      <div className="mb-8 border border-black p-4 bg-slate-50/50">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="w-24 font-black py-1">단지명 :</td>
              <td className="font-bold">{apartment.name}</td>
              <td className="w-32 font-black py-1 text-right">출력일자 :</td>
              <td className="w-32 text-right">{new Date().toLocaleDateString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse border-2 border-black text-[10px]">
        <thead className="bg-slate-100 font-black">
          <tr className="h-10">
            <th className="border border-black w-12">번호</th>
            <th className="border border-black w-24">집행일자</th>
            <th className="border border-black text-left px-4">공사항목</th>
            <th className="border border-black w-28">집행금액(원)</th>
            <th className="border border-black w-32">시공업체</th>
            <th className="border border-black text-left px-4">비고 (수선내용 등)</th>
          </tr>
        </thead>
        <tbody>
          {currentHistories.map((h, idx) => (
            <tr key={h.id} className="h-12 text-center">
              <td className="border border-black font-medium">{currentHistories.length - idx}</td>
              <td className="border border-black">{h.executionDate}</td>
              <td className="border border-black text-left px-4 font-bold">{h.itemName}</td>
              <td className="border border-black text-right px-3 font-mono font-black">
                {h.actualCost.toLocaleString()}
              </td>
              <td className="border border-black text-slate-600">{h.contractor || '-'}</td>
              <td className="border border-black text-left px-4 text-[9px] text-slate-500 leading-snug">
                {h.remarks || '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 font-black">
          <tr className="h-12">
            <td colSpan={3} className="border border-black text-right px-4">누적 합계</td>
            <td className="border border-black text-right px-3 font-mono text-blue-800">
              {currentHistories.reduce((sum, h) => sum + h.actualCost, 0).toLocaleString()}
            </td>
            <td colSpan={2} className="border border-black bg-white"></td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-12 p-8 border-2 border-slate-200 rounded-2xl relative">
        <div className="absolute -top-3 left-6 bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">확인 및 검인</div>
        <div className="flex justify-around items-center pt-4">
          <div className="text-center">
            <div className="w-20 h-20 border border-slate-200 rounded-full flex items-center justify-center mb-2 text-slate-200 text-[10px]">인</div>
            <p className="text-xs font-black">담당자</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 border border-slate-200 rounded-full flex items-center justify-center mb-2 text-slate-200 text-[10px]">인</div>
            <p className="text-xs font-black">관리사무소장</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 border border-slate-200 rounded-full flex items-center justify-center mb-2 text-slate-200 text-[10px]">인</div>
            <p className="text-xs font-black">입주자대표회의</p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center text-[9px] text-slate-300 font-black tracking-widest pt-6 border-t border-slate-100">
        본 대장은 공동주택관리법에 의거하여 관리주체가 작성 및 보관해야 하는 법정 서식에 준하여 생성되었습니다.
      </div>
    </div>
  );
};

export default ExecutionHistoryReport;
