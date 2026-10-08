import { useState, useEffect,useRef } from 'react';
import TraceModal from './TraceModal';

export default function ConclusionPanel() {
  const [activeTrace, setActiveTrace] = useState<{ id: string; title: string; type: string } | null>(null);
  
  const [report, setReport] = useState({
    level: '待分析',
    // 模拟后端返回带有“文本标记”的真实数据
    conclusionText: '等待一键分析深度输出结论...',
    suggestions: ['等待输入患者数据并点击分析...']
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const data = (e as CustomEvent).detail;
      setReport({
        level: data.level,
        conclusionText: data.conclusion, // 接收后端传来的带标记文本
        suggestions: data.suggestions
      });
    };

    window.addEventListener('UPDATE_CONCLUSION_PANEL', handleUpdate);
    return () => window.removeEventListener('UPDATE_CONCLUSION_PANEL', handleUpdate);
  }, []);

  // =========================================================
  // 🔍 核心解析函数：将 "文字 [可点文本](type:xxx;id:yyy) 文字" 转化为 React Element 数组
  // =========================================================
  const renderInteractiveText = (rawText: string) => {
    // 正则表达式匹配格式: [显示文本](type:类型;id:标识)
    const regex = /\[(.*?)\]\((type:.*?;id:.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      const matchIndex = match.index;
      
      // 1. 放入匹配项之前的普通文本
      if (matchIndex > lastIndex) {
        parts.push(rawText.substring(lastIndex, matchIndex));
      }

      const linkText = match[1]; // 中括号里的文本，例如 "非典型肺炎"
      const linkPropsRaw = match[2]; // 小括号里的属性字符串，例如 "type:disease;id:dis-101"

      // 解析属性
      const propsMap: Record<string, string> = {};
      linkPropsRaw.split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) propsMap[k] = v;
      });

      // 2. 将匹配到的词组转化为可点击的 React Button 超链接
      parts.push(
        <button
          key={matchIndex}
          onClick={() => setActiveTrace({ 
            id: propsMap.id || 'default', 
            title: linkText, // 直接展示疾病/指标名称，如 “非典型肺炎”
            type: propsMap.type || 'metric' // 传入实际的类型
          })}
          className="text-blue-600 font-semibold underline hover:text-blue-800 mx-0.5 cursor-pointer inline-block"
        >
          {linkText}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    // 3. 放入剩余的普通文本
    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : rawText;
  };

  const panelRef = useRef<HTMLDivElement>(null); // 👈 1. 创建 Ref 绑定 DOM 节点
  

  //定义导出的pdf的样式
  const handleExportPDF = () => {
  // 假定你的组件中存在 report.alerts 字符串数组，格式为后端传入的 alerts_list
  // 如果当前仅有 report.conclusionText，可以通过构造 alerts 数组传进来：
  const rawAlerts: string[] = report.suggestions || []; // 或你实际存储 alerts 字符串数组的字段

  // =========================================================
  // 1. 数据解析：将 Backend 格式的文本拆解为结构化 JSON 数据
  // 例："abc 血小板数值 15.0 超出安全范围 (阈值: 25.0) - 《...》 (儿科肺部)"
  // =========================================================
  interface ParsedAlert {
    patient: string;
    indicator: string;
    value: string;
    threshold: string;
    evidence: string;
    dept: string;
  }

  const parsedAlerts: ParsedAlert[] = [];

  rawAlerts.forEach((line) => {
    if (!line || typeof line !== 'string') return;

    const trimmed = line.trim();
    // 正则拆分文本
    const regex = /(\w+)\s+([\u4e00-\u9fa5]+数值)\s+([\d.]+)\s+超出安全范围\s+\(阈值:\s+([\d.]+)\)\s+-\s+(.+)/;
    const match = trimmed.match(regex);

    if (match) {
      const evidenceFull = match[5];
      let dept = '未分类';
      let evidence = evidenceFull;

      // 从尾部匹配科室：(儿科肺部)
      const deptMatch = evidenceFull.match(/\(([^)]+)\)$/);
      if (deptMatch) {
        dept = deptMatch[1];
        evidence = evidenceFull.replace(`(${dept})`, '').trim();
      }

      parsedAlerts.push({
        patient: match[1],
        indicator: match[2].replace('数值', ''),
        value: match[3],
        threshold: match[4],
        evidence: evidence,
        dept: dept,
      });
    }
  });

  // 获取去重并排序后的科室列表
  const depts = Array.from(new Set(parsedAlerts.map((a) => a.dept))).sort();

  // =========================================================
  // 2. 拼装后台风格的精美 HTML 字符串
  // =========================================================
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333333; padding: 20px; }
        .header { border-bottom: 2px solid #c93b2b; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 24px; color: #c93b2b; font-weight: bold; margin: 0; }
        .summary-box { background-color: #fdf3f2; border-left: 4px solid #c93b2b; padding: 12px; margin-bottom: 20px; }
        h2 { font-size: 18px; color: #2c3e50; border-left: 4px solid #2c3e50; padding-left: 8px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f4f6f8; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 14px; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; background-color: #fee2e2; color: #991b1b; font-weight: bold; }
        .source-text { color: #64748b; font-size: 13px; }
        @page { size: A4; margin: 15mm; }
    </style>
    </head>
    <body>
        <div class="header"><p class="title">🚨 医疗临床风险拦截报警报告</p></div>
        <div class="summary-box">
          <p><strong>报告摘要：</strong>系统检测到有指标异常，请相关临床医生立即结合对应医学指南复核。</p>
          <p><strong>综合结论：</strong>${report.conclusionText.replace(/\[(.*?)\]\(.*?\)/g, '$1')}</p>
        </div>
  `;

  // 兜底降级处理：如果没有匹配到任何格式化的科室列表，则直接打印原始行文本
  if (depts.length === 0 && rawAlerts.length > 0) {
    htmlContent += `<h2>异常风险报警明细</h2>`;
    htmlContent += `<table><thead><tr><th>警报明细描述</th></tr></thead><tbody>`;
    rawAlerts.forEach((line) => {
      htmlContent += `<tr><td>${line.trim()}</td></tr>`;
    });
    htmlContent += `</tbody></table>`;
  } else {
    // 按科室动态渲染分类表格
    depts.forEach((dept) => {
      htmlContent += `<h2>${dept} 相关报警</h2>`;
      htmlContent += `<table><thead><tr>
          <th style='width:12%'>患者</th>
          <th style='width:18%'>异常指标</th>
          <th style='width:15%'>当前数值</th>
          <th style='width:15%'>安全阈值</th>
          <th style='width:40%'>依据医学指南文献</th>
      </tr></thead><tbody>`;

      parsedAlerts
        .filter((a) => a.dept === dept)
        .forEach((a) => {
          htmlContent += `<tr>
            <td>${a.patient}</td>
            <td><span class="badge">${a.indicator}</span></td>
            <td style="font-weight:bold;color:#c93b2b;">${a.value}</td>
            <td>${a.threshold}</td>
            <td class="source-text">${a.evidence}</td>
          </tr>`;
        });

      htmlContent += `</tbody></table>`;
    });
  }

  htmlContent += `</body></html>`;

  // =========================================================
  // 3. 利用隐藏 iframe 拉起 Web 原生打印保存为 PDF（完美兼容 Tauri）
  // =========================================================
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 250);
};





  return (
    <div ref={panelRef} className="border border-red-200 rounded-xl bg-red-50/60 p-4 flex flex-col justify-between h-full shadow-sm overflow-y-auto relative">
      <div className="shrink-0 flex items-center justify-between">
        
        {/* 🎯 用一个无动画的 flex 容器包裹它们，让它们并排对齐 */}
        <div className="flex items-center gap-1.5 text-sm">
          
          {/* 1. 只有警报分级闪烁 */}
          <div className="text-[30px] text-red-600 font-black flex items-center gap-1.5 animate-pulse">
            ⚠️ 警报分级: {report.level}
          </div>

          {/* 2. 放在外面，保持静止的时间戳 */}
          <span className="text-slate-400 font-normal text-xs ml-1">
            [{new Date().toLocaleTimeString('zh-CN', { hour12: false })}]
          </span>

          {/* 👈 右侧追加导出 PDF 按钮 */}
          <button
            onClick={handleExportPDF}
            className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            📄 导出 PDF
          </button>


        </div>

      </div>

      <div className="flex-1 my-3 text-xs leading-relaxed text-slate-700">
        <div className="font-bold text-slate-800 mb-1 text-xs">综合结论：</div>
        {/* 调用解析函数，将文本动态转化为带交互的 React 节点数组 */}
        <p className="inline-block">
          {renderInteractiveText(report.conclusionText)}
        </p>
      </div>

      <div className="border-t border-red-100 pt-2.5 shrink-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">进一步检查建议：</div>
        <div className="text-[11px] text-slate-600 leading-relaxed mt-1">
          {report.suggestions.map((s, idx) => <div key={idx}>{s}</div>)}
        </div>
      </div>

      {activeTrace && (
        <TraceModal 
          id={activeTrace.id} 
          title={activeTrace.title} 
          type={activeTrace.type} // 👈 动态传入类型，告诉弹窗怎么干活
          onClose={() => setActiveTrace(null)} 
        />
      )}
    </div>
  );
}