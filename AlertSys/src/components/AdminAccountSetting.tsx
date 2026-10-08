import React, { useState, useEffect } from 'react';
import type { AccountFormat } from '../common/CommonInterface';
import { doing } from '../utils'; // 线性异步函数，返回 [error, data] 数组

interface AdminManageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminManageAccountModal({ isOpen, onClose }: AdminManageAccountModalProps) {
  const [users, setUsers] = useState<AccountFormat[]>([]);

  // 编辑表单 State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');

  // 新增账号表单 State
  const [newId, setNewId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 搜索框 State
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 从后端 SQLite 数据库拉取账号列表
  const fetchUsers = async (searchVal = '') => {
    const query = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
    const [netErr, res] = await doing(fetch(`/api/auth/users${query}`));

    if (netErr || !res || !res.ok) return;

    const [parseErr, result] = await doing(res.json());
    if (!parseErr && result?.success && Array.isArray(result.users)) {
      setUsers(result.users);
    }
  };

  // 弹窗打开或搜索关键词改变时发请求（包含简单防抖/即时拉取）
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, searchTerm]);

  if (!isOpen) return null;

  // 2. 新增账号 (C)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newId.trim();
    const username = newUsername.trim();
    const password = newPassword.trim();

    if (!id || !/^\d+$/.test(id)) return alert('账号 ID 必须是纯数字字符串！');
    if (!password) return alert('请输入密码！');

    const [netErr, res] = await doing(
      fetch('/api/auth/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          username: username || '新医生',
          password,
          rank: 'doctor',
        }),
      })
    );

    if (netErr || !res) return alert('网络错误：添加账号失败！');

    const [parseErr, result] = await doing(res.json());
    if (parseErr || !result || !result.success) {
      return alert(result?.message || '账号添加失败！');
    }

    setNewId('');
    setNewUsername('');
    setNewPassword('');
    alert('账号添加成功！');
    fetchUsers(searchTerm);
  };

  // 3. 删除账号 (D)
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除账号【${name} (ID: ${id})】吗？`)) return;

    const [netErr, res] = await doing(
      fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    );

    if (netErr || !res) return alert('网络错误：删除失败！');

    const [parseErr, result] = await doing(res.json());
    if (parseErr || !result || !result.success) {
      return alert(result?.message || '删除账号失败！');
    }

    alert('账号删除成功！');
    fetchUsers(searchTerm);
  };

  // 4. 重置密码 (U)
  const handleResetPassword = async (id: string) => {
    const defaultPwd = '123';
    const newPwd = window.prompt(`正在重置 ID 为 ${id} 的密码：`, defaultPwd);

    if (newPwd === null) return;
    if (!newPwd.trim()) return alert('密码不能为空！');

    const [netErr, res] = await doing(
      fetch('/api/auth/admin-update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: newPwd.trim() }),
      })
    );

    if (netErr || !res) return alert('网络错误：修改密码失败！');

    const [parseErr, result] = await doing(res.json());
    if (parseErr || !result || !result.success) {
      return alert(result?.message || '重置密码失败！');
    }

    alert('密码重置成功！');
    fetchUsers(searchTerm);
  };

  // 5. 修改显示姓名 (U)
  const startEditName = (user: AccountFormat) => {
    setEditingId(user.id);
    setEditUsername(user.username);
  };

  const saveEditName = async (id: string) => {
    const trimmedName = editUsername.trim();
    if (!trimmedName) return alert('显示姓名不能为空！');

    const [netErr, res] = await doing(
      fetch('/api/auth/admin-update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, username: trimmedName }),
      })
    );

    if (netErr || !res) return alert('网络错误：修改姓名失败！');

    const [parseErr, result] = await doing(res.json());
    if (parseErr || !result || !result.success) {
      return alert(result?.message || '修改姓名失败！');
    }

    setEditingId(null);
    alert(`账号 ID ${id} 的名字已修改为: ${trimmedName}`);
    fetchUsers(searchTerm);
  };

  // 5.5 修改 Rank 权限 (U)
  const handleRankChange = async (id: string, newRank: string) => {
    const [netErr, res] = await doing(
      fetch('/api/auth/admin-update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rank: newRank }),
      })
    );

    if (netErr || !res) return alert('网络错误：修改权限失败！');

    const [parseErr, result] = await doing(res.json());
    if (parseErr || !result || !result.success) {
      return alert(result?.message || '修改权限失败！');
    }

    alert(`账号 ID ${id} 的权限已修改为: ${newRank}`);
    fetchUsers(searchTerm);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal 头部 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">账号列表管理 (管理员)</h3>
            <p className="text-xs text-slate-500">直接管理医生账号、新增、改名、重置密码和删除</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Modal 主体：滚动区域 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ① 添加新账号表单 */}
          <form onSubmit={handleAddUser} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">➕ 快速添加新账号</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="数字账号ID (如 1001)"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-indigo-500"
              />
              <input
                type="text"
                placeholder="医生姓名 (如 张医生)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-indigo-500"
              />
              <input
                type="password"
                placeholder="初始密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
            >
              添加账号
            </button>
          </form>

          {/* 1.5 搜索账号 */}
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="🔍 搜索账号 ID 或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm w-64 focus:outline-indigo-500"
            />
          </div>

          {/* ② 账号列表表格 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              📋 已注册账号列表 ({users.length})
            </h4>
            {users.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-400 border border-dashed rounded-lg">
                暂无任何医生账号
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="p-3">账号 ID</th>
                      <th className="p-3">显示姓名</th>
                      <th className="p-3">身份权限 (Rank)</th>
                      <th className="p-3">当前密码</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        {/* ID */}
                        <td className="p-3 font-mono font-medium text-slate-700">{u.id}</td>

                        {/* 姓名支持行内编辑 */}
                        <td className="p-3">
                          {editingId === u.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="px-2 py-0.5 border border-indigo-400 rounded text-sm w-28 focus:outline-none"
                              />
                              <button
                                onClick={() => saveEditName(u.id)}
                                className="text-xs text-green-600 hover:underline px-1 cursor-pointer"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-slate-400 hover:underline px-1 cursor-pointer"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{u.username}</span>
                              <button
                                onClick={() => startEditName(u)}
                                className="text-xs text-indigo-500 hover:underline cursor-pointer"
                              >
                                ✏️改名
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Rank 身份切换下拉框 */}
                        <td className="p-3">
                          <select
                            value={u.rank || 'doctor'}
                            onChange={(e) => handleRankChange(u.id, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-indigo-500 cursor-pointer"
                          >
                            <option value="doctor">医生 (doctor)</option>
                            <option value="user">普通用户 (user)</option>
                            <option value="admin">管理员 (admin)</option>
                          </select>
                        </td>

                        {/* 显示密码 */}
                        <td className="p-3 font-mono text-slate-400">{u.password}</td>

                        {/* 操作按键区 */}
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className="px-2 py-1 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded text-xs transition-colors cursor-pointer"
                          >
                            重置密码
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="px-2 py-1 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 rounded text-xs transition-colors cursor-pointer"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal 底部 */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm transition-colors cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
}