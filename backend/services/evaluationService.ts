import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

class EvaluationService {
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

  // 评估引擎主方法
  async evaluate(machineTypeId: number) {
    if (!this.db) throw new Error('Database not initialized')

    try {
      // 获取相关数据
      const agreements = await this.db.all('SELECT * FROM agreements WHERE machine_type = ?', [machineTypeId])
      const visionReports = await this.db.all('SELECT * FROM vision_reports WHERE machine_type = ?', [machineTypeId])
      const costTables = await this.db.all('SELECT * FROM cost_tables WHERE machine_type = ?', [machineTypeId])
      const parts = await this.db.all('SELECT * FROM parts')

      // 分析数据
      const analysis = this.analyzeData(agreements, visionReports, costTables, parts)

      // 生成评估结果
      const result = this.generateResult(analysis)

      return result
    } catch (error) {
      console.error('Error during evaluation:', error)
      throw error
    }
  }

  // 分析数据
  private analyzeData(agreements: any[], visionReports: any[], costTables: any[], parts: any[]) {
    const analysis: any = {
      agreements: this.analyzeAgreements(agreements),
      visionReports: this.analyzeVisionReports(visionReports),
      costTables: this.analyzeCostTables(costTables),
      parts: this.analyzeParts(parts)
    }

    return analysis
  }

  // 分析协议资料
  private analyzeAgreements(agreements: any[]) {
    const analysis: any = {
      total: agreements.length,
      keyInfo: [],
      issues: []
    }

    agreements.forEach(agreement => {
      if (agreement.extracted_info) {
        try {
          const extractedInfo = JSON.parse(agreement.extracted_info)
          analysis.keyInfo.push({
            id: agreement.id,
            name: agreement.name,
            precision: extractedInfo.precision,
            speed: extractedInfo.speed,
            detectionPoints: extractedInfo.detectionPoints,
            preferredBrands: extractedInfo.preferredBrands
          })
        } catch (error) {
          analysis.issues.push({
            id: agreement.id,
            name: agreement.name,
            error: 'Failed to parse extracted info'
          })
        }
      }
    })

    return analysis
  }

  // 分析视觉方案
  private analyzeVisionReports(visionReports: any[]) {
    const analysis: any = {
      total: visionReports.length,
      keyInfo: [],
      issues: []
    }

    visionReports.forEach(report => {
      if (report.extracted_info) {
        try {
          const extractedInfo = JSON.parse(report.extracted_info)
          analysis.keyInfo.push({
            id: report.id,
            name: report.name,
            precision: extractedInfo.precision,
            speed: extractedInfo.speed,
            detectionPoints: extractedInfo.detectionPoints,
            preferredBrands: extractedInfo.preferredBrands
          })
        } catch (error) {
          analysis.issues.push({
            id: report.id,
            name: report.name,
            error: 'Failed to parse extracted info'
          })
        }
      }
    })

    return analysis
  }

  // 分析成本表
  private analyzeCostTables(costTables: any[]) {
    const analysis: any = {
      total: costTables.length,
      totalCost: 0,
      averageCost: 0,
      keyInfo: []
    }

    if (costTables.length > 0) {
      analysis.totalCost = costTables.reduce((sum, table) => sum + (table.total_cost || 0), 0)
      analysis.averageCost = analysis.totalCost / costTables.length

      costTables.forEach(table => {
        analysis.keyInfo.push({
          id: table.id,
          name: table.name,
          totalCost: table.total_cost,
          extractedInfo: table.extracted_info ? JSON.parse(table.extracted_info) : {}
        })
      })
    }

    return analysis
  }

  // 分析标准件
  private analyzeParts(parts: any[]) {
    const analysis: any = {
      total: parts.length,
      byCategory: {},
      byBrand: {}
    }

    parts.forEach(part => {
      // 按类别统计
      if (!analysis.byCategory[part.category]) {
        analysis.byCategory[part.category] = []
      }
      analysis.byCategory[part.category].push(part)

      // 按品牌统计
      if (!analysis.byBrand[part.brand]) {
        analysis.byBrand[part.brand] = []
      }
      analysis.byBrand[part.brand].push(part)
    })

    return analysis
  }

  // 生成评估结果
  private generateResult(analysis: any) {
    const result: any = {
      overallStatus: 'pending',
      score: 0,
      recommendations: [],
      issues: [],
      details: analysis
    }

    // 计算评分
    result.score = this.calculateScore(analysis)

    // 生成建议
    result.recommendations = this.generateRecommendations(analysis)

    // 识别问题
    result.issues = this.identifyIssues(analysis)

    // 确定整体状态
    if (result.score >= 80) {
      result.overallStatus = 'excellent'
    } else if (result.score >= 60) {
      result.overallStatus = 'good'
    } else if (result.score >= 40) {
      result.overallStatus = 'fair'
    } else {
      result.overallStatus = 'poor'
    }

    return result
  }

  // 计算评分
  private calculateScore(analysis: any) {
    let score = 100

    // 检查协议资料完整性
    if (analysis.agreements.total === 0) {
      score -= 20
    }

    // 检查视觉方案完整性
    if (analysis.visionReports.total === 0) {
      score -= 20
    }

    // 检查成本表完整性
    if (analysis.costTables.total === 0) {
      score -= 20
    }

    // 检查标准件完整性
    if (analysis.parts.total === 0) {
      score -= 10
    }

    // 检查数据质量
    const totalIssues = analysis.agreements.issues.length + analysis.visionReports.issues.length
    score -= totalIssues * 5

    // 确保分数在0-100之间
    return Math.max(0, Math.min(100, score))
  }

  // 生成建议
  private generateRecommendations(analysis: any) {
    const recommendations: string[] = []

    if (analysis.agreements.total === 0) {
      recommendations.push('需要添加协议资料')
    }

    if (analysis.visionReports.total === 0) {
      recommendations.push('需要添加视觉方案')
    }

    if (analysis.costTables.total === 0) {
      recommendations.push('需要添加成本表')
    }

    if (analysis.parts.total === 0) {
      recommendations.push('需要添加标准件')
    }

    // 检查品牌偏好
    const preferredBrands = new Set<string>()
    analysis.agreements.keyInfo.forEach((item: any) => {
      if (item.preferredBrands) {
        item.preferredBrands.forEach((brand: string) => preferredBrands.add(brand))
      }
    })

    if (preferredBrands.size > 0) {
      recommendations.push(`推荐使用以下品牌: ${Array.from(preferredBrands).join(', ')}`)
    }

    return recommendations
  }

  // 识别问题
  private identifyIssues(analysis: any) {
    const issues: string[] = []

    if (analysis.agreements.issues.length > 0) {
      issues.push(`协议资料解析问题: ${analysis.agreements.issues.length}个文件`)
    }

    if (analysis.visionReports.issues.length > 0) {
      issues.push(`视觉方案解析问题: ${analysis.visionReports.issues.length}个文件`)
    }

    if (analysis.costTables.total > 0 && analysis.costTables.totalCost === 0) {
      issues.push('成本表数据不完整')
    }

    return issues
  }
}

export default new EvaluationService()