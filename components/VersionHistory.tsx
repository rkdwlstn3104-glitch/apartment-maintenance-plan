
import React from 'react';
import { PlanSnapshot } from '../types';

interface VersionHistoryProps {
  snapshots: PlanSnapshot[];
  onRestore: (snapshot: PlanSnapshot) => void;
  onDelete: (id: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ snapshots, onRestore, onDelete }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">수선계획 버전 히스토리</h2>
        <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-60">저장된 스냅샷을 확인하고 원하는 시점으로 복원할 수 있습니다.</p>
      </header>

      {snapshots.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-40 flex flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-history text-3xl"></i>
          </div>
          <p className="font-black text-lg">아직 저장된 버전이 없습니다.</p>
          <p className="text-sm mt-2">상단의 '버전 저장' 버튼을 눌러 현재 상태를 기록하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 이미 상태가 최신순으로 정렬되어 있으므로 reverse() 없이 맵핑 */}
          {snapshots.map((snapshot, index) => (
            <div key={snapshot.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all overflow-hidden group">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      v.{snapshots.length - index}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{snapshot.versionName}</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <i className="far fa-calendar-alt mr-1"></i>
                    {new Date(snapshot.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button 
                  onClick={() => onDelete(snapshot.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">총 공사 항목</span>
                  <span className="font-black text-slate-900">{snapshot.itemCount}개</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">계획 총 예산</span>
                  <span className="font-black text-blue-600">{Math.round(snapshot.totalCost).toLocaleString()}원</span>
                </div>
                
                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={() => onRestore(snapshot)}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-slate-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-undo-alt"></i> 이 버전으로 복원
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
