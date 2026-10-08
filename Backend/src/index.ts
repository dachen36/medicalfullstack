import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static'
import { medicalRoutes } from './routes/medical.route';
import { authRoutes } from './routes/auth.route';

import { db, initDB } from './Service/Database';
initDB() // 启动自动建表


import { auditMiddleware } from './AuditMiddleware'
import { auditRoute } from './routes/audit.route'


// 解决部分 Windows 环境下 Sharp 图片库的底层库路径冲突问题
process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';

const BackendAvatarPath='/uploads';  //对应后端的存放自定义头像的目录




const app = new Elysia()
  // 全局中间件 解决前端跨域
  .use(cors())

  // 👈 追加这一行，把 uploads 目录暴露为 HTTP 静态资源
  .use(staticPlugin({ assets: 'uploads', prefix: BackendAvatarPath }))

  .onAfterHandle(auditMiddleware(db)) // 🌟 全局挂载审计中间件（所有 API 被请求后，满足条件会自动插日志） 还得放前面...


  // 注册业务模块路由 ---目前只有访问ocr
  .use(medicalRoutes)
 
  .use(authRoutes)    // 注册挂载认证模块  处理用户登录逻辑

  
  .use(auditRoute(db)) // 🌟 挂载审计查询 API（前端访问 /api/audit/logs 走这里）



  // 健康检查接口
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  .listen({
    port: 3000,
    hostname: '0.0.0.0'
  });

console.log(
  `🦊 Elysia HTTP 服务已成功启动！运行地址: http://${app.server?.hostname}:${app.server?.port}`
);