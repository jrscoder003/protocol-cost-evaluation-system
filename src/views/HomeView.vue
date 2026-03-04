<template>
  <div class="home">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>协议评估成本核算系统</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
            <el-menu-item index="dashboard">仪表盘</el-menu-item>
            <el-menu-item index="library">资料库管理</el-menu-item>
            <el-menu-item index="evaluation">评估引擎</el-menu-item>
            <el-menu-item index="report">报告生成</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <el-card class="welcome-card">
          <template #header>
            <div class="card-header">
              <span>欢迎使用协议评估成本核算系统</span>
            </div>
          </template>
          <div class="welcome-content">
            <p>本系统用于自动化设备客户协议评估与成本核算，支持视觉方案评估优先。</p>
            <el-row :gutter="20" class="feature-row">
              <el-col :span="6">
                <el-card class="feature-card">
                  <el-icon><Document /></el-icon>
                  <h3>资料库管理</h3>
                  <p>导入、解析和管理各类协议资料</p>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="feature-card">
                  <el-icon><DataAnalysis /></el-icon>
                  <h3>评估引擎</h3>
                  <p>基于规则的智能评估系统</p>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="feature-card">
                  <el-icon><Operation /></el-icon>
                  <h3>标准件管理</h3>
                  <p>维护和管理标准件库</p>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="feature-card">
                  <el-icon><Reading /></el-icon>
                  <h3>报告生成</h3>
                  <p>自动生成评估报告和成本核算</p>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Document, DataAnalysis, Operation, Reading } from '@element-plus/icons-vue'

const router = useRouter()
const activeIndex = ref('1')

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
.home {
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

.welcome-card {
  margin-top: 20px;
}

.welcome-content p {
  margin-bottom: 30px;
  font-size: 16px;
}

.feature-row {
  margin-top: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-card .el-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #409EFF;
}

.feature-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.feature-card p {
  margin: 0;
  color: #606266;
}
</style>
