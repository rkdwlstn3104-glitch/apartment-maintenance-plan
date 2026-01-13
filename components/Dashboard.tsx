
import React, { useMemo, useState } from 'react';
import { MaintenanceItem, Apartment, MaintenanceHistory } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, Cell as PieCell
} from 'recharts';

interface DashboardProps {
  items: MaintenanceItem[];
  selectedApt: Apartment;
  histories?: MaintenanceHistory[];
}

const Dashboard: React.FC<DashboardProps> = ({ items = [], selectedApt, histories = [] }) => {
  const [useInflation, setUseInflation] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const planPeriod = Math.min(100, Math.max(1, Number(selectedApt?.planPeriod) || 40));
  const globalInflationRate = selectedApt.inflationRate || 2.5;

  const safeNum = (val: any, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) || !isFinite(n) ? fallback : n;
  };

  // 1. 핵심 요약 통계
  const stats = useMemo(() => {
    let totalPlanCost = 0;
    let urgentCount = 0;
    let reviewCount = 0;
    
    items.forEach(item => {
      // estimatedCost is already in Man-Won
      totalPlanCost += safeNum(item.estimatedCost) * 10000;
      if (item.status === '긴급') urgentCount++;
      if (item.status === '검토필요') reviewCount++;
    });

    return { totalPlanCost, urgentCount, reviewCount, totalItemCount: items.length };
  }, [items]);

  // 2. 연도별 예상 지출 (향후 10년)
  const yearlyForecast = useMemo(() => {
    const data = [];
    let hasActualData = false;

    for (let i = 0; i < 12; i++) { // 12년으로 확장하여 더 많은 데이터 노출
      const year = currentYear + i;
      let totalYearCost = 0;
      
      items.forEach(item => {
        const nextYear = Number(item.nextRepairYear);
        // 만약 차기수선연도가 해당 년도라면 (또는 주기적으로 해당 년도에 걸린다면)
        if (nextYear === year) {
          // item.estimatedCost는 40년치 총액이므로, 1회 수선 비용으로 역산
          const cycle = Math.max(1, Number(item.cycleYears));
          const repairRate = Number(item.repairRate) || 100;
          const totalRepairCount = Math.round((planPeriod / cycle) * (repairRate / 100) * 10) / 10;
          
          // 1회 수선비 = 총 계획 예산 / 총 수선 횟수
          const oneTimeCostManWon = totalRepairCount > 0 
            ? safeNum(item.estimatedCost) / totalRepairCount 
            : safeNum(item.unitPrice) * safeNum(item.facilitySize) * (repairRate / 100);
          
          let cost = oneTimeCostManWon;
          
          // 물가상승 반영 시 미래가치 계산
          if (useInflation) {
            const yearsDiff = Math.max(0, year - currentYear);
            cost = cost * Math.pow(1 + (globalInflationRate / 100), yearsDiff);
          }
          
          totalYearCost += cost;
        }
      });
      
      if (totalYearCost > 0) hasActualData = true;
      data.push({ 
        year: `${year}년`, 
        cost: Math.round(totalYearCost), // 단위: 만원
        rawCost: totalYearCost * 10000 
      });
    }
    return { data, hasData: hasActualData };
  }, [items, currentYear, useInflation, globalInflationRate, planPeriod]);

  // 3. 공정별 예산 비중
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    let hasActualData = false;

    items.forEach(item => {
      const costManWon = safeNum(item.estimatedCost);
      if (costManWon > 0) {
        hasActualData = true;
        const catName = item.mainCategory || '미분류';
        catMap[catName] = (catMap[catName] || 0) + costManWon;
      }
    });

    const result = Object.entries(catMap)
      .map(([name, value]) => ({ 
        name, 
        value: Math.round(value) 
      }))
      .sort((a, b) => b.value - a.value);

    return { result, hasData: hasActualData };
  }, [items]);

  const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#16a34a', '#0891b2'];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">계획 전략 대시보드</h2>
          <p className="text-slate-500 text-xs font-black mt-1 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            단지 수선 현황 및 재무 리스크 분석
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setUseInflation(false)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${!useInflation ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>기본가(PV)</button>
          <button onClick={() => setUseInflation(true)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${useInflation ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>물가반영(FV)</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-800">
          <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">총 계획 예산 규모</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">₩{(stats.totalPlanCost / 100000000).toFixed(1)}</span>
            <span className="text-sm font-bold opacity-60">억</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-500 uppercase">계획 기간</span>
            <span className="font-black text-blue-400">{planPeriod}년</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">수선 항목 모니터링</p>
          <div className="flex items-center gap-4">
             <div className="flex flex-col"><span className="text-2xl font-black text-slate-900">{stats.totalItemCount}</span><span className="text-[9px] font-bold text-slate-400">전체 항목</span></div>
             <div className="h-8 w-px bg-slate-100"></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-red-500">{stats.urgentCount}</span><span className="text-[9px] font-bold text-red-400">긴급</span></div>
             <div className="h-8 w-px bg-slate-100"></div>
             <div className="flex flex-col"><span className="text-2xl font-black text-amber-500">{stats.reviewCount}</span><span className="text-[9px] font-bold text-amber-400">검토</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">적용 물가 상승률</p>
          <div className="flex items-center gap-2"><i className="fas fa-chart-line text-blue-600 text-xl"></i><span className="text-3xl font-black text-slate-900">{globalInflationRate}%</span></div>
          <div className="mt-2 text-[9px] font-bold text-slate-400 italic">* {useInflation ? '물가 변동 시뮬레이션 활성화' : '기준가 분석 모드'}</div>
        </div>
        <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-200">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">단지 관리 정보</p>
          <div className="text-lg font-black truncate">{selectedApt.name}</div>
          <p className="text-[10px] font-bold opacity-60 mt-1">사용승인: {selectedApt.approvalDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">향후 12년 연도별 지출 예측</h3>
            <span className="text-[10px] font-bold text-slate-400">단위: 만원</span>
          </div>
          <div className="flex-1 w-full relative">
            {!yearlyForecast.hasData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <i className="fas fa-chart-bar text-slate-200 text-5xl mb-4"></i>
                <p className="text-slate-400 text-sm font-black">수선 예정 데이터가 없습니다.</p>
                <p className="text-slate-300 text-[10px] mt-1">계획 관리 탭에서 차기수선연도를 확인하세요.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyForecast.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{payload[0].payload.year}</p>
                          <p className="text-base font-black text-blue-400">₩{Math.round(payload[0].value).toLocaleString()} 만원</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="cost" radius={[10, 10, 0, 0]} barSize={36}>
                    {yearlyForecast.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cost > (stats.totalPlanCost / planPeriod / 10000) * 1.5 ? '#f43f5e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
          <h3 className="text-sm font-black text-slate-900 mb-8 uppercase tracking-widest">공정 대분류별 예산 비중</h3>
          <div className="flex-1 w-full relative">
            {!categoryData.hasData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <i className="fas fa-chart-pie text-slate-200 text-5xl mb-4"></i>
                <p className="text-slate-400 text-sm font-black">비중 분석 데이터가 없습니다.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData.result} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value">
                    {categoryData.result.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                          <p className="text-xs font-black text-slate-900 mb-1">{payload[0].name}</p>
                          <p className="text-sm font-black text-blue-600">₩{payload[0].value?.toLocaleString()} 만원</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" formatter={(value) => <span className="text-[11px] font-bold text-slate-600 uppercase ml-2">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
