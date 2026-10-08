// src/middleware/auditMiddleware.ts

// 1. 拦截字典：路由路径 -> 业务动作名称
const ACTION_MAP: Record<string, string> = {
  'POST /api/auth/login': '用户登录',
  'POST /api/auth/add-user': '增加新用户',
  'POST /api/auth/admin-update-user': '管理员修改用户信息',
  'POST /api/auth/delete-user': '删除已有用户',
  'POST /api/auth/upload-avatar': '上传头像',
  'POST /api/auth/logout': '用户登出',
  'POST /api/auth/update-profile': '修改个人资料',
  // 'POST /api/reports/export': '导出诊断报告',
  // 'POST /api/patients/infer': '发起 AI 病例推理',
  // 'POST /api/patients/add': '录入新病例',
  // 'DELETE /api/patients': '删除病例记录'
}

// 2. 敏感字段脱敏工具
function sanitizeDetail(body: any): string {
  if (!body) return ''
  try {
    const clone = JSON.parse(JSON.stringify(body))
    if (clone.password) clone.password = '******'
    if (clone.token) clone.token = '******'
    if (clone.idCard) clone.idCard = clone.idCard.replace(/^(\d{6})\d+(\d{4})$/, '$1****$2')
    if (clone.phone) clone.phone = clone.phone.replace(/^(\d{3})\d+(\d{4})$/, '$1****$2')
    return JSON.stringify(clone)
  } catch {
    return String(body)
  }
}

// 3. 中间件主体（同步落盘，零 Promise 传染）
export const auditMiddleware = (db: any) => ({ request, body, currentUser, set }: any) => {
  const method = request.method
  const path = new URL(request.url).pathname
  const apiKey = `${method} ${path}`

  console.log('🔍 经过中间件的请求:', apiKey) // 👈 跑一下登录，看看控制台打印出什么

  console.log('🔍 请求体内容:', body); // 👈 跑一下登录，看看控制台打印出什么

  // 命中字典才会写入审计日志
  if (ACTION_MAP[apiKey]) {
    try {
      const actionName = ACTION_MAP[apiKey]
      const detail = sanitizeDetail(body)
      //console.log(detail);
      // {"role":"user","userId":"33","password":"******"}
      // {"role":"admin","userId":"","password":"******"}

      // 1. 提取 user_id：优先当前登录用户 -> 其次 body 中的 userId -> 兜底为 000000
      const userId = currentUser?.id || (body?.userId ? String(body.userId) : '000000')

      // 2. 提取 username：优先当前登录用户 -> 其次查 users 表 -> 其次用 role 拼装 -> 兜底 Guest
      let username = currentUser?.username

      if (!username && userId !== '000000') {
        try {
          // 根据登录填的 ID 去 users 表里查真实姓名
          const userRow = db.prepare(`SELECT username FROM users WHERE id = ?`).get(userId) as { username?: string }
          if (userRow?.username) {
            username = userRow.username
            //console.log(`✅ 审计中间件查到用户真实姓名: ${username} (ID: ${userId})`)
          }
        } catch {
            username = "NAN" // 查询失败异常（如未建立 users 表）
        }
      }

      // 如果 users 表没查到（比如账号不存在），用角色兜底
      if (!username) {
        if (body?.role && body?.userId) {
          username = `${body.role}_${body.userId}`
        } else if (body?.role) {
          username = body.role
        } else {
          username = 'Guest'
        }
      }

      db.run(`
        INSERT INTO audit_logs (user_id, username, action, http_method, endpointpath, detail)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, username, actionName, method, path, detail])

      //console.log(`✅ 成功记录审计日志: [${actionName}] - 操作人: ${username} (ID: ${userId})`)
    } catch (err) {
      console.error('❌ 审计日志写入失败:', err)
    }
  }
}