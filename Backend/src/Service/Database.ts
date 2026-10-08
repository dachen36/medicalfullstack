// 第一步：新建 src/Database.ts（只有连接和自动建表）
// 在项目里建一个 src/Database.ts，直接用 Bun 原生 SQLite：

// src/Database.ts
import { Database } from 'bun:sqlite'

// 打开/创建 clinic.db 文件
export const db = new Database('clinic.db')

// 自动建表与写入初始数据（启动时运行一次）
export function initDB() {
  // 1. 原始 SQL 建表   与公共接口保持完全一致    初始化用户账户表  额 id先用text吧 虽然填都是integer
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      rank TEXT NOT NULL DEFAULT 'doctor',
      avatarUrl TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 2. 原始 SQL 检查并写入默认数据
  const admin = db.query(`SELECT * FROM users WHERE id = $id`).get({ $id: '000000' })
  if (!admin) {
    const insertStmt = db.prepare(`
      INSERT INTO users (id, username, password, rank, avatarUrl)
      VALUES ($id, $username, $password, $rank, $avatarUrl)
    `)
    
    insertStmt.run({ $id: '000000', $username: '系统管理员', $password: 'cd', $rank: 'admin', $avatarUrl: '' })
    insertStmt.run({ $id: '1001', $username: '张医生', $password: '123', $rank: 'doctor', $avatarUrl: '' })
    insertStmt.run({ $id: '1002', $username: '李医生', $password: '456', $rank: 'doctor', $avatarUrl: '' })
  }

  console.log('用户表初始化完成并已写入默认数据！')

  // 2. 初始化审计日志表  ---- 只可新增的表   id是日志里边每个条目的id  user_id是操作者的id  
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,                  
      username TEXT NOT NULL,                
      action TEXT NOT NULL,                  
      http_method TEXT NOT NULL,                  
      endpointpath TEXT NOT NULL,                    
      detail TEXT,                           
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP 
    );
  `)

  // 建立索引，方便后续在后台按用户或时间快速搜索
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);`)

  // 3. 🌟 检查表是否为空，只有第一次创建数据库时才写入首条日志
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM audit_logs`).get() as { count: number }
    
    // 只有当 count 为 0 时，才插入“系统初始化”记录
    if (row.count === 0) {
      db.run(`
        INSERT INTO audit_logs (user_id, username, action, http_method, endpointpath, detail)
        VALUES ('-1','System','系统初始化','SYSTEM','INIT','数据库表结构及索引创建/校验成功，系统服务启动。'
        );
      `)
      console.log('✅ 审计日志表首次创建成功，已写入系统启动首条记录！')
    } else {
      console.log('ℹ️ 审计日志表结构校验完成，已跳过首条记录写入。')
    }
  } catch (err) {
    console.error('❌ 校验/写入系统初始化日志失败:', err)
  }

}