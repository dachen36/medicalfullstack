//关于软件 弹窗
interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* 
        修改点 1：宽度从 w-80 放大到 w-[420px] (或 w-96)
        修改点 2：内边距从 p-6 放大到 p-7
        修改点 3：元素间距从 gap-4 放大到 gap-6
      */}
      <div className="bg-white rounded-xl p-7 w-[420px] shadow-2xl border border-slate-100 flex flex-col gap-6">
        
        {/* 标题栏 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          {/* 修改点 4：标题字号从 text-base (16px) 放大到 text-lg (18px) */}
          <h3 className="text-lg font-semibold text-slate-800">关于软件</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 详细信息区域 */}
        {/* 修改点 5：全局字号从 text-xs (12px) 放大到 text-sm (14px)，垂直间距 gap-2.5 改为 gap-3.5 */}
        <div className="text-sm text-slate-600 flex flex-col gap-3.5">
          {/* 版本信息 */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">系统版本：</span>
            <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              v1.0.4-Build2026
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">知识图谱版本：</span>
            <span className="font-mono font-medium text-slate-700">KG-v2.3.1</span>
          </div>

          <hr className="border-slate-100 my-1" />

          {/* 授权与维保 */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">厂商授权状态：</span>
            <span className="text-emerald-600 font-semibold">商业正式版</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-500 whitespace-nowrap">授权服务期限：</span>
            <div className="text-right">
              <p className="font-mono font-medium text-slate-700">2026-12-31</p>
              {/* 提醒文字改用 text-xs (12px)，层次更分明 */}
              <p className="text-xs text-amber-600 mt-1 font-normal">
                （到期前请及时缴纳维保费续期）
              </p>
            </div>
          </div>

          <hr className="border-slate-100 my-1" />

          {/* 售后支持 */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">技术支持热线：</span>
            <span className="font-mono font-medium text-slate-700">400-888-6666</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">服务支持邮箱：</span>
            <span className="font-mono font-medium text-slate-700">support@company.com</span>
          </div>
        </div>

        {/* 底部按钮 */}
        {/* 修改点 6：按钮高度 py-2 改为 py-2.5，字号改 text-sm */}
        <button
          onClick={onClose}
          className="mt-1 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          确定
        </button>
      </div>
    </div>
  );
}