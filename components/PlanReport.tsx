
import React, { useState, useRef } from 'react';
import { MaintenanceItem, Apartment, MaintenanceHistory } from '../types';
import SummaryReport from './SummaryReport';
import ItemizedReport from './ItemizedReport';
import YearlyMatrixReport from './YearlyMatrixReport';
import StrategicAnalysisReport from './StrategicAnalysisReport';
import ExecutionPerformanceReport from './ExecutionPerformanceReport';
import ExecutionHistoryReport from './ExecutionHistoryReport';
import ItemDetailStatusReport from './ItemDetailStatusReport';

interface PlanReportProps {
  items: MaintenanceItem[];
  apartment: Apartment;
  histories?: MaintenanceHistory[];
}

type ReportType = 
  | 'combined_full_report' 
  | 'itemized_full_plan' 
  | 'item_detail_status'
  | 'yearly_execution_plan' 
  | 'strategic_budget_analysis' 
  | 'execution_performance_report'
  | 'execution_history_list';

const PlanReport: React.FC<PlanReportProps> = ({ items, apartment, histories = [] }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('combined_full_report');
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const startYear = apartment.planStartYear || (new Date(apartment.approvalDate).getFullYear() + 1);

  const handleReportSelect = (type: ReportType) => {
    setSelectedReport(type);
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isYearly = selectedReport === 'yearly_execution_plan';
    const content = reportRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${apartment.name} 보고서 출력</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: ${isYearly ? 'A3 landscape' : 'A4 portrait'}; margin: 1cm; }
            body { font-family: 'Malgun Gothic', 'Dotum', sans-serif; padding: 0; margin: 0; }
            table { width: 100%; border-collapse: collapse; border: 2px solid black !important; table-layout: fixed; }
            th, td { border: 1px solid black !important; padding: 4px; text-align: center; }
            .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
            .bg-black { background-color: #000000 !important; color: white !important; }
            .text-blue-600 { color: #2563eb !important; font-weight: bold; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
          </style>
        </head>
        <body>
          <div class="${isYearly ? 'w-[1400px]' : 'w-[1000px]'} mx-auto">
            ${content}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    setIsGenerating(true);
    const element = reportRef.current;
    const isYearly = selectedReport === 'yearly_execution_plan';
    
    const opt = {
      margin: 10,
      filename: `${apartment.name}_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: isYearly ? 'a3' : 'a4', 
        orientation: isYearly ? 'landscape' : 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    }).catch((err: any) => {
      console.error('PDF Generation Error:', err);
      setIsGenerating(false);
      alert('PDF 생성 중 오류가 발생했습니다.');
    });
  };

  return (
    <div className="flex gap-10 items-start">
      <div className="w-80 shrink-0 space-y-4 pt-4 print:hidden">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-6 mb-4">보고서 선택</h3>
        <div className="space-y-4 px-2">
          {[
            { id: 'combined_full_report', title: '장기수선계획 총괄 요약표', icon: 'fa-file-invoice' },
            { id: 'itemized_full_plan', title: '공종별 상세 내역서', icon: 'fa-list-check' },
            { id: 'item_detail_status', title: '항목별 상세 현황', icon: 'fa-table-list' },
            { id: 'yearly_execution_plan', title: '연도별 집행계획표 (A3)', icon: 'fa-calendar-days' },
            { id: 'strategic_budget_analysis', title: '예산 집행 전략 분석 리포트', icon: 'fa-chart-pie' },
            { id: 'execution_history_list', title: '공사 집행 이력 대장', icon: 'fa-book' },
            { id: 'execution_performance_report', title: '장기수선 집행 실적 보고서', icon: 'fa-check-double' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => handleReportSelect(r.id as ReportType)}
              className={`w-full text-left p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 ${
                selectedReport === r.id 
                  ? `bg-white border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] scale-[1.03]` 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedReport === r.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                <i className={`fas ${r.icon} text-lg`}></i>
              </div>
              <div>
                <p className={`text-base font-black leading-tight ${selectedReport === r.id ? 'text-slate-900' : ''}`}>{r.title}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">운영 보고서</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[1200px] relative flex flex-col">
        <div className="bg-white border-b border-slate-100 p-4 px-10 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">미리보기</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} disabled={isGenerating} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-2xl text-[11px] font-black hover:bg-slate-200 transition-all flex items-center gap-2">
              <i className="fas fa-print"></i> 인쇄
            </button>
            <button onClick={downloadPDF} disabled={isGenerating} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-blue-200 hover:bg-blue-500 transition-all flex items-center gap-2 disabled:bg-slate-400">
              {isGenerating ? "변환 중..." : <><i className="fas fa-file-pdf"></i> PDF 다운로드</>}
            </button>
          </div>
        </div>

        <div ref={reportRef} className="flex-1 overflow-x-auto no-scrollbar bg-slate-100">
          {selectedReport === 'combined_full_report' && <SummaryReport items={items} apartment={apartment} startYear={startYear} />}
          {selectedReport === 'itemized_full_plan' && <ItemizedReport items={items} apartment={apartment} startYear={startYear} />}
          {selectedReport === 'item_detail_status' && <ItemDetailStatusReport items={items} apartment={apartment} />}
          {selectedReport === 'yearly_execution_plan' && <YearlyMatrixReport items={items} apartment={apartment} startYear={startYear} />}
          {selectedReport === 'strategic_budget_analysis' && <StrategicAnalysisReport items={items} apartment={apartment} startYear={startYear} />}
          {selectedReport === 'execution_performance_report' && <ExecutionPerformanceReport histories={histories} apartment={apartment} />}
          {selectedReport === 'execution_history_list' && <ExecutionHistoryReport histories={histories} apartment={apartment} />}
        </div>
      </div>
    </div>
  );
};

export default PlanReport;
