import  { useState } from 'react';

//反馈区域 — 用户给出星级评分 或文字评价 指出哪里需要修改
export default function FeedbackPanel() {
  const [rating, setRating] = useState(3);
  const [text, setText] = useState('');

  return (
    <div className="h-36 border border-red-200 rounded-xl p-3 bg-gradient-to-br from-red-50/30 to-white shadow-sm flex flex-col justify-between shrink-0">
      {/* 提示文案 */}
      <div className="text-xs font-semibold text-red-700 leading-normal">
        反馈区域 — 用户给出星级评分 或文字评价 指出哪里需要修改
      </div>

      {/* 星级评分交互 */}
      <div className="flex gap-1 text-xl text-amber-400 select-none my-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className="cursor-pointer transition-transform active:scale-120"
          >
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
        <span className="text-xs text-slate-400 ml-1 self-center">({rating}星)</span>
      </div>

      {/* 文字评价输入框 */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="指出哪里需要修改..."
          className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-red-300 bg-white"
        />
        <button 
          onClick={() => { alert(`感谢反馈: ${text}`); setText(''); }}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
        >
          提交
        </button>
      </div>
    </div>
  );
}