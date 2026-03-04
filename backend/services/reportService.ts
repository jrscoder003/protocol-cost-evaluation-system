import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { generatePdf } from 'html-pdf-node'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ReportService {
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
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }

  // 生成报告
  async generateReport(machineTypeId: number, format: string = 'pdf') {
    if (!this.db) throw new Error('Database not initialized')

    try {
      // 获取评估结果
      const evaluationResult = await this.getEvaluationResult(machineTypeId)
      
      // 生成HTML内容
      const htmlContent = this.generateHtmlReport(evaluationResult)
      
      // 根据格式生成报告
      let reportPath = ''
      switch (format.toLowerCase()) {
        case 'pdf':
          reportPath = await this.generatePdfReport(htmlContent, machineTypeId)
          break
        case 'html':
          reportPath = await this.generateHtmlFile(htmlContent, machineTypeId)
          break
        default:
          throw new Error('Unsupported report format')
      }

      return { reportPath, format }
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }

  // 获取评估结果
  private async getEvaluationResult(machineTypeId: number) {
    if (!this.db) throw new Error('Database not initialized')

    // 这里应该调用评估服务获取评估结果
    // 为了简化，我们直接查询数据库获取相关数据
    const agreements = await this.db.all('SELECT * FROM agreements WHERE machine_type = ?', [machineTypeId])
    const visionReports = await this.db.all('SELECT * FROM vision_reports WHERE machine_type = ?', [machineTypeId])
    const costTables = await this.db.all('SELECT * FROM cost_tables WHERE machine_type = ?', [machineTypeId])
    const parts = await this.db.all('SELECT * FROM parts')

    return {
      machineTypeId,
      agreements,
      visionReports,
      costTables,
      parts,
      generatedAt: new Date().toISOString()
    }
  }

  // 生成HTML报告
  private generateHtmlReport(data: any) {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>协议评估成本核算报告</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
          }
          h1 {
            color: #333;
            text-align: center;
          }
          h2 {
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .summary {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .section {
            margin: 30px 0;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>协议评估成本核算报告</h1>
        
        <div class="summary">
          <h2>报告摘要</h2>
          <p><strong>机型ID:</strong> ${data.machineTypeId}</p>
          <p><strong>生成时间:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
          <p><strong>协议资料数量:</strong> ${data.agreements.length}</p>
          <p><strong>视觉方案数量:</strong> ${data.visionReports.length}</p>
          <p><strong>成本表数量:</strong> ${data.costTables.length}</p>
          <p><strong>标准件数量:</strong> ${data.parts.length}</p>
        </div>

        <div class="section">
          <h2>协议资料</h2>
          ${data.agreements.length > 0 ? `
            <table>
              <tr>
                <th>文件名</th>
                <th>机型</th>
                <th>工位</th>
                <th>上传时间</th>
              </tr>
              ${data.agreements.map((agreement: any) => `
                <tr>
                  <td>${agreement.name}</td>
                  <td>${agreement.machine_type}</td>
                  <td>${agreement.stations}</td>
                  <td>${new Date(agreement.uploaded_at).toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p>无协议资料</p>'}
        </div>

        <div class="section">
          <h2>视觉方案</h2>
          ${data.visionReports.length > 0 ? `
            <table>
              <tr>
                <th>文件名</th>
                <th>机型</th>
                <th>工位</th>
                <th>上传时间</th>
              </tr>
              ${data.visionReports.map((report: any) => `
                <tr>
                  <td>${report.name}</td>
                  <td>${report.machine_type}</td>
                  <td>${report.stations}</td>
                  <td>${new Date(report.uploaded_at).toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p>无视觉方案</p>'}
        </div>

        <div class="section">
          <h2>成本表</h2>
          ${data.costTables.length > 0 ? `
            <table>
              <tr>
                <th>文件名</th>
                <th>机型</th>
                <th>总成本</th>
                <th>上传时间</th>
              </tr>
              ${data.costTables.map((table: any) => `
                <tr>
                  <td>${table.name}</td>
                  <td>${table.machine_type}</td>
                  <td>${table.total_cost}</td>
                  <td>${new Date(table.uploaded_at).toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p>无成本表</p>'}
        </div>

        <div class="section">
          <h2>标准件</h2>
          ${data.parts.length > 0 ? `
            <table>
              <tr>
                <th>类别</th>
                <th>名称</th>
                <th>型号</th>
                <th>品牌</th>
                <th>单价</th>
              </tr>
              ${data.parts.map((part: any) => `
                <tr>
                  <td>${part.category}</td>
                  <td>${part.name}</td>
                  <td>${part.model}</td>
                  <td>${part.brand}</td>
                  <td>${part.price}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p>无标准件</p>'}
        </div>

        <div class="footer">
          <p>本报告由协议评估成本核算系统自动生成</p>
        </div>
      </body>
      </html>
    `
  }

  // 生成PDF报告
  private async generatePdfReport(htmlContent: string, machineTypeId: number) {
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    }

    const reportDir = path.join(__dirname, '../../reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const reportPath = path.join(reportDir, `report_${machineTypeId}_${Date.now()}.pdf`)
    const file = {
      content: htmlContent
    }

    await generatePdf(file, options, reportPath)
    return reportPath
  }

  // 生成HTML文件
  private async generateHtmlFile(htmlContent: string, machineTypeId: number) {
    const reportDir = path.join(__dirname, '../../reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const reportPath = path.join(reportDir, `report_${machineTypeId}_${Date.now()}.html`)
    await fs.promises.writeFile(reportPath, htmlContent)
    return reportPath
  }

  // 获取报告列表
  async getReports() {
    const reportDir = path.join(__dirname, '../../reports')
    if (!fs.existsSync(reportDir)) {
      return []
    }

    const files = await fs.promises.readdir(reportDir)
    return files.map(file => ({
      name: file,
      path: path.join(reportDir, file),
      size: fs.statSync(path.join(reportDir, file)).size,
      createdAt: fs.statSync(path.join(reportDir, file)).birthtime
    }))
  }
}

export default new ReportService()