
import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { MaintenanceItem, MaintenanceStandard } from '../types';
import { CATEGORIES, REPAIR_METHODS, UNITS } from '../constants';
import AddItemModal from './AddItemModal';

interface PlanTableProps {
  items: MaintenanceItem[];
  masterStandards: MaintenanceStandard[];
  planPeriod: number;
  inflationRate: number; 
  onUpdate: (updatedItems: MaintenanceItem[]) => void;
  onAdd: (standard: MaintenanceStandard) => void;
  onDelete: (id: string) => void;
  onInitialize?: () => void;
  onExecute?: (item: MaintenanceItem) => void;
  onCancelExecute?: (item: MaintenanceItem) => void;
  onSaveVersion?: () => void;
  apartmentName?: string;
  approvalDate?: string;
}

const TableRow = memo(({ 
  item, 
  planPeriod,
  inflationRate,
  columnWidths,
  onUpdate,
  onDelete,
  onExecute,
  onCancelExecute
}: { 
  item: MaintenanceItem, 
  planPeriod: number,
  inflationRate: number,
  masterStandards: MaintenanceStandard[],
  columnWidths: Record<string, number>,
  onUpdate: (updatedItems: MaintenanceItem[]) => void,
  onDelete: (id: string) => void,
  onExecute?: (item: MaintenanceItem) => void,
  onCancelExecute?: (item: MaintenanceItem) => void
}) => {
  const currentYear = 2025;
  const safeInflation = Number(inflationRate) || 0;
  const safePlanPeriod = Number(planPeriod) || 40;

  const pvWon = Math.round((Number(item.unitPrice) || 0) * 10000);
  const calculatedFvWon = Math.round(pvWon * (1 + (safeInflation / 100)));

  const [localValues, setLocalValues] = useState({
    method: item.method || '전면교체',
    unit: item.unit || 'm2',
    lastRepairYear: item.lastRepairYear || currentYear,
    cycleYears: item.cycleYears || 10,
    facilitySize: item.facilitySize || 0,
    adjPriceWon: calculatedFvWon, 
    repairRate: item.repairRate || 100,
    remarks: item.remarks || '',
    isExecuted: item.isExecuted || false,
    status: item.status || '정상'
  });

  useEffect(() => {
    setLocalValues({
      method: item.method || '전면교체',
      unit: item.unit || 'm2',
      lastRepairYear: item.lastRepairYear || currentYear,
      cycleYears: item.cycleYears || 10,
      facilitySize: item.facilitySize || 0,
      adjPriceWon: calculatedFvWon,
      repairRate: item.repairRate || 100,
      remarks: item.remarks || '',
      isExecuted: item.isExecuted || false,
      status: item.status || '정상'
    });
  }, [item.id, item.isExecuted, item.status, item.unitPrice, safeInflation, calculatedFvWon, item.lastRepairYear, item.cycleYears, item.facilitySize]);

  const repairCount = useMemo(() => {
    const cycle = Math.max(1, Number(localValues.cycleYears));
    const rate = Number(localValues.repairRate) || 100;
    return Math.round((safePlanPeriod / cycle) * (rate / 100) * 10) / 10;
  }, [safePlanPeriod, localValues.cycleYears, localValues.repairRate]);

  const nextRepairYear = useMemo(() => {
    const last = Number(localValues.lastRepairYear) || currentYear;
    const cycle = Number(localValues.cycleYears) || 0;
    return last + cycle;
  }, [localValues.lastRepairYear, localValues.cycleYears]);

  const handleBlur = () => {
    const fv = Number(localValues.adjPriceWon) || 0;
    const size = Number(localValues.facilitySize) || 0;
    const count = Number(repairCount) || 0;
    const totalPlannedCostWon = fv * size * count;

    onUpdate([{ 
      ...item, 
      method: localValues.method,
      unit: localValues.unit,
      lastRepairYear: Number(localValues.lastRepairYear),
      cycleYears: Number(localValues.cycleYears),
      nextRepairYear: nextRepairYear,
      facilitySize: size,
      repairRate: Number(localValues.repairRate),
      quantity: count,
      estimatedCost: totalPlannedCostWon / 10000, 
      remarks: localValues.remarks,
      isExecuted: localValues.isExecuted,
      status: localValues.status as any
    }]);
  };

  return (
    <tr className={`min-h-[44px] hover:bg-slate-50 transition-colors border-b border-slate-200 group/row ${localValues.isExecuted ? 'bg-emerald-50/60' : 'bg-white'}`}>
      <td className="px-1 py-2 border-r border-slate-200 sticky left-0 z-20 bg-white text-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]" style={{ width: columnWidths.exec }}>
        {localValues.isExecuted ? (
          <div className="relative group/cancel flex items-center justify-center h-8">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm group-hover/cancel:scale-0 transition-transform duration-200">
              <i className="fas fa-check text-[8px]"></i>
            </div>
            <button 
              onClick={() => onCancelExecute?.(item)}
              className="absolute inset-0 flex items-center justify-center text-red-500 scale-0 group-hover/cancel:scale-100 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="집행 취소"
            >
              <i className="fas fa-undo-alt text-xs"></i>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onExecute?.(item)}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center mx-auto"
            title="공사 집행 등록"
          >
            <i className="fas fa-file-signature text-xs"></i>
          </button>
        )}
      </td>
      
      <td className="px-2 py-2 border-r border-slate-200 sticky left-10 z-20 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]" style={{ width: columnWidths.item }}>
        <div className={`font-black text-[11px] leading-tight break-words ${
          localValues.isExecuted ? 'text-emerald-700' : 
          item.isManual ? 'text-red-600' : 'text-slate-900'
        }`}>
          {item.item}
        </div>
        <div className="text-[9px] text-slate-500 font-black truncate mt-0.5">{item.mainCategory} ({item.code})</div>
      </td>

      <td className="px-1 py-2 border-r border-slate-200" style={{ width: columnWidths.method }}>
        <select 
          value={localValues.method} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, method: e.target.value}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-center text-[10px] font-black text-slate-700 outline-none cursor-pointer appearance-none disabled:cursor-not-allowed"
        >
          {REPAIR_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </td>

      <td className="px-1 py-2 border-r border-slate-200 bg-slate-50/30" style={{ width: columnWidths.cycle }}>
        <input 
          type="number" 
          value={localValues.cycleYears} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, cycleYears: Number(e.target.value)}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-center text-[11px] font-black text-slate-900 outline-none disabled:opacity-50"
        />
      </td>

      <td className="px-1 py-2 border-r border-slate-200 bg-slate-50/30 text-center" style={{ width: columnWidths.rate }}>
        <input 
          type="number" 
          value={localValues.repairRate} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, repairRate: Number(e.target.value)}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-center text-[11px] font-black text-blue-600 outline-none disabled:opacity-50"
        />
      </td>

      <td className="px-1 py-2 border-r border-slate-200" style={{ width: columnWidths.unit }}>
        <select 
          value={localValues.unit} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, unit: e.target.value}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-center text-[10px] font-bold text-slate-500 outline-none cursor-pointer appearance-none disabled:opacity-50"
        >
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>

      <td className="px-1 py-2 border-r border-slate-200 bg-amber-50/20" style={{ width: columnWidths.year }}>
        <input 
          type="number" 
          value={localValues.lastRepairYear} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, lastRepairYear: Number(e.target.value)}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-center text-[11px] font-black text-amber-700 outline-none disabled:opacity-50"
        />
      </td>

      <td className="px-1 py-2 border-r border-slate-200 bg-blue-50/20 text-center" style={{ width: columnWidths.year }}>
        <span className="text-[11px] font-black text-blue-700">{nextRepairYear}</span>
      </td>

      <td className="px-2 py-2 text-right border-r border-slate-200 bg-slate-50/80" style={{ width: columnWidths.price }}>
        <div className="w-full text-right text-[11px] font-mono font-bold text-slate-400 select-none">
          {pvWon.toLocaleString()}
        </div>
      </td>

      <td className="px-2 py-2 text-right border-r border-slate-200 bg-white" style={{ width: columnWidths.adjPrice }}>
        <input 
          type="text" 
          value={Math.round(localValues.adjPriceWon).toLocaleString()} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, adjPriceWon: Number(e.target.value.replace(/[^0-9]/g, ''))}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-right text-[12px] font-mono font-black text-blue-600 outline-none disabled:opacity-50"
        />
      </td>

      <td className="px-1 py-2 text-right border-r border-slate-200" style={{ width: columnWidths.size }}>
        <input 
          type="number" 
          value={localValues.facilitySize} 
          disabled={localValues.isExecuted}
          onChange={(e) => setLocalValues(p => ({...p, facilitySize: Number(e.target.value)}))}
          onBlur={handleBlur}
          className="w-full bg-transparent text-right text-[11px] font-black text-slate-900 outline-none disabled:opacity-50"
        />
      </td>

      <td className="px-1 py-2 border-r border-slate-200 bg-indigo-50/30 text-center" style={{ width: columnWidths.count }}>
        <span className="text-[11px] font-black text-indigo-700">{repairCount}</span>
      </td>

      <td className="px-2 py-2 text-right font-black text-slate-900 text-[12px] bg-slate-900/5 border-r border-slate-200" style={{ width: columnWidths.total }}>
        {(Number(localValues.adjPriceWon || 0) * Number(localValues.facilitySize || 0) * Number(repairCount || 0)).toLocaleString()}
      </td>

      <td className="px-2 py-2 border-r border-slate-200 bg-white" style={{ width: columnWidths.remarks }}>
        <textarea 
          value={localValues.remarks} 
          onChange={(e) => setLocalValues(p => ({...p, remarks: e.target.value}))}
          onBlur={handleBlur}
          rows={1}
          placeholder="..."
          className="w-full bg-transparent text-left text-[10px] font-medium text-slate-500 outline-none resize-none overflow-hidden"
        />
      </td>

      <td className="px-1 py-2 text-center bg-white sticky right-0 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.15)] border-l border-slate-200" style={{ width: columnWidths.delete }}>
        {localValues.isExecuted ? (
          <div className="w-8 h-8 flex items-center justify-center mx-auto text-slate-300" title="집행 완료된 항목은 삭제할 수 없습니다.">
            <i className="fas fa-lock text-[10px]"></i>
          </div>
        ) : (
          <button 
            onClick={() => onDelete(item.id)} 
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center mx-auto"
            title="항목 삭제"
          >
            <i className="fas fa-trash-alt text-[10px]"></i>
          </button>
        )}
      </td>
    </tr>
  );
});

