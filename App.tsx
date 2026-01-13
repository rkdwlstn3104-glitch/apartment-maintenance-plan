
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
import Login from './components/Login';
import Settings from './components/Settings';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  MaintenanceItem, Apartment, MaintenanceStandard, MaintenanceHistory, PlanSnapshot, UnitType, AnnualRate,
  DBApartment, DBUnitType, DBAnnualRate, DBMaintenanceItem, DBMaintenanceStandard, DBMaintenanceHistory, DBPlanSnapshot
} from './types';
import { APARTMENTS, DEFAULT_SEED_STANDARDS, getInitialItems, generateInitialItemsForApt } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const prevAptIdRef = useRef<string | null>(null);
  
  const [allItems, setAllItems] = useState<MaintenanceItem[]>([]);
  const [masterStandards, setMasterStandards] = useState<MaintenanceStandard[]>([]);
  const [histories, setHistories] = useState<MaintenanceHistory[]>([]);
  const [snapshots, setSnapshots] = useState<PlanSnapshot[]>([]);
  
  const [executingItem, setExecutingItem] = useState<MaintenanceItem | null>(null);

  // --- Utility: Safe Number Parser ---
  const safeNum = (val: any, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) || !isFinite(n) ? fallback : n;
  };

  // --- Mappers: DB (snake_case) -> JS (camelCase) ---
  const parseDBUnitType = (u: DBUnitType): UnitType => ({
    id: u.id, type: u.type, privateArea: safeNum(u.private_area), supplyArea: safeNum(u.common_area), households: safeNum(u.households)
  });

  const parseDBAnnualRate = (r: DBAnnualRate): AnnualRate => ({
    id: r.id, startPeriod: r.start_period, endPeriod: r.end_period, rate: safeNum(r.rate)
  });

  const parseDBApartment = (a: DBApartment, units: DBUnitType[] = [], rates: DBAnnualRate[] = []): Apartment => ({
    id: a.id, name: a.name, approvalDate: a.approval_date, planPeriod: safeNum(a.plan_period), inflationRate: safeNum(a.inflation_rate),
    unitTypes: units.filter(u => u.apartment_id === a.id).map(parseDBUnitType),
    annualRates: rates.filter(r => r.apartment_id === a.id).map(parseDBAnnualRate)
  });

  const parseDBItem = useCallback((i: DBMaintenanceItem): MaintenanceItem => ({
    id: i.id, apartmentId: i.apartment_id, code: i.code, mainCategory: i.category,
    subCategory: i.sub_category, category: i.category, item: i.item, detail: i.remarks || '',
    method: i.method, unit: i.unit, unitPrice: safeNum(i.unit_price), repairRate: safeNum(i.repair_rate),
    cycleYears: safeNum(i.cycle_years), facilitySize: safeNum(i.facility_size), quantity: safeNum(i.quantity),
    lastRepairYear: safeNum(i.last_repair_year), nextRepairYear: safeNum(i.next_repair_year),
    estimatedCost: safeNum(i.estimated_cost), status: (i.status || '정상') as MaintenanceItem['status'], isExecuted: !!i.is_executed,
    isManual: !!i.is_manual, actualCost: safeNum(i.actual_cost), remarks: i.remarks || '',
    breakdown: { material: safeNum(i.material), labor: safeNum(i.labor), expense: safeNum(i.expense) }
  }), []);

  const parseDBStandard = (s: DBMaintenanceStandard): MaintenanceStandard => ({
    id: s.id, code: s.code, mainCategory: s.category, subCategory: s.sub_category, category: s.category, item: s.item, method: s.method, unit: s.unit, 
    unitPrice: safeNum(s.unit_price), repairRate: safeNum(s.repair_rate), cycleYears: safeNum(s.cycle_years), lastRepairYear: safeNum(s.last_repair_year), 
    breakdown: { material: safeNum(s.material), labor: safeNum(s.labor), expense: safeNum(s.expense) }
  });

  const parseDBHistory = (h: DBMaintenanceHistory): MaintenanceHistory => ({
    id: h.id, itemId: h.item_id, apartmentId: h.apartment_id, itemName: h.item_name, executionYear: safeNum(h.execution_year), 
    executionDate: h.execution_date, plannedCost: safeNum(h.planned_cost), actualCost: safeNum(h.actual_cost), 
    contractor: h.contractor || '', remarks: h.remarks || '', createdAt: h.created_at || new Date().toISOString()
  });

  const parseDBSnapshot = (s: DBPlanSnapshot): PlanSnapshot => ({
    id: s.id, apartmentId: s.apartment_id, versionName: s.version_name, createdAt: s.created_at || new Date().toISOString(), 
    itemCount: safeNum(s.item_count), totalCost: safeNum(s.total_cost), items: s.items.map(parseDBItem)
  });

  // --- Data Loading ---
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
        
        if (aptRes.data) {
          const apts = (aptRes.data as DBApartment[]).map(a => 
            parseDBApartment(a, (unitRes.data as DBUnitType[]) || [], (rateRes.data as DBAnnualRate[]) || [])
          );
          setApartments(apts);
          if (!selectedAptId && apts.length > 0) {
            setSelectedAptId(apts[0].id);
            prevAptIdRef.current = apts[0].id;
          }
        }
        if (stdRes.data) setMasterStandards((stdRes.data as DBMaintenanceStandard[]).map(parseDBStandard));
        if (itemRes.data) setAllItems((itemRes.data as DBMaintenanceItem[]).map(parseDBItem));
        if (historyRes.data) setHistories((historyRes.data as DBMaintenanceHistory[]).map(parseDBHistory));
        if (snapRes.data) setSnapshots((snapRes.data as DBPlanSnapshot[]).map(parseDBSnapshot));
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

  // --- Handlers: JS (camelCase) -> DB (snake_case) ---
  const handleUpdateItems = async (updatedItems: MaintenanceItem[]) => {
    setAllItems(prev => {
      const updatedMap = new Map(updatedItems.map(i => [i.id, i]));
      const existingUpdated = prev.map(item => updatedMap.get(item.id) || item);
      const existingIds = new Set(prev.map(i => i.id));
      const newItemsToAdd = updatedItems.filter(i => !existingIds.has(i.id));
      return [...existingUpdated, ...newItemsToAdd];
    });
    
    if (!isDemoMode && isSupabaseConfigured && supabase) {
      try {
        const dbPayload: DBMaintenanceItem[] = updatedItems.map(item => ({
          id: item.id, apartment_id: item.apartmentId, code: item.code, category: item.mainCategory,
          sub_category: item.subCategory, item: item.item, method: item.method, unit: item.unit,
          unit_price: item.unitPrice, repair_rate: item.repairRate, cycle_years: item.cycleYears,
          facility_size: item.facilitySize, quantity: item.quantity, 
          last_repair_year: item.lastRepairYear, next_repair_year: item.nextRepairYear,
          estimated_cost: item.estimatedCost, status: item.status,
          is_executed: !!item.isExecuted, is_manual: !!item.isManual, actual_cost: item.actualCost || 0, remarks: item.remarks || '',
          material: item.breakdown?.material || 0, labor: item.breakdown?.labor || 0, expense: item.breakdown?.expense || 0
        }));
        await supabase.from('maintenance_items').upsert(dbPayload);
      } catch (err) { console.error("DB Items Update Error:", err); }
    }
  };

  const selectedApt = useMemo(() => apartments.find(a => a.id === selectedAptId) || null, [apartments, selectedAptId]);
  const filteredItems = useMemo(() => selectedApt ? allItems.filter(i => i.apartmentId === selectedApt.id) : [], [allItems, selectedApt]);
  const filteredHistories = useMemo(() => selectedAptId ? histories.filter(h => h.apartmentId === selectedAptId) : [], [histories, selectedAptId]);
  const aptSnapshots = useMemo(() => snapshots.filter(s => s.apartmentId === selectedAptId), [snapshots, selectedAptId]);

  const handleInitializePlan = async () => {
    if (!selectedApt || !selectedAptId) return;
    const standardsToUse = masterStandards.length > 0 ? masterStandards : DEFAULT_SEED_STANDARDS;
    if (!window.confirm("마스터 DB의 표준 항목을 불러와 계획을 수립하시겠습니까?")) return;
    try {
      const newItems = generateInitialItemsForApt(selectedApt, standardsToUse);
      const existingCodes = new Set(filteredItems.map(i => i.code));
      const itemsToAdd = newItems.filter(ni => !existingCodes.has(ni.code));
      if (itemsToAdd.length === 0) { alert("새로 추가할 항목이 없습니다."); return; }
      await handleUpdateItems(itemsToAdd);
      alert(`${itemsToAdd.length}개의 항목을 불러왔습니다.`);
    } catch (err) { alert("항목 불러오기 중 오류가 발생했습니다."); }
  };

  const handleSaveSnapshot = async () => {
    if (!selectedAptId || !selectedApt) return;
    const versionName = prompt("버전 명칭:", `${new Date().toLocaleDateString()} 수립안`);
    if (!versionName) return;
    const totalCost = filteredItems.reduce((sum, i) => sum + (Number(i.estimatedCost) || 0) * 10000, 0);
    const snapshot: PlanSnapshot = {
      id: crypto.randomUUID(), apartmentId: selectedAptId, versionName, createdAt: new Date().toISOString(), itemCount: filteredItems.length, totalCost, items: JSON.parse(JSON.stringify(filteredItems))
    };
    if (!isDemoMode && isSupabaseConfigured && supabase) {
      // Map back to DB snapshot items if needed, or send as is if DB accepts JSON items
      const dbItems: DBMaintenanceItem[] = snapshot.items.map(item => ({
        id: item.id, apartment_id: item.apartmentId, code: item.code, category: item.mainCategory,
        sub_category: item.subCategory, item: item.item, method: item.method, unit: item.unit,
        unit_price: item.unitPrice, repair_rate: item.repairRate, cycle_years: item.cycleYears,
        facility_size: item.facilitySize, quantity: item.quantity, 
        last_repair_year: item.lastRepairYear, next_repair_year: item.nextRepairYear,
        estimated_cost: item.estimatedCost, status: item.status,
        is_executed: !!item.isExecuted, is_manual: !!item.isManual, actual_cost: item.actualCost || 0, remarks: item.remarks || '',
        material: item.breakdown?.material || 0, labor: item.breakdown?.labor || 0, expense: item.breakdown?.expense || 0
      }));

      await supabase.from('plan_snapshots').insert({ 
        id: snapshot.id, apartment_id: snapshot.apartmentId, version_name: snapshot.versionName, 
        item_count: snapshot.itemCount, total_cost: snapshot.totalCost, items: dbItems 
      });
    }
    setSnapshots(prev => [snapshot, ...prev]);
    alert("버전 저장 완료");
  };

  const handleCancelExecute = async (item: MaintenanceItem) => {
    if (!window.confirm(`[${item.item}] 집행 취소하시겠습니까?`)) return;
    try {
      if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_history').delete().eq('item_id', item.id);
      setHistories(prev => prev.filter(h => h.itemId !== item.id));
      await handleUpdateItems([{ ...item, isExecuted: false, actualCost: 0 }]);
    } catch (err) { alert("취소 실패"); }
  };

  // Auth Logic
  const handleLogin = async (id: string, pw: string): Promise<boolean> => {
    if (!isSupabaseConfigured || isDemoMode) {
      if (id === 'admin' && pw === '1234') { setIsAuthenticated(true); return true; }
      return false;
    }
    try {
      const { data, error } = await supabase!.from('admin_users').select('*').eq('username', id).eq('password', pw).single();
      if (data && !error) { setIsAuthenticated(true); return true; }
      return false;
    } catch (err) { return false; }
  };

  const handleUpdateMasterPassword = async (current: string, next: string): Promise<boolean> => {
    if (!isSupabaseConfigured || isDemoMode) { alert("데모 모드 금지"); return false; }
    try {
      const { data: user, error: fetchError } = await supabase!.from('admin_users').select('*').eq('username', 'admin').eq('password', current).single();
      if (!user || fetchError) return false;
      const { error: updateError } = await supabase!.from('admin_users').update({ password: next }).eq('id', user.id);
      return !updateError;
    } catch (err) { return false; }
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-inter text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)} />
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
                  items={filteredItems} masterStandards={masterStandards} planPeriod={selectedApt.planPeriod} inflationRate={selectedApt.inflationRate || 0} onUpdate={handleUpdateItems} onInitialize={handleInitializePlan} onSaveVersion={handleSaveSnapshot}
                  onAdd={(std) => {
                    const newItem: MaintenanceItem = { ...std, id: crypto.randomUUID(), apartmentId: selectedAptId!, facilitySize: 0, quantity: 1, nextRepairYear: 2025 + std.cycleYears, estimatedCost: 0, status: '정상' as const };
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
                    setApartments(prev => {
                      const isNew = !prev.find(a => a.id === apt.id);
                      if (isNew) return [...prev, apt];
                      return prev.map(a => a.id === apt.id ? apt : a);
                    });
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      const dbApt: DBApartment = { id: apt.id, name: apt.name, approval_date: apt.approvalDate, plan_period: apt.planPeriod, inflation_rate: apt.inflationRate };
                      await supabase.from('apartments').upsert(dbApt);
                      await supabase.from('unit_types').delete().eq('apartment_id', apt.id);
                      if (apt.unitTypes.length > 0) {
                        const dbUnits: DBUnitType[] = apt.unitTypes.map(u => ({ id: u.id, apartment_id: apt.id, type: u.type, private_area: u.privateArea, common_area: u.supplyArea, households: u.households }));
                        await supabase.from('unit_types').insert(dbUnits);
                      }
                      await supabase.from('annual_rates').delete().eq('apartment_id', apt.id);
                      if (apt.annualRates?.length) {
                        const dbRates: DBAnnualRate[] = apt.annualRates.map(r => ({ id: r.id, apartment_id: apt.id, start_period: r.startPeriod, end_period: r.endPeriod, rate: r.rate }));
                        await supabase.from('annual_rates').insert(dbRates);
                      }
                    }
                  }} 
                  onAdd={() => { prevAptIdRef.current = selectedAptId; setSelectedAptId(null); }} 
                  onCancelAdd={() => setSelectedAptId(prevAptIdRef.current)}
                  onDelete={async () => {
                    if (!selectedAptId || !window.confirm("삭제하시겠습니까?")) return;
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('apartments').delete().eq('id', selectedAptId);
                    const remaining = apartments.filter(a => a.id !== selectedAptId);
                    setApartments(remaining);
                    setSelectedAptId(remaining[0]?.id || null);
                  }} 
                  showConfirm={(title, msg, confirm) => { if(window.confirm(msg)) confirm(); }} 
                />
              )}
              {activeTab === 'history' && <VersionHistory snapshots={aptSnapshots} onRestore={(snap) => { setAllItems(prev => [...prev.filter(i => i.apartmentId !== snap.apartmentId), ...snap.items]); handleUpdateItems(snap.items); }} onDelete={(id) => { setSnapshots(prev => prev.filter(s => s.id !== id)); if (!isDemoMode && isSupabaseConfigured && supabase) supabase.from('plan_snapshots').delete().eq('id', id); }} />}
              {activeTab === 'report' && selectedApt && <PlanReport items={filteredItems} apartment={selectedApt} histories={filteredHistories} />}
              {activeTab === 'standards' && (
                <MaintenanceStandards 
                  standards={masterStandards} onUpdate={async (stds) => {
                    setMasterStandards(stds);
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      const dbStds: DBMaintenanceStandard[] = stds.map(s => ({ 
                        id: s.id, code: s.code, category: s.mainCategory, sub_category: s.subCategory, item: s.item, method: s.method, unit: s.unit, unit_price: s.unitPrice, 
                        repair_rate: s.repairRate, cycle_years: s.cycleYears, last_repair_year: s.lastRepairYear, material: s.breakdown.material, labor: s.breakdown.labor, expense: s.breakdown.expense 
                      }));
                      await supabase.from('maintenance_standards').upsert(dbStds);
                    }
                  }} onDelete={async (id) => { setMasterStandards(prev => prev.filter(s => s.id !== id)); if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_standards').delete().eq('id', id); }} showConfirm={() => {}} 
                />
              )}
              {activeTab === 'execution' && <ExecutionHistoryTab histories={filteredHistories} />}
              {activeTab === 'settings' && <Settings onUpdatePassword={handleUpdateMasterPassword} />}
            </>
          )}
        </div>
      </main>

      {executingItem && (
        <ExecutionModal 
          item={executingItem} onClose={() => setExecutingItem(null)} 
          onConfirm={async (data) => {
            const h: MaintenanceHistory = { 
              id: crypto.randomUUID(), itemId: executingItem.id, apartmentId: selectedAptId!, itemName: executingItem.item, executionYear: new Date(data.executionDate).getFullYear(), 
              executionDate: data.executionDate, plannedCost: safeNum(executingItem.estimatedCost) * 10000, actualCost: data.actualCost, contractor: data.contractor, remarks: data.remarks, createdAt: new Date().toISOString() 
            };
            if (!isDemoMode && isSupabaseConfigured && supabase) {
              const dbHistory: DBMaintenanceHistory = { 
                id: h.id, item_id: h.itemId, apartment_id: h.apartmentId, item_name: h.itemName, 
                execution_year: h.executionYear, execution_date: h.executionDate, 
                planned_cost: h.plannedCost, actual_cost: h.actualCost, 
                contractor: h.contractor, remarks: h.remarks 
              };
              await supabase.from('maintenance_history').insert(dbHistory);
            }
            setHistories(prev => [h, ...prev]);
            handleUpdateItems([{ ...executingItem, isExecuted: true, actualCost: data.actualCost / 10000, lastRepairYear: h.executionYear, nextRepairYear: h.executionYear + executingItem.cycleYears }]);
            setExecutingItem(null);
          }} 
        />
      )}
    </div>
  );
};

export default App;
