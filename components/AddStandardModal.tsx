
import React, { useState, useEffect } from 'react';
import { MaintenanceCategory, MaintenanceStandard } from '../types';
import { CATEGORIES, SUB_CATEGORIES_MAP, REPAIR_METHODS, UNITS, SUB_CATEGORY_CODES } from '../constants';

interface AddStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (standard: MaintenanceStandard) => void;
  standards: MaintenanceStandard[]; // 기존 리스트를 받아 마지막 번호 계산에 사용
}

const AddStandardModal: React.FC<AddStandardModalProps> = ({ isOpen, onClose, onAdd, standards }) => {
  const initialFormData = {
    mainCategory: CATEGORIES[0],
    subCategory: SUB_CATEGORIES_MAP[CATEGORIES[0]][0],
    item: '',
    method: REPAIR_METHODS[0],
    unit: UNITS[0],
    cycleYears: 10,
    repairRate: 100,
    material: 0,
    labor: 0,
    expense: 0,
    lastRepairYear: 2025,
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const availableSubs = SUB_CATEGORIES_MAP[formData.mainCategory as MaintenanceCategory];
    setFormData(prev => ({
      ...prev,
      subCategory: availableSubs ? availableSubs[0] : ''
    }));
  }, [formData.mainCategory]);

  if (!isOpen) return null;

  const totalPrice = formData.material + formData.labor + formData.expense;

  // 요구사항: 대분류코드(중분류 Prefix) - (해당 분류 내 마지막 코드 + 1) 자동 생성
  const generateNextCode = (subCategory: string): string => {
    const prefix = SUB_CATEGORY_CODES[subCategory] || '99'; // 매핑 없을 시 99
    
    // 현재 리스트에서 해당 중분류 Prefix로 시작하는 코드들을 추출
    const sameSubCodes = standards
      .filter(s => s.code && s.code.startsWith(`${prefix}-`))
      .map(s => {
        const parts = s.code.split('-');
        return parts.length > 1 ? parseInt(parts[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const maxSuffix = sameSubCodes.length > 0 ? Math.max(...sameSubCodes) : 0;
    const nextSuffix = (maxSuffix + 1).toString().padStart(2, '0');
    
    return `${prefix}-${nextSuffix}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item) {
      alert('공사 항목명을 입력해주세요.');
      return;
    }

    const nextCode = generateNextCode(formData.subCategory);
    
    const newStandard: MaintenanceStandard = {
      id: crypto.randomUUID(),
      code: nextCode, 
      mainCategory: formData.mainCategory as MaintenanceCategory,
      subCategory: formData.subCategory,
      category: formData.mainCategory as MaintenanceCategory,
      item: formData.item,
      method: formData.method,
      unit: formData.unit,
      unitPrice: totalPrice / 10000,
      repairRate: formData.repairRate,
      cycleYears: formData.cycleYears,
      lastRepairYear: formData.lastRepairYear,
      breakdown: { 
        material: formData.material, 
        labor: formData.labor, 
        expense: formData.expense 
      },
      remarks: formData.remarks
    };

    onAdd(newStandard);
    setFormData(initialFormData);
    onClose();
  };

  const handleNumChange = (field: string, val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ''));
    setFormData(prev => ({ ...prev, [field]: num }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
              <i className="fas fa-database text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">마스터 DB 표준 등록</h3>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-0.5">Register New Master Standard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대분류</label>
              <select value={formData.mainCategory} onChange={(e) => setFormData({...formData, mainCategory: e.target.value as MaintenanceCategory})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">중분류</label>
              <select value={formData.subCategory} onChange={(e) => setFormData({...formData, subCategory: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 text-blue-600">
                {SUB_CATEGORIES_MAP[formData.mainCategory as MaintenanceCategory]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">공사항목명</label>
            <input type="text" placeholder="예: 아스팔트 싱글 부분 보수" value={formData.item} onChange={(e) => setFormData({...formData, item: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수선방법</label>
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                {REPAIR_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주기(년)</label>
              <input type="text" value={formData.cycleYears} onChange={(e) => handleNumChange('cycleYears', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-center" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수선율(%)</label>
              <input type="text" value={formData.repairRate} onChange={(e) => handleNumChange('repairRate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-center text-blue-600" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 space-y-4">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center border-b border-white/10 pb-2">세부 산출 근거 (원 단위)</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">재료비</label>
                <input type="text" value={formData.material.toLocaleString()} onChange={(e) => handleNumChange('material', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white text-right" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">노무비</label>
                <input type="text" value={formData.labor.toLocaleString()} onChange={(e) => handleNumChange('labor', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white text-right" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">경비</label>
                <input type="text" value={formData.expense.toLocaleString()} onChange={(e) => handleNumChange('expense', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white text-right" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-[11px] font-black text-white/60">최종 표준단가 합계</span>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400">{totalPrice.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-white/40 ml-1">원</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">단가 기준 연도</label>
              <input type="text" value={formData.lastRepairYear} onChange={(e) => handleNumChange('lastRepairYear', e.target.value)} className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-black text-amber-700 text-center" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비고</label>
              <input type="text" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} placeholder="특이사항 입력..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium" />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition-all">취소</button>
            <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">마스터 DB 등록 완료</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStandardModal;
