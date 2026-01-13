
import React, { useState, useEffect } from 'react';
import { MaintenanceCategory, MaintenanceStandard } from '../types';
import { CATEGORIES, SUB_CATEGORIES_MAP, REPAIR_METHODS, UNITS } from '../constants';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (standard: MaintenanceStandard) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    mainCategory: CATEGORIES[0],
    subCategory: SUB_CATEGORIES_MAP[CATEGORIES[0]][0],
    item: '',
    method: REPAIR_METHODS[0],
    unit: UNITS[0],
    cycleYears: 10,
    repairRate: 100,
    unitPrice: 0,
    remarks: ''
  });

  // 대분류 변경 시 중분류 첫 번째 항목으로 자동 초기화
  useEffect(() => {
    const availableSubs = SUB_CATEGORIES_MAP[formData.mainCategory as MaintenanceCategory];
    setFormData(prev => ({
      ...prev,
      subCategory: availableSubs ? availableSubs[0] : ''
    }));
  }, [formData.mainCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item) {
      alert('공사 항목명을 입력해주세요.');
      return;
    }

    const newStandard: MaintenanceStandard = {
      id: crypto.randomUUID(),
      code: 'NEW', // 실제 시스템에서는 카테고리별 코드를 자동 생성할 수 있음
      mainCategory: formData.mainCategory as MaintenanceCategory,
      subCategory: formData.subCategory,
      category: formData.mainCategory as MaintenanceCategory,
      item: formData.item,
      detail: `${formData.subCategory} 관련 신규 공사`,
      method: formData.method,
      unit: formData.unit,
      unitPrice: formData.unitPrice,
      repairRate: formData.repairRate,
      cycleYears: formData.cycleYears,
      lastRepairYear: 2025,
      breakdown: { material: 0, labor: 0, expense: 0 },
      remarks: formData.remarks
    };

    onAdd(newStandard);
    onClose();
    // 폼 초기화
    setFormData({
      mainCategory: CATEGORIES[0],
      subCategory: SUB_CATEGORIES_MAP[CATEGORIES[0]][0],
      item: '',
      method: REPAIR_METHODS[0],
      unit: UNITS[0],
      cycleYears: 10,
      repairRate: 100,
      unitPrice: 0,
      remarks: ''
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-plus-circle text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">신규 공사종별 추가</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Add New Maintenance Category</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 대분류 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대분류 (Major Category)</label>
              <select 
                value={formData.mainCategory}
                onChange={(e) => setFormData({...formData, mainCategory: e.target.value as MaintenanceCategory})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* 중분류 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">중분류 (Sub Category)</label>
              <select 
                value={formData.subCategory}
                onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                {SUB_CATEGORIES_MAP[formData.mainCategory as MaintenanceCategory]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 항목명 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">공사항목명 (Item Name)</label>
            <input 
              type="text"
              placeholder="예: 외벽 크랙 보수 및 방수"
              value={formData.item}
              onChange={(e) => setFormData({...formData, item: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수선방법</label>
              <select 
                value={formData.method}
                onChange={(e) => setFormData({...formData, method: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 outline-none"
              >
                {REPAIR_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">단위</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 outline-none"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주기 (년)</label>
              <input 
                type="number"
                value={formData.cycleYears}
                onChange={(e) => setFormData({...formData, cycleYears: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수선율 (%)</label>
                <input 
                  type="number"
                  value={formData.repairRate}
                  onChange={(e) => setFormData({...formData, repairRate: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-blue-600 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">기준단가 (만원)</label>
                <input 
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-emerald-600 outline-none"
                />
              </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
            >
              취소
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
            >
              항목 추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
