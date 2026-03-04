import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import documentParserService from './documentParserService.js'
import path from 'path'

class AgreementService {
  private db: sqlite3.Database | null = null

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
    
    // 提取产品尺寸
    const productSizeMatch = text.match(/(产品尺寸|尺寸要求|规格)[\s\S]{0,500}(?=(\n\s*\n|$))/i)
    if (productSizeMatch) sections.productSize = productSizeMatch[0]
    
    // 提取PPM
    const ppmMatch = text.match(/(PPM|节拍|产能|速度)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (ppmMatch) sections.ppm = ppmMatch[0]
    
    // 提取检测要求
    const inspectionMatch = text.match(/(检测要求|检测内容|外观检测)[\s\S]{0,500}(?=(\n\s*\n|$))/i)
    if (inspectionMatch) sections.inspectionRequirements = inspectionMatch[0]
    
    // 提取检测对象规格
    const specsMatch = text.match(/(检测对象|规格要求|极耳尺寸|胶纸间距)[\s\S]{0,500}(?=(\n\s*\n|$))/i)
    if (specsMatch) sections.inspectionObjectSpecs = specsMatch[0]
    
    // 提取检测精度
    const precisionMatch = text.match(/(检测精度|精度要求|相机分辨率)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (precisionMatch) sections.inspectionPrecision = precisionMatch[0]
    
    // 提取工位要求
    const stationMatch = text.match(/(工位要求|工位配置|单工位|双工位)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (stationMatch) sections.stationRequirements = stationMatch[0]
    
    // 提取品牌要求
    const brandMatch = text.match(/(品牌要求|相机品牌|镜头品牌|光源品牌)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (brandMatch) sections.brandRequirements = brandMatch[0]
    
    // 提取工控机要求
    const computerMatch = text.match(/(工控机|配置要求|存储要求|端口预留)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (computerMatch) sections.industrialComputerRequirements = computerMatch[0]
    
    // 提取软件要求
    const softwareMatch = text.match(/(软件要求|界面要求|功能要求|权限要求)[\s\S]{0,300}(?=(\n\s*\n|$))/i)
    if (softwareMatch) sections.softwareRequirements = softwareMatch[0]
    
    return sections
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
