import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

const apiBase = 'http://localhost:3006/api'
const targetFolder = 'E:/协议评估成本核算系统/测试文件/测试资料/数码卷绕/数码卷绕'

const supported = new Set(['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx', '.xls'])

async function main() {
  const entries = fs.readdirSync(targetFolder)
    .map((name) => ({ name, fullPath: path.join(targetFolder, name), ext: path.extname(name).toLowerCase() }))
    .filter((item) => fs.statSync(item.fullPath).isFile() && supported.has(item.ext))

  if (!entries.length) {
    console.log('未找到可测试文件。')
    return
  }

  const pick = entries.find((item) => item.ext === '.pdf') || entries[0]
  console.log('测试文件:', pick.fullPath)

  const form = new FormData()
  form.append('files', fs.createReadStream(pick.fullPath), { filename: pick.name })
  form.append('machineType', '1')
  form.append('stations', '1站')

  const uploadResp = await axios.post(`${apiBase}/agreements/upload`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000
  })
  console.log('上传结果:', uploadResp.data)

  const listResp = await axios.get(`${apiBase}/agreements`, { timeout: 120000 })
  const items = Array.isArray(listResp.data?.items) ? listResp.data.items : []
  if (!items.length) {
    console.log('列表为空，无法验证。')
    return
  }

  const latest = items[items.length - 1]
  const extracted = typeof latest.extracted_info === 'string'
    ? (() => {
      try { return JSON.parse(latest.extracted_info) } catch { return {} }
    })()
    : (latest.extracted_info || {})

  const keySections = extracted.keySections || {}
  const nonEmptySectionNames = Object.keys(keySections).filter((key) => String(keySections[key] || '').trim().length > 0)

  console.log('--- 验证结果 ---')
  console.log('记录ID:', latest.id)
  console.log('文件名:', latest.name)
  console.log('full_text长度:', String(latest.full_text || '').length)
  console.log('extracted_info键:', Object.keys(extracted))
  console.log('keySections非空项:', nonEmptySectionNames)
  console.log('keySections数量:', nonEmptySectionNames.length)

  if (!String(latest.full_text || '').trim()) {
    console.log('提示: full_text 为空，可能是扫描版PDF或文档无可提取文本。')
  }
}

main().catch((error) => {
  const message = error?.response?.data || error?.message || error
  console.error('测试失败:', message)
  process.exitCode = 1
})
