
import React, { useState, memo, useEffect, useMemo, useCallback } from 'react';
import { MaintenanceStandard, MaintenanceCategory } from '../types';
import { CATEGORIES } from '../constants';
import AddStandardModal from './AddStandardModal';
// @ts-ignore
import * as XLSX from 'xlsx';

interface MaintenanceStandardsProps {
  standards: MaintenanceStandard[];
  onUpdate: (updatedStandards: MaintenanceStandard[]) => void;
  onDelete: (id: string) => void;
  onMigrate?: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const StandardRow = memo(({ 
  std, 
  index,
  onRowUpdate,
  onDelete
}: { 
  std: MaintenanceStandard, 
  index: number,
  onRowUpdate: (updated: MaintenanceStandard) => void,
  onDelete: (id: string) => void
}) => {
  const [localValues, setLocalValues] = useState({
    subCategory: std.subCategory || '',
    item: std.item || '',
    method: std.method || '',
    cycleYears: std.cycleYears,
    repairRate: std.repairRate,
    unit: std.unit || '',
    material: std.material || 0,
    labor: std.labor || 0,
    expense: std.expense || 0,
    lastRepairYear: std.lastRepairYear || 2025,
    remarks: std.remarks || ''
  });

  useEffect(() => {
    setLocalValues({
      subCategory: std.subCategory || '',
      item: std.item || '',
      method: std.method || '',
      cycleYears: std.cycleYears,
      repairRate: std.repairRate,
      unit: std.unit || '',
      material: std.material || 0,
      labor: std.labor || 0,
      expense: std.expense || 0,
      lastRepairYear: std.lastRepairYear || 2025,
      remarks: std.remarks || ''
    });
  }, [std.id]);

  const handleInputChange = (field: string, value: any) => {
    if (['material', 'labor', 'expense', 'cycleYears', 'repairRate', 'lastRepairYear'].includes(field)) {
      const numValue = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
      setLocalValues(prev => ({ ...prev, [field]: numValue }));
    } else {
      setLocalValues(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = () => {
    const totalWon = Number(localValues.material) + Number(localValues.labor) + Number(localValues.expense);
    onRowUpdate({
      ...std,
      subCategory: localValues.subCategory,
      item: localValues.item,
      method: localValues.method,
      cycleYears: Number(localValues.cycleYears),
      repairRate: Number(localValues.repairRate),
      unit: localValues.unit,
      unitPrice: totalWon / 10000,
      lastRepairYear: Number(localValues.lastRepairYear),
      material: Number(localValues.material),
      labor: Number(localValues.labor),
      expense: Number(localValues.expense),
      remarks: localValues.remarks
    });
  };

  const formatNum = (val: number) => Math.round(val).toLocaleString();

  return (
    <tr className="hover:bg-blue-50/60 transition-colors group h-10 text-[11px]">
      <td className="border border-slate-300 bg-slate-100 text-center text-[9px] font-bold text-slate-400 w-10 sticky left-0 z-20 shadow-[1px_0_0_0_#cbd5e1]">
        {index + 1}
      </td>
      <td className="border border-slate-200 px-1 py-0.5 text-center text-slate-600 w-24 sticky left-10 z-20 bg-white">
        <select 
          value={std.mainCategory} 
          onChange={(e) => onRowUpdate({...std, mainCategory: e.target.value as MaintenanceCategory, category: e.target.value as MaintenanceCategory})}
          className="w-full bg-transparent outline-none cursor-pointer text-[10px] font-black appearance-none text-center text-blue-600"
        >
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </td>
      <td className="border border-slate-200 px-1 py-0.5 text-center text-slate-600 w-24 sticky left-[130px] z-20 bg-white">
        <input 
          type="text" 
          value={localValues.subCategory}
          onChange={(e) => handleInputChange('subCategory', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent outline-none text-center font-bold text-slate-500"
        />
      </td>
      <td className="border border-slate-200 px-3 py-0.5 font-black text-slate-900 w-64 truncate sticky left-[226px] z-20 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
        <input 
          type="text" 
          value={localValues.item}
          onChange={(e) => handleInputChange('item', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent outline-none truncate whitespace-nowrap"
        />
      </td>
      <td className="border border-slate-200 px-1 py-0.5 text-center w-28">
        <input 
          type="text" 
          value={localValues.method}
          onChange={(e) => handleInputChange('method', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent outline-none text-center text-[10px] font-black text-slate-700"
        />
      </td>
      <td className="border border-slate-200 p-0 text-center font-black text-slate-900 bg-slate-50/30 w-12">
        <input 
          type="text" 
          value={localValues.cycleYears}
          onChange={(e) => handleInputChange('cycleYears', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent outline-none text-center appearance-none leading-tight"
        />
      </td>
      <td className="border border-slate-200 px-1 py-0.5 text-center font-black text-blue-600 bg-blue-50/20 w-16">
        <div className="flex items-center justify-center gap-0.5">
          <input 
            type="text" 
            value={localValues.repairRate}
            onChange={(e) => handleInputChange('repairRate', e.target.value)}
            onBlur={handleBlur}
            className="w-8 bg-transparent outline-none text-right p-0"
          />
          <span className="text-[9px]">%</span>
        </div>
      </td>
      <td className="border border-slate-200 px-1 py-0.5 text-center font-bold text-slate-400 w-12">
        <input 
          type="text" 
          value={localValues.unit}
          onChange={(e) => handleInputChange('unit', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent outline-none text-center"
        />
      </td>
      <td className="border border-slate-200 p-0 w-24">
        <input 
          type="text" 
          value={formatNum(localValues.material)}
          onChange={(e) => handleInputChange('material', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent px-2 text-right font-mono font-bold text-slate-500 outline-none focus:bg-white"
        />
      </td>
      <td className="border border-slate-200 p-0 w-24">
        <input 
          type="text" 
          value={formatNum(localValues.labor)}
          onChange={(e) => handleInputChange('labor', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent px-2 text-right font-mono font-bold text-slate-500 outline-none focus:bg-white"
        />
      </td>
      <td className="border border-slate-200 p-0 w-20">
        <input 
          type="text" 
          value={formatNum(localValues.expense)}
          onChange={(e) => handleInputChange('expense', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent px-2 text-right font-mono font-bold text-slate-500 outline-none focus:bg-white"
        />
      </td>
      <td className="border border-slate-200 px-2 text-right w-28 bg-blue-50/30">
        <span className="font-mono font-black text-[12px] text-slate-900">
          {(Number(localValues.material) + Number(localValues.labor) + Number(localValues.expense)).toLocaleString()}
        </span>
      </td>
      <td className="border border-slate-200 p-0 w-20 bg-amber-50/30">
        <input 
          type="text" 
          value={localValues.lastRepairYear}
          onChange={(e) => handleInputChange('lastRepairYear', e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent px-1 text-center font-black text-amber-700 outline-none focus:bg-white"
        />
      </td>
      <td className="border border-slate-200 p-0 flex-1">
        <input 
          type="text" 
          value={localValues.remarks}
          onChange={(e) => handleInputChange('remarks', e.target.value)}
          onBlur={handleBlur}
          placeholder="특이사항..."
          className="w-full h-full bg-transparent px-3 text-left text-[10px] outline-none font-medium text-slate-500"
        />
      </td>
      <td className="border border-slate-200 w-10 text-center bg-slate-50/30">
        <button 
          onClick={() => onDelete(std.id)}
          className="text-slate-300 hover:text-red-500 transition-all"
        >
          <i className="fas fa-trash-alt text-[10px]"></i>
        </button>
      </td>
    </tr>
  );
});

const MaintenanceStandards: React.FC<MaintenanceStandardsProps> = ({ standards, onUpdate, onDelete, onMigrate, showConfirm }) => {
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredStandards = useMemo(() => {
    return standards.filter(std => {
      const matchCategory = filterCategory === '전체' || std.mainCategory === filterCategory;
      const matchSearch = (std.item || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (std.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [standards, filterCategory, searchTerm]);

  const handleRowUpdate = useCallback((updatedStd: MaintenanceStandard) => {
    onUpdate(standards.map(s => s.id === updatedStd.id ? updatedStd : s));
  }, [standards, onUpdate]);

  const handleAddStandard = (newStd: MaintenanceStandard) => {
    onUpdate([newStd, ...standards]);
  };

  const handleDeleteWithConfirm = useCallback((id: string) => {
    const itemToDelete = standards.find(s => s.id === id);
    if (!itemToDelete) return;

    showConfirm(
      "마스터 항목 삭제",
      `[${itemToDelete.item}] 항목을 마스터 DB에서 삭제하시겠습니까?\n삭제된 항목은 더 이상 단지 계획 수립 시 불러올 수 없습니다.`,
      () => onDelete(id)
    );
  }, [standards, onDelete, showConfirm]);

  const exportToExcel = () => {
    const rows = filteredStandards.map((s, idx) => ({
      "번호": idx + 1,
      "대분류": s.mainCategory,
      "중분류": s.subCategory,
      "공사항목": s.item,
      "수선방법": s.method,
      "주기(년)": s.cycleYears,
      "수선율(%)": s.repairRate,
      "단위": s.unit,
      "재료비": s.material || 0,
      "노무비": s.labor || 0,
      "경비": s.expense || 0,
      "표준단가": s.unitPrice * 10000,
      "최종수선(단가기준)": s.lastRepairYear,
      "비고": s.remarks || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "표준기준DB");
    XLSX.writeFile(workbook, `장기수선_표준기준_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredStandards.map((s, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td style="text-align:center">${s.mainCategory}</td>
        <td style="text-align:center">${s.subCategory}</td>
        <td style="font-weight:bold">${s.item}</td>
        <td style="text-align:center">${s.method}</td>
        <td style="text-align:center">${s.cycleYears}</td>
        <td style="text-align:center">${s.repairRate}%</td>
        <td style="text-align:center">${s.unit}</td>
        <td style="text-align:right">${(s.material || 0).toLocaleString()}</td>
        <td style="text-align:right">${(s.labor || 0).toLocaleString()}</td>
        <td style="text-align:right">${(s.expense || 0).toLocaleString()}</td>
        <td style="text-align:right; font-weight:bold">${Math.round(s.unitPrice * 10000).toLocaleString()}</td>
        <td style="text-align:center; color:#b45309">${s.lastRepairYear}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>장기수선 수립 기준표 인쇄</title>
          <style>
            table { width: 100%; border-collapse: collapse; font-size: 8pt; }
            th, td { border: 1px solid #cbd5e1; padding: 4px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>장기수선 수립 기준표</h1>
          <table>
            <thead>
              <tr>
                <th>No</th><th>대분류</th><th>중분류</th><th>공사항목</th><th>방법</th><th>주기</th><th>수선율</th><th>단위</th><th>재료비</th><th>노무비</th><th>경비</th><th>합계</th><th>최종수선</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-center px-1 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <i className="fas fa-database text-blue-600"></i>
            수립 기준 마스터 DB
          </h2>
          <p className="text-slate-500 text-xs font-bold mt-1">세부 산출 근거(재료비/노무비/경비) 기반의 정밀 관리 모드입니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-2">
            <i className="fas fa-file-excel"></i> Excel 내보내기
          </button>
          <button onClick={handlePrint} className="bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2">
            <i className="fas fa-print"></i> PDF 인쇄
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center gap-2">
            <i className="fas fa-plus"></i> 표준 항목 추가
          </button>
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
             <i className="fas fa-search text-slate-300"></i>
             <input type="text" placeholder="마스터 DB 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-xs font-black outline-none w-48" />
          </div>
        </div>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto scrollbar-thin relative">
          {standards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-40">
              <button onClick={onMigrate} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">클라우드 데이터 동기화</button>
            </div>
          ) : (
            <table className="w-full border-collapse border-spacing-0 table-fixed min-w-[1500px]">
              <thead>
                <tr className="sticky top-0 z-40 bg-slate-50 shadow-sm h-12">
                  <th className="w-10 sticky left-0 z-50 bg-slate-100 border-r border-slate-200"></th>
                  <th className="w-24 px-1 sticky left-10 z-50 bg-slate-50 border-r border-slate-200 text-[10px] font-black">대분류</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-24 px-1 sticky left-[130px] z-50 bg-slate-50 border-r border-slate-200">중분류</th>
                  <th className="text-[11px] font-black text-slate-900 uppercase px-4 text-left w-64 sticky left-[226px] z-50 bg-slate-50 border-r border-slate-200">공사항목</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-28 px-1">방법</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-12 px-1">주기</th>
                  <th className="text-[11px] font-black text-blue-600 uppercase w-16 px-1">수선율</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-12 px-1">단위</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-24 px-1">재료비</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-24 px-1">노무비</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase w-20 px-1">경비</th>
                  <th className="text-[11px] font-black text-slate-900 uppercase w-28 px-2 text-right bg-blue-50/30">표준단가</th>
                  <th className="text-[11px] font-black text-amber-700 uppercase w-20 px-1 bg-amber-50/30">최종수선</th>
                  <th className="text-[11px] font-black text-slate-400 uppercase px-4 text-left flex-1">비고</th>
                  <th className="w-10 px-1"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredStandards.map((std, idx) => (
                  <StandardRow key={std.id} std={std} index={idx} onRowUpdate={handleRowUpdate} onDelete={handleDeleteWithConfirm} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddStandardModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddStandard} 
        standards={standards}
      />
    </div>
  );
};

export default MaintenanceStandards;
