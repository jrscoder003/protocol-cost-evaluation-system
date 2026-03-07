<template>
  <div class="library">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>资料库管理</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
            <el-menu-item index="dashboard">仪表盘</el-menu-item>
            <el-menu-item index="library">资料库管理</el-menu-item>
            <el-menu-item index="evaluation">评估引擎</el-menu-item>
            <el-menu-item index="report">报告生成</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main>
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="协议资料" name="agreement">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>协议资料导入</span>
                </div>
              </template>
              <el-form :model="agreementForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="10">
                    <el-form-item label="机型">
                      <div style="display: flex; gap: 8px;">
                        <el-select v-model="agreementForm.machineType" placeholder="选择机型" filterable allow-create style="flex: 1; min-width: 200px;">
                          <el-option
                            v-for="machine in machineTypes"
                            :key="machine"
                            :label="machine"
                            :value="machine"
                          />
                        </el-select>
                        <el-button type="primary" size="small" @click="createMachineType">新建</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="10">
                    <el-form-item label="工位">
                      <el-select v-model="agreementForm.stations" placeholder="选择工位" multiple filterable allow-create style="width: 100%; min-width: 200px;">
                        <el-option
                          v-for="station in stationList"
                          :key="station"
                          :label="station"
                          :value="station"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" style="display: flex; align-items: flex-end;">
                    <el-button type="primary" @click="searchAgreements" style="margin-bottom: 20px;">
                      查询
                    </el-button>
                  </el-col>
                </el-row>
              </el-form>
              <el-upload
                class="upload-demo"
                :auto-upload="false"
                :on-change="handleAgreementFileChange"
                multiple
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>
                  选择文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持上传 PDF、Word、Excel 格式文件
                  </div>
                </template>
              </el-upload>
              <el-button type="success" @click="uploadAgreementFiles" style="margin-top: 10px;" :loading="loading.agreement">
                开始上传
              </el-button>
              <el-table :data="agreementList" style="margin-top: 20px;">
                <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                <el-table-column prop="machine_type" label="机型"></el-table-column>
                <el-table-column prop="stations" label="工位"></el-table-column>
                <el-table-column prop="uploaded_at" label="上传时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="viewAgreement(scope.row)">
                      查看
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteAgreement(scope.row.id)">
                      删除
                    </el-button>
                    <el-button size="small" @click="previewAgreementInfo(scope.row)">
                      预览关键信息
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 关键信息预览 -->
              <el-card v-if="showKeyInfoPreview" style="margin-top: 20px;">
                <template #header>
                  <div class="card-header">
                    <span>关键信息预览</span>
                  </div>
                </template>
                <el-table :data="keyInfoList" style="margin-top: 10px;">
                  <el-table-column prop="id" label="序号" width="80"></el-table-column>
                  <el-table-column prop="name" label="名称" width="120"></el-table-column>
                  <el-table-column prop="description" label="说明"></el-table-column>
                  <el-table-column prop="relatedContent" label="协议内关联内容" width="300">
                    <template #default="scope">
                      <div v-if="scope.row.relatedContent">
                        <!-- 文本内容 -->
                        <div v-if="scope.row.relatedContent.text" class="related-text">
                          {{ scope.row.relatedContent.text }}
                        </div>
                        <!-- 图片内容 -->
                        <div v-if="scope.row.relatedContent.images && scope.row.relatedContent.images.length > 0" class="related-images">
                          <div v-for="(image, index) in scope.row.relatedContent.images" :key="index" style="margin-top: 10px;">
                            <img 
                              :src="image" 
                              alt="图片" 
                              style="width: 100px; height: 100px; object-fit: cover;"
                              @click="previewImage(scope.row.relatedContent.images, index)"
                              class="cursor-pointer"
                            />
                          </div>
                        </div>
                        <!-- 截图内容 -->
                        <div v-if="scope.row.relatedContent.screenshots && scope.row.relatedContent.screenshots.length > 0" class="related-screenshots">
                          <div v-for="(screenshot, index) in scope.row.relatedContent.screenshots" :key="index" style="margin-top: 10px;">
                            <img 
                              :src="screenshot" 
                              alt="截图" 
                              style="width: 150px; height: 100px; object-fit: cover;"
                              @click="previewImage(scope.row.relatedContent.screenshots, index)"
                              class="cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <div v-else>无关联内容</div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="protocolReading" label="协议解读" width="260">
                    <template #default="scope">
                      <div class="protocol-reading-cell">
                        <div>{{ scope.row.protocolReading || '无相关信息' }}</div>
                        <el-tag
                          v-if="scope.row.protocolReadingSourceLabel"
                          size="small"
                          :type="scope.row.protocolReadingSource === 'fallback' ? 'warning' : 'success'"
                          style="margin-top: 6px;"
                        >
                          {{ scope.row.protocolReadingSourceLabel }}
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="indexKeywords" label="索引关键词" width="200"></el-table-column>
                </el-table>
                <el-button type="primary" @click="exportKeyInfo" style="margin-top: 10px;">
                  导出关键信息
                </el-button>
              </el-card>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="视觉方案" name="vision">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>视觉方案报告导入</span>
                </div>
              </template>
              <el-form :model="visionForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="机型">
                      <el-select v-model="visionForm.machineType" placeholder="选择机型" filterable allow-create>
                        <el-option
                          v-for="machine in machineTypes"
                          :key="machine"
                          :label="machine"
                          :value="machine"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="工位">
                      <el-select v-model="visionForm.stations" placeholder="选择工位" multiple filterable allow-create>
                        <el-option
                          v-for="station in stationList"
                          :key="station"
                          :label="station"
                          :value="station"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" style="display: flex; align-items: flex-end;">
                    <el-button type="primary" @click="searchVisionReports" style="margin-bottom: 20px;">
                      查询
                    </el-button>
                  </el-col>
                </el-row>
              </el-form>
              <el-upload
                class="upload-demo"
                :auto-upload="false"
                :on-change="handleVisionFileChange"
                multiple
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>
                  选择文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持上传 PDF、Word、Excel 格式文件
                  </div>
                </template>
              </el-upload>
              <el-button type="success" @click="uploadVisionFiles" style="margin-top: 10px;" :loading="loading.vision">
                开始上传
              </el-button>
              <el-table :data="visionList" style="margin-top: 20px;">
                <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                <el-table-column prop="machine_type" label="机型"></el-table-column>
                <el-table-column prop="stations" label="工位"></el-table-column>
                <el-table-column prop="uploaded_at" label="上传时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="viewVision(scope.row)">
                      查看
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteVision(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="成本表" name="cost">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>成本预估表导入</span>
                </div>
              </template>
              <el-form :model="costForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="机型">
                      <el-select v-model="costForm.machineType" placeholder="选择机型" filterable allow-create>
                        <el-option
                          v-for="machine in machineTypes"
                          :key="machine"
                          :label="machine"
                          :value="machine"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="总成本">
                      <el-input v-model.number="costForm.totalCost" type="number"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" style="display: flex; align-items: flex-end;">
                    <el-button type="primary" @click="searchCostTables" style="margin-bottom: 20px;">
                      查询
                    </el-button>
                  </el-col>
                </el-row>
              </el-form>
              <el-upload
                class="upload-demo"
                :auto-upload="false"
                :on-change="handleCostFileChange"
                multiple
              >
                <el-button type="primary">
                  <el-icon><Upload /></el-icon>
                  选择文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持上传 Excel、CSV 格式文件
                  </div>
                </template>
              </el-upload>
              <el-button type="success" @click="uploadCostFiles" style="margin-top: 10px;" :loading="loading.cost">
                开始上传
              </el-button>
              <el-table :data="costList" style="margin-top: 20px;">
                <el-table-column prop="name" label="文件名" width="300"></el-table-column>
                <el-table-column prop="machine_type" label="机型"></el-table-column>
                <el-table-column prop="total_cost" label="总成本"></el-table-column>
                <el-table-column prop="uploaded_at" label="上传时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="viewCost(scope.row)">
                      查看
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteCost(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="标准件" name="parts">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>标准件管理</span>
                </div>
              </template>
              <el-form :model="partForm" label-width="80px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="类别">
                      <el-input v-model="partForm.category"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="名称">
                      <el-input v-model="partForm.name"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="型号">
                      <el-input v-model="partForm.model"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="品牌">
                      <el-input v-model="partForm.brand"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="单价">
                      <el-input v-model.number="partForm.price" type="number"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="精度(um)">
                      <el-input v-model.number="partForm.specPrecisionUm" type="number"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="交期(天)">
                      <el-input v-model.number="partForm.leadTimeDays" type="number"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="addPart" :loading="loading.part">添加</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <el-table :data="partsList" style="margin-top: 20px;">
                <el-table-column prop="category" label="类别"></el-table-column>
                <el-table-column prop="name" label="名称"></el-table-column>
                <el-table-column prop="model" label="型号"></el-table-column>
                <el-table-column prop="brand" label="品牌"></el-table-column>
                <el-table-column prop="price" label="单价"></el-table-column>
                <el-table-column prop="spec_precision_um" label="精度(um)"></el-table-column>
                <el-table-column prop="lead_time_days" label="交期(天)"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="editPart(scope.row)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deletePart(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="机型库" name="machine">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>机型库管理</span>
                </div>
              </template>
              <el-form :model="machineForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="机型库名称">
                      <el-input v-model="machineForm.name"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="createMachineLibrary" :loading="loading.machine">创建机型库</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <el-table :data="machineList" style="margin-top: 20px;">
                <el-table-column prop="name" label="机型库名称" width="300"></el-table-column>
                <el-table-column prop="created_at" label="创建时间"></el-table-column>
                <el-table-column prop="updated_at" label="更新时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="loadMachineLibrary(scope.row.id)">
                      加载
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteMachineLibrary(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="关键词索引" name="keyword">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>关键词索引/信息维护</span>
                </div>
              </template>
              <el-alert title="推荐小白模板列：机型、工位、解析关键项、关键词引词、关联项、项目实际解析的内容简介（备注）" type="info" :closable="false" style="margin-bottom: 12px;" />
              <el-upload
                :auto-upload="false"
                :limit="1"
                :on-change="handleKeywordImportFileChange"
                style="margin-bottom: 12px;"
              >
                <el-button type="primary" plain>选择关键词导入表格</el-button>
              </el-upload>
              <div style="margin-bottom: 16px; display: flex; gap: 8px;">
                <el-button type="success" @click="importKeywordFile" :loading="loading.keyword">导入表格</el-button>
                <el-button @click="showDownloadDefault">下载导入模板</el-button>
                <el-button type="warning" plain @click="seedDefaultKeywords" :loading="loading.keyword">一键生成默认关键词</el-button>
              </div>
              <el-form :model="keywordForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="关键词">
                      <el-input v-model="keywordForm.keyword"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="同义词">
                      <el-input v-model="keywordForm.synonyms" placeholder="逗号分隔"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="类型">
                      <el-select v-model="keywordForm.type">
                        <el-option label="协议" value="agreement"></el-option>
                        <el-option label="视觉方案" value="vision"></el-option>
                        <el-option label="成本表" value="cost"></el-option>
                        <el-option label="通用" value="all"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="关键项">
                      <el-select v-model="keywordForm.keySection" clearable>
                        <el-option label="产品尺寸" value="productSize" />
                        <el-option label="PPM" value="ppm" />
                        <el-option label="检测要求" value="inspectionRequirements" />
                        <el-option label="检测对象规格" value="inspectionObjectSpecs" />
                        <el-option label="检测精度" value="inspectionPrecision" />
                        <el-option label="工位要求" value="stationRequirements" />
                        <el-option label="品牌要求" value="brandRequirements" />
                        <el-option label="工控机要求" value="industrialComputerRequirements" />
                        <el-option label="软件要求" value="softwareRequirements" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="权重">
                      <el-input v-model.number="keywordForm.weight" type="number"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="备注">
                      <el-input v-model="keywordForm.remark"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="启用">
                      <el-switch v-model="keywordForm.enabled"></el-switch>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="addKeyword" :loading="loading.keyword">添加/更新</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <div style="margin-bottom: 15px;">
                <el-button type="success" @click="downloadKeywordLibrary">
                  📥 下载当前关键词库
                </el-button>
                <el-button type="info" @click="showDownloadDefault">
                  📋 下载导入模板
                </el-button>
              </div>
              <el-table :data="keywordList" style="margin-top: 20px;">
                <el-table-column prop="keyword" label="关键词" width="150"></el-table-column>
                <el-table-column prop="synonyms" label="同义词" width="200"></el-table-column>
                <el-table-column prop="type" label="类型" width="100"></el-table-column>
                <el-table-column label="关键项" width="150">
                  <template #default="scope">{{ toKeySectionLabel(scope.row.key_section) }}</template>
                </el-table-column>
                <el-table-column label="绑定范围" width="200">
                  <template #default="scope">
                    <span style="font-size: 12px; color: #666;">
                      {{ getBindingDisplayText(scope.row.id, scope.row.key_section) || 'ALL/ALL/关键项跟随关键词（默认）' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="weight" label="权重" width="70"></el-table-column>
                <el-table-column prop="enabled" label="启用" width="70">
                  <template #default="scope">{{ Number(scope.row.enabled) === 1 ? '是' : '否' }}</template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="160"></el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button size="small" @click="editKeyword(scope.row)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteKeyword(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-divider content-position="left">映射缩影（按导出模板展示）</el-divider>
              <el-table :data="keywordMappingPreviewRows" style="margin-top: 12px;" max-height="320">
                <el-table-column prop="machineType" label="机型" min-width="180" />
                <el-table-column prop="station" label="工位" min-width="150" />
                <el-table-column prop="keySectionLabel" label="解析关键项" min-width="120" />
                <el-table-column prop="keywordWithSynonyms" label="关键词引词" min-width="220" />
                <el-table-column prop="relatedItems" label="关联项" min-width="140" />
                <el-table-column prop="remarkText" label="项目实际解析的内容简介（备注）" min-width="320" show-overflow-tooltip />
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="关联绑定" name="binding">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>关联绑定维护</span>
                </div>
              </template>
              <el-form :model="bindingForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="关键词">
                      <el-select v-model="bindingForm.keywordId" filterable>
                        <el-option
                          v-for="item in keywordList"
                          :key="item.id"
                          :label="`${item.keyword} (${item.type})`"
                          :value="String(item.id)"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="机型">
                      <el-input v-model="bindingForm.machineType"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="工位">
                      <el-input v-model="bindingForm.station"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="关键项">
                      <el-select v-model="bindingForm.keySection" clearable>
                        <el-option label="产品尺寸" value="productSize" />
                        <el-option label="PPM" value="ppm" />
                        <el-option label="检测要求" value="inspectionRequirements" />
                        <el-option label="检测对象规格" value="inspectionObjectSpecs" />
                        <el-option label="检测精度" value="inspectionPrecision" />
                        <el-option label="工位要求" value="stationRequirements" />
                        <el-option label="品牌要求" value="brandRequirements" />
                        <el-option label="工控机要求" value="industrialComputerRequirements" />
                        <el-option label="软件要求" value="softwareRequirements" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="addBinding" :loading="loading.binding">添加</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <el-table :data="bindingList" style="margin-top: 20px;">
                <el-table-column prop="keyword_name" label="关键词" width="180"></el-table-column>
                <el-table-column prop="machine_type" label="机型"></el-table-column>
                <el-table-column prop="station" label="工位"></el-table-column>
                <el-table-column prop="key_section" label="关键项"></el-table-column>
                <el-table-column prop="priority" label="优先级" width="90"></el-table-column>
                <el-table-column prop="created_at" label="创建时间"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="editBinding(scope.row)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteBinding(scope.row.id)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          <el-tab-pane label="视觉信息" name="vision-info">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>协议视觉相关信息表</span>
                </div>
              </template>
              <el-form :model="visionInfoForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="协议ID">
                      <el-input v-model="visionInfoForm.agreementId"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="loadVisionInfo" :loading="loading.visionInfo">加载信息</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <el-table :data="visionInfoList" style="margin-top: 20px;">
                <el-table-column prop="station" label="工位"></el-table-column>
                <el-table-column prop="camera_type" label="相机类型"></el-table-column>
                <el-table-column prop="lens_type" label="镜头类型"></el-table-column>
                <el-table-column prop="light_type" label="光源类型"></el-table-column>
                <el-table-column prop="precision" label="精度"></el-table-column>
                <el-table-column prop="field_of_view" label="视野"></el-table-column>
                <el-table-column label="操作">
                  <template #default="scope">
                    <el-button size="small" @click="editVisionInfo(scope.row)">
                      编辑
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
    
    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="showImagePreview"
      title="图片预览"
      width="80%"
    >
      <el-image-viewer
        :url-list="previewImages"
        :initial-index="previewIndex"
        @close="showImagePreview = false"
      />
    </el-dialog>
    
    <!-- 文件全文阅览对话框 -->
    <el-dialog
      v-model="showFileViewer"
      :title="`文件阅览 - ${currentFile?.name || ''}`"
      width="90%"
      height="80vh"
    >
      <div style="height: 70vh; overflow-y: auto; padding: 20px;">
        <el-loading v-if="loading.view" fullscreen text="加载中..." />
        <div v-else>
          <h3>{{ currentFile?.name }}</h3>
          <p><strong>机型:</strong> {{ currentFile?.machine_type }}</p>
          <p><strong>工位:</strong> {{ currentFile?.stations }}</p>
          <p><strong>上传时间:</strong> {{ currentFile?.uploaded_at }}</p>
          <hr>
          
          <!-- 标签页切换 -->
          <el-tabs v-model="fileViewerTab" style="margin-bottom: 20px;">
            <el-tab-pane label="全文内容" name="fullText">
              <div v-if="currentFile?.full_text" style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 15px; border-radius: 4px; max-height: 50vh; overflow-y: auto;">
                {{ currentFile.full_text }}
              </div>
              <div v-else-if="currentFile?.extracted_info?.fullText" style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 15px; border-radius: 4px; max-height: 50vh; overflow-y: auto;">
                {{ currentFile.extracted_info.fullText }}
              </div>
              <div v-else>
                <p>暂无全文内容</p>
              </div>
            </el-tab-pane>
            <el-tab-pane label="提取信息" name="extractedInfo">
              <div v-if="currentFile?.extracted_info">
                <div v-if="currentFile.extracted_info.fullText" style="margin-bottom: 20px;">
                  <h5>摘要预览:</h5>
                  <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 15px; border-radius: 4px;">
                    {{ currentFile.extracted_info.fullText }}
                  </div>
                </div>
                <div v-if="currentFile.extracted_info.keySections" style="margin-top: 20px;">
                  <h5>关键章节:</h5>
                  <div v-if="currentFile.extracted_info.keySections.productSize" class="key-section">
                    <h6>产品尺寸:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.productSize }}
                    </div>
                  </div>
                  <div v-if="currentFile.extracted_info.keySections.ppm" class="key-section">
                    <h6>PPM/节拍:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.ppm }}
                    </div>
                  </div>
                  <div v-if="currentFile.extracted_info.keySections.inspectionRequirements" class="key-section">
                    <h6>检测要求:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.inspectionRequirements }}
                    </div>
                  </div>
                  <div v-if="currentFile.extracted_info.keySections.inspectionPrecision" class="key-section">
                    <h6>检测精度:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.inspectionPrecision }}
                    </div>
                  </div>
                  <div v-if="currentFile.extracted_info.keySections.stationRequirements" class="key-section">
                    <h6>工位要求:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.stationRequirements }}
                    </div>
                  </div>
                  <div v-if="currentFile.extracted_info.keySections.brandRequirements" class="key-section">
                    <h6>品牌要求:</h6>
                    <div style="white-space: pre-wrap; word-break: break-all; background-color: #f5f7fa; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      {{ currentFile.extracted_info.keySections.brandRequirements }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else>
                <p>暂无提取信息</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, Loading } from '@element-plus/icons-vue'
