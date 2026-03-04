import express from 'express'
import evaluationService from '../services/evaluationService.js'

const router = express.Router()

// 评估指定机型
router.post('/evaluate', async (req, res, next) => {
  try {
    const { machineTypeId } = req.body
    
    if (!machineTypeId) {
      return res.status(400).json({ message: 'Machine type ID is required' })
    }
    
    const result = await evaluationService.evaluate(machineTypeId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// 获取评估历史
router.get('/history', async (req, res, next) => {
  try {
    // 这里可以实现评估历史记录功能
    res.json({ history: [] })
  } catch (error) {
    next(error)
  }
})

export default router