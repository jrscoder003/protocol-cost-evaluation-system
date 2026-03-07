import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'
import keywordService from '../services/keywordService.js'

const router = express.Router()

const upload = multer({
  dest: path.join(process.cwd(), 'uploads', 'tmp')
})

router.get('/', async (req, res, next) => {
  try {
    const items = await keywordService.getKeywords()
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const item = await keywordService.createKeyword(req.body || {})
    res.json({ message: '关键词已保存', item })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const item = await keywordService.updateKeyword(id, req.body || {})
    res.json({ message: '关键词已更新', item })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await keywordService.deleteKeyword(id)
    res.json({ message: '关键词已删除' })
  } catch (error) {
    next(error)
  }
})

router.get('/bindings/list', async (req, res, next) => {
  try {
    const items = await keywordService.getBindings()
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

router.post('/bindings', async (req, res, next) => {
  try {
    const item = await keywordService.createBinding(req.body || {})
    res.json({ message: '绑定已创建', item })
  } catch (error) {
    next(error)
  }
})

router.delete('/bindings/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await keywordService.deleteBinding(id)
    res.json({ message: '绑定已删除' })
  } catch (error) {
    next(error)
  }
})

router.post('/import', upload.single('file'), async (req, res, next) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ message: '请上传导入文件' })
    return
  }

  try {
    const rows = parseKeywordImportRows(file.path)
    const result = await keywordService.importKeywords(rows)
    res.json({ message: '关键词导入成功', ...result })
  } catch (error) {
    next(error)
  } finally {
    try {
      fs.unlinkSync(file.path)
    } catch {}
  }
})

router.post('/seed-defaults', async (req, res, next) => {
  try {
    const result = await keywordService.seedDefaultKeywords()
    res.json({ message: '默认关键词已初始化', ...result })
  } catch (error) {
    next(error)
  }
})