import { ElImageViewer } from 'element-plus'
import { agreementAPI, visionReportAPI, costTableAPI, partAPI, machineLibraryAPI, keywordAPI } from '../services/api'

const router = useRouter()
const activeIndex = ref('library')
const activeTab = ref('agreement')

// 加载状态
const loading = ref({
  agreement: false,
  vision: false,
  cost: false,
  part: false,
  machine: false,
  keyword: false,
  binding: false,
  visionInfo: false,
  view: false
})

// 上传文件
const agreementFiles = ref<File[]>([])
const visionFiles = ref<File[]>([])
const costFiles = ref<File[]>([])
const keywordImportFile = ref<File | null>(null)

// 表单数据
const agreementForm = ref({
  machineType: '',
  stations: []
})

const visionForm = ref({
  machineType: '',
  stations: []
})

const costForm = ref({
  machineType: '',
  totalCost: 0
})

const partForm = ref({
  category: '',
  name: '',
  model: '',
  brand: '',
  price: 0,
  specPrecisionUm: 0,
  leadTimeDays: 0
})

const machineForm = ref({
  name: ''
})

// 关键词索引表单
const keywordForm = ref({
  keyword: '',
  synonyms: '',
  type: 'agreement',
  keySection: '',
  weight: 1,
  enabled: true,
  remark: ''
})

