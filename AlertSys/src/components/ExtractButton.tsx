import { useEffect, useState } from 'react';
import type { MetricTag, QuantitativeMetric } from '../common/CommonInterface';


//一键自动抽取的按钮？ 自动执行？？
//抽取的数据结构与QualitativeMetricsPanel 及 QuantitativeMetricsPanel 保持一致！

interface ExtractFeaturesButtonProps {
  caseId: string;
  autoExtract?: boolean; // 🟢 1. 新增可选属性：是否在加载时自动提取
}

export default function ExtractFeaturesButton({ caseId, autoExtract = false }: ExtractFeaturesButtonProps) {
  const [isExtracting, setIsExtracting] = useState(false);

  // 把核心提取逻辑单独抽成一个普通函数，方便复用
  const handleExtract = async () => {
    if (isExtracting) return;
    setIsExtracting(true);

    // 1. 立即通知日志/状态面板
    window.dispatchEvent(new CustomEvent('UPLOAD_START', {
      detail: { fileName: '[AI 临床多维特征提取指令]' }
    }));

    // 2. 从本地存储获取当前患者数据
    let rawCaseData = null;
    try {
      const casesStr = localStorage.getItem('clinic_cases_v3'); // 💡 建议跟主页面统一为 v3
      if (casesStr) {
        const casesList = JSON.parse(casesStr);
        rawCaseData = casesList.find((c: any) => c.id === caseId);
        //console.log(rawCaseData)
        //{id: '456', name: 'def', gender: '男', age: 58, 
        // 患者病例: '患者男性，58岁，因“呼吸困难16 h”于2020年12月23日14∶36入院。
        // 既往有糖尿病、高血压…饱和度仅80%，予高流量吸氧（氧流量20 L/min，氧浓度100%），
        // 外周氧饱和度勉强至90%。', …}
        

      }
    } catch (err) {
      console.error("读取病例原始数据失败", err);
    }

    if (!rawCaseData) {
      console.warn("未找到该病例的原始文本，自动跳过特征提取");
      setIsExtracting(false);
      return;
    }

    // =================================================================
    // 🚀 预留后端 AI 大模型特征提取核心 API 入口
    // =================================================================
    /*
    try {
      const response = await fetch('/api/medical/extract-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: rawCaseData.name,
          age: rawCaseData.age,
          gender: rawCaseData.gender,
          symptoms: rawCaseData.symptoms,
          routineCheck: rawCaseData.routineCheck,
          pathologyCheck: rawCaseData.pathologyCheck,
          imagingCheck: rawCaseData.imagingCheck
        })
      });
      const result = await response.json();
      // result 应包含: { extractedQualitative: [...], extractedQuantitative: [...] }
    } catch(err) { 
      console.error("AI 提取特征失败", err); 
    }
    */

    // 3. ⏳ 模拟 1.5 秒后端大模型语义理解与解析时间--较高级的模拟数据
    setTimeout(() => {
      setIsExtracting(false);

      // 获取当前患者的真实数据
      const pName = rawCaseData.name || '未知患者';
      const pSymptoms = rawCaseData['症状体征'] || '未录入明显症状';
      const pRoutine =  rawCaseData['常规检查'] || '';
      const pImaging =  rawCaseData['影像学检查'] || '';
      const pPathology =  rawCaseData['病原学检查'] || '';

      // === A. 【定性卡片】动态生成 ===
      const mockQualitative: MetricTag[] = [
        { //对齐卡片的数据接口 id + label
          id: `ql-${caseId}-1`, //病种id？ 随机数？？？
          // 动态命名：例如 "张三-主诉临床综合征"
          label: `${pName}-临床综合征`,
          // 只要有症状就判定为“异常”
          //status: pSymptoms.length > 5 ? '异常' : '正常',
          // 真实提取前 40 个字
          //desc: pSymptoms.length > 40 ? `${pSymptoms.substring(0, 40)}...` : pSymptoms
        },
        {
          id: `ql-${caseId}-2`,
          label: `${pSymptoms.substring(0,5)}`,
          // 智能判断影像学描述里有没有异常词
          //status: (pImaging.includes('影') || pImaging.includes('炎') || pImaging.includes('斑片')) ? '异常' : '正常',
          //desc: pImaging ? `影像提示: ${pImaging.substring(0, 30)}...` : '暂无影像学异常报告'
        },
        {
          id: `ql-${caseId}-3`,
          label: `${pImaging.substring(10,15)}`,
          //status: pPathology ? '正常' : '未知',
          //desc: pPathology ? `筛查结果: ${pPathology.substring(0, 30)}` : '未见病原学特异性指标'
        }
      ];

      // === B. 【定量卡片】动态生成 ===
      const mockQuantitative: QuantitativeMetric[] = [];

      // 如果常规检查有数据，我们根据里面的关键字提取并截取
      if (pRoutine) {
        // 尝试匹配文本中的数字，让它看起来像提取出来的数值
        const numericMatch = pRoutine.match(/\d+(\.\d+)?/);
        const extractedValue = numericMatch ? parseFloat(numericMatch[0]) : 8.5; // 找不到数字就给个默认值 8.5
        
        // 尝试识别指标名称，比如文本里有“白细胞”或“红细胞”
        //let indicatorName = '血常规特征';
        //let unit = '10^9/L';
        //let range = '4.0 - 10.0';
        //let status: '正常' | '偏高' | '偏低' = '正常';

        // if (pRoutine.includes('白细胞')) {
        //   indicatorName = '白细胞计数';
        //   status = extractedValue > 10 ? '偏高' : (extractedValue < 4 ? '偏低' : '正常');
        // } else if (pRoutine.includes('红细胞')) {
        //   indicatorName = '红细胞计数';
        //   unit = '10^12/L';
        //   range = '4.0 - 5.5';
        //   status = extractedValue > 5.5 ? '偏高' : (extractedValue < 4 ? '偏低' : '正常');
        // } else {
        //   // 如果没匹配到，就用你要求的：直接截取常规检查的前 10 个字符作为指标名！
        //   indicatorName = pRoutine.substring(0, 10).trim() || '实验室指标';
        //   status = '正常';
        // }

        mockQuantitative.push({
          id: `qn-${caseId}-1`, //指标自身的随机id？？？
          name: `${pPathology.substring(0,5)}`,
          value: `${extractedValue}*1.2`, //模拟数据！！
          //unit: unit,
          //range: range,
          //status: status
        });
      }

      // 兜底：如果常规检查完全是空的，放一个模拟的CRP定量
      if (mockQuantitative.length === 0) {
        mockQuantitative.push({
          id: `123`,
          name: '超敏C反应蛋白(hs-CRP)',
          value: '12.8',
          //isGoldStandard?: boolean; // 是否为金标准/病理检测
          //unit: 'mg/L',
          //range: '0.0 - 5.0',
          //status: '偏高'
        });
      }



      // 5. ⚡ 核心广播，通知对应的 Panel 组件更新
      window.dispatchEvent(new CustomEvent('UPDATE_QUALITATIVE_CARDS', {detail: mockQualitative}));
      window.dispatchEvent(new CustomEvent('UPDATE_QUANTITATIVE_CARDS', {detail: mockQuantitative}));

      // 6. 成功写回日志面板
      window.dispatchEvent(new CustomEvent('METRICS_QUALITATIVE_DATA', { //数据默认值？？
        detail: [] 
      }));

      console.log(`✅ 成功为患者【${pName}】提取个性化特征并回填`);

    }, 1500);
  };

  // 🟢 2. 新增一个 useEffect：当 autoExtract 为 true 且 caseId 存在时，组件挂载或换人时自动跑一遍 handleExtract
  useEffect(() => {
    if (autoExtract && caseId) {
      // 延迟 50ms 确保页面上的面板组件已经完全加载并注册了监听器
      const timer = setTimeout(() => {
        handleExtract();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [caseId, autoExtract]); // 监听 caseId，换人时也会自动重新抽取！

  return (
    <button
      onClick={handleExtract}
      disabled={isExtracting}
      className={`w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 active:scale-98 text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 select-none
        ${isExtracting ? 'opacity-70 cursor-not-allowed from-slate-200 to-slate-300 text-slate-400' : ''}`}
    >
      {isExtracting ? (
        <>
          <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></span>
          <span>大模型语义理解中，正在提取定性/定量特征...</span>
        </>
      ) : (
        <>
          <span>🧠</span> 一键提取临床特征（AI 抽取）
        </>
      )}
    </button>
  );
}



    