import { useState, useEffect } from 'react';

interface TraceModalProps {
  id: string;
  title: string;
  type: 'disease' | 'metric' | string;
  onClose: () => void;
}

export default function TraceModal({ id, title, type, onClose }: TraceModalProps) {
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [content, setContent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载模拟数据（或真实接口）
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (type === 'disease') {
        if (id === 'dis-101') {
          setContent([
            '【疾病释义】非典型肺炎（Atypical Pneumonia）是指由支原体、衣原体、军团菌或病毒等非典型病原体引起的肺部炎症。',
            '【临床特征】起病常较缓，伴有发热、头痛、寒战以及显著的刺激性干咳。肺部体征往往不明显，与 X 线表现不一致。',
            '【治疗原则】首选大环内酯类（如阿奇霉素）或氟喹诺酮类抗生素，普通青霉素及头孢菌素类治疗通常无效。'
          ]);
        } else {
          setContent([
            `【疾病查询】已成功检索疾病 ID: ${id}`,
            '暂无详细医学知识库描述，请在后台系统配置相关医学条目。'
          ]);
        }
      } else {
        setContent([
          `// 对应关键点的智能体推导日志 (ID: ${id})`,
          '• 提取定量特征值，触发阈值告警。',
          '• 排查常规感染链路后，结合定性指标[畏寒]转移至非典型病原体决策分支。',
          '• 神经网络联合注意力机制对“病原学阴性”与“红细胞极低”进行二次特征交叉，输出置信度 94.2% 的研判。'
        ]);
      }
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [id, type]);

  const handleSubmit = () => {
    if (!feedbackType) return alert('请选择反馈类型');
    alert(`反馈已送达！\n类型: ${feedbackType}\n详情: ${comment || '无'}`);
    onClose();
  };

  return (
    // 【全局背景遮罩 Overlay】使用 fixed 盖住全屏，半透明黑底背景 (bg-slate-900/40) 并带有一点毛玻璃滤镜 (backdrop-blur-xs)
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose} // 点击弹窗外部空白处直接关闭弹窗
    >
      {/* 【弹窗主体容器】居中放大，最大宽度 800px (max-w-3xl)，设定最大高度 (max-h-[85vh]) 保证在小屏幕上也能完美适配不溢出 */}
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-100 flex flex-col w-full max-w-3xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // 阻止冒泡，防止点击弹窗内部也触发 onClose
      >
        
        {/* 1. 弹窗头部 */}
        <div className="flex justify-between items-center border-b border-slate-100 px-5 py-3.5 shrink-0">
          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <span className="text-base">{type === 'disease' ? '📖' : '🧠'}</span> 
            {type === 'disease' ? '医学知识库' : '链路溯源'}: 
            <span className="text-slate-600 font-medium"> [{title}]</span>
          </h4>
          <button 
            onClick={onClose} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {/* 2. 弹窗身体区域 (左右分栏，内部独立滚动) */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-5">
          
          {/* 左侧内容区：支持内部纵向滚动 (overflow-y-auto) */}
          <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-700 space-y-3">
            {isLoading ? (
              <div className="space-y-3 animate-pulse py-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                <div className="h-3 bg-slate-200 rounded w-4/5"></div>
              </div>
            ) : (
              content.map((line, idx) => (
                <p 
                  key={idx} 
                  className={line.startsWith('//') ? 'text-blue-600 font-bold' : 'leading-relaxed'}
                >
                  {line}
                </p>
              ))
            )}
          </div>

          {/* 右侧反馈栏：宽度适度放宽到 w-56 (约224px)，使用 Flex 布局确保按钮永远被推到底部 */}
          {/* 改变点：min-h-[800px] 换成了 h-full，并加上 overflow-y-auto 允许独立滚动 */}
          <div className="w-full md:w-56 border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-start shrink-0 text-xs">
            <div className="space-y-2">
              
              <span className="font-bold text-slate-500 block text-[11px] uppercase tracking-wider">
                纠错反馈类型:
              </span>

              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'logic_error', label: '❌ 思考链路错误' },
                  { key: 'association_error', label: '🔗 联想偏离/错误' },
                  { key: 'data_error', label: '📊 数据解读有误' }
                ].map(feedback => (
                  <button
                    key={feedback.key}
                    onClick={() => setFeedbackType(feedback.key)}
                    className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      feedbackType === feedback.key 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {feedback.label}
                  </button>
                ))}
              </div>
              
              {/* 输入框区域 */}
              {feedbackType && (
                <textarea 
                  rows={3}
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="具体哪里错了..." 
                  className="w-full border border-slate-200 rounded-lg p-2 text-[11px] outline-none focus:border-blue-500 bg-white mt-2 transition-colors resize-none"
                />
              )}
            </div>

              {/* 提交反馈按钮：通过 flex-col 和 justify-between 确保它牢牢地呆在反馈卡片的最底部 */}
              <button 
                onClick={handleSubmit} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] py-2 rounded-lg font-medium mt-3 cursor-pointer shadow-sm transition-colors shrink-0"
              >
                提交反馈
              </button>
          </div>

        </div>

      </div>

    </div>
  );
}