import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import documentParserService from './documentParserService.js'

class CostTableService {
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

  async getCostTables() {
    if (!this.db) throw new Error('Database not initialized')
    return await this.db.all('SELECT * FROM cost_tables')
  }

  async createCostTable(name: string, machineType: string, totalCost: number, filePath?: string) {
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
      'INSERT INTO cost_tables (name, machine_type, total_cost, extracted_info) VALUES (?, ?, ?, ?)',
      [name, machineType, totalCost, JSON.stringify(extractedInfo)]
    )
    return { id: result.lastID, name, machineType, totalCost, extractedInfo }
  }

  async updateCostTable(id: number, name: string, machineType: string, totalCost: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run(
      'UPDATE cost_tables SET name = ?, machine_type = ?, total_cost = ? WHERE id = ?',
      [name, machineType, totalCost, id]
    )
    return { id, name, machineType, totalCost }
  }

  async deleteCostTable(id: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run('DELETE FROM cost_tables WHERE id = ?', [id])
    return { id }
  }
}

export default new CostTableService()
