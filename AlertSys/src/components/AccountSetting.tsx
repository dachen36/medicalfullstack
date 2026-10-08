import React, { useState, useRef, useEffect } from 'react';

import type { AccountFormat } from '../common/CommonInterface';
import { doing } from '../utils'; // 线性异步函数，返回 [error, data] 数组

const PRESET_AVATARS = [
  './avatars/cyclops.png',
  './avatars/daeva.png',
  './avatars/drake.png',
  './avatars/elf.png',
];

// 🌟 辅助函数：根据 avatarUrl 拼装前端真正用来展示的图片 src
export const getAvatarSrc = (url?: string): string => {
  if (!url) return PRESET_AVATARS[0];
  // 1. 如果是 blob 本地实时预览地址或 Base64，直接返回
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // 2. 如果是以 /uploads 开头的后端静态存盘路径，拼上后端 HOST
  if (url.startsWith('/uploads')) {
    return `${url}`;
  }
  // 3. 预置静态头像路径直接返回
  return url;
};

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AccountFormat; // 当前登录的用户信息
  onSave?: (updatedData: { username: string; password?: string; avatarUrl: string }) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [username, setUsername] = useState(currentUser?.username || '');

  // 💡 密码相关状态
  const [changePassword, setChangePassword] = useState(false); // 是否勾选修改密码
  const [oldPassword, setOldPassword] = useState(''); // 旧密码
  const [newPassword, setNewPassword] = useState(''); // 新密码
  const [confirmPassword, setConfirmPassword] = useState(''); // 确认新密码

  // 💡 头像路径状态与文件 File 对象状态
  const [currentAvatar, setCurrentAvatar] = useState<string>(
    currentUser?.avatarUrl || PRESET_AVATARS[0]
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // 暂存选中的文件对象

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 在 Modal 打开时，从后端 SQLite 数据库读取该用户的最新信息
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    // 重置密码与文件状态
    setChangePassword(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAvatarFile(null);

    // 线性请求后端最新用户数据
    const fetchLatestProfile = async () => {
      const [netErr, res] = await doing(
        fetch(`/api/auth/profile?id=${currentUser.id}`)
      );

      if (netErr || !res || !res.ok) {
        // 如果后端读取失败，优雅降级回父组件传进来的默认值
        setUsername(currentUser.username || '');
        setCurrentAvatar(currentUser.avatarUrl || PRESET_AVATARS[0]);
        return;
      }

      const [parseErr, result] = await doing(res.json());
      if (!parseErr && result?.success && result.user) {
        setUsername(result.user.username || '');
        setCurrentAvatar(result.user.avatarUrl || PRESET_AVATARS[0]);
      }
    };

    fetchLatestProfile();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // 💡 选择本地文件：读取 File 并使用 blob URL【实时替换预览】
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 存入 File 实例，并在前端用 createObjectURL 生成临时 preview 地址
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCurrentAvatar(objectUrl);
    e.target.value = '';
  };

  // 2. 点击“保存修改”时，先传文件再 POST 更新 Profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert('用户名不能为空！');
      return;
    }

    // 密码校验逻辑
    if (changePassword) {
      if (!oldPassword.trim()) {
        alert('请输入旧密码！');
        return;
      }
      if (!newPassword.trim()) {
        alert('请输入新密码！');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        alert('两次输入的新密码不一致！');
        return;
      }
    }

    let finalAvatarUrl = currentAvatar;

    // 🌟 如果用户选了本地文件，先通过 FormData 发送文件给后端存入 uploads 目录
    if (avatarFile && currentUser?.id) {
      const formData = new FormData();
      formData.append('id', currentUser.id);
      formData.append('avatar', avatarFile);

      const [uploadErr, uploadRes] = await doing(
        fetch('/api/auth/upload-avatar', {
          method: 'POST',
          body: formData,
        })
      );

      if (uploadErr || !uploadRes || !uploadRes.ok) {
        return alert('头像图片上传失败！');
      }

      const [uploadParseErr, uploadResult] = await doing(uploadRes.json());
      if (uploadParseErr || !uploadResult?.success) {
        return alert(uploadResult?.message || '头像上传保存出错！');
      }

      // 获取后端存盘后的相对路径（如：/uploads/avatar-1001-xxxx.png）
      finalAvatarUrl = uploadResult.avatarUrl;
    }

    // 发送请求给后端更新 Profile 数据库
    const [networkError, response] = await doing(
      fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser?.id,
          username: trimmedUsername,
          oldPassword: changePassword ? oldPassword.trim() : undefined,
          newPassword: changePassword ? newPassword.trim() : undefined,
          avatarUrl: finalAvatarUrl,
        }),
      })
    );

    if (networkError || !response) {
      return alert('网络错误：无法连接到后端数据库！');
    }

    const [parseError, result] = await doing(response.json());

    if (parseError || !result) {
      return alert('解析失败：后端返回格式错误！');
    }

    if (!response.ok || !result.success) {
      return alert(result.message || '修改失败！');
    }

    // 🌟 实时刷新父组件逻辑：触发回调
    if (onSave) {
      onSave({
        username: trimmedUsername,
        password: changePassword ? newPassword.trim() : currentUser?.password,
        avatarUrl: finalAvatarUrl,
      });
    }

    alert('修改成功！数据已更新至数据库。');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-800">修改账号信息</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 🌟 1. 实时大图预览区域 (调用 getAvatarSrc 解析) */}
          <div className="flex flex-col items-center justify-center bg-slate-50 py-4 rounded-lg border border-slate-100">
            <div className="relative group">
              <img
                src={getAvatarSrc(currentAvatar)}
                alt="当前头像"
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md bg-white"
              />
              <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                预览
              </span>
            </div>
          </div>

          {/* 🌟 2. 头像选择操作区 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">选择/上传头像</label>

            <div className="flex items-center justify-between gap-2 mb-3">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentAvatar(url);
                    setAvatarFile(null); // 选回预置头像时清空文件对象
                  }}
                  className={`relative rounded-full p-0.5 border-2 transition-all ${
                    currentAvatar === url
                      ? 'border-blue-500 scale-110 shadow'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`预置 ${idx}`} className="w-10 h-10 rounded-full bg-slate-100" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-11 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 bg-white"
              >
                <span>📁</span> 上传本地图片
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* 3. 修改账号/密码表单 */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">用户名</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="changePasswordCheckbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="changePasswordCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                修改密码
              </label>
            </div>

            {changePassword && (
              <div className="space-y-3 pl-2 border-l-2 border-blue-500 my-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">原密码</label>
                  <input
                    type="password"
                    required={changePassword}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    placeholder="请输入当前的原密码"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">新密码</label>
                  <input
                    type="password"
                    required={changePassword}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    placeholder="请输入新密码"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">确认新密码</label>
                  <input
                    type="password"
                    required={changePassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    placeholder="请再次输入新密码"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. 底部按钮 */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};