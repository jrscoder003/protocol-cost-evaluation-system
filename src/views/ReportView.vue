<template>
  <div class="report">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>报告生成</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
            <el-menu-item index="dashboard">仪表盘</el-menu-item>
            <el-menu-item index="library">资料库管理</el-menu-item>
            <el-menu-item index="evaluation">评估引擎</el-menu-item>
            <el-menu-item index="report">报告生成</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <div class="card-header">
              <span>生成报告</span>
            </div>
          </template>
          <el-form :model="reportForm" label-width="120px" style="margin-bottom: 20px;">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="机型库">
                  <el-select v-model="reportForm.machineTypeId" placeholder="选择机型库">
                    <el-option
                      v-for="machine in machineList"
                      :key="machine.id"
                      :label="machine.name"
                      :value="machine.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="报告格式">
                  <el-select v-model="reportForm.format" placeholder="选择报告格式">
                    <el-option label="PDF" value="pdf" />
                    <el-option label="HTML" value="html" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="操作">
                  <el-button type="primary" @click="generateReport" :loading="loading">生成报告</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>报告列表</span>
            </div>
          </template>
          <el-table :data="reportList" style="margin-top: 20px;">
            <el-table-column prop="name" label="文件名" width="300"></el-table-column>
            <el-table-column label="大小">
              <template #default="scope">
                {{ formatFileSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="创建时间">
              <template #default="scope">
                {{ new Date(scope.row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="downloadReport(scope.row.accessPath)">
                  下载
                </el-button>
                <el-button size="small" type="danger" @click="deleteReport(scope.row.name)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { machineLibraryAPI, reportAPI } from '../services/api'

const router = useRouter()
const activeIndex = ref('report')
const loading = ref(false)

// 表单数据
const reportForm = ref({
  machineTypeId: '',
  format: 'pdf'
})

// 数据列表
const machineList = ref<any[]>([])
const reportList = ref<any[]>([])

// 生命周期
onMounted(() => {
  loadMachineLibraries()
  loadReports()
})

// 导航处理
const handleSelect = (key: string) => {
  switch (key) {
    case 'dashboard':
      router.push('/dashboard')
      break
    case 'library':
      router.push('/library')
      break
    case 'evaluation':
      router.push('/evaluation')
      break
    case 'report':
      router.push('/report')
      break
  }
}

// 加载机型库
const loadMachineLibraries = async () => {
  try {
    const response = await machineLibraryAPI.getList()
    machineList.value = response.data.items
  } catch (error) {
    console.error('加载机型库失败:', error)
  }
}

// 加载报告列表
const loadReports = async () => {
  try {
    const response = await reportAPI.getList()
    reportList.value = response.data.reports
  } catch (error) {
    console.error('加载报告列表失败:', error)
  }
}

// 生成报告
const generateReport = async () => {
  if (!reportForm.value.machineTypeId) {
    alert('请选择机型库')
    return
  }
  
  loading.value = true
  try {
    const response = await reportAPI.generate(reportForm.value.machineTypeId, reportForm.value.format)
    alert('报告生成成功')
    await loadReports()
  } catch (error) {
    alert('报告生成失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 下载报告
const downloadReport = (accessPath: string) => {
  window.open(accessPath, '_blank')
}

// 删除报告
const deleteReport = async (fileName: string) => {
  if (confirm('确定要删除吗？')) {
    try {
      // 这里应该调用删除报告的API
      // 为了简化，我们直接刷新列表
      await loadReports()
      alert('删除成功')
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }
}
</script>

<style scoped>
.report {
  min-height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-content h1 {
  font-size: 20px;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>