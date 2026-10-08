//（图表可视化独立面板）
//目前先为你划好标准区域，等待今后接入真实图表：

//import React from 'react';

import { useState } from 'react';

export default function ChartPanel() {
  const [activeTab, setActiveTab] = useState('probability');

  const tabs = [
    { id: 'probability', label: '鉴别诊断概率' },
    { id: 'trend', label: '就诊与指标趋势' },
    { id: 'timeline', label: '病情演进时间线' },
    { id: 'operation', label: '运营统计---后端' }, //!!!估计要移到后端
  ];

  // 1. 鉴别诊断概率 模拟数据
  const probabilityData = [
    { disease: '急性冠脉综合征 (ACS)', prob: 78, tag: '高风险', color: 'bg-rose-500' },
    { disease: '主动脉夹层', prob: 12, tag: '需排查', color: 'bg-amber-500' },
    { disease: '急性肺栓塞', prob: 6, tag: '低风险', color: 'bg-emerald-500' },
    { disease: '气胸 / 肋软骨炎', prob: 4, tag: '低风险', color: 'bg-slate-400' },
  ];

  // 2. 检验指标趋势 模拟数据
  const trendData = [
    { date: '05-10', cTnI: 0.02, wbc: 6.5 },
    { date: '05-12', cTnI: 0.08, wbc: 8.2 },
    { date: '05-15 (急诊)', cTnI: 2.45, wbc: 12.8 },
    { date: '05-16', cTnI: 1.80, wbc: 10.1 },
    { date: '05-18', cTnI: 0.45, wbc: 7.4 },
  ];

  // 3. 病情演进时间线 模拟数据
  const timelineData = [
    { time: '2026-05-10 10:00', title: '首次门诊', desc: '主诉胸闷2周，开立心电图与常规化验。', type: 'visit' },
    { time: '2026-05-15 02:30', title: '急诊入院', desc: '突发剧烈胸痛3小时，伴大汗，心肌酶升高。', type: 'emergency' },
    { time: '2026-05-15 04:00', title: 'PCI 介入手术', desc: '冠脉造影示 L strain 90% 狭窄，成功植入支架1枚。', type: 'surgery' },
    { time: '2026-05-18 11:00', title: '好转出院', desc: '指标恢复正常，开立替格瑞洛等药物带药出院。', type: 'discharge' },
  ];

  // 4. 运营统计 模拟数据
  const operationMetrics = [
    { label: '本周推演次数', value: '1,284', change: '+12.5%', isUp: true },
    { label: '常见诊断准确率', value: '94.2%', change: '+1.8%', isUp: true },
    { label: '平均响应延时', value: '320ms', change: '-15ms', isUp: true },
    { label: '报告导出份数', value: '452', change: '-3.1%', isUp: false },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-700">
      {/* Tab 导航栏 */}
      <div className="flex border-b border-slate-100 bg-slate-50/60 px-2 pt-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-cyan-600 border-t-2 border-cyan-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 图表展示面板 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Tab 1: 鉴别诊断概率直方图 */}
        {activeTab === 'probability' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-500">AI 推理匹配概率分布</span>
              <span className="text-[10px] text-slate-400">基于病例特征多模态计算</span>
            </div>
            {probabilityData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.disease}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.prob}%</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${item.color}`}>
                      {item.tag}
                    </span>
                  </div>
                </div>
                {/* 模拟直方图 Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${item.prob}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: 检验指标趋势折线图 */}
        {activeTab === 'trend' && (
          <div className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                  肌钙蛋白 cTnI (ng/mL)
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                  白细胞 WBC (10^9/L)
                </span>
              </div>
              <span className="text-[10px] text-rose-500 font-medium">⚠️ 05-15 出现明显峰值</span>
            </div>

            {/* 原生 SVG 绘制简易折线图 */}
            <div className="w-full h-36 bg-slate-50/50 rounded-lg p-2 border border-slate-100 flex items-end justify-between relative">
              {/* 参考警戒线 */}
              <div className="absolute top-1/3 left-0 right-0 border-b border-dashed border-rose-300 text-[9px] text-rose-400 pl-2">
                cTnI 危机值 (1.0)
              </div>
              
              {trendData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 z-10">
                  <div className="text-[10px] font-bold text-cyan-600 mb-1">{d.cTnI}</div>
                  {/* 柱形/数据点高度映射 */}
                  <div
                    className="w-2 bg-cyan-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.min(d.cTnI * 35 + 8, 80)}px` }}
                  />
                  <span className="text-[10px] text-slate-400 mt-2 scale-90">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: 病情演进时间线 */}
        {activeTab === 'timeline' && (
          <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-100">
            {timelineData.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* 时间线圆点 */}
                <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-white" />
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: 运营统计指标卡片 */}
        {activeTab === 'operation' && (
          <div className="grid grid-cols-2 gap-2.5">
            {operationMetrics.map((m, i) => (
              <div key={i} className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500">{m.label}</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-bold text-slate-800">{m.value}</span>
                  <span className={`text-[10px] font-medium ${m.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {m.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}