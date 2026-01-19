
import React, { useState } from 'react';
import { UserAccount } from '../types';

interface LoginProps {
  onLogin: (id: string, pw: string) => Promise<UserAccount | null>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(false);
    
    const user = await onLogin(id, pw);
    if (user) {
      setError(false);
    } else {
      setError(true);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500 relative">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[3rem] shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">수선계획 Pro<br/>통합 관리 로그인</h1>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Unified Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">아이디</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={id}
                  disabled={isLoggingIn}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm disabled:opacity-50"
                  placeholder="ID"
                />
                <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-white/30"></i>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">비밀번호</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={pw}
                  disabled={isLoggingIn}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm disabled:opacity-50"
                  placeholder="Password"
                />
                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-white/30"></i>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-black text-center animate-bounce">아이디 또는 비밀번호가 일치하지 않습니다.</p>
            )}

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:bg-slate-700"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  인증 중...
                </>
              ) : (
                <>로그인하기 <i className="fas fa-arrow-right"></i></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
             <p className="text-[10px] text-white/20 font-medium">© 2025 Apartment Pro RBAC Engine. v1.5.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
