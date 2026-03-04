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
                  <el-table-column prop="protocolReading" label="协议解读" width="200"></el-table-column>
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
              <el-form :model="keywordForm" label-width="120px" style="margin-bottom: 20px;">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="关键词">
                      <el-input v-model="keywordForm.keyword"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="类型">
                      <el-select v-model="keywordForm.type">
                        <el-option label="协议" value="agreement"></el-option>
                        <el-option label="视觉方案" value="vision"></el-option>
                        <el-option label="成本表" value="cost"></el-option>
                        <el-option label="标准件" value="part"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="操作">
                      <el-button type="primary" @click="addKeyword" :loading="loading.keyword">添加</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              <el-table :data="keywordList" style="margin-top: 20px;">
                <el-table-column prop="keyword" label="关键词" width="200"></el-table-column>
                <el-table-column prop="type" label="类型"></el-table-column>
                <el-table-column prop="created_at" label="创建时间"></el-table-column>
                <el-table-column label="操作">
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
                    <el-form-item label="关键词">
                      <el-input v-model="bindingForm.keyword"></el-input>
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
                <el-table-column prop="machine_type" label="机型"></el-table-column>
                <el-table-column prop="station" label="工位"></el-table-column>
                <el-table-column prop="keyword" label="关键词"></el-table-column>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, Loading } from '@element-plus/icons-vue'
import { ElImageViewer } from 'element-plus'
import { agreementAPI, visionReportAPI, costTableAPI, partAPI, machineLibraryAPI } from '../services/api'

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
  type: 'agreement'
})

