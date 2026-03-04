import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import costTableService from '../services/costTableService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/cost-tables')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // 处理文件名编码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, `${Date.now()}-${originalName}`)
  }
})

const upload = multer({ storage })

// 上传成本表
router.post('/upload', upload.array('files'), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[]
    const { machineType } = req.body
    
    for (const file of files) {
      // 处理文件名编码
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      await costTableService.createCostTable(originalName, machineType, file.path)
    }
    
    res.json({ message: 'Files uploaded successfully', count: files.length })
  } catch (error) {
    next(error)
  }
})

// 获取成本表列表
router.get('/', async (req, res, next) => {
  try {
    const tables = await costTableService.getCostTables()
    res.json({ items: tables })
  } catch (error) {
    next(error)
  }
})

// 删除成本表
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await costTableService.deleteCostTable(parseInt(id))
    res.json({ message: 'Cost table deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
