import { useState } from 'react';
import { ForgotPasswordModal } from './components/ForgetPasswordModal';
import { AboutModal } from './components/AboutModal';
import { doing} from './utils'; 
import type { AccountFormat } from './common/CommonInterface';


interface LoginPageProps {
  onLoginSuccess: (currentRole: Role, accountinfo: AccountFormat) => void;
}



type Role = 'user' | 'admin';

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [role, setRole] = useState<Role>('user');
  const [userId, setUserId] = useState(''); // 纯数字内容的字符串（如 "1001"）
  const [password, setPassword] = useState('');

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);   //模拟账号登录中 的 临时状态


  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'admin') setUserId('');
  };

  //处理登录逻辑
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 本地校验
    if (role === 'admin' && !password.trim()) return alert('请输入管理员密码！');
    if (role === 'user' && (!userId.trim() || !password.trim())) return alert('请输入账号(ID)和密码！');

    setIsLoading(true);

    // 2. 线性发送网络请求（用 doing() 包包裹，不会抛出异常中断）
    const [networkError, response] = await doing(
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId: userId.trim(), password: password.trim() }),
      })
    );

    // 如果网络挂了（局域网断开、后端没启动）
    if (networkError || !response) {
      setIsLoading(false);
      return alert('网络异常，无法连接到服务器');
    }

    // 3. 线性解析响应数据
    const [parseError, result] = await doing(response.json());

    if (parseError || !result) {
      setIsLoading(false);
      return alert('数据解析失败');
    }

    setIsLoading(false);

    // 4. 根据后端结果进行提示与业务跳转（完美复刻你原来的逻辑）
    if (response.ok && result.success) {
      if (role === 'admin') {
        alert('管理员登录成功！');
      } else {
        alert(`登录成功！欢迎 ${result.user.username}`);
      }
      onLoginSuccess(role, result.user);
    } else {
      alert(result.message || '账号或密码错误！');
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-80 flex flex-col items-center">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          <div className="flex items-center justify-around pb-2 border-b border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => handleRoleChange('user')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              用户
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => handleRoleChange('admin')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              管理员
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className={`text-sm font-medium whitespace-nowrap ${isAdmin ? 'text-slate-400' : 'text-slate-600'}`}>
              账号(ID)
            </label>
            <input
              type="text"
              value={userId}
              disabled={isAdmin}
              onChange={(e) => setUserId(e.target.value)}
              className="w-44 px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              placeholder={isAdmin ? '管理员无需输入' : '请输入数字账号'}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-44 px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              placeholder="请输入密码"
            />
          </div>

          <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-all ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  正在验证身份...
                </span>
              ) : (
                '登 录'
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
            >
              忘记密码
            </button>

            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
            >
              关于软件
            </button>

            {/* 🧪 调试专用：快速添加测试账号 */}
            <button
              type="button"
              onClick={async () => {
                // 1. 弹出输入框搜集数据
                const idInput = window.prompt('【调试】请输入医生的数字账号ID（如 1001 或 001）：');
                if (!idInput || !idInput.trim()) return alert('取消添加：账号ID不能为空！');

                const idStr = idInput.trim();
                if (!/^\d+$/.test(idStr)) return alert('添加失败：账号ID只能由纯数字组成！');

                const password = window.prompt('【调试】请输入登录密码：');
                if (!password || !password.trim()) return alert('取消添加：密码不能为空！');

                const username = window.prompt('【调试】请输入医生显示的姓名（如 张医生）：') || '未命名医生';

                // 2. 线性发送 POST 请求到后端 api/auth/add-user
                const [networkError, response] = await doing(
                  fetch('/api/auth/add-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: idStr,
                      username: username.trim(),
                      password: password.trim(),
                      avatarUrl: ''
                    }),
                  })
                );

                // 3. 网络错误校验
                if (networkError || !response) {
                  return alert('添加失败：无法连接到后端服务器！');
                }

                // 4. 解析后端返回的数据
                const [parseError, result] = await doing(response.json());

                if (parseError || !result) {
                  return alert('添加失败：后端返回数据格式有误！');
                }

                // 5. 提示后端处理好的结果（包含了重复 ID 校验等）
                if (response.ok && result.success) {
                  alert(result.message);
                } else {
                  alert(result.message || '添加失败！');
                }
              }}
              className="mt-4 w-80 py-1.5 px-3 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded border border-dashed border-gray-400 text-center cursor-pointer transition-colors"
            >
              🛠️ [调试] 点此连续弹窗添加测试账号
            </button>

          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        isAdmin={isAdmin}
        onClose={() => setShowForgotModal(false)}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
}