// 关联绑定表单
const bindingForm = ref({
  keywordId: '',
  machineType: '',
  station: '',
  keySection: '',
  priority: 1
})

// 视觉信息表单
const visionInfoForm = ref({
  agreementId: ''
})

// 数据列表
const agreementList = ref<any[]>([])
const visionList = ref<any[]>([])
const costList = ref<any[]>([])
const partsList = ref<any[]>([])
const machineList = ref<any[]>([])
const keywordList = ref<any[]>([])
const bindingList = ref<any[]>([])
const visionInfoList = ref<any[]>([])
const keyInfoList = ref<any[]>([])
const editingKeywordId = ref<number | null>(null)

// 机型和工位列表
const machineTypes = ref<string[]>([])
const stationList = ref<string[]>([])

// 关键信息预览状态
const showKeyInfoPreview = ref(false)
const currentAgreement = ref<any>(null)

const KEY_INFO_SECTIONS = [
  {
    id: 1,
    name: '产品尺寸',
    keySection: 'productSize',
    description: '产品或来料尺寸边界是否明确（如极片/极耳/极组尺寸、视野范围与公差）。',
    indexKeywords: '产品尺寸,极片尺寸,极耳尺寸,视野'
  },
  {
    id: 2,
    name: 'PPM',
    keySection: 'ppm',
    description: '产线节拍、拍照频率、UPH/PPM 是否定义，是否存在工位独立节拍。',
    indexKeywords: 'PPM,节拍,拍照频率,UPH'
  },
  {
    id: 3,
    name: '检测要求',
    keySection: 'inspectionRequirements',
    description: '每工位检测项目、判定标准、漏检/过杀/GRR 等质量指标是否清晰。',
    indexKeywords: '检测内容,检测项目,判定标准,过杀,漏检,GRR'
  },
  {
    id: 4,
    name: '检测对象规格',
    keySection: 'inspectionObjectSpecs',
    description: '每工位需检测对象及尺寸/颜色/间距等规格是否给出完整边界。',
    indexKeywords: '检测对象,对象规格,极耳尺寸,胶纸间距'
  },
  {
    id: 5,
    name: '检测精度',
    keySection: 'inspectionPrecision',
    description: '检测精度、像元精度、分辨率与视野对应关系是否明确。',
    indexKeywords: '检测精度,重复精度,像元精度,分辨率'
  },
  {
    id: 6,
    name: '工位要求',
    keySection: 'stationRequirements',
    description: '工位数量、单/双工位配置、每工位相机数量及前后段布局是否明确。',
    indexKeywords: '工位要求,工艺流程,工位配置,相机数量'
  },
  {
    id: 7,
    name: '品牌要求',
    keySection: 'brandRequirements',
    description: '相机/镜头/光源等品牌是否限定，是否允许替代及替代边界。',
    indexKeywords: '品牌要求,相机品牌,镜头品牌,光源品牌'
  },
  {
    id: 8,
    name: '工控机要求',
    keySection: 'industrialComputerRequirements',
    description: 'CPU、内存、网口、存储天数、接口预留等工控机性能要求是否完整。',
    indexKeywords: '工控机,CPU,内存,端口,存储天数'
  },
  {
    id: 9,
    name: '软件要求',
    keySection: 'softwareRequirements',
    description: '软件基础能力（权限、追溯、导出、报警、MES 对接）是否明确。',
    indexKeywords: '软件要求,权限,追溯,导出,报警,MES'
  }
]

