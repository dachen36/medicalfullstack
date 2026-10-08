// src/services/Audit.ts
import type { AuditQuery } from '../CommonInterface'


export const auditService = {
  /**
   * 分页并按条件查询审计日志
   */
  getLogs(db: any, query: AuditQuery) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.max(1, Number(query.pageSize) || 15)
    const offset = (page - 1) * pageSize

    // 模糊匹配拼装
    const usernameParam = query.username ? `%${query.username}%` : '%'
    const actionParam = query.action ? `%${query.action}%` : '%'

    try {
      // 1. 查询符合条件的日志总数 (用于前端分页器计算总页数)
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total FROM audit_logs 
        WHERE username LIKE ? AND action LIKE ?
      `)
      const { total } = countStmt.get(usernameParam, actionParam) as { total: number }

      // 2. 按 id 倒序 (最新日志在最前面) 分页查询列表
      const listStmt = db.prepare(`
        SELECT id, user_id, username, action, http_method, endpointpath, detail, created_at
        FROM audit_logs 
        WHERE username LIKE ? AND action LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      const list = listStmt.all(usernameParam, actionParam, pageSize, offset)

      return {
        success: true,
        data: {
          list,
          total,
          page,
          pageSize
        }
      }
    } catch (err: any) {
      console.error('❌ 查询审计日志失败:', err)
      return {
        success: false,
        message: '查询审计日志失败',
        error: err?.message
      }
    }
  }
}