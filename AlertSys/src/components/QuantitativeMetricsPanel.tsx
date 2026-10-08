import  { useState,useEffect } from 'react';
import type { QuantitativeMetric } from '../common/CommonInterface';

export default function QuantitativeMetricsPanel() {
  const [metrics, setMetrics] = useState<QuantitativeMetric[]>([
    { id: '1', name: '体温', value: '37 °C' },
    { id: '2', name: '血压', value: '120 mmHg' },
    { id: '3', name: '红细胞计数', value: '2.18 × 10¹²' },
    { id: '4', name: '上呼吸道病原体核酸', value: '阴性', isGoldStandard: true },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isGold, setIsGold] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 👂 挂起耳朵听定量数据的广播
  useEffect(() => {
    // 1. 响应 AI 自动提取定量特征的事件（直接覆盖，防堆叠）
    const handleAiExtract = (e: Event) => {
      const customEvent = e as CustomEvent<any[]>;
      if (customEvent.detail) {
        // 将后端返回的数据映射回当前面板的 QuantitativeMetric 格式
        const formattedMetrics: QuantitativeMetric[] = customEvent.detail.map((item: any) => ({
          id: item.id || Date.now().toString() + Math.random(),
          name: item.name || '',
          // 兼容后端返回的不同数值格式：比如单独的值 + 单位，或者直接组合好的 value 
          value: item.value !== undefined ? `${item.value}${item.unit ? ' ' + item.unit : ''}` : '',
          // 根据后端状态或属性判断是否标记为金标准
          isGoldStandard: item.isGoldStandard || item.status === '金标准' || false
        }));
        setMetrics(formattedMetrics); // ⚡ 直接覆盖当前列表，干净回填
      }
    };

    // 2. 原有的日志面板追加逻辑（保留）
    const handleReceive = (e: Event) => {
      const customEvent = e as CustomEvent<QuantitativeMetric[]>;
      if (customEvent.detail) {
        setMetrics(prev => [...prev, ...customEvent.detail]);
      }
    };

    // 3. 响应分析按钮的呼叫，回传当前的 metrics
    const handleRequest = () => {
      window.dispatchEvent(new CustomEvent('RESPONSE_QUANTITATIVE_CURRENT', { detail: metrics }));
    };

    // 注册所有事件监听器
    window.addEventListener('UPDATE_QUANTITATIVE_CARDS', handleAiExtract); // 👈 监听 AI 提取
    window.addEventListener('METRICS_QUANTITATIVE_DATA', handleReceive);
    window.addEventListener('REQUEST_CURRENT_METRICS', handleRequest);

    return () => {
      window.removeEventListener('UPDATE_QUANTITATIVE_CARDS', handleAiExtract);
      window.removeEventListener('METRICS_QUANTITATIVE_DATA', handleReceive);
      window.removeEventListener('REQUEST_CURRENT_METRICS', handleRequest);
    };
    
  }, [metrics]); // 确保 metrics 变化时 request 能拿到最新数据


  // 增加
  const handleAdd = () => {
    if (!newName.trim() || !newValue.trim()) return;
    setMetrics([
      ...metrics,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        value: newValue.trim(),
        isGoldStandard: isGold,
      },
    ]);
    setNewName('');
    setNewValue('');
    setIsGold(false);
    setIsAdding(false);
  };

  // 删除
  const handleDelete = (id: string) => {
    setMetrics(metrics.filter((m) => m.id !== id));
  };

  // 修改
  const handleUpdate = (id: string, updatedFields: Partial<QuantitativeMetric>) => {
    setMetrics(metrics.map((m) => (m.id === id ? { ...m, ...updatedFields } : m)));
  };

  return (
    <div className="border border-cyan-200 rounded-xl p-3.5 bg-white shadow-sm flex flex-col h-full overflow-hidden">
      {/* 头部标题区 */}
      <div className="flex justify-between items-center mb-2.5 shrink-0">
        <h3 className="text-xs font-bold text-cyan-800 tracking-wider uppercase">
          数值化定量指标及病理/病原体检测
        </h3>
        <span className="text-[11px] text-slate-400">一键分析前可手动调改</span>
      </div>

      {/* 卡片展示与增删改区域 */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 content-start">
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((item) => (
            <div
              key={item.id}
              className={`border p-2 rounded-lg flex justify-between items-center relative group shadow-xs transition-colors
                ${item.isGoldStandard 
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 col-span-2' 
                  : 'border-slate-100 bg-slate-50/50 text-slate-800'}`}
            >
              {/* 删除按钮 (悬浮显示) */}
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center font-bold text-[10px] shadow-sm z-10"
              >
                ×
              </button>

              {editingId === item.id ? (
                <div className="flex gap-1 w-full items-center text-xs">
                  <input
                    autoFocus
                    type="text"
                    defaultValue={item.name}
                    onBlur={(e) => handleUpdate(item.id, { name: e.target.value })}
                    className="outline-none border-b border-cyan-500 bg-white px-1 w-1/2"
                  />
                  <input
                    type="text"
                    defaultValue={item.value}
                    onBlur={(e) => handleUpdate(item.id, { value: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="outline-none border-b border-cyan-500 bg-white px-1 w-1/2"
                  />
                  <button onClick={() => setEditingId(null)} className="text-emerald-600 font-bold">✔</button>
                </div>
              ) : (
                <div 
                  onClick={() => setEditingId(item.id)} 
                  className="flex justify-between w-full items-center cursor-pointer"
                  title="点击可直接修改"
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    {item.isGoldStandard && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>}
                    <span className={item.isGoldStandard ? 'font-medium' : 'text-slate-500'}>{item.name}</span>
                  </div>
                  <span className={`text-sm ${item.isGoldStandard ? 'font-bold text-emerald-700' : 'font-bold text-slate-800'}`}>
                    {item.value}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 增加卡片输入流 */}
        {isAdding ? (
          <div className="border border-cyan-400 rounded-lg p-2 bg-white shadow-xs text-xs space-y-2 mt-1">
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名称(如:心率)"
                className="outline-none border border-slate-200 rounded px-1.5 py-1 w-1/2"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="数值(如:95次/分)"
                className="outline-none border border-slate-200 rounded px-1.5 py-1 w-1/2"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <label className="flex items-center gap-1 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isGold}
                  onChange={(e) => setIsGold(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                标记为金标准/病理检测
              </label>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded font-medium">确认</button>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 px-1">取消</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="border border-dashed border-slate-300 hover:border-cyan-500 p-2 rounded-lg text-slate-400 hover:text-cyan-600 text-xs font-medium transition-all cursor-pointer w-full text-center mt-1"
          >
            + 添加定量指标 / 金标准检测
          </button>
        )}
      </div>
    </div>
  );
}