import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import agreementService from '../services/agreementService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const docsRoot = path.join(__dirname, '../../资料库文档')
const archiveRoot = path.join(docsRoot, '01_历史技术协议库')

const router = express.Router()

// 上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/agreements')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // 处理文件名编码并做安全化，避免非法字符导致上传失败
    const originalName = sanitizeFileName(decodeOriginalName(file.originalname))
    cb(null, `${Date.now()}-${originalName}`)
  }
})

const upload = multer({ storage })

function sanitizeFolderName(input: string) {
  return String(input || '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
}

function sanitizeFileName(input: string) {
  const normalized = String(input || '').trim().replace(/[\\/:*?"<>|]/g, '_')
  return normalized || '未命名文件'
}

function decodeOriginalName(rawName: string) {
  try {
    return Buffer.from(rawName || '', 'latin1').toString('utf8')
  } catch (error) {
    return String(rawName || '')
  }
}

function normalizeToUrlPath(filePath: string) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\/+/, '')
}

// 上传协议资料
router.post('/upload', upload.array('files'), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[]) || []
    const { machineType, stations } = req.body
    
    if (files.length > 0) {
      // 验证必填字段
      if (!machineType || machineType.trim() === '') {
        res.status(400).json({ message: '机型不能为空' })
        return
      }
      
      // 工位可以不写，因为后面方案文件会解析出工位的
      
      // 合并多个文件为一个记录
      // 使用第一个文件的名称作为主文件名，其他文件名作为补充
      const mainFile = files[0]
      const originalName = sanitizeFileName(decodeOriginalName(mainFile.originalname))

      const machineFolder = sanitizeFolderName(machineType)
      const targetFolder = path.join(archiveRoot, machineFolder)
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true })
      }
      let archiveRelPath = ''
      try {
        const archiveName = `${Date.now()}-${sanitizeFileName(originalName)}`
        const archiveAbsPath = path.join(targetFolder, archiveName)
        fs.copyFileSync(mainFile.path, archiveAbsPath)
        archiveRelPath = normalizeToUrlPath(path.relative(docsRoot, archiveAbsPath))
      } catch (archiveError) {
        console.error('Archive copy failed, continue without archive path:', archiveError)
      }

      // 创建一个协议记录
      await agreementService.createAgreement(
        originalName,
        machineType,
        stations,
        mainFile.path,
        archiveRelPath
      )
      
      res.json({ message: 'Files uploaded successfully', count: files.length })
    } else {
      res.status(400).json({ message: 'No files uploaded' })
    }
  } catch (error) {
    next(error)
  }
})

// 获取协议资料列表
router.get('/', async (req, res, next) => {
  try {
    const agreements = (await agreementService.getAgreements()) as unknown as any[]
    const items = agreements.map((item: any) => {
      const archiveRelPath = String(item.archive_rel_path || '').trim()
      const archiveUrl = archiveRelPath ? `/library-docs/${encodeURI(archiveRelPath)}` : ''
      return {
        ...item,
        archive_url: archiveUrl
      }
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

// 删除协议资料
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await agreementService.deleteAgreement(parseInt(id))
    res.json({ message: 'Agreement deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
