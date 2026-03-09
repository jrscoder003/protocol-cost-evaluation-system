import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

interface KeywordPayload {
  keyword: string
  synonyms?: string
  type?: string
  keySection?: string
  weight?: number
  enabled?: boolean | number
  source?: string
  remark?: string
}

interface BindingPayload {
  keywordId: number
  machineType?: string
  station?: string
  keySection?: string
  priority?: number
}

class KeywordService {
  private db: Database | null = null

  private readonly defaultKeywordSeeds = [
    { keyword: '产品尺寸', synonyms: '极片尺寸,极耳尺寸,长宽,视野,料长', keySection: 'productSize', remark: '请确认项目涉及的尺寸项：极片长宽、极耳尺寸、极耳间距、极耳外露等；并核对是否给出量程/公差/单位。' },
    { keyword: 'PPM', synonyms: '节拍,拍照频率,产能,UPH', keySection: 'ppm', remark: '请确认产线节拍、拍照频率、单工位处理能力是否一致；若存在前后段差异，请按工位分别记录。' },
    { keyword: '工位要求', synonyms: '工位,工位配置,单工位,双工位,Station,S1,S2', keySection: 'stationRequirements', remark: '请确认工位数量、单/双工位配置、每工位相机数量及上下游工位衔接关系。' },
    { keyword: '工艺流程', synonyms: '流程图,工序,工步,站点,工位流程,前后段', keySection: 'stationRequirements', remark: '请结合工艺流程图确认检测位置（前段/后段/终检）及其与设备布置的对应关系。' },
    { keyword: 'XX检测', synonyms: '检测工位,终检,复检,段后检测,工位X', keySection: 'stationRequirements', remark: '请关注“XX检测”小节中的工位约束、检测范围及该工位硬件配置要求。' },
    { keyword: '检测项目', synonyms: '缺陷类型,检测点,过杀,漏检,GRR', keySection: 'inspectionRequirements', remark: '请提取检测项目清单（缺陷类型/检测点位）并核对是否给出过杀、漏检、GRR等指标要求。' },
    { keyword: '检测内容', synonyms: '外观检测,尺寸检测,定位检测,判定标准', keySection: 'inspectionRequirements', remark: '请明确每项检测内容的判定标准、输出结果形式（OK/NG、数值、分档）与异常处理要求。' },
    { keyword: '检测精度', synonyms: '精度,重复精度,像素精度,μm,分辨率', keySection: 'inspectionPrecision', remark: '若协议未直接给出精度，请结合视野与分辨率推算；并记录推算依据与置信度。' },
    { keyword: '品牌要求', synonyms: '相机品牌,镜头品牌,光源品牌,工控机品牌,3D线激光', keySection: 'brandRequirements', remark: '请核对品牌限定及可替代品牌的边界条件。' },
    { keyword: '工控机性能', synonyms: 'CPU,内存,硬盘,端口,存储天数,网口', keySection: 'industrialComputerRequirements', remark: '请确认工控机配置及图片存储天数是否满足项目。' },
    { keyword: '软件功能', synonyms: '权限,界面,配方,追溯,导出,报警,MES', keySection: 'softwareRequirements', remark: '请确认软件权限、追溯、导出、MES 对接等功能要求。' }
  ]