const buildKeyInfoList = (extractedInfo: any) => {
  const sections = extractedInfo?.keySections || {}
  return KEY_INFO_SECTIONS.map((config) => {
    const sectionText = String(sections[config.keySection] || '').trim()
    const initialText = sectionText || '无相关信息'

    return {
      id: config.id,
      name: config.name,
      description: config.description,
      protocolReading: initialText,
      protocolReadingSource: sectionText ? 'text-hit' : 'none',
      protocolReadingSourceLabel: sectionText ? '文本命中' : '',
      indexKeywords: config.indexKeywords,
      relatedContent: {
        text: initialText,
        images: [],
        screenshots: []
      }
    }
  })
}

const stripEmptyPlaceholder = (text: string) => {
  const value = String(text || '').trim()
  if (!value || value === '无相关信息') return ''
  return value
}

// 生命周期
onMounted(async () => {
  await loadMachineLibraries()
  await loadParts()
  // 加载所有数据来提取机型和工位列表
  await loadAgreements()
  await loadVisionReports()
  await loadCostTables()
  // 提取机型和工位列表
  await loadMachineTypes()
  await loadStations()
  // 清空文件列表，等待用户查询
  agreementList.value = []
  visionList.value = []
  costList.value = []
})

// 标签切换
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  switch (tab) {
    case 'agreement':
      // 清空协议资料列表，等待用户查询
      agreementList.value = []
      break
    case 'vision':
      // 清空视觉方案列表，等待用户查询
      visionList.value = []
      break
    case 'cost':
      // 清空成本表列表，等待用户查询
      costList.value = []
      break
    case 'parts':
      loadParts()
      break
    case 'machine':
      loadMachineLibraries()
      break
    case 'keyword':
      loadKeywords()
      loadBindings()
      break
    case 'binding':
      loadBindings()
      break
    case 'vision-info':
      loadVisionInfoList()
      break
  }
}

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

// 文件选择处理
const handleAgreementFileChange = (file: any) => {
  agreementFiles.value.push(file.raw)
}

const handleVisionFileChange = (file: any) => {
  visionFiles.value.push(file.raw)
}

const handleCostFileChange = (file: any) => {
  costFiles.value.push(file.raw)
}





