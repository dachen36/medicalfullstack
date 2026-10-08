import { useEffect, useState } from 'react';
import InputBar from './components/InputBar';
import UploadPanel from './components/UploadPanel';
import ProcessLogPanel from './components/ProcessLogPanel';
import FeedbackPanel from './components/FeedbackPanel';
import QualitativeMetricsPanel from './components/QualitativeMetricsPanel';
import QuantitativeMetricsPanel from './components/QuantitativeMetricsPanel';
import ConclusionPanel from './components/ConclusionPanel';
import ChartPanel from './components/ChartPanel';
import AnalyzeButton from './components/AnalyzeButton';
// 1. 引入刚才写好的特征提取组件
import ExtractFeaturesButton from './components/ExtractButton';


import type { PatientCase } from './common/CommonInterface';



interface AnalysisPageProps {
  caseId: string;
  onBack: () => void;
}

export default function AnalysisPage({ caseId, onBack }: AnalysisPageProps) {
  const [patient, setPatient] = useState<PatientCase | null>(null);

  useEffect(() => {
    const localData = localStorage.getItem('clinic_cases_v3');
    if (localData) {
      const cases = JSON.parse(localData);
      const foundedCase = cases.find((c: any) => c.id === caseId);
      if (foundedCase) {
        setPatient(foundedCase);
      }
    }
  }, [caseId]);





  return (
    <div className="w-screen h-screen bg-slate-50 flex flex-col p-3 overflow-hidden text-sm text-slate-800 antialiased gap-3">
      
      {/* 🟢 顶层控制条 */}
      <div className="shrink-0 flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-xs">
        <button 
          onClick={onBack} //返回LandingPage
          className="text-slate-600 hover:text-blue-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>&larr;</span> 返回患者病历列表(主页)
        </button>
        <div className="text-xs text-slate-500 font-medium">
          当前分析患者: {patient ? (
            <span className="text-blue-600 font-bold">
              {patient.name} ({patient.gender} · {patient.age}岁)
            </span>
          ) : (
            <span className="text-slate-400">读取中...</span>
          )}
          <span className="text-slate-300 mx-2">|</span>
          病历号: <span className="font-mono text-slate-600">{caseId}</span>
        </div>
      </div>

      {/* 1. 顶部的对话指令输入框 */}
      <div className="shrink-0">
        <InputBar />
      </div>

      {/* 2. 主工作区布局 */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        
        {/* 左侧一栏：上传、处理过程、用户评分反馈 */}
        <div className="w-64 flex flex-col gap-3 h-full shrink-0">
          <UploadPanel />
          <ProcessLogPanel />
          <FeedbackPanel />
        </div>

        {/* 右侧主网格：包含上下指标、正中间的分析按钮、以及下方的输出 */}
        <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
          
          {/* 上半部分：定性指标 + 定量指标 并排网格 */}
          <div className="h-[43%] grid grid-cols-2 gap-3 min-h-[160px]">
            <QualitativeMetricsPanel />
            <QuantitativeMetricsPanel />
          </div>


          {/* ⚡ 正中间枢纽 */}
          <div className="shrink-0 grid grid-cols-2 gap-3">
            {/* 左按钮：一键提取特征卡片 */}
            <div className="shadow-sm rounded-xl overflow-hidden h-20 bg-white border border-slate-100 p-1 flex items-center justify-center">
              {/* 🟢 2. 在这里传入 autoExtract，这样页面一打开，按钮自己就去工作了，不需要你主页面操心了！ */}
              <ExtractFeaturesButton caseId={caseId} autoExtract={true} />
            </div>
            
            {/* 右按钮：一键深度分析诊断 */}
            <div className="shadow-sm rounded-xl overflow-hidden h-20">
              <AnalyzeButton />
            </div>
          </div>

          {/* 下半部分：智能体输出区 */}
          <div className="flex-1 border border-amber-300 rounded-xl p-3.5 bg-amber-50/5 shadow-xs flex flex-col overflow-hidden">
            
            <h3 className="text-xs font-bold text-amber-900 mb-2.5 tracking-wider uppercase shrink-0">
              智能体分析并输出
            </h3>
            
            <div className="flex-1 grid grid-cols-[8fr_2fr] gap-3 overflow-hidden">
              <ConclusionPanel />
              <ChartPanel />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}