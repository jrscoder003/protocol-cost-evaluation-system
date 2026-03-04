import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 机型库相关API
export const machineLibraryAPI = {
  getList: () => api.get('/machine-libraries'),
  create: (name: string) => api.post('/machine-libraries/create', { name }),
  update: (id: number, name: string) => api.put(`/machine-libraries/${id}`, { name }),
  delete: (id: number) => api.delete(`/machine-libraries/${id}`)
}

// 协议资料相关API
export const agreementAPI = {
  getList: () => api.get('/agreements'),
  upload: (formData: FormData) => api.post('/agreements/upload', formData),
  delete: (id: number) => api.delete(`/agreements/${id}`)
}

// 视觉方案相关API
export const visionReportAPI = {
  getList: () => api.get('/vision-reports'),
  upload: (formData: FormData) => api.post('/vision-reports/upload', formData),
  delete: (id: number) => api.delete(`/vision-reports/${id}`)
}

// 成本表相关API
export const costTableAPI = {
  getList: () => api.get('/cost-tables'),
  upload: (formData: FormData) => api.post('/cost-tables/upload', formData),
  delete: (id: number) => api.delete(`/cost-tables/${id}`)
}

// 标准件相关API
export const partAPI = {
  getList: () => api.get('/parts'),
  create: (part: any) => api.post('/parts', part),
  update: (id: number, part: any) => api.put(`/parts/${id}`, part),
  delete: (id: number) => api.delete(`/parts/${id}`)
}

// 评估相关API
export const evaluationAPI = {
  evaluate: (machineTypeId: number) => api.post('/evaluation/evaluate', { machineTypeId }),
  getHistory: () => api.get('/evaluation/history')
}

// 报告相关API
export const reportAPI = {
  generate: (machineTypeId: number, format: string) => api.post('/reports/generate', { machineTypeId, format }),
  getList: () => api.get('/reports/list')
}

export default api
