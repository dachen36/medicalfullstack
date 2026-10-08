import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import LoginPage from './LoginPage';         // 登录页
import LandingPage from './LandingPage';     // 病例列表/起始页
import AnalysisPage from './AnalysisPage';   // 分析面板

export default function App() {
  const navigate = useNavigate();

  // 1. 登录成功：对应你原有的 handleLoginSuccess
  const handleLoginSuccess = (role: 'user' | 'admin', accountinfo?: any) => {
    // 把 role 或者 accountinfo 通过 state 传过去，或者直接带在路径里
    navigate('/landing', { state: { role, accountinfo } });
  };

  // 2. 退出登录：直接跳回登录页
  const handleLogout = () => {
    // 拿到当前登录的用户信息 修改为读取当前登陆上的用户信息！！！ 新增api endpoint
    //const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // 发送登出请求供后端中间件捕捉审计日志
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 123 ,
        role: 456,
      })
    }).catch(() => {}); // 盲发，不管成功失败

    // 清除本地存储并跳转
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // 3. 选择病例 -> 进入分析页（把 caseId 变成网址的一部分：/analysis/123）
  const handleSelectCase = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  // 4. 从分析页返回列表
  const handleBackToList = () => {
    navigate('/landing');
  };

  return (
    <div className="w-screen h-screen bg-slate-50 overflow-hidden select-none">
      <Routes>
        {/* 登录页 */}
        <Route 
          path="/login" 
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />} 
        />

        {/* 列表页 */}
        <Route 
          path="/landing" 
          element={
            <LandingPage 
              onSelectCase={handleSelectCase} 
              onLogout={handleLogout} 
            />
          } 
        />

        {/* 分析页：利用组件把动态路由的 :id 拿出来传给你的 AnalysisPage */}
        <Route 
          path="/analysis/:id" 
          element={<AnalysisWrapper onBack={handleBackToList} />} 
        />

        {/* 默认根路径自动重定向到登录页 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

// 辅助小组件：用来提取 URL 里的动态 :id 参数，完美匹配你原有的 AnalysisPageProps
function AnalysisWrapper({ onBack }: { onBack: () => void }) {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <AnalysisPage 
      caseId={id} 
      onBack={onBack} 
    />
  );
}