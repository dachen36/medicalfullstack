// src/routes/audit.route.ts
//这个文件只负责暴露 HTTP 接口并调用我们刚才写好的 Service 模块：
import { Elysia } from 'elysia'
import { auditService } from '../Service/Audit' // 引入 service

export const auditRoute = (db: any) =>
  new Elysia({ prefix: '/api/audit' })
    // GET /api/audit/logs?page=1&pageSize=15&username=张三&action=登录
    .get('/logs', ({ query }) => {
      return auditService.getLogs(db, query) // 优雅直接地调用 service，零臃肿代码
    })