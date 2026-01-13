
import React, { useState } from 'react';
import { MaintenanceItem } from '../types';

interface ExecutionModalProps {
  item: MaintenanceItem;
  onClose: () => void;
  onConfirm: (executionData: {
    actualCost: number;
    executionDate: string;
    contractor: string;
    remarks: string;
  }) => void;
}

const ExecutionModal: React.FC<ExecutionModalProps> = ({ item, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    actualCost: Math.round(item.estimatedCost * 10000), // 기본값으로 계획 금액 제안
    executionDate: new Date().toISOString().split('T')[0],
    contractor: '',
    remarks: ''
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">공사 집행 완료 처리</h3>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">{item.item} ({item.code})</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-2">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">계획 정보</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">계획 연도: {item.nextRepairYear}년</span>
              <span className="text-xs font-bold text-slate-500">예상 비용: {Math.round(item.estimatedCost * 10000).toLocaleString()}원</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">실제 집행 금액 (원)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.actualCost.toLocaleString()}
                  onChange={(e) => setFormData({...formData, actualCost: Number(e.target.value.replace(/[^0-9]/g, ''))})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm"
                />
                <span className="absolute right-4 top-3 text-slate-400 font-black text-xs">원</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">실제 수선 일자</label>
                <input 
                  type="date" 
                  value={formData.executionDate}
                  onChange={(e) => setFormData({...formData, executionDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">시공 업체</label>
                <input 
                  type="text" 
                  placeholder="업체명 입력"
                  value={formData.contractor}
                  onChange={(e) => setFormData({...formData, contractor: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">집행 특이사항</label>
              <textarea 
                rows={3}
                placeholder="공사 내용 및 특이사항 기록"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
            >
              취소
            </button>
            <button 
              onClick={() => onConfirm(formData)}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              집행 완료 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionModal;
