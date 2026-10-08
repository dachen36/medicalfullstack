// src/routes/auth.route.ts
import { Elysia, t } from 'elysia'
import type { AccountFormat } from '../CommonInterface'
import { db } from '../Service/Database'

import fs from 'node:fs'
import path from 'node:path'

// 👈 想要改保存目录，直接改这里：  自定义头像的保存目录
const UPLOAD_DIR = path.join(process.cwd(), 'uploads') 
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })


export const authRoutes = new Elysia({ prefix: '/api/auth' })

  // 1. 登录校验接口（原始 SQL 查询）
  .post('/login', async ({ body, set }) => {
    const { role, userId, password } = body   //定义了登录时 传给 body的参数名

    console.log(`收到登录请求 -> 角色: ${role}, ID: ${userId}`)

    // ---------------- 管理员校验 ----------------
    if (role === 'admin') {
      // 原始 SQL：用 $id 传参防止 SQL 注入
      const admin = db.query<AccountFormat, { $id: string }>(
        'SELECT * FROM users WHERE id = $id'
      ).get({ $id: '000000' })

      if (admin && admin.password === password) {
        const { password: _, ...safeAdmin } = admin
        return { success: true, message: '管理员登录成功！', user: safeAdmin }
      } else {
        set.status = 400
        return { success: false, message: '管理员密码错误！' }
      }
    }

    // ---------------- 普通用户（医生）校验 ----------------
    if (role === 'user' && userId) {
      // 原始 SQL 查询
      const user = db.query<AccountFormat, { $id: string }>(
        'SELECT * FROM users WHERE id = $id'
      ).get({ $id: userId })

      if (user && user.password === password) {
        const { password: _, ...safeUser } = user
        return { success: true, message: `登录成功！欢迎 ${safeUser.username}`, user: safeUser }
      } else {
        set.status = 400
        return { success: false, message: '账号(ID)或密码错误！' }
      }
    }
  }, {
    body: t.Object({
      role: t.String(),
      userId: t.Optional(t.String()),
      password: t.String()
    })
  })

  // 2. 登录页调试按钮 添加账号
  .post('/add-user', async ({ body, set }) => {
    const { id, username, password, avatarUrl = '' } = body

    // 1. 原始 SQL 检查账号重复
    const existUser = db.query('SELECT id FROM users WHERE id = $id').get({ $id: id })
    if (existUser) {
      set.status = 400
      return { success: false, message: '添加失败：该账号ID已存在！' }
    }

    // 2. 原始 SQL 插入新账号
    db.prepare(`
      INSERT INTO users (id, username, password, rank, avatarUrl)
      VALUES ($id, $username, $password, $rank, $avatarUrl)
    `).run({
      $id: id,
      $username: username,
      $password: password,
      $rank: 'doctor',
      $avatarUrl: avatarUrl
    })

    const safeUser = { id, username, rank: 'doctor', avatarUrl }

    return {
      success: true,
      message: `🎉 账号添加成功并已保存到数据库！\n账号ID: ${id}\n显示姓名: ${username}`,
      user: safeUser
    }
  }, {
    body: t.Object({
      id: t.String(),
      username: t.String(),
      password: t.String(),
      avatarUrl: t.Optional(t.String())
    })
  })

  // 3. 获取单个用户最新信息接口
  .get('/profile', async ({ query, set }) => {
    const { id } = query
    if (!id) {
      set.status = 400
      return { success: false, message: '缺少用户 ID' }
    }

    const user = db.query<AccountFormat, { $id: string }>(
      'SELECT * FROM users WHERE id = $id'
    ).get({ $id: id })

    if (!user) {
      set.status = 404
      return { success: false, message: '未找到该账号' }
    }

    return { success: true, user }
  }, {
    query: t.Object({ id: t.String() })
  })

  // 4. 更新用户信息/修改密码接口
  .post('/update-profile', async ({ body, set }) => {
    const { id, username, oldPassword, newPassword, avatarUrl } = body

    // 查询当前用户数据
    const currentUser = db.query<AccountFormat, { $id: string }>(
      'SELECT * FROM users WHERE id = $id'
    ).get({ $id: id })

    if (!currentUser) {
      set.status = 404
      return { success: false, message: '修改失败：用户不存在！' }
    }

    let finalPassword = currentUser.password

    // 如果前端传了 oldPassword，说明用户勾选了修改密码
    if (oldPassword) {
      if (oldPassword !== currentUser.password) {
        set.status = 400
        return { success: false, message: '修改失败：原密码错误！' }
      }
      if (!newPassword) {
        set.status = 400
        return { success: false, message: '修改失败：新密码不能为空！' }
      }
      finalPassword = newPassword
    }

    // 原始 SQL 执行更新
    db.prepare(`
      UPDATE users 
      SET username = $username, password = $password, avatarUrl = $avatarUrl
      WHERE id = $id
    `).run({
      $username: username,
      $password: finalPassword,
      $avatarUrl: avatarUrl,
      $id: id
    })

    const updatedUser: AccountFormat = {
      id,
      username,
      password: finalPassword,
      rank: currentUser.rank,
      avatarUrl
    }

    return {
      success: true,
      message: '修改成功！',
      user: updatedUser
    }
  }, {
    body: t.Object({
      id: t.String(),
      username: t.String(),
      oldPassword: t.Optional(t.String()),
      newPassword: t.Optional(t.String()),
      avatarUrl: t.String()
    })
  })

  // 1. 获取用户列表（支持关键词搜索） 就不录入审计字典了
  .get('/users', async ({ query }) => {
    const search = query.search?.trim() || ''
    
    let users: AccountFormat[] = []
    if (search) {
      users = db.query<AccountFormat, { $search: string }>(`
        SELECT * FROM users 
        WHERE id LIKE $search OR username LIKE $search
        ORDER BY id DESC
      `).all({ $search: `%${search}%` })
    } else {
      users = db.query<AccountFormat, null>(`
        SELECT * FROM users WHERE rank != 'admin' ORDER BY id DESC;
      `).all(null)
    }

    return { success: true, users }
  }, {
    query: t.Object({ search: t.Optional(t.String()) })
  })

  // 2. 管理员新增账号
  .post('/add-user', async ({ body, set }) => {
    const { id, username, password, rank } = body

    const exist = db.query<AccountFormat, { $id: string }>(
      'SELECT id FROM users WHERE id = $id'
    ).get({ $id: id })

    if (exist) {
      set.status = 400
      return { success: false, message: '该账号 ID 已存在！' }
    }

    db.prepare(`
      INSERT INTO users (id, username, password, rank, avatarUrl)
      VALUES ($id, $username, $password, $rank, $avatarUrl)
    `).run({
      $id: id,
      $username: username || '新医生',
      $password: password,
      $rank: rank || 'doctor',
      $avatarUrl: './avatars/cyclops.png'
    })

    return { success: true, message: '账号添加成功！' }
  }, {
    body: t.Object({
      id: t.String(),
      username: t.String(),
      password: t.String(),
      rank: t.String()
    })
  })

  // 3. 管理员更新账号属性 (修改姓名/密码/Rank)
  .post('/admin-update-user', async ({ body, set }) => {
    const { id, username, password, rank } = body

    const user = db.query<AccountFormat, { $id: string }>(
      'SELECT * FROM users WHERE id = $id'
    ).get({ $id: id })

    if (!user) {
      set.status = 404
      return { success: false, message: '用户不存在！' }
    }

    const nextUsername = username !== undefined ? username : user.username
    const nextPassword = password !== undefined ? password : user.password
    const nextRank = rank !== undefined ? rank : user.rank

    db.prepare(`
      UPDATE users 
      SET username = $username, password = $password, rank = $rank
      WHERE id = $id
    `).run({
      $username: nextUsername,
      $password: nextPassword,
      $rank: nextRank,
      $id: id
    })

    return { success: true, message: '更新成功！' }
  }, {
    body: t.Object({
      id: t.String(),
      username: t.Optional(t.String()),
      password: t.Optional(t.String()),
      rank: t.Optional(t.String())
    })
  })

  // 4. 管理员删除账号
  .post('/delete-user', async ({ body, set }) => {
    const { id } = body

    const result = db.prepare('DELETE FROM users WHERE id = $id').run({ $id: id })

    if (result.changes === 0) {
      set.status = 404
      return { success: false, message: '删除失败，未找到该账号！' }
    }

    return { success: true, message: '账号删除成功！' }
  }, {
    body: t.Object({ id: t.String() })
  })

  // 头像上传接口：保存图片到本地 UPLOAD_DIR
  .post('/upload-avatar', async ({ body, set }) => {
    const { id, avatar } = body

    if (!avatar) {
      set.status = 400
      return { success: false, message: '请上传头像图片！' }
    }

    // 1. 生成文件名 (例如: avatar-1001-1698765432100.png)
    const ext = path.extname(avatar.name) || '.png'
    //const fileName = `avatar-${id}-${Date.now()}${ext}`
    const fileName = `avatar-${id}${ext}` //只用用户 ID 命名（覆盖旧头像，防止生成垃圾文件）：
    //const fileName = `avatar-${id}-${Math.random().toString(36).substring(2, 8)}${ext}` //加随机数防重名：
    const savePath = path.join(UPLOAD_DIR, fileName)

    // 2. 将文件写入磁盘目录
    const buffer = Buffer.from(await avatar.arrayBuffer())
    fs.writeFileSync(savePath, buffer)

    // 3. 生成网络路径并更新 SQLite 数据库
    const avatarUrl = `/uploads/${fileName}`
    db.prepare('UPDATE users SET avatarUrl = $avatarUrl WHERE id = $id').run({
      $avatarUrl: avatarUrl,
      $id: id
    })

    return { success: true, message: '头像更换成功！', avatarUrl }
  }, {
    body: t.Object({
      id: t.String(),
      avatar: t.File() // Elysia 接收 File 文件对象
    })
  })

  // 配合审计日志的简单登出接口
  .post('/logout', async ({ body }) => {
    return { success: true, message: '退出登录成功' }
  }, {
    body: t.Object({
      userId: t.Optional(t.String()),
      role: t.Optional(t.String())
    })
  })