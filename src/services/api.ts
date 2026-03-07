import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = String(error?.message || '').toLowerCase()
    const status = Number(error?.response?.status || 0)
    const responseBody = String(error?.response?.data || '').toLowerCase()
    const isBackendUnavailable =
      !error?.response ||
      message.includes('network error') ||
      message.includes('econnrefused') ||
      (status === 500 && (
        responseBody.includes('proxy') ||
        responseBody.includes('econnrefused') ||
        message.includes('econnrefused')
      ))

    if (isBackendUnavailable) {
      const normalizedError = new Error('后端服务不可用（请确认 3006 端口服务已启动）')
      ;(normalizedError as any).original = error
      return Promise.reject(normalizedError)
    }

    const serverMessage = error?.response?.data?.message
    if (serverMessage) {
      return Promise.reject(new Error(String(serverMessage)))
    }

    return Promise.reject(error)
  }
)

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

export const keywordAPI = {
  getList: () => api.get('/keywords'),
  create: (payload: any) => api.post('/keywords', payload),
  update: (id: number, payload: any) => api.put(`/keywords/${id}`, payload),
  delete: (id: number) => api.delete(`/keywords/${id}`),
  seedDefaults: () => api.post('/keywords/seed-defaults'),
  importFile: (formData: FormData) => api.post('/keywords/import', formData),
  getBindings: () => api.get('/keywords/bindings/list'),
  createBinding: (payload: any) => api.post('/keywords/bindings', payload),
  deleteBinding: (id: number) => api.delete(`/keywords/bindings/${id}`),
  analyzeAgreement: (agreementId: number) => api.get(`/keywords/analyze/${agreementId}`),
  exportLibrary: () => api.get('/keywords/export-library', { responseType: 'blob' }),
  exportTemplate: () => api.get('/keywords/export-template', { responseType: 'blob' })
}

export default api
