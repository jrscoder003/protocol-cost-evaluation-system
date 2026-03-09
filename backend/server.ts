import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 导入中间件
import logger from './middleware/logger'
import errorHandler from './middleware/errorHandler'

// 导入路由
import machineLibraryRouter from './routes/machineLibrary.js'
import agreementRouter from './routes/agreement.js'
import visionReportRouter from './routes/visionReport.js'
import costTableRouter from './routes/costTable.js'
import partRouter from './routes/part.js'
import evaluationRouter from './routes/evaluation.js'
import reportRouter from './routes/report.js'
import keywordRouter from './routes/keyword.js'

const app = express()
const port = 3006

// 中间件
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(logger)

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/reports', express.static(path.join(__dirname, '../reports')))
app.use('/library-docs', express.static(path.join(__dirname, '../资料库文档')))

// 数据库初始化
let db: sqlite3.Database | null = null

async function initDatabase() {
  try {
    db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    })
    
    // 创建表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS machine_libraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS agreements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        machine_type TEXT,
        stations TEXT,
        extracted_info TEXT,
        full_text TEXT,
        source_file_path TEXT,
        archive_rel_path TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS vision_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        machine_type TEXT,
        stations TEXT,
        extracted_info TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS cost_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        machine_type TEXT,
        total_cost REAL,
        extracted_info TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        brand TEXT NOT NULL,
        price REAL NOT NULL,
        spec_precision_um REAL,
        lead_time_days INTEGER
      );
    `)
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

initDatabase()

// API路由
app.use('/api/machine-libraries', machineLibraryRouter)
app.use('/api/agreements', agreementRouter)
app.use('/api/vision-reports', visionReportRouter)
app.use('/api/cost-tables', costTableRouter)
app.use('/api/parts', partRouter)
app.use('/api/evaluation', evaluationRouter)
app.use('/api/reports', reportRouter)
app.use('/api/keywords', keywordRouter)

// 健康检查与根路径提示，便于快速判断后端是否在线
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', port, time: new Date().toISOString() })
})

app.get('/', (req, res) => {
  res.status(200).json({ message: `Backend is running on http://localhost:${port}`, health: '/api/health' })
})

// 错误处理中间件
app.use(errorHandler)

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' })
})

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// 保持进程运行
setInterval(() => {}, 10000)
