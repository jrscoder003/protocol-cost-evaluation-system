import express from 'express'

const logger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now()
  const { method, url } = req
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} ${duration}ms`)
  })
  
  next()
}

export default logger
