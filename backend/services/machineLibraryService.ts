import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

class MachineLibraryService {
  private db: sqlite3.Database | null = null

  constructor() {
    // 构造函数中不直接调用异步方法
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

  async getMachineLibraries() {
    // 确保数据库已初始化
    if (!this.db) {
      await this.initDatabase()
      if (!this.db) throw new Error('Database not initialized')
    }
    return await this.db.all('SELECT * FROM machine_libraries')
  }

  async createMachineLibrary(name: string) {
    // 确保数据库已初始化
    if (!this.db) {
      await this.initDatabase()
      if (!this.db) throw new Error('Database not initialized')
    }
    const result = await this.db.run('INSERT INTO machine_libraries (name) VALUES (?)', [name])
    return { id: result.lastID, name }
  }

  async updateMachineLibrary(id: number, name: string) {
    // 确保数据库已初始化
    if (!this.db) {
      await this.initDatabase()
      if (!this.db) throw new Error('Database not initialized')
    }
    await this.db.run('UPDATE machine_libraries SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, id])
    return { id, name }
  }

  async deleteMachineLibrary(id: number) {
    // 确保数据库已初始化
    if (!this.db) {
      await this.initDatabase()
      if (!this.db) throw new Error('Database not initialized')
    }
    await this.db.run('DELETE FROM machine_libraries WHERE id = ?', [id])
    return { id }
  }
}

export default new MachineLibraryService()