// 关联绑定表单
const bindingForm = ref({
  machineType: '',
  station: '',
  keyword: ''
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

// 机型和工位列表
const machineTypes = ref<string[]>([])
const stationList = ref<string[]>([])

// 关键信息预览状态
const showKeyInfoPreview = ref(false)
const currentAgreement = ref<any>(null)

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

const viewAgreement = (row: any) => {
  if (row?.archive_url) {
    window.open(row.archive_url, '_blank')
    return
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
const addKeyword = async () => {
  loading.value.keyword = true
  try {
    // 这里应该调用API添加关键词
    alert('添加成功')
    keywordForm.value = { keyword: '', type: 'agreement' }
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
    // 这里应该调用API加载关键词
    // 模拟数据
    keywordList.value = [
      { id: 1, keyword: '相机', type: 'agreement', created_at: new Date().toISOString() },
      { id: 2, keyword: '镜头', type: 'vision', created_at: new Date().toISOString() },
      { id: 3, keyword: '光源', type: 'vision', created_at: new Date().toISOString() },
      { id: 4, keyword: '成本', type: 'cost', created_at: new Date().toISOString() }
    ]
  } catch (error) {
    console.error('加载关键词失败:', error)
  }
}

const editKeyword = (row: any) => {
  console.log('Edit keyword:', row)
}

const deleteKeyword = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      // 这里应该调用API删除关键词
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
    // 这里应该调用API添加关联绑定
    alert('添加成功')
    bindingForm.value = { machineType: '', station: '', keyword: '' }
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
    // 这里应该调用API加载关联绑定
    // 模拟数据
    bindingList.value = [
      { id: 1, machine_type: '卷绕机', station: '外观检测', keyword: '相机', created_at: new Date().toISOString() },
      { id: 2, machine_type: '卷绕机', station: '尺寸检测', keyword: '镜头', created_at: new Date().toISOString() },
      { id: 3, machine_type: '组装机', station: 'OCR检测', keyword: '光源', created_at: new Date().toISOString() }
    ]
  } catch (error) {
    console.error('加载关联绑定失败:', error)
  }
}

const editBinding = (row: any) => {
  console.log('Edit binding:', row)
}

const deleteBinding = async (id: number) => {
  if (confirm('确定要删除吗？')) {
    try {
      // 这里应该调用API删除关联绑定
      alert('删除成功')
      await loadBindings()
    } catch (error) {
      alert('删除失败')
      console.error(error)
    }
  }
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

  // 从上传的文件中提取真实数据
  if (Object.keys(extractedInfo).length > 0) {
    keyInfoList.value = [
      {
        id: 1, 
        name: '产品尺寸', 
        description: '极片长宽范围、电芯或电池产品长宽范围、视野大小、料长', 
        protocolReading: extractedInfo.keySections?.productSize || '无相关信息', 
        indexKeywords: '产品尺寸,视野',
        relatedContent: {
          text: extractedInfo.keySections?.productSize || '无相关信息',
          images: [
            'https://picsum.photos/200/150?random=1',
            'https://picsum.photos/200/150?random=2'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=3'
          ]
        }
      },
      {
        id: 2, 
        name: 'PPM', 
        description: 'PPM、速度、拍照频率', 
        protocolReading: extractedInfo.keySections?.ppm || '无相关信息', 
        indexKeywords: 'PPM,速度,拍照频率',
        relatedContent: {
          text: extractedInfo.keySections?.ppm || '无相关信息',
          screenshots: [
            'https://picsum.photos/300/200?random=4'
          ]
        }
      },
      {
        id: 3, 
        name: '检测要求', 
        description: '检测内容、相机黑白、测量内容、外观检测要求、过杀漏检等', 
        protocolReading: extractedInfo.keySections?.inspectionRequirements || '无相关信息', 
        indexKeywords: '检测要求,外观检测',
        relatedContent: {
          text: extractedInfo.keySections?.inspectionRequirements || '无相关信息',
          images: [
            'https://picsum.photos/200/150?random=5'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=6'
          ]
        }
      },
      {
        id: 4, 
        name: '检测对象规格', 
        description: '极耳尺寸、相机尺寸、胶纸间距、胶纸颜色等', 
        protocolReading: extractedInfo.keySections?.inspectionObjectSpecs || '无相关信息', 
        indexKeywords: '极耳尺寸,胶纸间距',
        relatedContent: {
          text: extractedInfo.keySections?.inspectionObjectSpecs || '无相关信息',
          screenshots: [
            'https://picsum.photos/300/200?random=7'
          ]
        }
      },
      {
        id: 5, 
        name: '检测精度', 
        description: '检测精度、像素精度、相机分辨率、一个工位几个相机', 
        protocolReading: extractedInfo.keySections?.inspectionPrecision || '无相关信息', 
        indexKeywords: '检测精度,相机分辨率',
        relatedContent: {
          text: extractedInfo.keySections?.inspectionPrecision || '无相关信息',
          images: [
            'https://picsum.photos/200/150?random=8'
          ]
        }
      },
      {
        id: 6, 
        name: '工位要求', 
        description: '有哪些工位，单工位还是双工位，一个工位几个相机', 
        protocolReading: extractedInfo.keySections?.stationRequirements || '无相关信息', 
        indexKeywords: '工位,相机数量',
        relatedContent: {
          text: extractedInfo.keySections?.stationRequirements || '无相关信息',
          images: [
            'https://picsum.photos/200/150?random=9'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=10'
          ]
        }
      },
      {
        id: 7, 
        name: '品牌要求', 
        description: '相机、镜头、光源、工控机等品牌要求', 
        protocolReading: extractedInfo.keySections?.brandRequirements || '无相关信息', 
        indexKeywords: '相机品牌,镜头品牌,光源品牌',
        relatedContent: {
          text: extractedInfo.keySections?.brandRequirements || '无相关信息',
          screenshots: [
            'https://picsum.photos/300/200?random=11'
          ]
        }
      },
      {
        id: 8, 
        name: '工控机要求', 
        description: '性能要求、配置要求、存储要求、端口预留要求，图片存储天数', 
        protocolReading: extractedInfo.keySections?.industrialComputerRequirements || '无相关信息', 
        indexKeywords: '工控机,配置,存储',
        relatedContent: {
          text: extractedInfo.keySections?.industrialComputerRequirements || '无相关信息',
          screenshots: [
            'https://picsum.photos/300/200?random=12'
          ]
        }
      },
      {
        id: 9, 
        name: '软件要求', 
        description: '界面、权限、功能等', 
        protocolReading: extractedInfo.keySections?.softwareRequirements || '无相关信息', 
        indexKeywords: '软件,界面,功能',
        relatedContent: {
          text: extractedInfo.keySections?.softwareRequirements || '无相关信息',
          images: [
            'https://picsum.photos/200/150?random=13'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=14'
          ]
        }
      }
    ]
  } else {
    // 模拟关键信息数据，包含关联内容
    keyInfoList.value = [
      {
        id: 1, 
        name: '产品尺寸', 
        description: '极片长宽范围、电芯或电池产品长宽范围、视野大小、料长', 
        protocolReading: '极片尺寸：100mm×200mm，视野：200mm×200mm', 
        indexKeywords: '产品尺寸,视野',
        relatedContent: {
          text: '协议第3.2节详细说明了产品尺寸要求，包括极片、电芯的长宽范围和允许误差。',
          images: [
            'https://picsum.photos/200/150?random=1',
            'https://picsum.photos/200/150?random=2'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=3'
          ]
        }
      },
      {
        id: 2, 
        name: 'PPM', 
        description: 'PPM、速度、拍照频率', 
        protocolReading: 'PPM要求：1200，拍照频率：10次/秒', 
        indexKeywords: 'PPM,速度,拍照频率',
        relatedContent: {
          text: '协议第4.1节规定了生产效率要求，PPM不得低于1200，拍照频率需达到10次/秒。',
          screenshots: [
            'https://picsum.photos/300/200?random=4'
          ]
        }
      },
      {
        id: 3, 
        name: '检测要求', 
        description: '检测内容、相机黑白、测量内容、外观检测要求、过杀漏检等', 
        protocolReading: '检测内容：外观缺陷、尺寸测量，相机类型：工业黑白相机', 
        indexKeywords: '检测要求,外观检测',
        relatedContent: {
          text: '协议第5.2节详细说明了检测要求，包括外观缺陷检测、尺寸测量等内容，要求使用工业黑白相机。',
          images: [
            'https://picsum.photos/200/150?random=5'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=6'
          ]
        }
      },
      {
        id: 4, 
        name: '检测对象规格', 
        description: '极耳尺寸、相机尺寸、胶纸间距、胶纸颜色等', 
        protocolReading: '极耳尺寸：5mm×20mm，胶纸间距：10mm', 
        indexKeywords: '极耳尺寸,胶纸间距',
        relatedContent: {
          text: '协议第6.1节规定了检测对象的具体规格，包括极耳尺寸、胶纸间距等参数。',
          screenshots: [
            'https://picsum.photos/300/200?random=7'
          ]
        }
      },
      {
        id: 5, 
        name: '检测精度', 
        description: '检测精度、像素精度、相机分辨率、一个工位几个相机', 
        protocolReading: '检测精度：±0.05mm，相机分辨率：2000万像素', 
        indexKeywords: '检测精度,相机分辨率',
        relatedContent: {
          text: '协议第7.3节规定了检测精度要求，尺寸检测精度需达到±0.05mm，相机分辨率不低于2000万像素。',
          images: [
            'https://picsum.photos/200/150?random=8'
          ]
        }
      },
      {
        id: 6, 
        name: '工位要求', 
        description: '有哪些工位，单工位还是双工位，一个工位几个相机', 
        protocolReading: '工位：外观检测工位、尺寸检测工位，每个工位2个相机', 
        indexKeywords: '工位,相机数量',
        relatedContent: {
          text: '协议第8.2节规定了工位配置要求，包括外观检测工位和尺寸检测工位，每个工位配置2个相机。',
          images: [
            'https://picsum.photos/200/150?random=9'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=10'
          ]
        }
      },
      {
        id: 7, 
        name: '品牌要求', 
        description: '相机、镜头、光源、工控机等品牌要求', 
        protocolReading: '相机品牌：Keyence，镜头品牌：Computar，光源品牌：CCS', 
        indexKeywords: '相机品牌,镜头品牌,光源品牌',
        relatedContent: {
          text: '协议第9.1节规定了设备品牌要求，相机推荐使用Keyence，镜头推荐使用Computar，光源推荐使用CCS。',
          screenshots: [
            'https://picsum.photos/300/200?random=11'
          ]
        }
      },
      {
        id: 8, 
        name: '工控机要求', 
        description: '性能要求、配置要求、存储要求、端口预留要求，图片存储天数', 
        protocolReading: 'CPU：i7，内存：16GB，存储：512GB SSD，图片存储：30天', 
        indexKeywords: '工控机,配置,存储',
        relatedContent: {
          text: '协议第10.2节规定了工控机配置要求，包括CPU、内存、存储等参数，以及图片存储时间要求。',
          screenshots: [
            'https://picsum.photos/300/200?random=12'
          ]
        }
      },
      {
        id: 9, 
        name: '软件要求', 
        description: '界面、权限、功能等', 
        protocolReading: '界面要求：中文界面，功能：实时监控、数据导出、报警功能', 
        indexKeywords: '软件,界面,功能',
        relatedContent: {
          text: '协议第11.3节规定了软件要求，界面需为中文，功能包括实时监控、数据导出、报警功能等。',
          images: [
            'https://picsum.photos/200/150?random=13'
          ],
          screenshots: [
            'https://picsum.photos/300/200?random=14'
          ]
        }
      }
    ]
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
</style>
