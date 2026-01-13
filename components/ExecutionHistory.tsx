
import React from 'react';
import { MaintenanceHistory } from '../types';

interface ExecutionHistoryProps {
  histories: MaintenanceHistory[];
}

const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ histories }) => {
  const sortedHistories = [...histories].sort((a, b) => b.executionDate.localeCompare(a.executionDate));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">공사 집행 및 차이 분석</h2>
        <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-60">
          계획 예산 대비 실제 집행 비용의 오차를 분석하여 차기 계획의 정확도를 개선합니다.
        </p>
      </header>

      {sortedHistories.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-40 flex flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-history text-3xl"></i>
          </div>
          <p className="font-black text-lg">아직 집행된 공사 이력이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-800">일자/연도</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-800">공사항목</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest border-r border-slate-800">계획 예산 (Frozen)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest border-r border-slate-800">실제 집행 (Actual)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest border-r border-slate-800">차이 (Variance)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">시공사/비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHistories.map((h) => {
                const variance = h.actualCost - h.plannedCost;
                const variancePercent = h.plannedCost > 0 ? (variance / h.plannedCost) * 100 : 0;
                
                // 5% 이상 차이 시 강조
                const isOverBudget = variance > h.plannedCost * 0.05;
                const isUnderBudget = variance < -h.plannedCost * 0.05;

                return (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 border-r border-slate-50">
                      <div className="font-black text-slate-900 text-sm">{h.executionYear}년</div>
                      <div className="text-[10px] text-slate-400 font-bold">{h.executionDate}</div>
                    </td>
                    <td className="px-6 py-5 border-r border-slate-50">
                      <div className="font-black text-blue-700 text-sm">{h.itemName}</div>
                    </td>
                    <td className="px-6 py-5 text-right border-r border-slate-50 bg-slate-50/20">
                      <span className="font-mono font-bold text-slate-500 text-sm">{Math.round(h.plannedCost).toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">원</span>
                    </td>
                    <td className="px-6 py-5 text-right border-r border-slate-50 bg-white">
                      <span className="font-mono font-black text-slate-900 text-sm">{Math.round(h.actualCost).toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">원</span>
                    </td>
                    <td className={`px-6 py-5 text-right border-r border-slate-50 ${isOverBudget ? 'bg-red-50' : isUnderBudget ? 'bg-blue-50' : 'bg-white'}`}>
                      <div className={`font-mono font-black text-sm ${isOverBudget ? 'text-red-600' : isUnderBudget ? 'text-blue-600' : 'text-slate-400'}`}>
                        {variance > 0 ? '+' : ''}{Math.round(variance).toLocaleString()}
                      </div>
                      <div className={`text-[9px] font-black uppercase ${isOverBudget ? 'text-red-400' : isUnderBudget ? 'text-blue-400' : 'text-slate-300'}`}>
                        ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-black text-slate-700 mb-0.5">{h.contractor || '-'}</div>
                      <p className="text-[10px] text-slate-400 font-medium max-w-xs truncate" title={h.remarks}>{h.remarks || '-'}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExecutionHistory;
