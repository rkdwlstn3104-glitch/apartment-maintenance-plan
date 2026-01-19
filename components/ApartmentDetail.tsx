
import React, { useState, useEffect, useMemo } from 'react';
import { Apartment, AnnualRate, UnitType } from '../types';

interface ApartmentDetailProps {
  apartment: Apartment | null;
  onUpdate: (updatedApt: Apartment) => Promise<void>;
  onAdd: () => void;
  onCancelAdd: () => void;
  onDelete: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ApartmentDetail: React.FC<ApartmentDetailProps> = ({ apartment, onUpdate, onAdd, onCancelAdd, onDelete, showConfirm }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const cleanDate = (d: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.split('T')[0].split('(')[0].replace(/[^\d-]/g, '').trim();
  };

  const getYearMonth = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const addMonth = (yearMonth: string, months: number) => {
    if (!yearMonth) return "";
    const parts = yearMonth.split('-');
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
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
  const planEndYM = useMemo(() => addMonth(approvalYM, localInfo.planPeriod * 12 - 1), [approvalYM, localInfo.planPeriod]);
  
  const totalRate = useMemo(() => {
    const sum = localRates.reduce((sum, r) => sum + (Number(r.rate) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [localRates]);

  const isRateComplete = Math.abs(totalRate - 100) < 0.01;

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

  const validateIntegrity = () => {
    if (!localInfo.name) {
      alert("아파트 명칭을 입력해주세요.");
      return false;
    }
    if (localRates.length === 0) return true;
    if (!isRateComplete) {
      alert(`적립요율의 총합은 100%가 되어야 합니다. (현재: ${totalRate}%)`);
      return false;
    }
    if (localRates[0].startPeriod !== approvalYM) {
      alert(`첫 번째 구간의 시작일은 사용승인일(${approvalYM})과 일치해야 합니다.`);
      return false;
    }
    for (let i = 0; i < localRates.length; i++) {
      const r = localRates[i];
      if (r.startPeriod > r.endPeriod) {
        alert(`구간 ${i + 1}의 시작년월이 종료년월보다 늦습니다.`);
        return false;
      }
      if (i > 0) {
        const prev = localRates[i - 1];
        const expectedStart = addMonth(prev.endPeriod, 1);
        if (r.startPeriod !== expectedStart) {
          alert(`구간 ${i}와 구간 ${i + 1}의 날짜가 연속되지 않습니다.`);
          return false;
        }
      }
    }
    const lastRate = localRates[localRates.length - 1];
    if (lastRate.endPeriod !== planEndYM) {
      alert(`마지막 구간의 종료일(${lastRate.endPeriod})은 계획종료일(${planEndYM})과 일치해야 합니다.`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateIntegrity()) return;
    setIsSaving(true);
    try {
      await onUpdate({
        id: apartment?.id || crypto.randomUUID(),
        ...localInfo,
        annualRates: localRates,
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

  const updateUnitType = (id: string, field: keyof UnitType, value: any) => {
    setLocalUnitTypes(prev => prev.map(ut => ut.id === id ? { ...ut, [field]: value } : ut));
    setHasChanges(true);
  };

  const removeUnitType = (id: string) => {
    setLocalUnitTypes(prev => prev.filter(ut => ut.id !== id));
    setHasChanges(true);
  };

  const addRate = () => {
    const newRates = [...localRates];
    if (newRates.length === 0) {
      setLocalRates([{ id: crypto.randomUUID(), startPeriod: approvalYM, endPeriod: planEndYM, rate: 100 }]);
    } else {
      const last = newRates[newRates.length - 1];
      const nextStart = addMonth(last.endPeriod, 1);
      const nextEnd = addMonth(nextStart, 11); 
      newRates.push({ id: crypto.randomUUID(), startPeriod: nextStart, endPeriod: nextEnd, rate: 0 });
      setLocalRates(newRates);
    }
    setHasChanges(true);
  };

  const updateRate = (id: string, field: keyof AnnualRate, value: any) => {
    setLocalRates(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const newRates = [...prev];
      newRates[idx] = { ...newRates[idx], [field]: value };
      
      if (field === 'endPeriod' && idx < newRates.length - 1) {
        newRates[idx + 1] = { ...newRates[idx + 1], startPeriod: addMonth(value, 1) };
      }
      return newRates;
    });
    setHasChanges(true);
  };

  const removeRate = (id: string) => {
    if (localRates.length <= 1) return;
    const updated = localRates.filter(r => r.id !== id);
    setLocalRates(updated);
    setHasChanges(true);
  };

  const totalHouseholds = localUnitTypes.reduce((sum, ut) => sum + (Number(ut.households) || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {apartment?.name ? '단지 정보 관리' : '신규 단지 등록'}
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-bold flex items-center gap-2">
            <i className="fas fa-database text-blue-600"></i>
            데이터베이스 마스터 정보를 저장하고 관리합니다.
          </p>
        </div>
        <div className="flex gap-3">
           {apartment?.name ? (
             <>
               <button onClick={onDelete} className="px-6 py-4 rounded-2xl text-xs font-black bg-white text-red-500 border border-red-100 hover:bg-red-50 transition-all flex items-center gap-2">
                 <i className="fas fa-trash-can"></i> 단지 삭제
               </button>
               {/* [개선] 명칭을 '수정사항 저장하기'로 변경하고 디자인 강화 */}
               <button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges} 
                className={`px-8 py-4 rounded-2xl text-xs font-black shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
                  !hasChanges 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-200 ring-4 ring-blue-500/10'
                }`}
               >
                 {isSaving ? (
                   <i className="fas fa-spinner fa-spin"></i>
                 ) : (
                   <i className="fas fa-floppy-disk"></i>
                 )} 
                 수정사항 저장하기
               </button>
               <button onClick={onAdd} className="px-6 py-4 rounded-2xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                 <i className="fas fa-plus"></i> 새 단지 추가
               </button>
             </>
           ) : (
             <>
               <button onClick={onCancelAdd} className="px-6 py-4 rounded-2xl text-xs font-black bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2">
                 작업 취소
               </button>
               {/* [개선] 신규 등록 시에도 '저장' 의미를 강조 */}
               <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="px-8 py-4 rounded-2xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 active:scale-95"
               >
                 {isSaving ? (
                   <i className="fas fa-spinner fa-spin"></i>
                 ) : (
                   <i className="fas fa-cloud-arrow-up"></i>
                 )} 
                 단지 정보 저장 및 등록
               </button>
             </>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xs"><i className="fas fa-sliders"></i></div>
              기본 정보 (Apartments)
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">아파트 명칭</label>
                <input type="text" name="name" value={localInfo.name} onChange={handleInfoChange} placeholder="아파트 이름 입력" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
              </div>
              <div className="grid grid-cols-[1.3fr_0.7fr] gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">사용승인일 (APPROVAL_DATE)</label>
                  <input type="date" name="approvalDate" value={localInfo.approvalDate} onChange={handleInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">계획기간 (년)</label>
                  <input type="number" name="planPeriod" value={localInfo.planPeriod} onChange={handleInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">적용 물가상승률 (%)</label>
                  <span className="text-2xl font-black text-blue-600">{localInfo.inflationRate}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" name="inflationRate" value={localInfo.inflationRate} onChange={handleInfoChange} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6">단지 규모 요약</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">총 세대수</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-white">{totalHouseholds}</span>
                   <span className="text-[10px] font-bold text-slate-500">세대</span>
                 </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">유형 종류</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-white">{localUnitTypes.length}</span>
                   <span className="text-[10px] font-bold text-slate-500">종</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-xs"><i className="fas fa-layer-group"></i></div>
                세대 유형 (Unit Types)
              </h3>
              <button onClick={() => { setLocalUnitTypes([...localUnitTypes, { id: crypto.randomUUID(), type: '', privateArea: 0, commonArea: 0, households: 0 }]); setHasChanges(true); }} className="text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">유형 추가</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-2">타입명</th>
                    <th className="px-4 py-2">공급면적(m²)</th>
                    <th className="px-4 py-2">전용면적(m²)</th>
                    <th className="px-4 py-2">세대수</th>
                    <th className="px-4 py-2 text-center w-10">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {localUnitTypes.map((ut) => (
                    <tr key={ut.id} className="group">
                      <td className="bg-slate-50 first:rounded-l-2xl px-4 py-3">
                        <input type="text" value={ut.type} onChange={(e) => updateUnitType(ut.id, 'type', e.target.value)} className="bg-transparent border-none outline-none font-black text-sm w-full" placeholder="예: 84A" />
                      </td>
                      <td className="bg-slate-50 px-4 py-3">
                        <input type="number" value={ut.commonArea} onChange={(e) => updateUnitType(ut.id, 'commonArea', parseFloat(e.target.value))} className="bg-transparent border-none outline-none font-mono font-bold text-sm w-full text-blue-600" />
                      </td>
                      <td className="bg-slate-50 px-4 py-3">
                        <input type="number" value={ut.privateArea} onChange={(e) => updateUnitType(ut.id, 'privateArea', parseFloat(e.target.value))} className="bg-transparent border-none outline-none font-mono font-bold text-sm w-full" />
                      </td>
                      <td className="bg-slate-50 px-4 py-3">
                        <input type="number" value={ut.households} onChange={(e) => updateUnitType(ut.id, 'households', parseInt(e.target.value))} className="bg-transparent border-none outline-none font-black text-sm text-slate-900 w-full" />
                      </td>
                      <td className="bg-slate-50 last:rounded-r-2xl px-4 py-3 text-center">
                        <button onClick={() => removeUnitType(ut.id)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                      </td>
                    </tr>
                  ))}
                  {localUnitTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold italic">
                        추가된 세대 유형이 없습니다. 상단의 '유형 추가' 버튼을 눌러주세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-xs"><i className="fas fa-percent"></i></div>
                  연차별 충당금 적립요율 설정
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 ml-11 uppercase tracking-tight">수정은 자유롭게 가능하며, 저장 시에만 무결성을 최종 점검합니다.</p>
              </div>
              <button 
                onClick={addRate} 
                className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-200"
              >
                구간 추가
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-2">시작년월</th>
                    <th className="px-4 py-2">종료년월</th>
                    <th className="px-4 py-2 text-right">적립요율(%)</th>
                    <th className="px-4 py-2 text-center w-10">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {localRates.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="bg-slate-50 first:rounded-l-2xl px-4 py-3">
                        <input 
                          type="month" 
                          value={r.startPeriod} 
                          disabled={idx === 0}
                          onChange={(e) => updateRate(r.id, 'startPeriod', e.target.value)}
                          className="bg-transparent border-none outline-none font-black text-sm w-full disabled:opacity-50" 
                        />
                      </td>
                      <td className="bg-slate-50 px-4 py-3">
                        <input 
                          type="month" 
                          value={r.endPeriod} 
                          onChange={(e) => updateRate(r.id, 'endPeriod', e.target.value)}
                          className="bg-transparent border-none outline-none font-black text-sm w-full text-blue-600" 
                        />
                      </td>
                      <td className="bg-slate-50 px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={r.rate} 
                            onChange={(e) => updateRate(r.id, 'rate', parseFloat(e.target.value))}
                            className="bg-transparent border-none outline-none font-mono font-black text-sm w-16 text-right" 
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </td>
                      <td className="bg-slate-50 last:rounded-r-2xl px-4 py-3 text-center">
                        <button 
                          onClick={() => removeRate(r.id)} 
                          disabled={localRates.length === 1}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-20"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`p-6 rounded-[1.5rem] border flex items-center justify-between transition-all duration-300 ${isRateComplete ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRateComplete ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    <i className={`fas ${isRateComplete ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
                 </div>
                 <div>
                   <p className={`text-xs font-black ${isRateComplete ? 'text-emerald-700' : 'text-red-700'}`}>
                     {isRateComplete ? '적립 요율 무결성 검증 완료' : `적립 요율 합계가 ${totalRate}%입니다.`}
                   </p>
                   <p className={`text-[10px] font-bold ${isRateComplete ? 'text-emerald-500' : 'text-red-400'}`}>
                     {isRateComplete ? '모든 구간의 합계가 100%에 도달했습니다.' : '저장 시 모든 구간의 합계가 반드시 100%가 되어야 합니다.'}
                   </p>
                 </div>
               </div>
               <div className="text-right">
                 <span className={`text-3xl font-black ${isRateComplete ? 'text-emerald-600' : 'text-red-600'}`}>{totalRate}</span>
                 <span className={`text-lg font-black ml-1 ${isRateComplete ? 'text-emerald-400' : 'text-red-400'}`}>%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentDetail;
