import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import documentParserService from './documentParserService.js'
import path from 'path'

class AgreementService {
  private db: Database | null = null

  constructor() {
    this.initDatabase()
  }

  private async initDatabase() {
    try {
      this.db = await open({
        filename: './database.db',
        driver: sqlite3.Database
      })
      
      // 创建agreements表（如果不存在）
      try {
        await this.db.run(`
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
          )
        `)
      } catch (createError) {
        console.error('Error creating agreements table:', createError)
      }
      
      // 确保agreements表有full_text列（仅在缺失时补齐，避免每次启动报重复列错误）
      const columns = await this.db.all('PRAGMA table_info(agreements)')
      const hasFullText = Array.isArray(columns)
        ? columns.some((column: any) => String(column.name || '').toLowerCase() === 'full_text')
        : false
      if (!hasFullText) {
        await this.db.run('ALTER TABLE agreements ADD COLUMN full_text TEXT')
      }

      const hasSourceFilePath = Array.isArray(columns)
        ? columns.some((column: any) => String(column.name || '').toLowerCase() === 'source_file_path')
        : false
      if (!hasSourceFilePath) {
        await this.db.run('ALTER TABLE agreements ADD COLUMN source_file_path TEXT')
      }

      const hasArchiveRelPath = Array.isArray(columns)
        ? columns.some((column: any) => String(column.name || '').toLowerCase() === 'archive_rel_path')
        : false
      if (!hasArchiveRelPath) {
        await this.db.run('ALTER TABLE agreements ADD COLUMN archive_rel_path TEXT')
      }
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }

  async getAgreements() {
    if (!this.db) throw new Error('Database not initialized')
    return await this.db.all('SELECT * FROM agreements')
  }

  async createAgreement(
    name: string,
    machineType: string,
    stations: string,
    filePath?: string,
    archiveRelPath: string = ''
  ) {
    // 确保数据库已初始化
    if (!this.db) {
      await this.initDatabase()
      if (!this.db) throw new Error('Database not initialized')
    }
    
    let extractedInfo = {}
    let fullText = ''
    if (filePath) {
      try {
        const parsedData = await documentParserService.parseFile(filePath)
        // 处理不同类型文件的解析结果
        if (parsedData.text) {
          fullText = parsedData.text
        } else if (parsedData.sheets) {
          // 对于Excel文件，将sheets转换为文本
          fullText = ''
          parsedData.sheets.forEach((sheet: any) => {
            fullText += `Sheet: ${sheet.name}\n`
            if (sheet.data && sheet.data.length > 0) {
              // 添加表头
              const headers = Object.keys(sheet.data[0])
              fullText += headers.join(',') + '\n'
              // 添加数据行
              sheet.data.forEach((row: any) => {
                const values = headers.map(header => row[header])
                fullText += values.join(',') + '\n'
              })
            }
            fullText += '\n'
          })
        }
        
        // 提取关键信息
        if (fullText) {
          extractedInfo = documentParserService.extractKeyInfo(fullText)
          // 添加更多关键信息提取
          extractedInfo = {
            ...extractedInfo,
            fullText: fullText.substring(0, 1000) + (fullText.length > 1000 ? '...' : ''),
            keySections: this.extractKeySections(fullText)
          }
        }
      } catch (error) {
        console.error('Error parsing document:', error)
      }
    }
    
    try {
      const result = await this.db.run(
        'INSERT INTO agreements (name, machine_type, stations, extracted_info, full_text, source_file_path, archive_rel_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, machineType, stations, JSON.stringify(extractedInfo), fullText, filePath || '', archiveRelPath]
      )
      return {
        id: (result as any).lastID,
        name,
        machineType,
        stations,
        extractedInfo,
        fullText,
        sourceFilePath: filePath || '',
        archiveRelPath
      }
    } catch (error) {
      console.error('Error inserting agreement:', error)
      // 如果是表结构问题，尝试添加full_text字段
      if ((error as any).message.includes('no such column: full_text')) {
        try {
          await this.db.run('ALTER TABLE agreements ADD COLUMN full_text TEXT')
          const result = await this.db.run(
            'INSERT INTO agreements (name, machine_type, stations, extracted_info, full_text, source_file_path, archive_rel_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, machineType, stations, JSON.stringify(extractedInfo), fullText, filePath || '', archiveRelPath]
          )
          return {
            id: (result as any).lastID,
            name,
            machineType,
            stations,
            extractedInfo,
            fullText,
            sourceFilePath: filePath || '',
            archiveRelPath
          }
        } catch (alterError) {
          console.error('Error adding full_text column:', alterError)
          throw alterError
        }
      }
      throw error
    }
  }
  
  // 提取关键章节
  extractKeySections(text: string): any {
    const sections = {
      productSize: '',
      ppm: '',
      inspectionRequirements: '',
      inspectionObjectSpecs: '',
      inspectionPrecision: '',
      stationRequirements: '',
      brandRequirements: '',
      industrialComputerRequirements: '',
      softwareRequirements: ''
    }

    const normalizedText = String(text || '')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \u00A0]+/g, ' ')
      .trim()

