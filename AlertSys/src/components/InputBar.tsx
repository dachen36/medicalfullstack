import { useState } from 'react';

//文字对话输入框
export default function InputBar() {
  const [inputValue, setInputValue] = useState('');
  const quickQueries = ['我最近头疼，有点发热', '感冒药和布洛芬能一起吃吗', '什么是高血压'];

  const handleSend = () => {
    // 1. 先把 text 稳妥地声明并提取出来，确保全局/局部都能找到
    const InputText: string = inputValue.trim();
    if (!InputText) return;

    setInputValue('');

    // ==========================================
    // 🚀 预留后端文本分析 API 联调入口 (已完全隔离，不干扰下方编译)
    // ==========================================
    // const callBackend = async () => {
    //   try {
    //     const response = await fetch('/api/medical/parse-text', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({ text: text })
    //     });
    //     const backendData = await response.json();
    //   } catch(err) { console.error("文本解析失败", err); }
    // };


    // 👇 1. 立即广播：通知日志面板“检测到指令输入”
    window.dispatchEvent(new CustomEvent('UPLOAD_START', {
      detail: { fileName: `[对话指令] "${InputText.length > 10 ? InputText.slice(0, 10) + '...' : InputText}"` }
    }));

    // 👇 2. 模拟 1 秒后大模型 NLP 结构化提取完成
    setTimeout(() => {
      // 智能提取文本中的指标特征（这块以后用后端真实返回代替）
      let detectedQualitative: any[] = [];
      let detectedQuantitative: any[] = [];

      // 简单模拟匹配逻辑：如果是发热/头疼
      if (InputText.includes('发热') || InputText.includes('头疼')) {
        detectedQualitative = [{ id: `q-input-${Date.now()}`, label: '发热' }];
        detectedQuantitative = [{ id: `qn-input-${Date.now()}`, name: '主诉体温', value: '38.5 °C' }];
      } else {
        // 默认模拟提取
        detectedQualitative = [{ id: `q-input-${Date.now()}`, label: '新发症状' }];
      }

      // 广播给定性指标面板
      window.dispatchEvent(new CustomEvent('METRICS_QUALITATIVE_DATA', {
        detail: detectedQualitative
      }));

      // 广播给定量指标面板
      if (detectedQuantitative.length > 0) {
        window.dispatchEvent(new CustomEvent('METRICS_QUANTITATIVE_DATA', {
          detail: detectedQuantitative
        }));
      }
    }, 1000);


  };

  return (
    <div className="w-full border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
      {/* 核心对话输入框 */}
      <div className="flex-1 flex items-center gap-2 border border-blue-200 rounded-lg px-3 bg-slate-50/50 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner">
        <span className="text-blue-500 font-bold text-xs whitespace-nowrap">💬 智能体输入:</span>
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="在这里输入患者新症状或对智能体下达指令..." 
          className="flex-1 py-2 bg-transparent outline-none text-sm text-slate-800"
        />
        <button 
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer"
        >
          发送
        </button>
      </div>

      {/* 快捷推荐提示词 */}
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">快捷问题:</span>
        {quickQueries.map((q, i) => (
          <button 
            key={i} 
            onClick={() => setInputValue(q)}
            className="text-xs bg-white hover:bg-blue-50 hover:text-blue-600 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}