//处理过程…(尽量压缩小 保留滚动条即可)
import { useState, useEffect } from 'react';

interface LogItem {
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARN'| 'INIT';
  message: string;
}

export default function ProcessLogPanel() {
  // 默认的系统初始化日志
  const nowTime = new Date().toTimeString().split(' ')[0];
  const [logs, setLogs] = useState<LogItem[]>([
    { time: nowTime, type: 'INIT', message: '系统初始化成功...' },
    { time: nowTime, type: 'INIT', message: '图像识别/OCR 模块就绪.' },
    { time: nowTime, type: 'INIT', message: '结构化数据提取引擎已上线.' },
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 1. 统一的启动监听：拿到文件名并打印开始日志
    const handleUploadStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ fileName: string }>;
      const now = new Date().toTimeString().split(' ')[0];
      setIsProcessing(true);
      setLogs(prev => [
        ...prev,
        { time: now, type: 'INFO', message: `检测到新文件上传: ${customEvent.detail.fileName || '未知文件'}` },
        { time: now, type: 'INFO', message: '启动 OCR 及格式化解析引擎，深度特征融合抽取中...' }
      ]);
    };

    // 2. 统一的成功监听：解析完成时打出成功日志
    const handleSuccess = () => {
      setIsProcessing(false);
      const now = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [
        ...prev,
        { time: now, type: 'SUCCESS', message: '结构化数据提取成功！已自动分流填入卡片。' }
      ]);
    };

    // 绑定事件
    window.addEventListener('UPLOAD_START', handleUploadStart);
    window.addEventListener('METRICS_QUALITATIVE_DATA', handleSuccess);

    // 解绑销毁
    return () => {
      window.removeEventListener('UPLOAD_START', handleUploadStart);
      window.removeEventListener('METRICS_QUALITATIVE_DATA', handleSuccess);
    };
  }, []);

  return (
    /* 修改 1: 容器换成 bg-white (白色底)，text-slate-700 (深灰字体)，border-slate-200 */
    <div className="h-96 border border-slate-200 rounded-xl p-3 bg-white text-slate-700 font-mono text-xs overflow-y-auto shadow-sm flex flex-col gap-1 shrink-0">
      {/* 修改 2: 标题改为更显眼的深灰色 text-slate-400 */}
      <div className="text-slate-400 mb-0.5 shrink-0">日志记录 (保留滚动条)</div>
      
      {/* 渲染日志列表 */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="leading-relaxed">
            {/* 修改 3: 时间前缀改为灰蓝色 text-slate-400 */}
            <span className="text-slate-400">[{log.time}]</span>{' '}
            
            {/* 修改 4: 在白色背景下，SUCCESS 类型标签改为深翠绿 text-emerald-600，其他类型标签改为深天蓝 text-sky-600 */}
            <span className={log.type === 'SUCCESS' ? 'text-emerald-600 font-bold' : 'text-sky-600'}>
              [{log.type}]
            </span>{' '}

            {/* 修改 5: 保留你的 style 颜色判断逻辑，INIT 对应红色 (#ff0000)，后续信息改为更适合白底阅读的深翠绿 (#059669) */}
            <span style={{ color: log.type === 'INIT' ? '#ff0000' : '#059669' }}>
              {log.message}
            </span>
          
          </div>
        ))}
        
        {/* 动态光标提示 */}
        {/* 修改 6: 提示动画在白底下改为更柔和的橙色 (text-amber-600) 和 绿色 (text-emerald-600) */}
        {isProcessing ? (
          <div className="animate-pulse text-amber-600 mt-1">⚡ 正在解析中，请稍候...</div>
        ) : (
          <div className="animate-pulse text-emerald-600 mt-1">_ 正在等待新数据输入...</div>
        )}
      </div>
    </div>
  );
}