router.get('/analyze/:agreementId', async (req, res, next) => {
  try {
    const agreementId = Number(req.params.agreementId)
    const result = await keywordService.analyzeAgreementKeywords(agreementId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.get('/export-library', async (req, res, next) => {
  try {
    await sendKeywordLibraryWorkbook(res)
  } catch (error) {
    next(error)
  }
})

router.get('/export-template', async (req, res, next) => {
  try {
    await sendKeywordLibraryWorkbook(res)
  } catch (error) {
    next(error)
  }
})

async function sendKeywordLibraryWorkbook(res: express.Response) {
  const keywords = await keywordService.getKeywords()
  const bindings = await keywordService.getBindings()

  const rows = keywords.flatMap((kw: any) => {
    const relatedBindings = bindings.filter((b: any) => Number(b.keyword_id) === Number(kw.id))
    const sourceRows = relatedBindings.length > 0
      ? relatedBindings
      : [{ machine_type: 'ALL', station: 'ALL', key_section: kw.key_section || '' }]

    return sourceRows.map((binding: any) => {
      const relatedSections = extractRelatedSections(kw.remark)
      return {
        '机型': String(binding.machine_type || 'ALL').trim() || 'ALL',
        '工位': String(binding.station || 'ALL').trim() || 'ALL',
        '解析关键项': toKeySectionLabel(String(binding.key_section || kw.key_section || '').trim()),
        '关键词引词': [kw.keyword, kw.synonyms].filter(Boolean).join('、'),
        '关联项': relatedSections,
        '项目实际解析的内容简介（备注）': stripRelatedSectionHint(kw.remark)
      }
    })
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '关键词索引')

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  const date = new Date().toISOString().slice(0, 10)
  const fileName = `关键词索引库_${date}.xlsx`
  res.setHeader('Content-Disposition', `attachment; filename=keyword-mapping-${date}.xlsx; filename*=UTF-8''${encodeURIComponent(fileName)}`)

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  res.send(buffer)
}

function parseKeywordImportRows(filePath: string) {
  const workbook = XLSX.readFile(filePath)
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Array<Record<string, any>>

  return rawRows.map((row) => normalizeImportRow(row)).filter((row) => String(row.keyword || '').trim())
}

function normalizeImportRow(row: Record<string, any>) {
  const map = new Map<string, any>()
  Object.keys(row || {}).forEach((key) => {
    const normalizedKey = String(key || '').trim().toLowerCase().replace(/\s+/g, '')
    map.set(normalizedKey, row[key])
  })

  const getValue = (aliases: string[]) => {
    for (const alias of aliases) {
      const value = map.get(alias)
      if (value !== undefined) return value
    }
    return ''
  }

  return {
    keyword: normalizeKeyword(getValue(['关键词', 'keyword', 'term', '关键词引词'])).keyword,
    synonyms: normalizeKeyword(getValue(['关键词', 'keyword', 'term', '关键词引词'])).synonyms || getValue(['同义词', 'synonyms', 'alias', 'aliases']),
    type: getValue(['类型', 'type']) || 'agreement',
    keySection: mapKeySection(getValue(['关键项', '关键项字段', 'keysection', 'key_section', '解析关键项'])),
    machineType: getValue(['机型', 'machinetype', 'machine_type']),
    station: getValue(['工位', 'station']),
    weight: Number(getValue(['权重', 'weight']) || 1),
    enabled: normalizeEnabled(getValue(['启用', 'enabled'])),
    remark: [
      getValue(['备注', 'remark']),
      getValue(['项目实际解析的内容简介（备注）', '项目实际解析的内容简介(备注)', '项目实际解析内容简介', '内容简介']),
      getValue(['关联项', '关联项建议']) ? `关联项:${getValue(['关联项', '关联项建议'])}` : ''
    ].filter(Boolean).join('；'),
    priority: Number(getValue(['优先级', 'priority']) || 1)
  }
}

function normalizeKeyword(raw: any) {
  const text = String(raw || '').trim()
  if (!text) return { keyword: '', synonyms: '' }

  const parts = text
    .split(/[，,;；、\n]/g)
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  if (!parts.length) return { keyword: '', synonyms: '' }
  return {
    keyword: parts[0],
    synonyms: parts.slice(1).join(',')
  }
}

function mapKeySection(raw: any) {
  const text = String(raw || '').trim()
  const map: Record<string, string> = {
    '产品尺寸': 'productSize',
    '尺寸': 'productSize',
    '产品规格': 'productSize',
    'ppm': 'ppm',
    '生产节拍': 'ppm',
    '工位要求': 'stationRequirements',
    '工艺流程': 'stationRequirements',
    '工位配置': 'stationRequirements',
    '检测项目': 'inspectionRequirements',
    '检测内容': 'inspectionRequirements',
    '检测要求': 'inspectionRequirements',
    '检测对象规格': 'inspectionObjectSpecs',
    '对象规格': 'inspectionObjectSpecs',
    '品牌要求': 'brandRequirements',
    '品牌': 'brandRequirements',
    '工控机性能要求': 'industrialComputerRequirements',
    '工控机要求': 'industrialComputerRequirements',
    '工控机性能': 'industrialComputerRequirements',
    '软件功能要求': 'softwareRequirements',
    '软件要求': 'softwareRequirements',
    '软件功能': 'softwareRequirements',
    '检测精度': 'inspectionPrecision'
  }

  const lower = text.toLowerCase()
  if (map[text]) return map[text]
  if (map[lower]) return map[lower]
  return text
}

function normalizeEnabled(value: any) {
  const text = String(value ?? '').trim().toLowerCase()
  if (!text) return 1
  if (['0', 'false', '否', '禁用', 'n', 'no'].includes(text)) return 0
  return 1
}

function toKeySectionLabel(section: string) {
  const map: Record<string, string> = {
    productSize: '产品尺寸',
    ppm: 'PPM',
    inspectionRequirements: '检测要求',
    inspectionObjectSpecs: '检测对象规格',
    inspectionPrecision: '检测精度',
    stationRequirements: '工位要求',
    brandRequirements: '品牌要求',
    industrialComputerRequirements: '工控机要求',
    softwareRequirements: '软件要求'
  }
  return map[section] || section || ''
}

function extractRelatedSections(remark: any) {
  const text = String(remark || '').trim()
  const match = text.match(/关联项[:：]\s*([^；;\n]+)/)
  return match?.[1]?.trim() || ''
}

function stripRelatedSectionHint(remark: any) {
  const text = String(remark || '').trim()
  if (!text) return ''
  return text
    .split(/[；;]/g)
    .map((item) => String(item || '').trim())
    .filter((item) => item && !/^关联项[:：]/.test(item))
    .join('；')
}

export default router
