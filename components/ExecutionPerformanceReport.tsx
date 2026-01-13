
import React, { useMemo } from 'react';
import { MaintenanceHistory, Apartment } from '../types';

interface ExecutionPerformanceReportProps {
  histories: MaintenanceHistory[];
  apartment: Apartment;
}

const ExecutionPerformanceReport: React.FC<ExecutionPerformanceReportProps> = ({ histories, apartment }) => {
  const currentHistories = useMemo(() => {
    return histories.filter(h => h.apartmentId === apartment.id);
  }, [histories, apartment.id]);

  const stats = useMemo(() => {
    if (!currentHistories || currentHistories.length === 0) return null;
    
    let totalPlanned = 0;
    let totalActual = 0;
    
    currentHistories.forEach(h => {
      totalPlanned += h.plannedCost;
      totalActual += h.actualCost;
    });
    
    const bpi = totalActual > 0 ? (totalPlanned / totalActual) : 1;
    const totalVariance = totalActual - totalPlanned;
    const savingPercent = totalPlanned > 0 ? ((totalPlanned - totalActual) / totalPlanned) * 100 : 0;
    
    return {
      totalPlanned,
      totalActual,
      bpi,
      totalVariance,
      savingPercent
    };
  }, [currentHistories]);

  const topSavings = useMemo(() => {
    return [...currentHistories]
      .map(h => ({ ...h, saving: h.plannedCost - h.actualCost }))
      .sort((a, b) => b.saving - a.saving)
      .slice(0, 5);
  }, [currentHistories]);

  if (!currentHistories || currentHistories.length === 0) {
    return (
      <div className="p-20 bg-white min-h-[800px] flex flex-col items-center justify-center text-slate-400">
        <i className="fas fa-file-circle-exclamation text-6xl mb-6"></i>
        <h2 className="text-xl font-black">집행 실적이 없습니다</h2>
        <p className="mt-2 text-sm font-bold">공사 집행 등록을 마친 후 보고서를 확인하세요.</p>
      </div>
    );
  }

  return (
    <div className="p-16 bg-white min-h-screen max-w-[1000px] mx-auto text-slate-900 leading-tight">
      <div className="border-b-[3px] border-black pb-6 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">
            {apartment.name} 장기수선 집행 실적 분석 보고서
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">분석기간</p>
          <p className="text-base font-black text-slate-900">{new Date().getFullYear()}년 실적</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-12">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">총 계획 예산</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-black text-slate-900">₩{(stats?.totalPlanned! / 10000).toLocaleString()}</p>
            <span className="text-[10px] font-bold text-slate-400">만</span>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">총 실제 집행</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-black text-blue-700">₩{(stats?.totalActual! / 10000).toLocaleString()}</p>
            <span className="text-[10px] font-bold text-slate-400">만</span>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">예산 절감액</p>
          <div className="flex items-baseline gap-1">
            <p className={`text-xl font-black ${stats?.totalVariance! < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₩{Math.abs(stats?.totalVariance! / 10000).toLocaleString()}
            </p>
            <span className="text-[10px] font-bold text-slate-400">만</span>
          </div>
          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
            ({stats?.savingPercent.toFixed(1)}% {stats?.totalVariance! < 0 ? '절감' : '초과'})
          </p>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <p className="text-[9px] font-black opacity-60 uppercase mb-2 tracking-tighter">집행 효율 지수 (BPI)</p>
          <p className="text-2xl font-black text-emerald-400">{stats?.bpi.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-14">
        <h2 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest border-l-[4px] border-slate-900 pl-3">
          1. 주요 예산 절감 성과
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {topSavings.map((h, i) => (
            <div key={i} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
              <p className="text-[8px] font-black text-emerald-600 mb-1 truncate px-2 uppercase">{h.itemName}</p>
              <p className="text-xs font-black text-slate-900">₩{(h.saving / 10000).toLocaleString()}만</p>
              <p className="text-[7px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">절감</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-14">
        <h2 className="text-sm font-black flex items-center gap-2 mb-4 uppercase tracking-widest border-l-[4px] border-slate-900 pl-3">
          2. 전체 집행 상세 내역
        </h2>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead className="bg-slate-100 font-black">
            <tr className="h-10">
              <th className="border border-black w-24">집행일자</th>
              <th className="border border-black text-left px-4">공사항목</th>
              <th className="border border-black w-28">계획금액</th>
              <th className="border border-black w-28">집행금액</th>
              <th className="border border-black w-24">차이(원)</th>
              <th className="border border-black w-20">집행율</th>
              <th className="border border-black w-24">시공사</th>
            </tr>
          </thead>
          <tbody>
            {currentHistories.map((h, idx) => {
              const variance = h.actualCost - h.plannedCost;
              const ratio = (h.actualCost / h.plannedCost) * 100;
              return (
                <tr key={idx} className="h-9 text-center">
                  <td className="border border-black font-medium">{h.executionDate}</td>
                  <td className="border border-black text-left px-4 font-bold">{h.itemName}</td>
                  <td className="border border-black text-right px-3 font-mono text-slate-400">
                    {h.plannedCost.toLocaleString()}
                  </td>
                  <td className="border border-black text-right px-3 font-mono font-black text-blue-700">
                    {h.actualCost.toLocaleString()}
                  </td>
                  <td className={`border border-black text-right px-3 font-mono font-black ${variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                  </td>
                  <td className="border border-black font-bold">
                    {ratio.toFixed(1)}%
                  </td>
                  <td className="border border-black text-[9px] text-slate-500 px-1 truncate uppercase">
                    {h.contractor || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-black">
            <tr className="h-10 text-center">
              <td className="border border-black" colSpan={2}>합계</td>
              <td className="border border-black text-right px-3 font-mono">{stats?.totalPlanned.toLocaleString()}</td>
              <td className="border border-black text-right px-3 font-mono text-emerald-400">{stats?.totalActual.toLocaleString()}</td>
              <td className="border border-black text-right px-3 font-mono">{stats?.totalVariance.toLocaleString()}</td>
              <td className="border border-black" colSpan={2}>{stats?.savingPercent.toFixed(1)}% {stats?.totalVariance! < 0 ? '절감' : '초과'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <i className="fas fa-microchip"></i>
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest">관리 효율성 정밀 분석 소견</h3>
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-600 italic">
          "본 단지의 최근 장기수선 집행 결과, {stats?.totalVariance! < 0 ? '철저한 시장 조사와 경쟁 입찰을 통해 당초 계획 대비 약 ' + Math.abs(stats?.totalVariance! / 10000).toLocaleString() + '만 원의 예산을 성공적으로 절감하였습니다.' : '물가 상승 및 긴급 보수 상황으로 인해 예산 대비 지출이 다소 발생하였으나, 집행 지수(BPI)가 ' + stats?.bpi.toFixed(2) + '로 산출되어 전체적인 계획 관리 체계는 안정적으로 유지되고 있는 것으로 평가됩니다.'} 향후 절감된 예산은 충당금 예치 기간을 연장하거나 후속 공정의 보완 재원으로 활용하여 단지 자산 가치를 제고할 것을 권장합니다."
        </p>
      </div>

      <div className="mt-8 text-center text-[9px] text-slate-300 font-black uppercase tracking-widest border-t border-slate-100 pt-6">
        {apartment.name} 관리 전략 분석팀
      </div>
    </div>
  );
};

export default ExecutionPerformanceReport;
