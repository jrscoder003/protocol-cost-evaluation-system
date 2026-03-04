import express from 'express'
import reportService from '../services/reportService.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 生成报告
router.post('/generate', async (req, res, next) => {
  try {
    const { machineTypeId, format } = req.body
    
    if (!machineTypeId) {
      return res.status(400).json({ message: 'Machine type ID is required' })
    }
    
    const result = await reportService.generateReport(machineTypeId, format)
    
    // 构建可访问的文件路径
    const relativePath = result.reportPath.replace(path.join(__dirname, '../../'), '')
    const accessPath = `/reports${relativePath}`
    
    res.json({ 
      message: 'Report generated successfully',
      reportPath: accessPath,
      format: result.format
    })
  } catch (error) {
    next(error)
  }
})

// 获取报告列表
router.get('/list', async (req, res, next) => {
  try {
    const reports = await reportService.getReports()
    
    // 构建可访问的文件路径
    const formattedReports = reports.map(report => ({
      ...report,
      accessPath: `/reports/${report.name}`
    }))
    
    res.json({ reports: formattedReports })
  } catch (error) {
    next(error)
  }
})

export default router