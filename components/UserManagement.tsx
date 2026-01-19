
import React, { useState } from 'react';
import { UserAccount, Apartment, UserRole } from '../types';

interface UserManagementProps {
  accounts: UserAccount[];
  apartments: Apartment[];
  onAddAccount: (account: UserAccount) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccount: (account: UserAccount) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ accounts, apartments, onAddAccount, onDeleteAccount, onUpdateAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userName: '',
    apartmentId: ''
  });

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({ username: '', password: '', userName: '', apartmentId: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: UserAccount) => {
    setEditingAccount(acc);
    setFormData({
      username: acc.username,
      password: acc.password,
      userName: acc.userName,
      apartmentId: acc.apartmentId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.apartmentId) {
      alert("모든 필수 항목을 입력하세요.");
      return;
    }

    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        ...formData
      });
    } else {
      const account: UserAccount = {
        id: crypto.randomUUID(),
        role: 'manager' as UserRole,
        createdAt: new Date().toISOString(),
        ...formData
      };
      onAddAccount(account);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">계정 및 권한 관리</h2>
          <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-60">
            단지별 매니저 계정의 비밀번호 설정 및 정보를 슈퍼 관리자가 직접 제어합니다.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <i className="fas fa-user-plus"></i> 신규 매니저 생성
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50 text-slate-400">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">담당자</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">로그인 ID</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">비밀번호 (관리용)</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">소속 단지</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-center">관리 도구</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {accounts.filter(a => a.role === 'manager').map((acc) => {
              const aptName = apartments.find(a => a.id === acc.apartmentId)?.name || '단지 미지정';
              return (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm uppercase">
                        {acc.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{acc.userName}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{new Date(acc.createdAt).toLocaleDateString()} 생성</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">{acc.username}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-600 font-black">{acc.password}</span>
                        <i className="fas fa-lock text-[10px] text-slate-300"></i>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">{aptName}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEdit(acc)}
                        className="w-10 h-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="정보 및 비밀번호 수정"
                      >
                        <i className="fas fa-user-pen"></i>
                      </button>
                      <button 
                        onClick={() => onDeleteAccount(acc.id)}
                        className="w-10 h-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="계정 삭제"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{editingAccount ? '계정 정보 수정' : '신규 매니저 생성'}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Admin User Controller</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">담당자 성함</label>
                  <input type="text" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="홍길동" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">로그인 ID (고정 권장)</label>
                  <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="manager01" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 ml-1">설정 비밀번호</label>
                  <div className="relative">
                    <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 text-blue-700" placeholder="새 비밀번호 입력" />
                    <i className="fas fa-key absolute right-5 top-1/2 -translate-y-1/2 text-blue-300"></i>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mt-2 ml-1">* 매니저는 스스로 비밀번호를 변경할 수 없으므로, 수정 후 반드시 해당 정보를 통보해 주십시오.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">관리 권한 단지</label>
                  <select value={formData.apartmentId} onChange={e => setFormData({...formData, apartmentId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">단지 선택</option>
                    {apartments.map(apt => <option key={apt.id} value={apt.id}>{apt.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-500 transition-all">
                {editingAccount ? '정보 업데이트 완료' : '계정 생성하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
