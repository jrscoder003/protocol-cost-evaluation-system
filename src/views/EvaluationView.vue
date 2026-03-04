<template>
  <div class="evaluation">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>评估引擎</h1>
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
              <span>机型评估</span>
            </div>
          </template>
          <el-form :model="evaluationForm" label-width="120px" style="margin-bottom: 20px;">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="机型库">
                  <el-select v-model="evaluationForm.machineTypeId" placeholder="选择机型库">
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
                <el-form-item label="操作">
                  <el-button type="primary" @click="startEvaluation" :loading="loading">开始评估</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          
          <div v-if="evaluationResult" class="evaluation-result">
            <el-divider>评估结果</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>整体状态</span>
                    </div>
                  </template>
                  <div class="status-container">
                    <el-tag :type="getStatusType(evaluationResult.overallStatus)">
                      {{ getStatusText(evaluationResult.overallStatus) }}
                    </el-tag>
                    <div class="score">
                      {{ evaluationResult.score }}/100
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>建议</span>
                    </div>
                  </template>
                  <el-list>
                    <el-list-item v-for="(recommendation, index) in evaluationResult.recommendations" :key="index">
                      <span class="recommendation-item">{{ recommendation }}</span>
                    </el-list-item>
                  </el-list>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>问题</span>
                    </div>
                  </template>
                  <el-list>
                    <el-list-item v-for="(issue, index) in evaluationResult.issues" :key="index">
                      <span class="issue-item">{{ issue }}</span>
                    </el-list-item>
                  </el-list>
                </el-card>
              </el-col>
            </el-row>
            
            <el-divider>详细分析</el-divider>
            <el-tabs v-model="activeDetailTab">
              <el-tab-pane label="协议资料" name="agreements">
                <el-table :data="evaluationResult.details.agreements.keyInfo" style="margin-top: 20px;">
                  <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                  <el-table-column label="精度">
                    <template #default="scope">
                      {{ scope.row.precision ? `${scope.row.precision.value} ${scope.row.precision.unit}` : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="节拍">
                    <template #default="scope">
                      {{ scope.row.speed ? `${scope.row.speed.value} ${scope.row.speed.unit}` : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="检测要点">
                    <template #default="scope">
                      {{ scope.row.detectionPoints ? scope.row.detectionPoints.join(', ') : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="品牌偏好">
                    <template #default="scope">
                      {{ scope.row.preferredBrands ? scope.row.preferredBrands.join(', ') : '-' }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="视觉方案" name="vision">
                <el-table :data="evaluationResult.details.visionReports.keyInfo" style="margin-top: 20px;">
                  <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                  <el-table-column label="精度">
                    <template #default="scope">
                      {{ scope.row.precision ? `${scope.row.precision.value} ${scope.row.precision.unit}` : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="节拍">
                    <template #default="scope">
                      {{ scope.row.speed ? `${scope.row.speed.value} ${scope.row.speed.unit}` : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="检测要点">
                    <template #default="scope">
                      {{ scope.row.detectionPoints ? scope.row.detectionPoints.join(', ') : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="品牌偏好">
                    <template #default="scope">
                      {{ scope.row.preferredBrands ? scope.row.preferredBrands.join(', ') : '-' }}
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="成本表" name="cost">
                <el-table :data="evaluationResult.details.costTables.keyInfo" style="margin-top: 20px;">
                  <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                  <el-table-column prop="totalCost" label="总成本"></el-table-column>
                </el-table>
                <div class="cost-summary" style="margin-top: 20px;">
                  <el-statistic title="总成本" :value="evaluationResult.details.costTables.totalCost"></el-statistic>
                  <el-statistic title="平均成本" :value="evaluationResult.details.costTables.averageCost" style="margin-left: 40px;"></el-statistic>
                </div>
              </el-tab-pane>
              <el-tab-pane label="标准件" name="parts">
                <el-table :data="getPartsList" style="margin-top: 20px;">
                  <el-table-column prop="category" label="类别"></el-table-column>
                  <el-table-column prop="name" label="名称"></el-table-column>
                  <el-table-column prop="model" label="型号"></el-table-column>
                  <el-table-column prop="brand" label="品牌"></el-table-column>
                  <el-table-column prop="price" label="单价"></el-table-column>
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { machineLibraryAPI, evaluationAPI } from '../services/api'

const router = useRouter()
const activeIndex = ref('evaluation')
const loading = ref(false)
const activeDetailTab = ref('agreements')

// 表单数据
const evaluationForm = ref({
  machineTypeId: ''
})

// 数据列表
const machineList = ref<any[]>([])
const evaluationResult = ref<any>(null)

// 生命周期
onMounted(() => {
  loadMachineLibraries()
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

// 开始评估
const startEvaluation = async () => {
  if (!evaluationForm.value.machineTypeId) {
    alert('请选择机型库')
    return
  }
  
  loading.value = true
  try {
    const response = await evaluationAPI.evaluate(evaluationForm.value.machineTypeId)
    evaluationResult.value = response.data
  } catch (error) {
    alert('评估失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'success'
    case 'good':
      return 'primary'
    case 'fair':
      return 'warning'
    case 'poor':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'excellent':
      return '优秀'
    case 'good':
      return '良好'
    case 'fair':
      return '一般'
    case 'poor':
      return '较差'
    default:
      return '未知'
  }
}

// 计算标准件列表
const getPartsList = computed(() => {
  if (!evaluationResult.value || !evaluationResult.value.details.parts) {
    return []
  }
  
  const parts: any[] = []
  Object.keys(evaluationResult.value.details.parts.byCategory).forEach(category => {
    evaluationResult.value.details.parts.byCategory[category].forEach((part: any) => {
      parts.push(part)
    })
  })
  return parts
})
</script>

<style scoped>
.evaluation {
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

.evaluation-result {
  margin-top: 20px;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.score {
  font-size: 36px;
  font-weight: bold;
  margin-top: 10px;
}

.recommendation-item {
  color: #67c23a;
}

.issue-item {
  color: #f56c6c;
}

.cost-summary {
  display: flex;
  align-items: center;
}
</style>