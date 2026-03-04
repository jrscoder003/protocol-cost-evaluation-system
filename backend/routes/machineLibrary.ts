import express from 'express'
import machineLibraryService from '../services/machineLibraryService'

const router = express.Router()

// 获取机型库列表
router.get('/', async (req, res, next) => {
  try {
    const libraries = await machineLibraryService.getMachineLibraries()
    res.json({ items: libraries })
  } catch (error) {
    next(error)
  }
})

// 创建机型库
router.post('/create', async (req, res, next) => {
  try {
    const { name } = req.body
    const library = await machineLibraryService.createMachineLibrary(name)
    res.json({ message: 'Machine library created successfully', library })
  } catch (error) {
    next(error)
  }
})

// 更新机型库
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name } = req.body
    const library = await machineLibraryService.updateMachineLibrary(parseInt(id), name)
    res.json({ message: 'Machine library updated successfully', library })
  } catch (error) {
    next(error)
  }
})

// 删除机型库
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await machineLibraryService.deleteMachineLibrary(parseInt(id))
    res.json({ message: 'Machine library deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