// 上传成本表
const uploadCostFiles = async () => {
  if (costFiles.value.length === 0) {
    alert('请选择文件')
    return
  }
  
  const formData = new FormData()
  costFiles.value.forEach(file => formData.append('files', file))
  formData.append('machineType', costForm.value.machineType)
  formData.append('totalCost', costForm.value.totalCost.toString())
  
  loading.value.cost = true
  try {
    await costTableAPI.upload(formData)
    alert('上传成功')
    costFiles.value = []
    costForm.value = { machineType: '', totalCost: 0 }
    await loadCostTables()
    await loadMachineTypes()
  } catch (error) {
    alert('上传失败')
    console.error(error)
  } finally {
    loading.value.cost = false
  }
}

// 查询协议资料
const searchAgreements = async () => {
  await loadAgreements()
  // 根据机型和工位进行过滤
  if (agreementForm.value.machineType) {
    agreementList.value = agreementList.value.filter(item => 
      item.machine_type === agreementForm.value.machineType
    )
  }
  if (agreementForm.value.stations && Array.isArray(agreementForm.value.stations) && agreementForm.value.stations.length > 0) {
    const stations = agreementForm.value.stations
    agreementList.value = agreementList.value.filter(item => {
      if (!item.stations) return false
      const itemStations = item.stations.split(',').map(s => s.trim())
      return stations.some(station => itemStations.includes(station))
    })
  }
}

// 查询视觉方案
const searchVisionReports = async () => {
  await loadVisionReports()
  // 根据机型和工位进行过滤
  if (visionForm.value.machineType) {
    visionList.value = visionList.value.filter(item => 
      item.machine_type === visionForm.value.machineType
    )
  }
  if (visionForm.value.stations && Array.isArray(visionForm.value.stations) && visionForm.value.stations.length > 0) {
    const stations = visionForm.value.stations
    visionList.value = visionList.value.filter(item => {
      if (!item.stations) return false
      const itemStations = item.stations.split(',').map(s => s.trim())
      return stations.some(station => itemStations.includes(station))
    })
  }
}

// 查询成本表
const searchCostTables = async () => {
  await loadCostTables()
  // 根据机型进行过滤
  if (costForm.value.machineType) {
    costList.value = costList.value.filter(item => 
      item.machine_type === costForm.value.machineType
    )
  }
}

// 添加标准件
const addPart = async () => {
  loading.value.part = true
  try {
    await partAPI.create(partForm.value)
    alert('添加成功')
    partForm.value = {
      category: '',
      name: '',
      model: '',
      brand: '',
      price: 0,
      specPrecisionUm: 0,
      leadTimeDays: 0
    }
    await loadParts()
  } catch (error) {
    alert('添加失败')
    console.error(error)
  } finally {
    loading.value.part = false
  }
}

// 创建机型库
const createMachineLibrary = async () => {
  if (!machineForm.value.name) {
    alert('请输入机型库名称')
    return
  }
  
  loading.value.machine = true
  try {
    await machineLibraryAPI.create(machineForm.value.name)
    alert('创建成功')
    machineForm.value.name = ''
    await loadMachineLibraries()
  } catch (error) {
    alert('创建失败')
    console.error(error)
  } finally {
    loading.value.machine = false
  }
}

// 加载数据
const loadAgreements = async () => {
  try {
    const response = await agreementAPI.getList()
    console.log('加载协议资料成功，响应:', response)
    agreementList.value = response.data.items.map((item: any) => {
      // 兼容 extracted_info 可能是字符串或对象，统一转为对象
      item.extracted_info = normalizeExtractedInfo(item.extracted_info)
      console.log('协议资料项:', item)
      return item
    })
  } catch (error) {
    console.error('加载协议资料失败:', error)
  }
}

const loadVisionReports = async () => {
  try {
    const response = await visionReportAPI.getList()
    visionList.value = response.data.items
  } catch (error) {
    console.error('加载视觉方案失败:', error)
  }
}

const loadCostTables = async () => {
  try {
    const response = await costTableAPI.getList()
    costList.value = response.data.items
  } catch (error) {
    console.error('加载成本表失败:', error)
  }
}

const loadParts = async () => {
  try {
    const response = await partAPI.getList()
    partsList.value = response.data.items
  } catch (error) {
    console.error('加载标准件失败:', error)
  }
}

const loadMachineLibraries = async () => {
  try {
    const response = await machineLibraryAPI.getList()
    machineList.value = response.data.items
  } catch (error) {
    console.error('加载机型库失败:', error)
  }
}

// 查看和删除操作
// 查看文件全文
const showFileViewer = ref(false)
const currentFile = ref<any>(null)
const fileViewerTab = ref('fullText')

