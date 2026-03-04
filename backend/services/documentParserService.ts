import pdf from 'pdf-parse'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'

class DocumentParserService {
  // 解析PDF文档
  async parsePDF(filePath: string): Promise<any> {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdf(dataBuffer)
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      }
    } catch (error) {
      console.error('Error parsing PDF:', error)
      return { text: '', pages: 0, info: {} }
    }
  }

  // 解析Excel文档
  parseExcel(filePath: string): any {
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetNames = workbook.SheetNames
      const sheets = sheetNames.map(name => {
        const sheet = workbook.Sheets[name]
        return {
          name,
          data: XLSX.utils.sheet_to_json(sheet)
        }
      })
      
      // 提取文本内容
      let text = ''
      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name]
        text += `Sheet: ${name}\n`
        text += XLSX.utils.sheet_to_csv(sheet)
        text += '\n\n'
      })
      
      return { sheets, text }
    } catch (error) {
      console.error('Error parsing Excel:', error)
      return { sheets: [], text: '' }
    }
  }

  // 解析文本文件
  parseText(filePath: string): any {
    try {
      const text = fs.readFileSync(filePath, 'utf8')
      return { text }
    } catch (error) {
      console.error('Error parsing text:', error)
      return { text: '' }
    }
  }

  // 解析Word文档
  async parseWord(filePath: string): Promise<any> {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const result = await mammoth.extractRawText({ buffer: dataBuffer })
      return { text: result.value }
    } catch (error) {
      console.error('Error parsing Word:', error)
      return { text: '' }
    }
  }

  // 根据文件类型选择解析方法
  async parseFile(filePath: string): Promise<any> {
    const ext = path.extname(filePath).toLowerCase()
    
    switch (ext) {
      case '.pdf':
        return await this.parsePDF(filePath)
      case '.xlsx':
      case '.xls':
        return this.parseExcel(filePath)
      case '.doc':
      case '.docx':
        return await this.parseWord(filePath)
      case '.txt':
      case '.md':
      case '.csv':
        return this.parseText(filePath)
      default:
        return { text: '', error: 'Unsupported file type' }
    }
  }

  // 提取关键信息
  extractKeyInfo(text: string): any {
    const info: any = {}
    
    // 提取精度要求
    const precisionMatch = text.match(/(精度|accuracy)[^\d]{0,8}(\d+(?:\.\d+))\s*(um|μm|mm)/i)
    if (precisionMatch) {
      info.precision = {
        value: parseFloat(precisionMatch[2]),
        unit: precisionMatch[3]
      }
    }

    // 提取节拍要求
    const speedMatch = text.match(/(节拍|产能|speed)[^\d]{0,8}(\d+(?:\.\d+))\s*(件\/分|ppm|pcs\/min)/i)
    if (speedMatch) {
      info.speed = {
        value: parseFloat(speedMatch[2]),
        unit: speedMatch[3]
      }
    }

    // 提取检测要点
    const keywords = ['缺陷', '划痕', '尺寸', '定位', '同轴光', '背光', '二维码']
    const foundKeywords = keywords.filter(word => text.includes(word))
    if (foundKeywords.length) {
      info.detectionPoints = foundKeywords
    }

    // 提取品牌偏好
    const brands = ['Cognex', 'Keyence', 'Basler', 'Hikrobot', 'Omron']
    const foundBrands = brands.filter(brand => text.toLowerCase().includes(brand.toLowerCase()))
    if (foundBrands.length) {
      info.preferredBrands = foundBrands
    }

    return info
  }
}

export default new DocumentParserService()
