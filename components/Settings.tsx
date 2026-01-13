
import React, { useState } from 'react';

interface SettingsProps {
  onUpdatePassword: (current: string, next: string) => Promise<boolean>;
}

const Settings: React.FC<SettingsProps> = ({ onUpdatePassword }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw !== confirmPw) {
      alert("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }
    
    setStatus('loading');
    const success = await onUpdatePassword(currentPw, newPw);
    
    if (success) {
      setStatus('success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">시스템 설정</h2>
        <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-60">관리자 계정 보안 및 전역 설정을 관리합니다.</p>
      </header>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-lg font-black flex items-center gap-3 text-slate-900">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs"><i className="fas fa-key"></i></div>
          마스터 비밀번호 변경
        </h3>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">현재 비밀번호</label>
              <input 
                type="password" 
                value={currentPw}
                disabled={status === 'loading'}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm disabled:opacity-50"
                placeholder="현재 사용중인 비밀번호"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">새 비밀번호</label>
                <input 
                  type="password" 
                  value={newPw}
                  disabled={status === 'loading'}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm disabled:opacity-50"
                  placeholder="변경할 비밀번호"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">새 비밀번호 확인</label>
                <input 
                  type="password" 
                  value={confirmPw}
                  disabled={status === 'loading'}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-sm disabled:opacity-50"
                  placeholder="비밀번호 재입력"
                />
              </div>
            </div>
          </div>

          {status === 'success' && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs font-black text-center border border-emerald-100 animate-in slide-in-from-top-2">
              비밀번호가 성공적으로 변경되었습니다.
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black text-center border border-red-100">
              현재 비밀번호가 올바르지 않거나 변경에 실패했습니다.
            </div>
          )}

          <button 
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:bg-slate-400 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                변경 중...
              </>
            ) : "비밀번호 업데이트"}
          </button>
        </form>
      </div>

      <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100">
         <div className="flex items-center gap-3 mb-2">
            <i className="fas fa-info-circle text-blue-600"></i>
            <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">보안 정책 안내</span>
         </div>
         <p className="text-[11px] text-blue-600 leading-relaxed font-bold">
           마스터 비밀번호는 앱 전체의 권한을 제어합니다. 분실 시 DB 직접 접근을 통한 초기화가 필요하므로 각별히 관리해 주시기 바랍니다.
         </p>
      </div>
    </div>
  );
};

export default Settings;
