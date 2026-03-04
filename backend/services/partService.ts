import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

class PartService {
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

  async getParts() {
    if (!this.db) throw new Error('Database not initialized')
    return await this.db.all('SELECT * FROM parts')
  }

  async createPart(category: string, name: string, model: string, brand: string, price: number, specPrecisionUm: number, leadTimeDays: number) {
    if (!this.db) throw new Error('Database not initialized')
    const result = await this.db.run(
      'INSERT INTO parts (category, name, model, brand, price, spec_precision_um, lead_time_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category, name, model, brand, price, specPrecisionUm, leadTimeDays]
    )
    return { id: result.lastID, category, name, model, brand, price, specPrecisionUm, leadTimeDays }
  }

  async updatePart(id: number, category: string, name: string, model: string, brand: string, price: number, specPrecisionUm: number, leadTimeDays: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run(
      'UPDATE parts SET category = ?, name = ?, model = ?, brand = ?, price = ?, spec_precision_um = ?, lead_time_days = ? WHERE id = ?',
      [category, name, model, brand, price, specPrecisionUm, leadTimeDays, id]
    )
    return { id, category, name, model, brand, price, specPrecisionUm, leadTimeDays }
  }

  async deletePart(id: number) {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.run('DELETE FROM parts WHERE id = ?', [id])
    return { id }
  }
}

export default new PartService()
