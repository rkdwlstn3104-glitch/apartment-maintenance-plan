
import React, { useState, useMemo, useEffect } from 'react';
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
import UserManagement from './components/UserManagement';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  MaintenanceItem, Apartment, MaintenanceStandard, MaintenanceHistory, PlanSnapshot, UserAccount, MaintenanceCategory
} from './types';
import { generateInitialItemsForApt, DEFAULT_SEED_STANDARDS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isCreatingNewApt, setIsCreatingNewApt] = useState(false);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  
  const [allItems, setAllItems] = useState<MaintenanceItem[]>([]);
  const [masterStandards, setMasterStandards] = useState<MaintenanceStandard[]>([]);
  const [histories, setHistories] = useState<MaintenanceHistory[]>([]);
  const [snapshots, setSnapshots] = useState<PlanSnapshot[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  
  const [executingItem, setExecutingItem] = useState<MaintenanceItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const [aptRes, stdRes, itemRes, historyRes, snapRes, userRes] = await Promise.all([
          supabase.from('apartments').select('*').order('name'),
          supabase.from('maintenance_standards').select('*').order('code'),
          supabase.from('maintenance_items').select('*'),
          supabase.from('maintenance_history').select('*').order('execution_date', { ascending: false }),
          supabase.from('plan_snapshots').select('*').order('created_at', { ascending: false }),
          supabase.from('admin_users').select('*').order('created_at', { ascending: false })
        ]);

        setIsDemoMode(false);
        
        if (aptRes.data) {
          setApartments(aptRes.data.map((apt: any) => ({
            id: apt.id, 
            name: apt.name, 
            approvalDate: apt.approval_date, 
            planPeriod: apt.plan_period,
            inflationRate: Number(apt.inflation_rate), 
            unitTypes: apt.unit_types || [], 
            annualRates: apt.annual_rates || []
          })));
        }

        if (userRes.data) {
          setUserAccounts(userRes.data.map((u: any) => ({
            id: u.id, username: u.username, password: u.password, role: u.role,
            apartmentId: u.apartment_id, userName: u.user_name || u.username, createdAt: u.created_at
          })));
        }

        if (stdRes.data) {
          setMasterStandards(stdRes.data.map((s: any) => ({
            id: s.id, 
            code: s.code, 
            mainCategory: (s.category || '건물외부') as MaintenanceCategory,
            subCategory: s.sub_category || '기타',
            category: (s.category || '건물외부') as MaintenanceCategory,
            item: s.item || '미지정 항목',
            method: s.method || '전면교체',
            unit: s.unit || 'm2',
            unitPrice: Number(s.unit_price) || 0,
            repairRate: Number(s.repair_rate) || 100,
            cycleYears: Number(s.cycle_years) || 10,
            lastRepairYear: Number(s.last_repair_year) || 0,
            material: Number(s.material) || 0,
            labor: Number(s.labor) || 0,
            expense: Number(s.expense) || 0,
            remarks: s.remarks || ''
          } as MaintenanceStandard)));
        }

        if (itemRes.data) {
          setAllItems(itemRes.data.map((i: any) => ({
            id: i.id, 
            code: i.code, 
            apartmentId: i.apartment_id,
            mainCategory: (i.main_category || '건물외부') as MaintenanceCategory,
            subCategory: i.sub_category || '기타',
            category: (i.main_category || '건물외부') as MaintenanceCategory,
            item: i.item || '미지정 항목',
            method: i.method || '전면교체',
            unit: i.unit || 'm2',
            unitPrice: Number(i.unit_price) || 0,
            repairRate: Number(i.repair_rate) || 100,
            cycleYears: Number(i.cycle_years) || 10,
            lastRepairYear: Number(i.last_repair_year) || 0,
            facilitySize: Number(i.facility_size) || 0,
            quantity: Number(i.quantity) || 1,
            nextRepairYear: Number(i.next_repair_year) || 0,
            estimatedCost: Number(i.estimated_cost) || 0,
            isExecuted: i.is_executed ?? false,
            status: (i.status || '정상') as MaintenanceItem['status'],
            remarks: i.remarks || '',
            material: Number(i.breakdown?.material) || 0,
            labor: Number(i.breakdown?.labor) || 0,
            expense: Number(i.breakdown?.expense) || 0
          } as MaintenanceItem)));
        }

        if (historyRes.data) {
          setHistories(historyRes.data.map((h: any) => ({
            id: h.id, 
            itemId: h.item_id, 
            apartmentId: h.apartment_id, 
            itemName: h.item_name, 
            executionYear: h.execution_year, 
            executionDate: h.execution_date, 
            plannedCost: Number(h.planned_cost), 
            actualCost: Number(h.actual_cost),
            contractor: h.contractor, 
            remarks: h.remarks, 
            createdAt: h.created_at || new Date().toISOString()
          } as MaintenanceHistory)));
        }

        if (snapRes.data) {
          setSnapshots(snapRes.data.map((s: any) => ({
            id: s.id, 
            apartmentId: s.apartment_id, 
            versionName: s.version_name,
            createdAt: s.created_at, 
            item_count: s.item_count, 
            totalCost: Number(s.total_cost), 
            items: s.items
          } as any)));
        }
      }
    } catch (err) {
      console.error("Data Load Error:", err);
      setIsDemoMode(true);
      setMasterStandards(DEFAULT_SEED_STANDARDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateItems = async (updatedItems: MaintenanceItem[]) => {
    setAllItems(prev => {
      const updatedMap = new Map(updatedItems.map(i => [i.id, i]));
      const existingUpdated = prev.map(item => updatedMap.get(item.id) || item);
      const existingIds = new Set(prev.map(i => i.id));
      const newItemsToAdd = updatedItems.filter(i => !existingIds.has(i.id));
      return [...existingUpdated, ...newItemsToAdd];
    });
    
    if (!isDemoMode && isSupabaseConfigured && supabase) {
      const dbItems = updatedItems.map(i => ({
        id: i.id, 
        apartment_id: i.apartmentId, 
        code: i.code || 'NEW', 
        main_category: i.mainCategory || i.category || '건물외부',
        sub_category: i.subCategory || '기타',
        item: i.item || '미지정 항목',
        method: i.method || '전면교체', 
        unit: i.unit || 'm2',
        unit_price: Number(i.unitPrice) || 0, 
        repair_rate: Number(i.repairRate) || 100,
        cycle_years: Number(i.cycleYears) || 10, 
        last_repair_year: Number(i.lastRepairYear) || 0,
        facility_size: Number(i.facilitySize) || 0, 
        quantity: Number(i.quantity) || 1, 
        next_repair_year: Number(i.nextRepairYear) || 0, // i.next_repair_year -> i.nextRepairYear 로 수정
        estimated_cost: Number(i.estimatedCost) || 0, 
        is_executed: i.isExecuted ?? false,
        status: i.status || '정상', 
        remarks: i.remarks || '',
        breakdown: {
          material: Number(i.material) || 0,
          labor: Number(i.labor) || 0,
          expense: Number(i.expense) || 0
        }
      }));
      const { error } = await supabase.from('maintenance_items').upsert(dbItems);
      if (error) alert("수선 항목 저장 실패: " + error.message);
    }
  };

  const handleRestoreVersion = async (snap: PlanSnapshot) => {
    if (!window.confirm(`[${snap.versionName}] 버전으로 수선계획을 복원하시겠습니까?`)) return;
    try {
      if (!isDemoMode && isSupabaseConfigured && supabase) {
        setLoading(true);
        await supabase.from('maintenance_items').delete().eq('apartment_id', snap.apartmentId);
        const dbItems = snap.items.map(i => ({
          id: i.id, apartment_id: i.apartmentId, code: i.code, 
          main_category: i.mainCategory, sub_category: i.subCategory, item: i.item,
          method: i.method, unit: i.unit, unit_price: i.unitPrice, repair_rate: i.repairRate,
          cycle_years: i.cycleYears, last_repair_year: i.lastRepairYear, facility_size: i.facilitySize,
          quantity: i.quantity, next_repair_year: i.nextRepairYear, estimated_cost: i.estimatedCost, // i.next_repair_year -> i.nextRepairYear 로 수정
          is_executed: i.isExecuted, status: i.status, remarks: i.remarks,
          breakdown: { material: i.material, labor: i.labor, expense: i.expense }
        }));
        await supabase.from('maintenance_items').insert(dbItems);
      }
      setAllItems(prev => {
        const others = prev.filter(i => i.apartmentId !== snap.apartmentId);
        return [...others, ...snap.items];
      });
      alert("복원 완료");
    } catch (e) { alert("복원 실패"); } finally { setLoading(false); }
  };

  const filteredApartments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') return apartments;
    return apartments.filter(a => a.id === currentUser.apartmentId);
  }, [apartments, currentUser]);

  useEffect(() => {
    if (currentUser && !loading && !isCreatingNewApt) {
      if (currentUser.role === 'manager' && currentUser.apartmentId) {
        setSelectedAptId(currentUser.apartmentId);
      } else if (currentUser.role === 'super_admin' && filteredApartments.length > 0 && !selectedAptId) {
        setSelectedAptId(filteredApartments[0].id);
      }
    }
  }, [currentUser, filteredApartments, selectedAptId, loading, isCreatingNewApt]);

  const selectedApt = useMemo(() => {
    if (isCreatingNewApt) return null;
    return filteredApartments.find(a => a.id === selectedAptId) || null;
  }, [filteredApartments, selectedAptId, isCreatingNewApt]);

  const currentItems = useMemo(() => selectedApt ? allItems.filter(i => i.apartmentId === selectedApt.id) : [], [allItems, selectedApt]);
  const currentHistories = useMemo(() => selectedAptId ? histories.filter(h => h.apartmentId === selectedAptId) : [], [histories, selectedAptId]);
  const currentSnapshots = useMemo(() => snapshots.filter(s => s.apartmentId === selectedAptId), [snapshots, selectedAptId]);

  const handleLogin = async (id: string, pw: string): Promise<UserAccount | null> => {
    const user = userAccounts.find(u => u.username === id && u.password === pw);
    if (user) { setCurrentUser(user); return user; }
    return null;
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-inter text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setCurrentUser(null); setSelectedAptId(null); setActiveTab('dashboard'); setIsCreatingNewApt(false); }} userRole={currentUser.role} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">{isDemoMode ? '오프라인 데모' : '실시간 DB 연결됨'}</span>
            <div className="h-4 w-px bg-slate-100 mx-2"></div>
            <div className="flex items-center gap-2">
              <i className="fas fa-user-circle text-blue-600"></i>
              <span className="text-[10px] font-black text-slate-900">{currentUser.userName}님 ({currentUser.role})</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isCreatingNewApt ? (
              <div className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black border border-blue-200 shadow-sm flex items-center gap-2 animate-pulse">
                <i className="fas fa-plus-circle"></i> 신규 단지 등록 진행 중...
              </div>
            ) : currentUser.role === 'super_admin' ? (
              apartments.map(apt => (
                <button key={apt.id} onClick={() => { setSelectedAptId(apt.id); setIsCreatingNewApt(false); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${selectedAptId === apt.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{apt.name}</button>
              ))
            ) : (
              <div className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg"><i className="fas fa-building mr-2"></i>{selectedApt?.name}</div>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pb-20">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-40 animate-pulse"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">데이터 동기화 중...</p></div>
          ) : (
            <>
              {activeTab === 'dashboard' && selectedApt && <Dashboard items={currentItems} selectedApt={selectedApt} histories={currentHistories} />}
              {activeTab === 'plan' && selectedApt && (
                <PlanTable 
                  items={currentItems} 
                  masterStandards={masterStandards} 
                  planPeriod={selectedApt.planPeriod} 
                  inflationRate={selectedApt.inflationRate || 0} 
                  onUpdate={handleUpdateItems} 
                  onInitialize={async () => {
                    const newItems = generateInitialItemsForApt(selectedApt, masterStandards);
                    await handleUpdateItems(newItems);
                  }}
                  onAdd={(std) => {
                    const newItem: MaintenanceItem = { ...std, id: crypto.randomUUID(), apartmentId: selectedApt.id, facilitySize: 0, quantity: 1, nextRepairYear: new Date().getFullYear() + std.cycleYears, estimatedCost: 0, isExecuted: false, status: '정상' };
                    handleUpdateItems([newItem]);
                  }}
                  onDelete={async (id) => {
                    setAllItems(prev => prev.filter(i => i.id !== id));
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_items').delete().eq('id', id);
                  }}
                  onExecute={(item) => setExecutingItem(item)}
                  onCancelExecute={async (item) => {
                    const updated = { ...item, isExecuted: false };
                    handleUpdateItems([updated]);
                    setHistories(prev => prev.filter(h => h.itemId !== item.id || h.apartmentId !== item.apartmentId));
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      await supabase.from('maintenance_history').delete().match({ item_id: item.id, apartment_id: item.apartmentId });
                    }
                  }}
                  onSaveVersion={async () => {
                    const name = prompt("버전명:");
                    if (!name) return;
                    const snap: PlanSnapshot = { id: crypto.randomUUID(), apartmentId: selectedApt.id, versionName: name, createdAt: new Date().toISOString(), itemCount: currentItems.length, totalCost: currentItems.reduce((s,i)=>s+(i.estimatedCost*10000),0), items: currentItems };
                    setSnapshots(prev => [snap, ...prev]);
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('plan_snapshots').insert({ id: snap.id, apartment_id: snap.apartmentId, version_name: snap.versionName, item_count: snap.itemCount, total_cost: snap.totalCost, items: snap.items });
                  }}
                  apartmentName={selectedApt.name} 
                />
              )}
              {activeTab === 'apartment-info' && (
                <ApartmentDetail 
                  apartment={selectedApt} 
                  onUpdate={async (apt) => {
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      const { error } = await supabase.from('apartments').upsert({
                        id: apt.id, name: apt.name, approval_date: apt.approvalDate, plan_period: apt.planPeriod, // apt.plan_period -> apt.planPeriod 수정
                        inflation_rate: apt.inflationRate, unit_types: apt.unitTypes, annual_rates: apt.annualRates
                      });
                      if (error) { alert("저장 실패: " + error.message); return; }
                    }
                    const isNew = !apartments.find(a => a.id === apt.id);
                    setApartments(prev => isNew ? [apt, ...prev] : prev.map(a => a.id === apt.id ? apt : a));
                    setSelectedAptId(apt.id);
                    setIsCreatingNewApt(false);
                  }} 
                  onAdd={() => { setIsCreatingNewApt(true); setSelectedAptId(null); }} 
                  onCancelAdd={() => { setIsCreatingNewApt(false); setSelectedAptId(apartments[0]?.id || null); }}
                  onDelete={async () => {
                    if (!selectedAptId || !window.confirm("삭제하시겠습니까?")) return;
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('apartments').delete().eq('id', selectedAptId);
                    const remaining = apartments.filter(a => a.id !== selectedAptId);
                    setApartments(remaining); setSelectedAptId(remaining[0]?.id || null);
                  }} 
                  showConfirm={(title, msg, confirm) => { if(window.confirm(msg)) confirm(); }} 
                />
              )}
              {activeTab === 'history' && <VersionHistory snapshots={currentSnapshots} onRestore={handleRestoreVersion} onDelete={(id) => { setSnapshots(prev => prev.filter(s => s.id !== id)); if (!isDemoMode && isSupabaseConfigured && supabase) supabase.from('plan_snapshots').delete().eq('id', id); }} />}
              {activeTab === 'report' && selectedApt && <PlanReport items={currentItems} apartment={selectedApt} histories={currentHistories} />}
              {activeTab === 'standards' && currentUser.role === 'super_admin' && (
                <MaintenanceStandards 
                  standards={masterStandards} 
                  onUpdate={async (stds) => {
                    setMasterStandards(stds);
                    if (!isDemoMode && isSupabaseConfigured && supabase) {
                      const dbStds = stds.map(s => ({
                        id: s.id, code: s.code, category: s.category, sub_category: s.subCategory, item: s.item, method: s.method, unit: s.unit, unit_price: s.unitPrice, repair_rate: s.repairRate, cycle_years: s.cycleYears, last_repair_year: s.lastRepairYear, material: s.material, labor: s.labor, expense: s.expense, remarks: s.remarks
                      }));
                      await supabase.from('maintenance_standards').upsert(dbStds);
                    }
                  }} 
                  onDelete={async (id) => { 
                    setMasterStandards(prev => prev.filter(s => s.id !== id)); 
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_standards').delete().eq('id', id); 
                  }} 
                  showConfirm={(title, msg, confirm) => { if(window.confirm(msg)) confirm(); }} 
                />
              )}
              {activeTab === 'execution' && <ExecutionHistoryTab histories={currentHistories} />}
              {activeTab === 'users' && currentUser.role === 'super_admin' && (
                <UserManagement 
                  accounts={userAccounts} apartments={apartments} 
                  onAddAccount={async (acc) => {
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('admin_users').insert({ id: acc.id, username: acc.username, password: acc.password, role: acc.role, apartment_id: acc.apartmentId, user_name: acc.userName });
                    setUserAccounts(prev => [acc, ...prev]);
                  }}
                  onDeleteAccount={async (id) => { 
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('admin_users').delete().eq('id', id);
                    setUserAccounts(prev => prev.filter(u => u.id !== id)); 
                  }}
                  onUpdateAccount={async (acc) => {
                    if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('admin_users').upsert({ id: acc.id, username: acc.username, password: acc.password, role: acc.role, apartment_id: acc.apartmentId, user_name: acc.userName });
                    setUserAccounts(prev => prev.map(u => u.id === acc.id ? acc : u));
                  }}
                />
              )}
              {activeTab === 'settings' && <Settings onUpdatePassword={async () => true} />}
            </>
          )}
        </div>
      </main>

      {executingItem && (
        <ExecutionModal 
          item={executingItem} 
          onClose={() => setExecutingItem(null)} 
          onConfirm={async (data) => {
            const h: MaintenanceHistory = { id: crypto.randomUUID(), itemId: executingItem.id, apartmentId: selectedAptId!, itemName: executingItem.item, executionYear: new Date(data.executionDate).getFullYear(), executionDate: data.executionDate, plannedCost: Number(executingItem.estimatedCost) * 10000, actualCost: data.actualCost, contractor: data.contractor, remarks: data.remarks, createdAt: new Date().toISOString() };
            setHistories(prev => [h, ...prev]);
            if (!isDemoMode && isSupabaseConfigured && supabase) await supabase.from('maintenance_history').insert({ id: h.id, item_id: h.itemId, apartment_id: h.apartmentId, item_name: h.itemName, execution_year: h.executionYear, execution_date: h.executionDate, planned_cost: h.plannedCost, actual_cost: h.actualCost, contractor: h.contractor, remarks: h.remarks }); // h.execution_date -> h.executionDate 등 프로퍼티 수정
            handleUpdateItems([{ ...executingItem, isExecuted: true }]);
            setExecutingItem(null);
          }} 
        />
      )}
    </div>
  );
};

export default App;
