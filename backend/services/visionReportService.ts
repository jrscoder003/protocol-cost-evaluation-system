import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import documentParserService from './documentParserService.js'

class VisionReportService {
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

  async getVisionReports() {
    if (!this.db) throw new Error('Database not initialized')
    return await this.db.all('SELECT * FROM vision_reports')
  }

  async createVisionReport(name: string, machineType: string, stations: string, filePath?: string) {
    if (!this.db) throw new Error('Database not initialized')
    
    let extractedInfo = {}
    if (filePath) {
      try {
        const parsedData = await documentParserService.parseFile(filePath)
        if (parsedData.text) {
          extractedInfo = documentParserService.extractKeyInfo(parsedData.text)
        }
      } catch (error) {
        console.error('Error parsing document:', error)
      }
    }
    
    const result = await this.db.run(
      'INSERT INTO vision_reports (name, machine_type, stations, extracted_info) VALUES (?, ?, ?, ?)',
      [name, machineType, stations, JSON.stringify(extractedInfo)]
    )
    return { id: result.lastID, name, machineType, stations, extractedInfo }
  }

  async updateVisionReport(id: number, name: string, machineType: string, stations: string) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run(
      'UPDATE vision_reports SET name = ?, machine_type = ?, stations = ? WHERE id = ?',
      [name, machineType, stations, id]
    )
    return { id, name, machineType, stations }
  }

  async deleteVisionReport(id: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run('DELETE FROM vision_reports WHERE id = ?', [id])
    return { id }
  }
}

export default new VisionReportService()