const resolveArchiveUrl = (archiveUrl: string) => {
  const raw = String(archiveUrl || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  const backendOrigin =
    (import.meta as any)?.env?.VITE_BACKEND_ORIGIN ||
    (window.location.port === '3004'
      ? `${window.location.protocol}//${window.location.hostname}:3006`
      : window.location.origin)

  return `${backendOrigin}${normalized}`
}

const viewAgreement = (row: any) => {
  if (row?.archive_url) {
    const openUrl = resolveArchiveUrl(row.archive_url)
    if (openUrl) {
      window.open(openUrl, '_blank')
      return
    }
  }
  if (row?.archive_url) {
    alert('归档链接为空，已切换到文本预览模式')
  }
  currentFile.value = row
  showFileViewer.value = true
}

const deleteAgreement = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await agreementAPI.delete(id)
      alert('删除成功')
      await loadAgreements()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

const viewVision = (row: any) => {
  console.log('View vision:', row)
}

const deleteVision = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await visionReportAPI.delete(id)
      alert('删除成功')
      await loadVisionReports()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

const viewCost = (row: any) => {
  console.log('View cost:', row)
}

const deleteCost = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await costTableAPI.delete(id)
      alert('删除成功')
      await loadCostTables()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

const editPart = (row: any) => {
  console.log('Edit part:', row)
}

const deletePart = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await partAPI.delete(id)
      alert('删除成功')
      await loadParts()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

const loadMachineLibrary = (id: number) => {
  console.log('Load machine library:', id)
}

const deleteMachineLibrary = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await machineLibraryAPI.delete(id)
      alert('删除成功')
      await loadMachineLibraries()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

// 关键词索引相关方法
const KEY_SECTION_LABEL_MAP: Record<string, string> = {
  productSize: '产品尺寸',
  ppm: 'PPM',
  inspectionRequirements: '检测要求',
  inspectionObjectSpecs: '检测对象规格',
  inspectionPrecision: '检测精度',
  stationRequirements: '工位要求',
  brandRequirements: '品牌要求',
  industrialComputerRequirements: '工控机要求',
  softwareRequirements: '软件要求'
}

const toKeySectionLabel = (section: string) => {
  const key = String(section || '').trim()
  return KEY_SECTION_LABEL_MAP[key] || key || ''
}

const extractRelatedItems = (remark: string) => {
  const match = String(remark || '').match(/关联项[:：]\s*([^；;\n]+)/)
  return match?.[1]?.trim() || ''
}

const stripRelatedHint = (remark: string) => {
  return String(remark || '')
    .split(/[；;]/g)
    .map((item) => String(item || '').trim())
    .filter((item) => item && !/^关联项[:：]/.test(item))
    .join('；')
}

const getBindingDisplayText = (keywordId: number, defaultKeySection?: string) => {
  const related = bindingList.value.filter((b: any) => Number(b.keyword_id) === Number(keywordId))
  if (related.length === 0) {
    const sectionText = toKeySectionLabel(String(defaultKeySection || '').trim()) || '未指定关键项'
    return `ALL/ALL/${sectionText}`
  }
  const texts = related.map((b: any) => {
    const machine = String(b.machine_type || 'ALL').trim()
    const station = String(b.station || 'ALL').trim()
    const section = toKeySectionLabel(String(b.key_section || defaultKeySection || '').trim()) || '未指定关键项'
    return `${machine}/${station}/${section}`
  })
  return texts.join('; ')
}

const keywordMappingPreviewRows = computed(() => {
  return keywordList.value.flatMap((kw: any) => {
    const related = bindingList.value.filter((b: any) => Number(b.keyword_id) === Number(kw.id))
    const sourceRows = related.length > 0 ? related : [{ machine_type: 'ALL', station: 'ALL', key_section: kw.key_section || '' }]

    return sourceRows.map((binding: any) => ({
      machineType: String(binding.machine_type || 'ALL').trim() || 'ALL',
      station: String(binding.station || 'ALL').trim() || 'ALL',
      keySectionLabel: toKeySectionLabel(String(binding.key_section || kw.key_section || '').trim()),
      keywordWithSynonyms: [kw.keyword, kw.synonyms].filter(Boolean).join('、'),
      relatedItems: extractRelatedItems(String(kw.remark || '')),
      remarkText: stripRelatedHint(String(kw.remark || ''))
    }))
  })
})

const addKeyword = async () => {
  loading.value.keyword = true
  try {
    if (!String(keywordForm.value.keyword || '').trim()) {
      alert('请先输入关键词')
      return
    }
    if (editingKeywordId.value) {
      await keywordAPI.update(editingKeywordId.value, keywordForm.value)
      alert('更新成功')
    } else {
      await keywordAPI.create(keywordForm.value)
      alert('保存成功')
    }
    keywordForm.value = {
      keyword: '',
      synonyms: '',
      type: 'agreement',
      keySection: '',
      weight: 1,
      enabled: true,
      remark: ''
    }
    editingKeywordId.value = null
    await loadKeywords()
  } catch (error) {
    alert('添加失败')
    console.error(error)
  } finally {
    loading.value.keyword = false
  }
}

const loadKeywords = async () => {
  try {
    const response = await keywordAPI.getList()
    keywordList.value = response.data.items || []
  } catch (error) {
    console.error('加载关键词失败:', error)
  }
}

const editKeyword = (row: any) => {
  editingKeywordId.value = Number(row.id)
  keywordForm.value = {
    keyword: String(row.keyword || ''),
    synonyms: String(row.synonyms || ''),
    type: String(row.type || 'agreement'),
    keySection: String(row.key_section || ''),
    weight: Number(row.weight || 1),
    enabled: Number(row.enabled) === 1,
    remark: String(row.remark || '')
  }
}

const deleteKeyword = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await keywordAPI.delete(id)
      alert('删除成功')
      await loadKeywords()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

// 关联绑定相关方法
const addBinding = async () => {
  loading.value.binding = true
  try {
    if (!bindingForm.value.keywordId) {
      alert('请先选择关键词')
      return
    }
    await keywordAPI.createBinding({
      keywordId: Number(bindingForm.value.keywordId),
      machineType: bindingForm.value.machineType,
      station: bindingForm.value.station,
      keySection: bindingForm.value.keySection,
      priority: Number(bindingForm.value.priority || 1)
    })
    alert('添加成功')
    bindingForm.value = { keywordId: '', machineType: '', station: '', keySection: '', priority: 1 }
    await loadBindings()
  } catch (error) {
    alert('添加失败')
    console.error(error)
  } finally {
    loading.value.binding = false
  }
}

const loadBindings = async () => {
  try {
    const response = await keywordAPI.getBindings()
    bindingList.value = response.data.items || []
  } catch (error) {
    console.error('加载关联绑定失败:', error)
  }
}

const editBinding = (row: any) => {
  bindingForm.value = {
    keywordId: String(row.keyword_id || ''),
    machineType: String(row.machine_type || ''),
    station: String(row.station || ''),
    keySection: String(row.key_section || ''),
    priority: Number(row.priority || 1)
  }
}

const deleteBinding = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      await keywordAPI.deleteBinding(id)
      alert('删除成功')
      await loadBindings()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
}

const handleKeywordImportFileChange = (uploadFile: any) => {
  keywordImportFile.value = uploadFile?.raw || null
}

const importKeywordFile = async () => {
  if (!keywordImportFile.value) {
    alert('请先选择导入文件')
    return
  }

  loading.value.keyword = true
  try {
    const formData = new FormData()
    formData.append('file', keywordImportFile.value)
    const response = await keywordAPI.importFile(formData)
    alert(`导入完成：关键词${response.data.insertedOrUpdated || 0}条，绑定${response.data.bindingCreated || 0}条`)
    keywordImportFile.value = null
    await loadKeywords()
    await loadBindings()
  } catch (error: any) {
    alert(`导入失败：${error?.message || error}`)
  } finally {
    loading.value.keyword = false
  }
}

const seedDefaultKeywords = async () => {
  loading.value.keyword = true
  try {
    const response = await keywordAPI.seedDefaults()
    alert(`默认关键词初始化完成：${response.data.seededCount || 0}条`)
    await loadKeywords()
    await loadBindings()
  } catch (error: any) {
    alert(`初始化失败：${error?.message || error}`)
  } finally {
    loading.value.keyword = false
  }
}

