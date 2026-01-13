
import React, { useState, useEffect, useMemo } from 'react';
import { Apartment, AnnualRate, UnitType } from '../types';

interface ApartmentDetailProps {
  apartment: Apartment | null;
  onUpdate: (updatedApt: Apartment) => Promise<void>;
  onAdd: () => void;
  onCancelAdd: () => void; // 취소 콜백 추가
  onDelete: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ApartmentDetail: React.FC<ApartmentDetailProps> = ({ apartment, onUpdate, onAdd, onCancelAdd, onDelete, showConfirm }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const cleanDate = (d: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.split('(')[0].replace(/[^\d-]/g, '').trim();
  };

  const getYearMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const addMonth = (yearMonth: string, months: number) => {
    if (!yearMonth) return "";
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + months, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [localInfo, setLocalInfo] = useState({
    name: '',
    approvalDate: cleanDate(''),
    planPeriod: 40,
    inflationRate: 2.5
  });
  
  const [localRates, setLocalRates] = useState<AnnualRate[]>([]);
  const [localUnitTypes, setLocalUnitTypes] = useState<UnitType[]>([]);

  const approvalYM = useMemo(() => getYearMonth(localInfo.approvalDate), [localInfo.approvalDate]);
  const planEndYM = useMemo(() => addMonth(approvalYM, localInfo.planPeriod * 12), [approvalYM, localInfo.planPeriod]);
  const totalRate = useMemo(() => localRates.reduce((sum, r) => sum + (Number(r.rate) || 0), 0), [localRates]);

  useEffect(() => {
    if (apartment) {
      setLocalInfo({
        name: apartment.name,
        approvalDate: cleanDate(apartment.approvalDate),
        planPeriod: apartment.planPeriod,
        inflationRate: apartment.inflationRate ?? 2.5
      });
      setLocalRates(apartment.annualRates || []);
      setLocalUnitTypes(apartment.unitTypes || []);
    } else {
      setLocalInfo({
        name: '',
        approvalDate: new Date().toISOString().split('T')[0],
        planPeriod: 40,
        inflationRate: 2.5
      });
      setLocalRates([]);
      setLocalUnitTypes([]);
    }
    setHasChanges(false);
  }, [apartment]);

  const alignRatesDates = (rates: AnnualRate[]) => {
    return rates.map((r, idx) => {
      const start = idx === 0 ? approvalYM : addMonth(rates[idx - 1].endPeriod, 1);
      const end = idx === rates.length - 1 ? planEndYM : r.endPeriod;
      return { ...r, startPeriod: start, endPeriod: end };
    });
  };

  const handleSave = async () => {
    if (!localInfo.name) { alert("아파트 이름을 입력해주세요."); return; }
    if (localRates.length > 0 && totalRate !== 100) {
      alert(`적립요율의 총합은 반드시 100%가 되어야 합니다. (현재: ${totalRate}%)`);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate({
        id: apartment?.id || crypto.randomUUID(),
        ...localInfo,
        annualRates: alignRatesDates(localRates),
        unitTypes: localUnitTypes
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newVal = (name === 'planPeriod' || name === 'inflationRate') ? parseFloat(value) : value;
    setLocalInfo(prev => ({ ...prev, [name]: newVal }));
    setHasChanges(true);
  };

  const addUnitType = () => {
    setLocalUnitTypes([...localUnitTypes, { id: crypto.randomUUID(), type: '', privateArea: 0, supplyArea: 0, households: 0 }]);
    setHasChanges(true);
  };

  const updateUnitType = (id: string, field: keyof UnitType, value: any) => {
    setLocalUnitTypes(prev => prev.map(ut => ut.id === id ? { ...ut, [field]: value } : ut));
    setHasChanges(true);
  };

  const removeUnitType = (id: string) => {
    setLocalUnitTypes(prev => prev.filter(ut => ut.id !== id));
    setHasChanges(true);
  };

  const addRate = () => {
    const lastRate = localRates[localRates.length - 1];
    const nextStart = lastRate ? addMonth(lastRate.endPeriod, 1) : approvalYM;
    const newRate: AnnualRate = { 
      id: crypto.randomUUID(), 
      startPeriod: nextStart, 
      endPeriod: planEndYM, 
      rate: Math.max(0, 100 - totalRate) 
    };
    const updated = alignRatesDates([...localRates, newRate]);
    setLocalRates(updated);
    setHasChanges(true);
  };

  const updateRate = (id: string, field: keyof AnnualRate, value: any) => {
    const updated = localRates.map(r => r.id === id ? { ...r, [field]: value } : r);
    setLocalRates(alignRatesDates(updated));
    setHasChanges(true);
  };

  const removeRate = (id: string) => {
    const updated = localRates.filter(r => r.id !== id);
    setLocalRates(alignRatesDates(updated));
    setHasChanges(true);
  };

  const totalHouseholds = localUnitTypes.reduce((sum, ut) => sum + (Number(ut.households) || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{apartment?.name ? '단지 정보 관리' : '신규 단지 등록'}</h2>
          <p className="text-slate-500 mt-1 text-sm font-bold">장기수선계획 수립을 위한 기초 자산 정보를 입력합니다.</p>
        </div>
        <div className="flex gap-3">
           {apartment?.name ? (
             <>
               <button 
                 onClick={onDelete} 
                 className="px-6 py-4 rounded-2xl text-xs font-black bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2"
               >
                 <i className="fas fa-trash-can"></i> 단지 삭제
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={isSaving || !hasChanges} 
                 className={`px-8 py-4 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center gap-2 ${!hasChanges ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-200'}`}
               >
                 {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} 
                 변경사항 저장하기
               </button>
               <button onClick={onAdd} className="px-6 py-4 rounded-2xl text-xs font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                 <i className="fas fa-plus"></i> 새 단지 추가
               </button>
             </>
           ) : (
             <>
               <button 
                 onClick={onCancelAdd} 
                 className="px-6 py-4 rounded-2xl text-xs font-black bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
               >
                 작업 취소
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={isSaving} 
                 className="px-8 py-4 rounded-2xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-200 transition-all flex items-center gap-2"
               >
                 {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} 
                 새 단지 등록하기
               </button>
             </>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xs">
                <i className="fas fa-sliders"></i>
              </div>
              기본 설정
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">아파트 명칭</label>
                <input type="text" name="name" value={localInfo.name} onChange={handleInfoChange} placeholder="아파트 이름 입력" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
              </div>
              
              <div className="grid grid-cols-[1.3fr_0.7fr] gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">사용승인일</label>
                  <input type="date" name="approvalDate" value={localInfo.approvalDate} onChange={handleInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">계획기간 (년)</label>
                  <input type="number" name="planPeriod" value={localInfo.planPeriod} onChange={handleInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">적용 물가상승률</label>
                  <span className="text-2xl font-black text-blue-600">{localInfo.inflationRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="20" step="0.1" 
                  name="inflationRate" 
                  value={localInfo.inflationRate} 
                  onChange={handleInfoChange}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-4">
             <div className="flex items-center gap-3">
               <i className="fas fa-users text-blue-400 text-xl"></i>
               <h4 className="text-xl font-black">단지 규모 요약</h4>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black text-white/40 uppercase mb-1">총 세대수</p>
                   <p className="text-2xl font-black">{totalHouseholds.toLocaleString()} <span className="text-xs opacity-50">세대</span></p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black text-white/40 uppercase mb-1">유형 종류</p>
                   <p className="text-2xl font-black">{localUnitTypes.length} <span className="text-xs opacity-50">종</span></p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-xs">
                  <i className="fas fa-layer-group"></i>
                </div>
                세대 유형 구성 관리
              </h3>
              <button onClick={addUnitType} className="text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                <i className="fas fa-plus mr-1"></i> 유형 추가
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-2">타입명</th>
                    <th className="px-4 py-2">전용면적(m²)</th>
                    <th className="px-4 py-2">공급면적(m²)</th>
                    <th className="px-4 py-2">세대수</th>
                    <th className="px-4 py-2 text-center w-10">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {localUnitTypes.map((ut) => (
                    <tr key={ut.id} className="group">
                      <td className="bg-slate-50 first:rounded-l-2xl px-4 py-3"><input type="text" value={ut.type} onChange={(e) => updateUnitType(ut.id, 'type', e.target.value)} placeholder="84A" className="bg-transparent border-none outline-none font-black text-sm w-full" /></td>
                      <td className="bg-slate-50 px-4 py-3"><input type="number" value={ut.privateArea} onChange={(e) => updateUnitType(ut.id, 'privateArea', parseFloat(e.target.value))} className="bg-transparent border-none outline-none font-mono font-bold text-sm w-full" /></td>
                      <td className="bg-slate-50 px-4 py-3"><input type="number" value={ut.supplyArea} onChange={(e) => updateUnitType(ut.id, 'supplyArea', parseFloat(e.target.value))} className="bg-transparent border-none outline-none font-mono font-bold text-sm w-full" /></td>
                      <td className="bg-slate-50 px-4 py-3"><input type="number" value={ut.households} onChange={(e) => updateUnitType(ut.id, 'households', parseInt(e.target.value))} className="bg-transparent border-none outline-none font-black text-sm text-blue-600 w-full" /></td>
                      <td className="bg-slate-50 last:rounded-r-2xl px-4 py-3 text-center">
                        <button onClick={() => removeUnitType(ut.id)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                      </td>
                    </tr>
                  ))}
                  {localUnitTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[11px] font-bold text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">등록된 유형 정보가 없습니다. '유형 추가'를 눌러 시작하세요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-xs">
                    <i className="fas fa-percentage"></i>
                  </div>
                  연차별 충당금 적립요율 설정
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">날짜는 이전 구간과 연동되며, 총합은 100%가 되어야 합니다.</p>
              </div>
              <button onClick={addRate} className="text-[10px] font-black bg-slate-100 text-slate-600 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all">
                <i className="fas fa-plus mr-1"></i> 구간 추가
              </button>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {localRates.map((r, idx) => {
                   const isFirst = idx === 0;
                   const isLast = idx === localRates.length - 1;
                   return (
                     <div key={r.id} className={`p-6 rounded-3xl border relative group transition-all ${totalRate === 100 ? 'bg-slate-50 border-slate-100' : 'bg-red-50/30 border-red-100'}`}>
                        <button onClick={() => removeRate(r.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-xs"></i></button>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full">구간 {idx+1}</span>
                          {isFirst && <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">사용승인일 시작</span>}
                          {isLast && <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">계획종료일 마감</span>}
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <input 
                                  type="month" 
                                  value={r.startPeriod} 
                                  readOnly={isFirst}
                                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none ${isFirst ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} 
                                />
                                <span className="absolute -top-3 left-2 px-1 bg-white text-[8px] font-black text-slate-400">START</span>
                              </div>
                              <span className="text-slate-300 font-black"><i className="fas fa-arrow-right-long"></i></span>
                              <div className="flex-1 relative">
                                <input 
                                  type="month" 
                                  value={r.endPeriod} 
                                  readOnly={isLast}
                                  onChange={(e) => updateRate(r.id, 'endPeriod', e.target.value)} 
                                  className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none ${isLast ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'focus:ring-2 focus:ring-blue-500'}`} 
                                />
                                <span className="absolute -top-3 left-2 px-1 bg-white text-[8px] font-black text-slate-400">END</span>
                              </div>
                           </div>
                           <div className="flex items-center justify-between pt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">해당 기간 적립율</span>
                              <div className="flex items-center gap-2">
                                 <input 
                                   type="number" 
                                   value={r.rate} 
                                   onChange={(e) => updateRate(r.id, 'rate', parseFloat(e.target.value))} 
                                   className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-1 text-right text-sm font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                                 />
                                 <span className="text-xs font-black text-slate-400">%</span>
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                 })}
               </div>

               {localRates.length === 0 ? (
                 <div className="py-12 text-center text-[11px] font-bold text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl italic">
                   구간별 적립 요율 정보가 정의되지 않았습니다.
                 </div>
               ) : (
                 <div className={`mt-4 p-5 rounded-2xl border flex items-center justify-between ${totalRate === 100 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${totalRate === 100 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}>
                          <i className={`fas ${totalRate === 100 ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
                       </div>
                       <div>
                          <p className={`text-xs font-black ${totalRate === 100 ? 'text-emerald-700' : 'text-red-700'}`}>
                             {totalRate === 100 ? '적립 요율 구성이 올바릅니다.' : `적립 요율 합계가 ${totalRate}%입니다. 100%가 되도록 조정해주세요.`}
                          </p>
                          <div className="w-48 h-1.5 bg-white rounded-full mt-1 overflow-hidden">
                             <div className={`h-full transition-all duration-500 ${totalRate === 100 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, totalRate)}%` }}></div>
                          </div>
                       </div>
                    </div>
                    <span className={`text-2xl font-black ${totalRate === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{totalRate}%</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentDetail;
