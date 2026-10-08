//一键分析按钮

import { useState, useEffect } from 'react';

interface AnalyzeButtonProps {
  onClick?: () => void;
}

export default function AnalyzeButton({ onClick }: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 临时存放收集到的数据
  let collectedQualitative: any[] = [];
  let collectedQuantitative: any[] = [];

  useEffect(() => {
    // 监听来自定性和定量面板的“数据回传”事件
    const handleReceiveQualitative = (e: Event) => {
      collectedQualitative = (e as CustomEvent).detail;
    };
    const handleReceiveQuantitative = (e: Event) => {
      collectedQuantitative = (e as CustomEvent).detail;
    };

    window.addEventListener('RESPONSE_QUALITATIVE_CURRENT', handleReceiveQualitative);
    window.addEventListener('RESPONSE_QUANTITATIVE_CURRENT', handleReceiveQuantitative);

    return () => {
      window.removeEventListener('RESPONSE_QUALITATIVE_CURRENT', handleReceiveQualitative);
      window.removeEventListener('RESPONSE_QUANTITATIVE_CURRENT', handleReceiveQuantitative);
    };
  }, []);

  const handleAction = async () => {
    if (isAnalyzing) return;

    if (onClick) {
      onClick();
      return;
    }

    setIsAnalyzing(true);

    // 1. 立即触发日志面板更新：“开始核心智能分析”
    window.dispatchEvent(new CustomEvent('UPLOAD_START', {
      detail: { fileName: '[智能体深度分析指令]' }
    }));

    // 2. 隔空向定性和定量面板“索要”当前屏幕上的所有卡片数据
    window.dispatchEvent(new CustomEvent('REQUEST_CURRENT_METRICS'));

    // 给事件流一点微秒级别的响应时间，确保数据收集完成
    await new Promise((resolve) => setTimeout(resolve, 50));

    console.log('📦 收集完毕，准备发送给后端的结构化数据:', {
      qualitative: collectedQualitative,
      quantitative: collectedQuantitative
    });

    // ==========================================
    // 🚀 预留后端大模型分析核心 API 入口
    // ==========================================
    /*
    try {
      const response = await fetch('/api/medical/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualitative: collectedQualitative,
          quantitative: collectedQuantitative
        })
      });
      const result = await response.json();
      // 拿到大模型的结论后，通过下面的 BROADCAST 发送出去给结论面板
    } catch(err) { console.error("分析失败", err); }
    */

    // 3. 模拟 2 秒的后端大模型深度推理耗时
    setTimeout(() => {
      setIsAnalyzing(false);

      // 4. 通知日志面板：分析成功
      window.dispatchEvent(new CustomEvent('METRICS_QUALITATIVE_DATA', {
        detail: [] // 仅借用成功触发的逻辑，不塞新指标卡片
      }));

      // 5. ⚡ 模拟后端送来带标记的超文本数据
      window.dispatchEvent(new CustomEvent('UPDATE_CONCLUSION_PANEL', {
        detail: {
          level: '高危',
          // 后端动态在“非典型肺炎”和“红细胞计数”中植入了超链接协议
          conclusion: '经过智能体二次推导，患者目前 [红细胞计数](type:metric;id:qn-2) 极低，伴随明显的系统性缺氧。高度怀疑临床为 [非典型肺炎](type:disease;id:dis-101) 或 [特发性间质性肺炎](type:disease;id:dis-102)。',
          suggestions: [
            '1. 紧急复查血气分析与电解质；',
            '2. 准备床旁高流量吸氧并转入专科跟进。'
          ]
        }
      }));
      
    }, 2000);
  };

  return (
    <button 
      onClick={handleAction}
      disabled={isAnalyzing}
      className={`w-full h-20 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-lg rounded-xl shadow-md border-b-4 border-amber-600 transition-all cursor-pointer tracking-wider flex items-center justify-center gap-2 select-none
        ${isAnalyzing ? 'opacity-70 cursor-not-allowed border-amber-500 from-slate-200 to-slate-300 hover:from-slate-200 hover:to-slate-300 text-slate-400' : ''}`}
    >
      {isAnalyzing ? (
        <>
          <span className="animate-spin inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"></span>
          <span>正在调用全网医疗知识库深度分析中...</span>
        </>
      ) : (
        <>
          <span>⚡</span> 一键分析
        </>
      )}
    </button>
  );
}