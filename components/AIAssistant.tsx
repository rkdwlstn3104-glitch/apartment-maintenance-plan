
import React, { useState } from 'react';
import { MaintenanceItem, AISuggestion } from '../types';
import { getMaintenanceAdvice, validatePlanWithAI } from '../services/geminiService';

interface AIAssistantProps {
  items: MaintenanceItem[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ items }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState<number | null>(null);

  const generateAdvice = async () => {
    if (items.length === 0) {
      alert("분석할 수선 항목이 없습니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setAdvice(null);
    setSuggestions([]);
    setRetryStatus(null);
    
    const handleRetry = (count: number) => {
      setRetryStatus(count);
    };

    try {
      // 1. 일반 요약 (Flash 모델)
      const adviceResult = await getMaintenanceAdvice(items, handleRetry);
      setAdvice(adviceResult || "분석 리포트를 생성할 수 없습니다.");
      
      // API Rate Limit 방지를 위한 1.5초 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 2. 법정 검토 (Pro 모델 + Thinking)
      const validationResult = await validatePlanWithAI(items, handleRetry);
      setSuggestions(validationResult);
      
      setRetryStatus(null);
    } catch (e: any) {
      console.error("AI Analysis Error:", e);
      const errorMsg = e.message?.toLowerCase() || "";
      if (errorMsg.includes('503') || errorMsg.includes('available')) {
        setError("AI 서버가 현재 점검 중이거나 과부하 상태입니다. 약 30초 후 다시 시도해 주세요. (Flash 모델 호출 성공 시 리포트는 먼저 표시됩니다.)");
      } else if (errorMsg.includes('429')) {
        setError("단시간에 너무 많은 요청이 발생했습니다. 잠시 대기 후 다시 시도해 주세요.");
      } else {
        setError("네트워크 연결에 문제가 발생했습니다. 브라우저를 새로고침한 후 다시 시도해 보세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI 전략 어드바이저</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-slate-500 text-sm font-bold">지능형 다중 모델 분석 시스템 가동 중</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-brain text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">전략 감사 엔진</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-0.5">Dual-Model Engine Active</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
              단지 데이터를 분석하여 법정 수선 주기 준수 여부와 예산 집행 효율성을 즉각 검증합니다.
            </p>

            <button 
              onClick={generateAdvice}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
                loading 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-slate-600 border-t-white rounded-full"></div>
                  {retryStatus ? `연결 재시도 (${retryStatus}/3)` : '분석 중...'}
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles"></i>
                  {error ? '다시 분석하기' : '계획 감사 시작'}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3 text-amber-700 font-black mb-3">
                <i className="fas fa-triangle-exclamation text-lg"></i>
                <span className="text-xs uppercase tracking-widest">분석 중 오류 발생</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-bold">
                {error}
              </p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h4 className="font-black text-slate-900 px-2 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <i className="fas fa-clipboard-check text-blue-500"></i> AI 법규 준수 검토 결과
              </h4>
              {suggestions.map((s, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 border-l-[6px] border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                  <h5 className="font-black text-slate-900 text-sm mb-1.5">{s.itemName}</h5>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-bold">{s.reason}</p>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {s.recommendedYear}년 권장
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <i className="fas fa-balance-scale text-slate-300"></i> {s.complianceNote}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {advice ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-full animate-in zoom-in-95 duration-700 flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <i className="fas fa-file-contract"></i>
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">전문가 감사 리포트</span>
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()} 생성</span>
              </div>
              <div className="prose prose-slate max-w-none flex-1">
                 <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-base selection:bg-blue-100">
                    {advice}
                 </div>
              </div>
              <div className="mt-10 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-bold italic text-center">
                * 본 리포트는 인공지능에 의해 생성되었으며, 최종 의사결정 시 전문가의 자문을 권장합니다.
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center py-40 text-slate-400 h-full">
              {loading ? (
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                      <div className="w-24 h-24 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-2xl shadow-inner flex items-center justify-center">
                        <i className="fas fa-microchip text-blue-500 text-xl"></i>
                      </div>
                   </div>
                   <div className="text-center space-y-2">
                     <p className="font-black text-slate-700 text-lg uppercase tracking-tight">지능형 모델 분석 엔진 가동 중</p>
                     <p className="text-sm text-slate-400 font-bold">수선 데이터 구조화 및 법규 대조 진행 중...</p>
                     {retryStatus && (
                       <p className="text-xs font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full mt-2 inline-block shadow-sm">
                         서버 가용성 확보 중... 재연결 시도 중 ({retryStatus}/3)
                       </p>
                     )}
                   </div>
                </div>
              ) : (
                <>
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 border border-slate-100">
                    <i className="fas fa-file-waveform text-4xl text-slate-200"></i>
                  </div>
                  <h4 className="font-black text-slate-600 text-xl mb-2 tracking-tight">감사 리포트 대기 중</h4>
                  <p className="text-slate-400 text-sm text-center px-12 leading-relaxed font-bold">
                    현재 단지의 장기수선계획 데이터를 기반으로<br/>
                    AI가 최적화된 집행 전략과 법규 준수 리포트를 생성합니다.
                  </p>
                  <div className="mt-10 flex gap-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100">
                        <i className="fas fa-bolt text-amber-500"></i> FLASH 모델
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100">
                        <i className="fas fa-brain text-blue-500"></i> PRO 추론 엔진
                     </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