    if (!normalizedText) {
      return sections
    }

    const lines = normalizedText
      .split('\n')
      .flatMap((line) => line.split(/[；;。]/g))
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    sections.productSize = this.extractSnippetByKeywords(lines, normalizedText, [
      '产品尺寸', '尺寸要求', '极片长宽', '电芯', '电池产品长宽', '视野', '料长'
    ])

    sections.ppm = this.extractSnippetByKeywords(lines, normalizedText, [
      'ppm', '节拍', '产能', '速度', '拍照频率'
    ])

    sections.inspectionRequirements = this.extractSnippetByKeywords(lines, normalizedText, [
      '检测要求', '检测内容', '外观检测', '过杀', '漏检', '黑白'
    ])

    sections.inspectionObjectSpecs = this.extractSnippetByKeywords(lines, normalizedText, [
      '检测对象', '对象规格', '极耳尺寸', '胶纸间距', '胶纸颜色', '规格'
    ])

    sections.inspectionPrecision = this.extractSnippetByKeywords(lines, normalizedText, [
      '检测精度', '像素精度', '精度要求', '相机分辨率', '分辨率', 'um', 'μm'
    ])

    sections.stationRequirements = this.extractSnippetByKeywords(lines, normalizedText, [
      '工位要求', '工位配置', '单工位', '双工位', '一个工位', '工位', '相机数量'
    ])

    sections.brandRequirements = this.extractSnippetByKeywords(lines, normalizedText, [
      '品牌要求', '相机品牌', '镜头品牌', '光源品牌', '工控机品牌'
    ])

    sections.industrialComputerRequirements = this.extractSnippetByKeywords(lines, normalizedText, [
      '工控机', 'ipc', '配置要求', '存储要求', '端口预留', '图片存储', '存储天数'
    ])

    sections.softwareRequirements = this.extractSnippetByKeywords(lines, normalizedText, [
      '软件要求', '界面', '权限', '功能', '报警', '数据导出'
    ])
    
    return sections
  }

  private extractSnippetByKeywords(
    lines: string[],
    fullText: string,
    keywords: string[],
    contextLines: number = 2,
    maxLength: number = 260
  ) {
    const normalizedKeywords = keywords
      .map((keyword) => String(keyword || '').trim().toLowerCase())
      .filter(Boolean)

    if (!normalizedKeywords.length) {
      return ''
    }

    const snippets: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const currentLine = String(lines[i] || '')
      const lowerLine = currentLine.toLowerCase()
      const hit = normalizedKeywords.some((keyword) => lowerLine.includes(keyword))
      if (!hit) {
        continue
      }

      const start = Math.max(0, i - 1)
      const end = Math.min(lines.length - 1, i + contextLines)
      const snippet = lines.slice(start, end + 1).join('；').trim()
      if (snippet) {
        snippets.push(snippet.slice(0, maxLength))
      }
    }

    if (!snippets.length) {
      const lowerText = fullText.toLowerCase()
      for (const keyword of normalizedKeywords) {
        const index = lowerText.indexOf(keyword)
        if (index < 0) continue
        const start = Math.max(0, index - 18)
        const end = Math.min(fullText.length, index + maxLength)
        const snippet = fullText.slice(start, end).trim()
        if (snippet) {
          snippets.push(snippet)
          break
        }
      }
    }

    return Array.from(new Set(snippets)).join('\n')
  }

  async updateAgreement(id: number, name: string, machineType: string, stations: string) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run(
      'UPDATE agreements SET name = ?, machine_type = ?, stations = ? WHERE id = ?',
      [name, machineType, stations, id]
    )
    return { id, name, machineType, stations }
  }

  async deleteAgreement(id: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run('DELETE FROM agreements WHERE id = ?', [id])
    return { id }
  }
}

export default new AgreementService()