const downloadKeywordLibrary = async () => {
  try {
    const response = await keywordAPI.exportLibrary()
    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const disposition = String(response.headers?.['content-disposition'] || '')
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    const plainMatch = disposition.match(/filename=([^;]+)/i)
    const fileName = utf8Match?.[1]
      ? decodeURIComponent(utf8Match[1])
      : (plainMatch?.[1]?.replace(/"/g, '').trim() || `关键词索引库_${new Date().toISOString().slice(0, 10)}.xlsx`)
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    alert(`下载失败：${error?.message || error}`)
  }
}

const showDownloadDefault = () => {
  const header = '机型,工位,解析关键项,关键词引词,关联项,项目实际解析的内容简介（备注）\n'
  const sample = [
    '数码卷绕设备-绿胶线扫相机,ALL,产品尺寸,工艺、产品尺寸、极片尺寸、极耳尺寸,,产品或者预测内容的工艺尺寸是否一致，是否存在新的尺寸边界',
    '数码卷绕设备-绿胶线扫相机,ALL,PPM,节拍、PPM,产品尺寸,设备生产节拍要求是多少，不同工位是否存在独立节拍',
    '数码卷绕设备-绿胶线扫相机,模切后切口检测工位,检测精度,精度、重复精度、分辨率,,若协议未明确精度，可结合视野与分辨率推算'
  ].join('\n') + '\n'
  const blob = new Blob([`\uFEFF${header}${sample}`], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '关键词导入模板.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

// 视觉信息相关方法
const loadVisionInfo = async () => {
  loading.value.visionInfo = true
  try {
    // 这里应该调用API加载视觉信息
    // 模拟数据
    visionInfoList.value = [
      { id: 1, station: '外观检测', camera_type: '工业相机', lens_type: 'FA镜头', light_type: 'LED光源', precision: '0.1mm', field_of_view: '100x100mm' },
      { id: 2, station: '尺寸检测', camera_type: '高精度相机', lens_type: '远心镜头', light_type: '同轴光源', precision: '0.01mm', field_of_view: '50x50mm' },
      { id: 3, station: 'OCR检测', camera_type: '高速相机', lens_type: '微距镜头', light_type: '环形光源', precision: '0.05mm', field_of_view: '80x80mm' }
    ]
  } catch (error) {
    alert('加载失败')
    console.error(error)
  } finally {
    loading.value.visionInfo = false
  }
}

const loadVisionInfoList = async () => {
  try {
    // 这里应该调用API加载视觉信息列表
    // 模拟数据
    visionInfoList.value = [
      { id: 1, station: '外观检测', camera_type: '工业相机', lens_type: 'FA镜头', light_type: 'LED光源', precision: '0.1mm', field_of_view: '100x100mm' },
      { id: 2, station: '尺寸检测', camera_type: '高精度相机', lens_type: '远心镜头', light_type: '同轴光源', precision: '0.01mm', field_of_view: '50x50mm' }
    ]
  } catch (error) {
    console.error('加载视觉信息失败:', error)
  }
}

const editVisionInfo = (row: any) => {
  console.log('Edit vision info:', row)
}

// 图片预览相关
const showImagePreview = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

const previewImage = (images: string[], index: number) => {
  previewImages.value = images
  previewIndex.value = index
  showImagePreview.value = true
}

// 关键信息预览相关方法
const previewAgreementInfo = async (agreement: any) => {
  currentAgreement.value = agreement
  showKeyInfoPreview.value = true

  const extractedInfo = normalizeExtractedInfo(agreement?.extracted_info)

  keyInfoList.value = buildKeyInfoList(extractedInfo)

  await applyKeywordAnalysisToKeyInfo(agreement)
  applyPrecisionEstimationToKeyInfo(agreement, extractedInfo)
}

const sectionKeyById: Record<number, string> = {
  1: 'productSize',
  2: 'ppm',
  3: 'inspectionRequirements',
  4: 'inspectionObjectSpecs',
  5: 'inspectionPrecision',
  6: 'stationRequirements',
  7: 'brandRequirements',
  8: 'industrialComputerRequirements',
  9: 'softwareRequirements'
}

const applyKeywordAnalysisToKeyInfo = async (agreement: any) => {
  if (!agreement?.id) return

  try {
    const response = await keywordAPI.analyzeAgreement(Number(agreement.id))
    const hits = Array.isArray(response.data?.hits) ? response.data.hits : []

    keyInfoList.value = keyInfoList.value.map((item: any) => {
      const keySection = sectionKeyById[Number(item.id)] || ''
      const matched = hits.filter((hit: any) => String(hit.key_section || '') === keySection)
      if (!matched.length) {
        return item
      }

      const keywords = Array.from(new Set(matched.map((hit: any) => String(hit.keyword || '').trim()).filter(Boolean)))
      const summaries = matched
        .slice(0, 3)
        .map((hit: any) => `【${hit.keyword}】${hit.summary || hit.excerpt || ''}`)
        .filter((text: string) => Boolean(text.trim()))
      const hasTableHint = matched.some((hit: any) => Boolean(hit.has_table_hint))
      const hasImageHint = matched.some((hit: any) => Boolean(hit.has_image_hint))
      const hasTextHit = matched.some((hit: any) => !hit?.is_fallback)
      const hintText = [
        hasTableHint ? '表格线索: 已检测到与关键词相关的表格/列项内容。' : '',
        hasImageHint ? '附图线索: 已检测到“图/图片/示意”等描述，请结合原文查看。' : ''
      ].filter(Boolean).join('\n')

      const existingRelatedText = stripEmptyPlaceholder(item?.relatedContent?.text || '')
      const mergedRelatedText = [existingRelatedText, ...summaries, hintText].filter(Boolean).join('\n') || '无相关信息'

      return {
        ...item,
        protocolReading: summaries.length ? summaries.join('；') : item.protocolReading,
        protocolReadingSource: hasTextHit ? 'text-hit' : 'fallback',
        protocolReadingSourceLabel: hasTextHit ? '文本命中' : '规则兜底',
        indexKeywords: keywords.join(','),
        relatedContent: {
          text: mergedRelatedText,
          images: [],
          screenshots: []
        }
      }
    })
  } catch (error) {
    console.error('关键词分析失败:', error)
  }
}

const applyPrecisionEstimationToKeyInfo = (agreement: any, extractedInfo: any) => {
  const precisionItem = keyInfoList.value.find((item: any) => Number(item.id) === 5)
  if (!precisionItem) return

  const hasExplicitPrecision = String(precisionItem.protocolReading || '').trim() && String(precisionItem.protocolReading).trim() !== '无相关信息'
  if (hasExplicitPrecision) return

  const sourceText = [
    String(agreement?.full_text || ''),
    String(extractedInfo?.fullText || ''),
    String(extractedInfo?.keySections?.productSize || '')
  ].join('\n')

  const estimate = estimatePrecisionByVision(sourceText)
  if (!estimate) return

  precisionItem.protocolReading = `协议未明确精度，系统推算约 ${estimate.estimatedUm.toFixed(1)}μm（${estimate.confidence}置信度）`
  precisionItem.protocolReadingSource = 'fallback'
  precisionItem.protocolReadingSourceLabel = '规则兜底'
  precisionItem.relatedContent = {
    ...(precisionItem.relatedContent || {}),
    text: [
      precisionItem.relatedContent?.text || '',
      `推算依据：FOV≈${estimate.fovMm.toFixed(1)}mm，分辨率≈${estimate.resolutionPx}px，K=${estimate.factor.toFixed(2)}`,
      `计算：mm/px=FOV/像素；估算精度≈0.15×mm/px×K`
    ].filter(Boolean).join('\n')
  }
}

const estimatePrecisionByVision = (text: string) => {
  const input = String(text || '')
  if (!input.trim()) return null

  const fovMatch = input.match(/视野[^\d]{0,8}(\d+(?:\.\d+)?)\s*(mm|毫米)(?:\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(mm|毫米))?/i)
  const resMatch = input.match(/(\d{3,5})\s*[x×*]\s*(\d{3,5})/)

  if (!fovMatch || !resMatch) return null

  const fovMm = Number(fovMatch[1] || 0)
  const resolutionPx = Number(resMatch[1] || 0)
  if (!fovMm || !resolutionPx) return null

  let factor = 1.8
  if (/高速|振动|反光|镜面/.test(input)) factor = 2.2
  if (/稳定|静态|实验室|标定/.test(input)) factor = 1.4

  const mmPerPx = fovMm / resolutionPx
  const estimatedUm = mmPerPx * 0.15 * factor * 1000
  const confidence = estimatedUm < 10 ? '中高' : '中'

  return {
    fovMm,
    resolutionPx,
    factor,
    estimatedUm,
    confidence
  }
}

const normalizeExtractedInfo = (raw: any) => {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (error) {
      console.error('extracted_info 解析失败:', error)
      return {}
    }
  }
  return {}
}

const exportKeyInfo = () => {
  // 这里应该实现导出功能，例如导出为Excel或PDF
  alert('导出功能已触发')
  console.log('Export key info:', keyInfoList.value)
}

const closeKeyInfoPreview = () => {
  showKeyInfoPreview.value = false
  currentAgreement.value = null
  keyInfoList.value = []
}

// 加载机型列表
const loadMachineTypes = async () => {
  // 从协议列表中提取唯一的机型
  const types = new Set<string>()
  agreementList.value.forEach(item => {
    if (item.machine_type) {
      types.add(item.machine_type)
    }
  })
  visionList.value.forEach(item => {
    if (item.machine_type) {
      types.add(item.machine_type)
    }
  })
  costList.value.forEach(item => {
    if (item.machine_type) {
      types.add(item.machine_type)
    }
  })
  
  // 从机型库API加载机型
  try {
    const response = await machineLibraryAPI.getList()
    response.data.items.forEach((item: any) => {
      types.add(item.name)
    })
  } catch (error) {
    console.error('加载机型库失败:', error)
  }
  
  machineTypes.value = Array.from(types)
}

// 加载工位列表
const loadStations = () => {
  // 从协议列表中提取唯一的工位
  const stations = new Set<string>()
  agreementList.value.forEach(item => {
    if (item && item.stations && typeof item.stations === 'string') {
      // 处理多个工位的情况
      const stationArray = item.stations.split(',').map(s => s.trim())
      stationArray.forEach(station => {
        if (station) {
          stations.add(station)
        }
      })
    }
  })
  visionList.value.forEach(item => {
    if (item && item.stations && typeof item.stations === 'string') {
      const stationArray = item.stations.split(',').map(s => s.trim())
      stationArray.forEach(station => {
        if (station) {
          stations.add(station)
        }
      })
    }
  })
  stationList.value = Array.from(stations)
}

// 新建机型
const createMachineType = async () => {
  const machineType = agreementForm.value.machineType
  if (!machineType || machineType.trim() === '') {
    alert('请输入机型名称')
    return
  }
  
  try {
    await machineLibraryAPI.create(machineType)
    alert('机型创建成功')
    await loadMachineTypes()
  } catch (error) {
    console.error('创建机型失败:', error)
    const err: any = error
    const backendMessage = err?.response?.data?.message
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error')) {
      alert('创建机型失败：后端服务不可用，请确认 http://localhost:3006/api/health 可访问。')
      return
    }
    alert(`创建机型失败：${backendMessage || err?.message || '请重试'}`)
  }
}

// 更新文件上传函数，处理工位的多选值
const uploadAgreementFiles = async () => {
  if (agreementFiles.value.length === 0) {
    alert('请选择文件')
    return
  }
  
  // 验证必填字段
  if (!agreementForm.value.machineType || agreementForm.value.machineType.trim() === '') {
    alert('机型不能为空')
    return
  }
  
  // 工位可以不写，因为后面方案文件会解析出工位的
  
  const formData = new FormData()
  agreementFiles.value.forEach(file => formData.append('files', file))
  formData.append('machineType', agreementForm.value.machineType)
  // 处理工位的多选值，转换为逗号分隔的字符串
  let stationsValue = ''
  if (agreementForm.value.stations) {
    stationsValue = Array.isArray(agreementForm.value.stations) 
      ? agreementForm.value.stations.join(',') 
      : agreementForm.value.stations
  }
  formData.append('stations', stationsValue)
  
  loading.value.agreement = true
  try {
    const response = await agreementAPI.upload(formData)
    console.log('上传成功，响应:', response)
    alert('上传成功')
    agreementFiles.value = []
    agreementForm.value = { machineType: '', stations: [] }
    await loadAgreements()
    await loadMachineTypes()
    await loadStations()
  } catch (error: any) {
    console.error('上传失败，错误详情:', error)
    if (error.response) {
      console.error('响应数据:', error.response.data)
      console.error('响应状态:', error.response.status)
      console.error('响应头:', error.response.headers)
      // 显示后端返回的错误信息
      if (error.response.data && error.response.data.message) {
        alert(`上传失败: ${error.response.data.message}`)
      } else {
        alert(`上传失败: ${error.message}`)
      }
    } else if (error.request) {
      console.error('请求已发出但没有收到响应:', error.request)
      alert('上传失败: 服务器无响应，请检查后端服务是否运行')
    } else {
      console.error('请求配置出错:', error.message)
      alert(`上传失败: ${error.message}`)
    }
  } finally {
    loading.value.agreement = false
  }
}

// 更新视觉方案上传函数，处理工位的多选值
const uploadVisionFiles = async () => {
  if (visionFiles.value.length === 0) {
    alert('请选择文件')
    return
  }
  
  const formData = new FormData()
  visionFiles.value.forEach(file => formData.append('files', file))
  formData.append('machineType', visionForm.value.machineType)
  // 处理工位的多选值，转换为逗号分隔的字符串
  const stationsValue = Array.isArray(visionForm.value.stations) 
    ? visionForm.value.stations.join(',') 
    : visionForm.value.stations
  formData.append('stations', stationsValue)
  
  loading.value.vision = true
  try {
    await visionReportAPI.upload(formData)
    alert('上传成功')
    visionFiles.value = []
    visionForm.value = { machineType: '', stations: [] }
    await loadVisionReports()
    await loadMachineTypes()
    await loadStations()
  } catch (error) {
    alert('上传失败')
    console.error(error)
  } finally {
    loading.value.vision = false
  }
}
</script>

<style scoped>
.library {
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

.upload-demo {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
}

.protocol-reading-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.protocol-reading-cell > div:first-child {
  word-break: break-word;
  white-space: pre-wrap;
}

.protocol-reading-cell .el-tag {
  width: fit-content;
}
</style>