const PlanTable: React.FC<PlanTableProps> = ({ items, masterStandards, planPeriod, inflationRate, onUpdate, onAdd, onDelete, onInitialize, onExecute, onCancelExecute, onSaveVersion, apartmentName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const columnWidths = {
    exec: 48, item: 180, method: 110, cycle: 60, rate: 65, unit: 60, year: 70, price: 110, adjPrice: 130, size: 80, count: 60, total: 140, remarks: 150, delete: 48
  };

  const filteredItems = useMemo(() => {
    const categoryOrder = CATEGORIES.reduce((acc, cat, idx) => ({ ...acc, [cat]: idx }), {} as Record<string, number>);

    return items
      .filter(i => (filterCategory === '전체' || i.mainCategory === filterCategory) && (i.item || '').includes(searchTerm))
      .sort((a, b) => {
        const catA = categoryOrder[a.mainCategory] ?? 999;
        const catB = categoryOrder[b.mainCategory] ?? 999;
        if (catA !== catB) return catA - catB;
        return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
      });
  }, [items, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    let totalPlan = 0;
    const safeInflation = Number(inflationRate) || 0;
    const safePeriod = Number(planPeriod) || 40;

    filteredItems.forEach(i => {
      const pv = (Number(i.unitPrice) || 0) * 10000;
      const adjPrice = Math.round(pv * (1 + (safeInflation / 100)));
      const size = Number(i.facilitySize) || 0;
      const cycle = Math.max(1, Number(i.cycleYears));
      const rate = Number(i.repairRate) || 100;
      const count = Math.round((safePeriod / cycle) * (rate / 100) * 10) / 10;
      
      const itemTotal = adjPrice * size * count;
      if (!isNaN(itemTotal) && isFinite(itemTotal)) {
        totalPlan += itemTotal;
      }
    });
    return { totalPlan };
  }, [filteredItems, inflationRate, planPeriod]);

  const generateReportHtml = () => {
    let lastCategory = '';
    const tableRows = filteredItems.map((i, idx) => {
      const pv = (Number(i.unitPrice) || 0) * 10000;
      const safeInflation = Number(inflationRate) || 0;
      const adjPrice = Math.round(pv * (1 + (safeInflation / 100)));
      const cycle = Math.max(1, Number(i.cycleYears));
      const rate = Number(i.repairRate) || 100;
      const count = Math.round((planPeriod / cycle) * (rate / 100) * 10) / 10;
      const total = adjPrice * (i.facilitySize || 0) * count;

      let categoryHeader = '';
      if (i.mainCategory !== lastCategory) {
        lastCategory = i.mainCategory;
        categoryHeader = `
          <tr class="category-group-row">
            <td colspan="15" class="category-header-cell">■ ${i.mainCategory}</td>
          </tr>
        `;
      }

      return `
        ${categoryHeader}
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td class="cat-col">${i.subCategory || '-'}</td>
          <td class="item-name">${i.item}</td>
          <td style="text-align:center">${i.method.substring(0,4)}</td>
          <td class="num-col">${i.cycleYears}</td>
          <td class="num-col">${i.repairRate}%</td>
          <td style="text-align:center">${i.unit}</td>
          <td class="num-col">${i.lastRepairYear}</td>
          <td class="num-col" style="font-weight:bold; color: #2563eb;">${i.nextRepairYear}</td>
          <td class="money-col">${pv.toLocaleString()}</td>
          <td class="money-col" style="font-weight:bold;">${adjPrice.toLocaleString()}</td>
          <td class="money-col">${(i.facilitySize || 0).toLocaleString()}</td>
          <td class="num-col" style="color: #4f46e5;">${count}</td>
          <td class="money-col" style="font-weight:bold; background-color: #f1f5f9;">${Math.round(total).toLocaleString()}</td>
          <td class="remarks-col">${i.remarks || ''}</td>
        </tr>
      `;
    }).join('');

    return `
      <div id="pdf-content">
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          body { font-family: 'Malgun Gothic', 'Dotum', sans-serif; font-size: 8pt; color: #333; line-height: 1.1; margin: 0; padding: 0; }
          .container { padding: 5mm; }
          h1 { text-align: center; font-size: 14pt; margin: 0 0 4mm 0; font-weight: 900; letter-spacing: -0.5px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 2mm; font-weight: bold; border-bottom: 1.5 solid #000; padding-bottom: 1.5mm; font-size: 8pt; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 0.5px solid #000; padding: 3px 4px; overflow: hidden; word-break: break-all; font-size: 8pt; height: 28px; }
          th { background: #f1f5f9; font-weight: 900; text-align: center; }
          .category-header-cell { background: #e2e8f0; font-weight: 900; text-align: left; padding: 4px 10px; font-size: 8pt; color: #1e293b; border-bottom: 1px solid #000; }
          .item-name { white-space: normal; word-break: keep-all; text-align: left; font-weight: 900; width: 160px; line-height: 1.0; }
          .cat-col { white-space: nowrap; text-align: center; color: #555; width: 80px; }
          .num-col { white-space: nowrap; text-align: center; font-family: 'Courier New', Courier, monospace; }
          .money-col { white-space: nowrap; text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: bold; }
          .remarks-col { white-space: normal; font-size: 8pt; color: #333; line-height: 1.1; text-align: left; }
          .footer { margin-top: 5mm; text-align: right; font-size: 8pt; font-weight: 900; border-top: 1.5px solid #000; padding-top: 3mm; }
          tr:nth-child(even):not(.category-group-row) { background-color: #f9fafb; }
        </style>
        <div class="container">
          <h1>${apartmentName} 장기수선계획 마스터 내역서</h1>
          <div class="info">
            <span>필터: ${filterCategory} | 계획기간: ${planPeriod}년 | 물가: ${inflationRate}%</span>
            <span>단지: ${apartmentName} | 출력: ${new Date().toLocaleString()}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:30px">No</th>
                <th style="width:80px">중분류</th>
                <th style="width:160px">공사종별</th>
                <th style="width:60px">방법</th>
                <th style="width:35px">주기</th>
                <th style="width:40px">수선율</th>
                <th style="width:35px">단위</th>
                <th style="width:45px">최종</th>
                <th style="width:45px">차기</th>
                <th style="width:95px">기본단가</th>
                <th style="width:95px">조정단가</th>
                <th style="width:60px">물량</th>
                <th style="width:40px">횟수</th>
                <th style="width:130px">계획총액(원)</th>
                <th style="width:150px">비고</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">
            총 항목수: ${filteredItems.length}개 | 전체 계획 예산 합계: ${Math.round(stats.totalPlan).toLocaleString()} 원
          </div>
        </div>
      </div>
    `;
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${apartmentName} 마스터 계획표</title></head><body>${generateReportHtml()}</body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[850px]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white gap-4 z-50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <i className="fas fa-calendar-days text-2xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{apartmentName} 마스터 계획표</h3>
              <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-lg">
                <i className="fas fa-chart-line mr-1"></i> 물가 {inflationRate}%
              </div>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">집행 완료된 항목은 <b>보호(Lock)</b> 처리되어 삭제할 수 없습니다.</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 text-slate-700 rounded-xl text-xs font-black hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"
            >
              <i className="fas fa-print"></i> 인쇄
            </button>
            <button 
              onClick={onSaveVersion}
              className="px-4 py-2 text-blue-600 rounded-xl text-xs font-black hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"
            >
              <i className="fas fa-history"></i> 버전 저장
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-500 transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> 공사종별 추가
          </button>
          <div className="flex bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             <div className="flex items-center pl-4 text-slate-400"><i className="fas fa-search text-sm"></i></div>
             <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="항목 검색..." className="px-4 py-3 text-xs bg-transparent outline-none w-48 font-black text-slate-800" />
             <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-5 py-3 text-xs font-black bg-white border-l border-slate-200 outline-none text-blue-700">
                <option value="전체">전체 공정</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin relative bg-slate-50/30 min-h-[400px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-40">
             <div className="text-center mb-8">
               <i className="fas fa-folder-open text-slate-200 text-6xl mb-4 block"></i>
               <p className="text-slate-400 font-black">수립된 계획 데이터가 없습니다.</p>
             </div>
             <button onClick={onInitialize} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-3"><i className="fas fa-download"></i> 마스터 DB 일괄 불러오기</button>
          </div>
        ) : (
          <table className="text-left border-separate border-spacing-0" style={{ width: 'max-content' }}>
            <thead>
              <tr className="bg-white sticky top-0 z-[60] border-b border-slate-200">
                <th className="px-1 py-4 border-r border-slate-200 sticky left-0 z-[70] bg-white text-center text-[10px] font-black text-slate-400 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]" style={{ width: 48 }}>집행</th>
                <th className="px-2 py-4 border-r border-slate-200 sticky left-10 z-[70] bg-white text-[10px] font-black text-slate-900 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]" style={{ width: 180 }}>공사종별</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-slate-400" style={{ width: 110 }}>방법</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-slate-400" style={{ width: 60 }}>주기</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-slate-400" style={{ width: 65 }}>수선율</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-slate-400" style={{ width: 60 }}>단위</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-amber-600 bg-amber-50/50" style={{ width: 70 }}>최종수선</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-blue-600 bg-blue-50/50" style={{ width: 70 }}>차기수선</th>
                <th className="px-2 py-4 border-r border-slate-200 text-right text-[10px] font-black text-slate-400" style={{ width: 110 }}>기본단가(PV)</th>
                <th className="px-2 py-4 border-r border-slate-200 text-right text-[10px] font-black text-blue-700 bg-blue-50/20" style={{ width: 130 }}>조정단가(FV)</th>
                <th className="px-1 py-4 border-r border-slate-200 text-right text-[10px] font-black text-slate-400" style={{ width: 80 }}>단지물량</th>
                <th className="px-1 py-4 border-r border-slate-200 text-center text-[10px] font-black text-indigo-600 bg-indigo-50/50" style={{ width: 60 }}>수선횟수</th>
                <th className="px-2 py-4 border-r border-slate-200 text-right text-[10px] font-black text-slate-900 bg-slate-900/5" style={{ width: 140 }}>계획총액</th>
                <th className="px-2 py-4 border-r border-slate-200 text-left text-[10px] font-black text-slate-400" style={{ width: 150 }}>비고</th>
                <th className="px-1 py-4 sticky right-0 z-[70] bg-white text-center text-[10px] font-black text-slate-300 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.15)] border-l border-slate-200" style={{ width: 48 }}>삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredItems.map((item, index) => {
                const showHeader = index === 0 || filteredItems[index - 1].mainCategory !== item.mainCategory;
                return (
                  <React.Fragment key={item.id}>
                    {showHeader && (
                      <tr className="bg-slate-100/80 sticky top-[44px] z-30">
                        <td colSpan={15} className="px-5 py-2.5 text-[11px] font-black text-slate-700 border-y border-slate-200">
                          <i className="fas fa-folder-open mr-2 text-blue-600"></i> {item.mainCategory}
                        </td>
                      </tr>
                    )}
                    <TableRow 
                      item={item} 
                      planPeriod={planPeriod} 
                      inflationRate={inflationRate}
                      masterStandards={masterStandards}
                      columnWidths={columnWidths}
                      onUpdate={onUpdate} 
                      onDelete={onDelete} 
                      onExecute={onExecute}
                      onCancelExecute={onCancelExecute}
                    />
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white p-8 flex items-center justify-between border-t border-slate-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">총 계획 기간</span>
            <span className="text-2xl font-black text-blue-600">{planPeriod}년</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">항목 수</span>
            <span className="text-2xl font-black text-slate-900">{filteredItems.length}개</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">전체 계획 예산 (실시간 합계)</span>
          </div>
          <div className="flex items-baseline justify-end gap-3">
            <span className="text-4xl font-black text-slate-900">
              {Math.round(stats.totalPlan || 0).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-400">원</span>
          </div>
        </div>
      </div>

      <AddItemModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAdd}
      />
    </div>
  );
};

export default PlanTable;