  private async ensureDatabase() {
    if (this.db) return

    this.db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    })

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS keyword_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        synonyms TEXT DEFAULT '',
        type TEXT DEFAULT 'agreement',
        key_section TEXT DEFAULT '',
        weight REAL DEFAULT 1,
        enabled INTEGER DEFAULT 1,
        source TEXT DEFAULT 'manual',
        remark TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS keyword_bindings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword_id INTEGER NOT NULL,
        machine_type TEXT DEFAULT '',
        station TEXT DEFAULT '',
        key_section TEXT DEFAULT '',
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_unique
      ON keyword_entries(keyword, type, key_section);
    `)
  }

  async getKeywords() {
    await this.ensureDatabase()
    return await this.db!.all('SELECT * FROM keyword_entries ORDER BY updated_at DESC, id DESC')
  }

  async createKeyword(payload: KeywordPayload) {
    await this.ensureDatabase()

    const keyword = String(payload.keyword || '').trim()
    if (!keyword) throw new Error('关键词不能为空')

    const synonyms = String(payload.synonyms || '').trim()
    const type = String(payload.type || 'agreement').trim() || 'agreement'
    const keySection = String(payload.keySection || '').trim()
    const weight = Number(payload.weight || 1) || 1
    const enabled = payload.enabled === false || Number(payload.enabled) === 0 ? 0 : 1
    const source = String(payload.source || 'manual').trim() || 'manual'
    const remark = String(payload.remark || '').trim()

    const result = await this.db!.run(
      `INSERT INTO keyword_entries (keyword, synonyms, type, key_section, weight, enabled, source, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(keyword, type, key_section) DO UPDATE SET
         synonyms = excluded.synonyms,
         weight = excluded.weight,
         enabled = excluded.enabled,
         source = excluded.source,
         remark = excluded.remark,
         updated_at = CURRENT_TIMESTAMP`,
      [keyword, synonyms, type, keySection, weight, enabled, source, remark]
    )

    if (result.lastID) {
      return await this.db!.get('SELECT * FROM keyword_entries WHERE id = ?', [result.lastID])
    }

    return await this.db!.get(
      'SELECT * FROM keyword_entries WHERE keyword = ? AND type = ? AND key_section = ?',
      [keyword, type, keySection]
    )
  }

  async updateKeyword(id: number, payload: KeywordPayload) {
    await this.ensureDatabase()

    const keyword = String(payload.keyword || '').trim()
    if (!keyword) throw new Error('关键词不能为空')

    await this.db!.run(
      `UPDATE keyword_entries
       SET keyword = ?,
           synonyms = ?,
           type = ?,
           key_section = ?,
           weight = ?,
           enabled = ?,
           remark = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        keyword,
        String(payload.synonyms || '').trim(),
        String(payload.type || 'agreement').trim() || 'agreement',
        String(payload.keySection || '').trim(),
        Number(payload.weight || 1) || 1,
        payload.enabled === false || Number(payload.enabled) === 0 ? 0 : 1,
        String(payload.remark || '').trim(),
        id
      ]
    )

    return await this.db!.get('SELECT * FROM keyword_entries WHERE id = ?', [id])
  }

  async deleteKeyword(id: number) {
    await this.ensureDatabase()
    await this.db!.run('DELETE FROM keyword_bindings WHERE keyword_id = ?', [id])
    await this.db!.run('DELETE FROM keyword_entries WHERE id = ?', [id])
    return { id }
  }

  async getBindings() {
    await this.ensureDatabase()
    return await this.db!.all(
      `SELECT b.*, k.keyword AS keyword_name, k.type AS keyword_type, k.key_section AS keyword_section
       FROM keyword_bindings b
       LEFT JOIN keyword_entries k ON k.id = b.keyword_id
       ORDER BY b.updated_at DESC, b.id DESC`
    )
  }

  async createBinding(payload: BindingPayload) {
    await this.ensureDatabase()

    const keywordId = Number(payload.keywordId)
    if (!keywordId) throw new Error('关键词ID不能为空')

    const result = await this.db!.run(
      `INSERT INTO keyword_bindings (keyword_id, machine_type, station, key_section, priority)
       VALUES (?, ?, ?, ?, ?)`,
      [
        keywordId,
        String(payload.machineType || '').trim(),
        String(payload.station || '').trim(),
        String(payload.keySection || '').trim(),
        Math.max(1, Number(payload.priority || 1) || 1)
      ]
    )

    return await this.db!.get(
      `SELECT b.*, k.keyword AS keyword_name, k.type AS keyword_type, k.key_section AS keyword_section
       FROM keyword_bindings b
       LEFT JOIN keyword_entries k ON k.id = b.keyword_id
       WHERE b.id = ?`,
      [result.lastID]
    )
  }

  async deleteBinding(id: number) {
    await this.ensureDatabase()
    await this.db!.run('DELETE FROM keyword_bindings WHERE id = ?', [id])
    return { id }
  }

  async importKeywords(rows: Array<Record<string, any>>) {
    await this.ensureDatabase()

    let insertedOrUpdated = 0
    let bindingCreated = 0

    for (const row of rows) {
      const keyword = String(row.keyword || '').trim()
      if (!keyword) continue

      const saved = await this.createKeyword({
        keyword,
        synonyms: String(row.synonyms || '').trim(),
        type: String(row.type || 'agreement').trim() || 'agreement',
        keySection: String(row.keySection || '').trim(),
        weight: Number(row.weight || 1) || 1,
        enabled: row.enabled,
        source: 'import',
        remark: String(row.remark || '').trim()
      })

      insertedOrUpdated += 1

      const machineType = String(row.machineType || '').trim()
      const station = String(row.station || '').trim()
      const keySection = String(row.bindingKeySection || row.keySection || '').trim()
      if (saved?.id && (machineType || station || keySection)) {
        await this.createBinding({
          keywordId: Number(saved.id),
          machineType,
          station,
          keySection,
          priority: Math.max(1, Number(row.priority || 1) || 1)
        })
        bindingCreated += 1
      }
    }

    return { insertedOrUpdated, bindingCreated }
  }

  async seedDefaultKeywords() {
    await this.ensureDatabase()

    let seededCount = 0
    for (const seed of this.defaultKeywordSeeds) {
      await this.createKeyword({
        keyword: seed.keyword,
        synonyms: seed.synonyms,
        type: 'agreement',
        keySection: seed.keySection,
        weight: 1,
        enabled: 1,
        source: 'default-seed',
        remark: seed.remark || '系统默认关键词'
      })
      seededCount += 1
    }

    return { seededCount }
  }

  async analyzeAgreementKeywords(agreementId: number) {
    await this.ensureDatabase()

    const agreement = await this.db!.get(
      'SELECT id, machine_type, stations, full_text, extracted_info FROM agreements WHERE id = ?',
      [agreementId]
    )

    if (!agreement) {
      throw new Error('协议记录不存在')
    }

    const extracted = this.safeParseJson(agreement.extracted_info)
    const fullText = String(agreement.full_text || extracted?.fullText || '')
      .replace(/\r/g, '\n')
      .trim()

    const keywords = await this.db!.all(
      'SELECT * FROM keyword_entries WHERE enabled = 1 AND type IN (?, ?) ORDER BY weight DESC, id DESC',
      ['agreement', 'all']
    )

    const bindings = await this.db!.all('SELECT * FROM keyword_bindings')

    const machineType = String(agreement.machine_type || '').trim()
    const stations = String(agreement.stations || '').trim()
    const stationTokens = this.tokenizeStations(stations)

    const hitMap = new Map<string, any>()

    for (const entry of keywords) {
      const relatedBindings = bindings.filter((binding: any) => Number(binding.keyword_id) === Number(entry.id))
      if (relatedBindings.length > 0) {
        const matchedBinding = relatedBindings.find((binding: any) => {
          const bindingMachine = String(binding.machine_type || '').trim()
          const bindingStation = String(binding.station || '').trim()
          const machineOk = this.matchMachineType(machineType, bindingMachine)
          const stationOk = this.matchStation(stationTokens, bindingStation)
          return machineOk && stationOk
        })
        if (!matchedBinding) {
          continue
        }
      }

      const terms = this.expandTerms(entry.keyword, entry.synonyms)
      for (const term of terms) {
        const indexes = this.findAllIndexes(fullText, term)
        for (const index of indexes) {
          const excerpt = this.extractExcerpt(fullText, index, term.length)
          const summary = this.summarizeExcerpt(excerpt)
          const section = this.resolveKeySection(entry, relatedBindings)
          const mapKey = `${entry.id}-${section}-${summary}`
          const existed = hitMap.get(mapKey)
          const nextScore = Number(entry.weight || 1) + (existed?.score || 0)

          hitMap.set(mapKey, {
            keyword_id: entry.id,
            keyword: entry.keyword,
            hit_term: term,
            key_section: section,
            excerpt,
            summary,
            has_table_hint: this.detectTableHint(excerpt),
            has_image_hint: this.detectImageHint(excerpt),
            is_fallback: false,
            score: Number(nextScore.toFixed(2))
          })
        }
      }
    }

    let hits = Array.from(hitMap.values()).sort((a, b) => b.score - a.score)

    if (hits.length === 0) {
      hits = this.buildFallbackHits(keywords, bindings, machineType, stationTokens)
    }

    return {
      agreementId,
      hits
    }
  }

  private buildFallbackHits(keywords: any[], bindings: any[], machineType: string, stationTokens: string[]) {
    const items: any[] = []

    for (const entry of keywords) {
      const relatedBindings = bindings.filter((binding: any) => Number(binding.keyword_id) === Number(entry.id))
      if (relatedBindings.length > 0) {
        const matchedBinding = relatedBindings.find((binding: any) => {
          const bindingMachine = String(binding.machine_type || '').trim()
          const bindingStation = String(binding.station || '').trim()
          return this.matchMachineType(machineType, bindingMachine) && this.matchStation(stationTokens, bindingStation)
        })
        if (!matchedBinding) {
          continue
        }
      }

      const section = this.resolveKeySection(entry, relatedBindings)
      if (!section) continue

      const summary = String(entry.remark || '').trim() || `关键词“${entry.keyword}”未在文本中直接命中，建议按该条款做人工确认。`
      items.push({
        keyword_id: entry.id,
        keyword: entry.keyword,
        hit_term: entry.keyword,
        key_section: section,
        excerpt: '',
        summary,
        has_table_hint: this.detectTableHint(summary),
        has_image_hint: this.detectImageHint(summary),
        score: Number(entry.weight || 1),
        is_fallback: true
      })
    }

    const dedup = new Map<string, any>()
    for (const item of items) {
      const key = `${item.key_section}-${item.keyword}`
      if (!dedup.has(key)) {
        dedup.set(key, item)
      }
    }

    return Array.from(dedup.values()).sort((a, b) => b.score - a.score)
  }

  private resolveKeySection(entry: any, bindings: any[]) {
    const byBinding = bindings.find((binding: any) => String(binding.key_section || '').trim())
    return String(byBinding?.key_section || entry.key_section || '').trim()
  }

  private safeParseJson(raw: any) {
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    if (typeof raw !== 'string') return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  private expandTerms(keyword: string, synonyms: string) {
    const terms = [keyword, ...String(synonyms || '').split(/[，,;；\n]/g)]
      .map((term) => String(term || '').trim())
      .filter(Boolean)

    return Array.from(new Set(terms))
  }

  private findAllIndexes(text: string, term: string) {
    const result: number[] = []
    if (!term) return result

    const source = String(text || '')
    const target = String(term || '')
    if (!source || !target) return result

    const sourceLower = source.toLowerCase()
    const targetLower = target.toLowerCase()

    let start = 0
    while (start < sourceLower.length) {
      const idx = sourceLower.indexOf(targetLower, start)
      if (idx < 0) break
      result.push(idx)
      start = idx + targetLower.length
      if (result.length >= 30) break
    }

    return result
  }

  private extractExcerpt(text: string, index: number, termLength: number) {
    const left = Math.max(0, index - 80)
    const right = Math.min(text.length, index + termLength + 120)
    return text.slice(left, right).replace(/\n{2,}/g, '\n').trim()
  }

  private summarizeExcerpt(excerpt: string) {
    const compact = excerpt.replace(/\s+/g, ' ').trim()
    return compact.length > 100 ? `${compact.slice(0, 100)}...` : compact
  }

  private detectImageHint(content: string) {
    const lower = String(content || '').toLowerCase()
    return /图|图片|附图|示意|截图|photo|image/.test(lower)
  }

  private detectTableHint(content: string) {
    const text = String(content || '')
    return /\||,|\t|序号|列|行|表格|table/i.test(text)
  }

  private tokenizeStations(stations: string) {
    return String(stations || '')
      .split(/[，,、;；\s/|]+/g)
      .map((token) => token.trim())
      .filter(Boolean)
  }

  private isAllToken(value: string) {
    const token = String(value || '').trim().toLowerCase()
    return token === 'all' || token === '*' || token === '全部' || token === '不限'
  }

  private matchMachineType(machineType: string, bindingMachine: string) {
    if (!bindingMachine || this.isAllToken(bindingMachine)) return true
    const current = String(machineType || '').trim()
    if (!current) return false
    return current === bindingMachine || current.includes(bindingMachine) || bindingMachine.includes(current)
  }

  private matchStation(stationTokens: string[], bindingStation: string) {
    if (!bindingStation || this.isAllToken(bindingStation)) return true
    const normalized = String(bindingStation || '').trim()
    if (!normalized) return true

    if (stationTokens.length === 0) return false
    return stationTokens.some((token) => token === normalized || token.includes(normalized) || normalized.includes(token))
  }
}

export default new KeywordService()
