<template>
  <div class="dashboard">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>仪表盘</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
            <el-menu-item index="dashboard">仪表盘</el-menu-item>
            <el-menu-item index="library">资料库管理</el-menu-item>
            <el-menu-item index="evaluation">评估引擎</el-menu-item>
            <el-menu-item index="report">报告生成</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <template #header>
                <div class="card-header">
                  <span>已导入资料</span>
                </div>
              </template>
              <div class="stat-content">
                <el-icon class="stat-icon"><Document /></el-icon>
                <div class="stat-value">{{ docCount }}</div>
                <div class="stat-desc">份资料</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <template #header>
                <div class="card-header">
                  <span>标准件数量</span>
                </div>
              </template>
              <div class="stat-content">
                <el-icon class="stat-icon"><Operation /></el-icon>
                <div class="stat-value">{{ partCount }}</div>
                <div class="stat-desc">个标准件</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <template #header>
                <div class="card-header">
                  <span>评估报告</span>
                </div>
              </template>
              <div class="stat-content">
                <el-icon class="stat-icon"><Reading /></el-icon>
                <div class="stat-value">{{ reportCount }}</div>
                <div class="stat-desc">份报告</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <template #header>
                <div class="card-header">
                  <span>机型库</span>
                </div>
              </template>
              <div class="stat-content">
                <el-icon class="stat-icon"><DataAnalysis /></el-icon>
                <div class="stat-value">{{ libraryCount }}</div>
                <div class="stat-desc">个机型库</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-card class="process-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>工作流程状态</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="已完成" type="success" placement="top">
              协议资料导入
            </el-timeline-item>
            <el-timeline-item timestamp="进行中" type="primary" placement="top">
              资料库维护
            </el-timeline-item>
            <el-timeline-item timestamp="待开始" type="warning" placement="top">
              评估匹配
            </el-timeline-item>
            <el-timeline-item timestamp="待开始" type="info" placement="top">
              报告输出
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Operation, Reading, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()
const activeIndex = ref('dashboard')

// 模拟数据
const docCount = ref(12)
const partCount = ref(56)
const reportCount = ref(3)
const libraryCount = ref(5)

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
</script>

<style scoped>
.dashboard {
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

.stat-card {
  height: 200px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.stat-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409EFF;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-desc {
  color: #606266;
}

.process-card {
  margin-top: 20px;
}
</style>
