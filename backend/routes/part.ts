import express from 'express'
import partService from '../services/partService'

const router = express.Router()

// 获取标准件列表
router.get('/', async (req, res, next) => {
  try {
    const parts = await partService.getParts()
    res.json({ items: parts })
  } catch (error) {
    next(error)
  }
})

// 创建标准件
router.post('/', async (req, res, next) => {
  try {
    const { category, name, model, brand, price, specPrecisionUm, leadTimeDays } = req.body
    const part = await partService.createPart(category, name, model, brand, price, specPrecisionUm, leadTimeDays)
    res.json({ message: 'Part created successfully', part })
  } catch (error) {
    next(error)
  }
})

// 更新标准件
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { category, name, model, brand, price, specPrecisionUm, leadTimeDays } = req.body
    const part = await partService.updatePart(parseInt(id), category, name, model, brand, price, specPrecisionUm, leadTimeDays)
    res.json({ message: 'Part updated successfully', part })
  } catch (error) {
    next(error)
  }
})

// 删除标准件
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await partService.deletePart(parseInt(id))
    res.json({ message: 'Part deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
