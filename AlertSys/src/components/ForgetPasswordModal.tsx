interface ForgotModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, isAdmin, onClose }: ForgotModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-72 shadow-xl border border-slate-100 flex flex-col items-center gap-4">
        <h3 className="text-base font-semibold text-slate-800">密码重置提示</h3>
        <p className="text-sm text-slate-600 text-center leading-relaxed">
          {isAdmin ? '请联系技术售后重置密码。' : '请联系管理员重置密码。'}
        </p>
        <button
          onClick={onClose}
          className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}

/* 
    ====================================================================
    [预留后端/数据库重置逻辑注释]
    --------------------------------------------------------------------
    1. 管理员密码重置:
       - 本地部署环境: 请在服务器/本机安装目录下运行 `reset-admin-password.bat`
       - 该 BAT 脚本会调用 Node/Python 脚本直接对数据库 (SQLite/MySQL) 
         中的 admin 账户密码进行 bcrypt 哈希重置。
       
    2. 普通用户密码重置:
       - 需联系系统管理员在「后台管理 -> 用户管理」中进行密码重置。
    ====================================================================
  */