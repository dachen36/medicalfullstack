import  { useState,useEffect } from 'react';
import type { MetricTag } from '../common/CommonInterface';

export default function QualitativeMetricsPanel() {
  const [metrics, setMetrics] = useState<MetricTag[]>([
    { id: '1', label: '畏寒' },
    { id: '2', label: '气喘' },
    { id: '3', label: '男' },
    { id: '4', label: '18岁' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 👂 挂起耳朵听外部的广播事件
  useEffect(() => {
    // 1. 响应 AI 自动提取特征的事件（直接覆盖，防止多次提取或切换患者时数据堆叠）
    const handleAiExtract = (e: Event) => {
      const customEvent = e as CustomEvent<any[]>;
      if (customEvent.detail) {

        //console.log(customEvent.detail) //此处detail就是 analysispage中的const mockQualitative = currentPatient?.患者病例 || [/* 默认定性数据 */];  //默认定性数据

        // 将后端返回的含有 id, name, status 等字段的结构，翻译成定性面板的 MetricTag 格式
        const formattedTags: MetricTag[] = customEvent.detail.map((item: any) => ({
          id: item.id || Date.now().toString() + Math.random(),
          // 如果后端字段叫 name，就用 name；否则兼容原本的 label
          label: item.name || item.label || '' 
        }));
        setMetrics(formattedTags); // ⚡ 直接覆盖当前列表，实现干净的数据回填
      }
    };

    // 2. 原有的日志面板追加逻辑（保留）
    const handleReceive = (e: Event) => {
      const customEvent = e as CustomEvent<MetricTag[]>;
      if (customEvent.detail) {
        setMetrics(prev => [...prev, ...customEvent.detail]);
      }
    };

    // 3. 响应分析按钮的呼叫，把当前最新的 metrics 吐出来
    const handleRequest = () => {
      window.dispatchEvent(new CustomEvent('RESPONSE_QUALITATIVE_CURRENT', { detail: metrics }));
    };

    // 绑定所有事件
    window.addEventListener('UPDATE_QUALITATIVE_CARDS', handleAiExtract); // 👈 监听 AI 提取
    window.addEventListener('METRICS_QUALITATIVE_DATA', handleReceive);
    window.addEventListener('REQUEST_CURRENT_METRICS', handleRequest);

    return () => {
      window.removeEventListener('UPDATE_QUALITATIVE_CARDS', handleAiExtract);
      window.removeEventListener('METRICS_QUALITATIVE_DATA', handleReceive);
      window.removeEventListener('REQUEST_CURRENT_METRICS', handleRequest);
    };

  }, [metrics]); // 保持监听 metrics 变化，确保 request 拿出去的是最新鲜的数据



  // 增加
  const handleAdd = () => {
    if (!inputValue.trim()) return;
    setMetrics([...metrics, { id: Date.now().toString(), label: inputValue.trim() }]);
    setInputValue('');
    setIsAdding(false);
  };

  // 删除
  const handleDelete = (id: string) => {
    setMetrics(metrics.filter((m) => m.id !== id));
  };

  // 修改
  const handleUpdate = (id: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setMetrics(metrics.map((m) => (m.id === id ? { ...m, label: newLabel.trim() } : m)));
    setEditingId(null);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-sm flex flex-col h-full overflow-hidden">
      {/* 头部标题区 */}
      <div className="flex justify-between items-center mb-2.5 shrink-0">
        <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          基础信息及定性指标
        </h3>
        <span className="text-[11px] text-slate-400">一键分析前可手动调改</span>
      </div>

      {/* 卡片展示与增删改区域 */}
      <div className="flex flex-wrap gap-2 overflow-y-auto flex-1 content-start pr-1">
        {metrics.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 hover:border-blue-400 shadow-xs px-3 py-1.5 rounded-lg bg-slate-50/80 flex items-center gap-2 font-medium text-slate-700 transition-colors"
          >
            {editingId === item.id ? (
              <input
                autoFocus
                type="text"
                defaultValue={item.label}
                onBlur={(e) => handleUpdate(item.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id, e.currentTarget.value)}
                className="outline-none text-sm bg-transparent w-16 border-b border-blue-500"
              />
            ) : (
              <span
                onClick={() => setEditingId(item.id)}
                className="text-sm cursor-pointer hover:text-blue-600"
                title="点击可直接修改"
              >
                {item.label}
              </span>
            )}
            <button
              onClick={() => handleDelete(item.id)}
              className="text-slate-300 hover:text-red-500 font-bold text-xs transition-colors ml-0.5"
            >
              ×
            </button>
          </div>
        ))}

        {/* 增加卡片输入流 */}
        {isAdding ? (
          <div className="border border-blue-400 rounded-lg px-2 py-1.5 flex items-center gap-1 bg-white shadow-xs">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onBlur={() => { if (!inputValue.trim()) setIsAdding(false); }}
              className="outline-none text-sm w-16 text-slate-700"
              placeholder="新指标"
            />
            <button onClick={handleAdd} className="text-xs text-emerald-600 font-bold px-0.5">✔</button>
            <button onClick={() => setIsAdding(false)} className="text-xs text-red-500 font-bold px-0.5">×</button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="border border-dashed border-slate-300 hover:border-blue-500 px-3 py-1.5 rounded-lg text-slate-400 hover:text-blue-600 text-xs font-medium transition-all cursor-pointer"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}


