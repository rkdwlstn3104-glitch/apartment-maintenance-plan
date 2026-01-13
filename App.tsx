
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlanTable from './components/PlanTable';
import ApartmentDetail from './components/ApartmentDetail';
import MaintenanceStandards from './components/MaintenanceStandards';
import PlanReport from './components/PlanReport';
import ExecutionHistoryTab from './components/ExecutionHistory';
import ExecutionModal from './components/ExecutionModal';
import VersionHistory from './components/VersionHistory';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MaintenanceItem, Apartment, MaintenanceStandard, MaintenanceHistory, PlanSnapshot } from './types';
import { APARTMENTS, DEFAULT_SEED_STANDARDS, getInitialItems } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const prevAptIdRef = useRef<string | null>(null); // 이전 선택 단지 ID 보관
  
  const [allItems, setAllItems] = useState<MaintenanceItem[]>([]);
  const [masterStandards, setMasterStandards] = useState<MaintenanceStandard[]>([]);
  const [histories, setHistories] = useState<MaintenanceHistory[]>([]);
  const [snapshots, setSnapshots] = useState<PlanSnapshot[]>([]);
  
  const [executingItem, setExecutingItem] = useState<MaintenanceItem | null>(null);

  const safeNum = (val: any, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) || !isFinite(n) ? fallback : n;
  };

  const parseDBItem = useCallback((i: any): MaintenanceItem => ({
    id: i.id, apartmentId: i.apartment_id, code: i.code, mainCategory: i.category,
    subCategory: i.sub_category, category: i.category, item: i.item, detail: i.detail || '',
    method: i.method, unit: i.unit, unitPrice: safeNum(i.unit_price), repairRate: safeNum(i.repair_rate),
    cycleYears: safeNum(i.cycle_years), facilitySize: safeNum(i.facility_size), quantity: safeNum(i.quantity),
    lastRepairYear: safeNum(i.last_repair_year), nextRepairYear: safeNum(i.next_repair_year),
    estimatedCost: safeNum(i.estimated_cost), status: (i.status || '정상') as MaintenanceItem['status'], isExecuted: !!i.is_executed,
    isManual: !!i.is_manual, actualCost: safeNum(i.actual_cost), remarks: i.remarks || '',
    breakdown: { material: safeNum(i.material), labor: safeNum(i.labor), expense: safeNum(i.expense) }
  }), []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const [aptRes, stdRes, itemRes, historyRes, snapRes, unitRes, rateRes] = await Promise.all([
          supabase.from('apartments').select('*').order('name'),
          supabase.from('maintenance_standards').select('*').order('code'),
          supabase.from('maintenance_items').select('*'),
          supabase.from('maintenance_history').select('*').order('execution_date', { ascending: false }),
          supabase.from('plan_snapshots').select('*').order('created_at', { ascending: false }),
          supabase.from('unit_types').select('*'),
          supabase.from('annual_rates').select('*').order('start_period')
        ]);

        if (aptRes.error) throw aptRes.error;
        setIsDemoMode(false);
        
        if (aptRes.data && aptRes.data.length > 0) {
          const apts: Apartment[] = aptRes.data.map(a => ({
            id: a.id, name: a.name, approvalDate: a.approval_date, planPeriod: safeNum(a.plan_period), 
            inflationRate: safeNum(a.inflation_rate),
            unitTypes: (unitRes.data || []).filter(u => u.apartment_id === a.id).map(u => ({
              id: u.id, type: u.type, privateArea: safeNum(u.private_area), supplyArea: safeNum(u.common_area), households: safeNum(u.households)
            })),
            annualRates: (rateRes.data || []).filter(r => r.apartment_id === a.id).map(r => ({
              id: r.id, startPeriod: r.start_period, endPeriod: r.end_period, rate: safeNum(r.rate)
            }))
          }));
          setApartments(apts);
          if (!selectedAptId) {
            setSelectedAptId(apts[0].id);
            prevAptIdRef.current = apts[0].id;
          }
        }

        if (stdRes.data) setMasterStandards(stdRes.data.map((s: any) => ({
          id: s.id, code: s.code, mainCategory: s.category, subCategory: s.sub_category, category: s.category, item: s.item, method: s.method, unit: s.unit, unitPrice: safeNum(s.unit_price), 
          repairRate: safeNum(s.repair_rate), cycleYears: safeNum(s.cycle_years), lastRepairYear: safeNum(s.last_repair_year), 
          breakdown: { material: safeNum(s.material), labor: safeNum(s.labor), expense: safeNum(s.expense) }
        })));

        if (itemRes.data) setAllItems(itemRes.data.map(parseDBItem));
        if (historyRes.data) setHistories(historyRes.data.map(h => ({
          id: h.id, itemId: h.item_id, apartmentId: h.apartment_id, itemName: h.item_name, executionYear: h.execution_year, executionDate: h.execution_date, plannedCost: h.planned_cost, actualCost: h.actual_cost, contractor: h.contractor, remarks: h.remarks, createdAt: h.created_at
        })));
        if (snapRes.data) setSnapshots(snapRes.data.map(s => ({
          id: s.id, apartmentId: s.apartment_id, versionName: s.version_name, createdAt: s.created_at, itemCount: s.item_count, totalCost: s.total_cost, items: s.items
        })));
      }
    } catch (err) {
      console.warn("Using Demo Mode:", err);
      setIsDemoMode(true);
      setApartments(APARTMENTS);
      setSelectedAptId(APARTMENTS[0].id);
      prevAptIdRef.current = APARTMENTS[0].id;
      setMasterStandards(DEFAULT_SEED_STANDARDS);
      setAllItems(getInitialItems());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateItems = async (updatedItems: MaintenanceItem[]) => {
    const updatedMap = new Map(updatedItems.map(i => [i.id, i]));
    setAllItems(prev => prev.map(item => updatedMap.get(item.id) || item));
    
    if (!isDemoMode && isSupabaseConfigured && supabase) {
      const dbPayload = updatedItems.map(item => ({
        id: item.id, apartment_id: item.apartmentId, code: item.code, category: item.mainCategory,
        sub_category: item.subCategory, item: item.item, method: item.method, unit: item.unit,
        unit_price: item.unitPrice, repair_rate: item.repairRate, cycle_years: item.cycleYears,
        facility_size: item.facilitySize, quantity: item.quantity, 
        last_repair_year: item.lastRepairYear, next_repair_year: item.nextRepairYear,
        estimated_cost: item.estimatedCost, status: item.status,
        is_executed: item.isExecuted, is_manual: item.isManual, actual_cost: item.actualCost, remarks: item.remarks
      }));
      await supabase.from('maintenance_items').upsert(dbPayload);
    }
  };

  const handleCancelExecute = async (item: MaintenanceItem) => {
    if (!window.confirm(`[${item.item}]의 집행 완료 처리를 취소하시겠습니까?\n관련 이력도 함께 삭제됩니다.`)) return;
    try {
      if (!isDemoMode && isSupabaseConfigured && supabase) {
        await supabase.from('maintenance_history').delete().eq('item_id', item.id);
      }
      setHistories(prev => prev.filter(h => h.itemId !== item.id));
      await handleUpdateItems([{ ...item, isExecuted: false, actualCost: 0 }]);
      alert("집행 취소 완료");
    } catch (err) {
      alert("취소 중 오류 발생");
    }
  };

  const selectedApt = useMemo(() => apartments.find(a => a.id === selectedAptId) || null, [apartments, selectedAptId]);
  const filteredItems = useMemo(() => selectedApt ? allItems.filter(i => i.apartmentId === selectedApt.id) : [], [allItems, selectedApt]);
  const filteredHistories = useMemo(() => selectedAptId ? histories.filter(h => h.apartmentId === selectedAptId) : [], [histories, selectedAptId]);
  const aptSnapshots = useMemo(() => snapshots.filter(s => s.apartmentId === selectedAptId), [snapshots, selectedAptId]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-inter text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">{isDemoMode ? '오프라인 데모' : '실시간 DB 연결됨'}</span>
          </div>
          <div className="flex gap-2">
            {apartments.map(apt => (
              <button key={apt.id} onClick={() => { setSelectedAptId(apt.id); prevAptIdRef.current = apt.id; }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${selectedAptId === apt.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{apt.name}</button>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pb-20">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-40 animate-pulse"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 로딩 중...</p></div>
          ) : (
            <>
              {activeTab === 'dashboard' && selectedApt && <Dashboard items={filteredItems} selectedApt={selectedApt} histories={filteredHistories} />}
              {activeTab === 'plan' && selectedApt && (
                <PlanTable 
                  items={filteredItems} masterStandards={masterStandards} planPeriod={selectedApt.planPeriod} inflationRate={selectedApt.inflationRate || 0} 
                  onUpdate={handleUpdateItems} 
                  onAdd={(std) => {
                    const newItem: MaintenanceItem = { ...std, id: crypto.randomUUID(), apartmentId: selectedAptId!, facilitySize: 0, quantity: 1, nextRepairYear: 2025 + std.cycleYears, estimatedCost: 0, status: '정상' as const };
                    setAllItems(prev => [...prev, newItem]);
                    handleUpdateItems([newItem]);
                  }} 
                  onDelete={(id) => {
                    setAllItems(prev => prev.filter(i => i.id !== id));
                    if (!isDemoMode && isSupabaseConfigured && supabase) supabase.from('maintenance_items').delete().eq('id', id);
                  }} 
                  apartmentName={selectedApt.name} onExecute={(item) => setExecutingItem(item)} onCancelExecute={handleCancelExecute}
                />
              )}
              {activeTab === 'apartment-info' && (
                <ApartmentDetail 
                  apartment={selectedApt} 
                  onUpdate={async (apt) => {
                    const isNew = !apartments.find(a => a.id === apt.id);
                    setApartments(prev => isNew ? [...prev, apt] : prev.map(a => a.id === apt.id ? apt : a));
                    setSelectedAptId(apt.id);
                    prevAptIdRef.current = apt.id;
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      await supabase.from('apartments').upsert({ id: apt.id, name: apt.name, approval_date: apt.approvalDate, plan_period: apt.planPeriod, inflation_rate: apt.inflationRate });
                      if (apt.unitTypes) await supabase.from('unit_types').upsert(apt.unitTypes.map(u => ({ ...u, apartment_id: apt.id })));
                      if (apt.annualRates) await supabase.from('annual_rates').upsert(apt.annualRates.map(r => ({ ...r, apartment_id: apt.id, start_period: r.startPeriod, end_period: r.endPeriod, rate: safeNum(r.rate) })));
                    }
                    alert(isNew ? "새 단지 등록 완료" : "수정 완료");
                  }} 
                  onAdd={() => { if (selectedAptId) prevAptIdRef.current = selectedAptId; setSelectedAptId(null); }} 
                  onCancelAdd={() => { setSelectedAptId(prevAptIdRef.current || (apartments.length > 0 ? apartments[0].id : null)); }}
                  onDelete={async () => {
                    if (!selectedAptId) return;
                    if (!window.confirm("단지를 삭제하시겠습니까?")) return;
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('apartments').delete().eq('id', selectedAptId);
                    const remaining = apartments.filter(a => a.id !== selectedAptId);
                    setApartments(remaining);
                    const nextApt = remaining.length > 0 ? remaining[0].id : null;
                    setSelectedAptId(nextApt);
                    prevAptIdRef.current = nextApt;
                  }} 
                  showConfirm={(title, msg, confirm) => { if(window.confirm(msg)) confirm(); }} 
                />
              )}
              {activeTab === 'history' && <VersionHistory snapshots={aptSnapshots} onRestore={(snap) => { setAllItems(prev => [...prev.filter(i => i.apartmentId !== snap.apartmentId), ...snap.items]); handleUpdateItems(snap.items); }} onDelete={(id) => { setSnapshots(prev => prev.filter(s => s.id !== id)); if (!isDemoMode && isSupabaseConfigured && supabase) supabase.from('plan_snapshots').delete().eq('id', id); }} />}
              {activeTab === 'report' && selectedApt && <PlanReport items={filteredItems} apartment={selectedApt} histories={filteredHistories} />}
              {activeTab === 'standards' && (
                <MaintenanceStandards 
                  standards={masterStandards} 
                  onUpdate={async (stds) => {
                    setMasterStandards(stds);
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      const dbPayload = stds.map(s => ({
                        id: s.id, code: s.code, category: s.mainCategory, sub_category: s.subCategory, item: s.item, method: s.method, unit: s.unit,
                        unit_price: s.unitPrice, repair_rate: s.repairRate, cycle_years: s.cycleYears, last_repair_year: s.lastRepairYear, 
                        material: s.breakdown.material, labor: s.breakdown.labor, expense: s.breakdown.expense
                      }));
                      await supabase.from('maintenance_standards').upsert(dbPayload);
                    }
                  }} 
                  onDelete={async (id) => { setMasterStandards(prev => prev.filter(s => s.id !== id)); if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_standards').delete().eq('id', id); }} 
                  showConfirm={() => {}} 
                />
              )}
              {activeTab === 'execution' && <ExecutionHistoryTab histories={filteredHistories} />}
            </>
          )}
        </div>
      </main>

      {executingItem && (
        <ExecutionModal 
          item={executingItem} onClose={() => setExecutingItem(null)} 
          onConfirm={async (data) => {
            const currentItem = executingItem;
            if (!currentItem) return;
            const h: MaintenanceHistory = { 
              id: crypto.randomUUID(), itemId: currentItem.id, apartmentId: selectedAptId!, itemName: currentItem.item, 
              executionYear: new Date(data.executionDate).getFullYear(), executionDate: data.executionDate, 
              plannedCost: currentItem.estimatedCost * 10000, actualCost: data.actualCost, contractor: data.contractor, remarks: data.remarks, createdAt: new Date().toISOString() 
            };
            if (!isDemoMode && isSupabaseConfigured && supabase) {
              await supabase.from('maintenance_history').insert({
                id: h.id, item_id: h.itemId, apartment_id: h.apartmentId, item_name: h.itemName, 
                execution_year: h.executionYear, execution_date: h.executionDate, planned_cost: h.plannedCost, 
                actual_cost: h.actualCost, contractor: h.contractor, remarks: h.remarks
              });
            }
            setHistories(prev => [h, ...prev]);
            handleUpdateItems([{ ...currentItem, isExecuted: true, actualCost: data.actualCost / 10000, lastRepairYear: h.executionYear, nextRepairYear: h.executionYear + currentItem.cycleYears }]);
            setExecutingItem(null);
          }} 
        />
      )}
    </div>
  );
};

export default App;
