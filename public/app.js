const storageKeys = {
  parts: 'vision.parts.v1',
  docs: 'vision.docs.v1',
  refDocs: 'vision.refdocs.v1',
  productTypes: 'vision.producttypes.v1',
  agreementLibrary: 'vision.agreement.library.v1',
  reportLibrary: 'vision.report.library.v1',
  costLibrary: 'vision.cost.library.v1',
  focusRules: 'vision.focus.rules.v1',
  infoDocs: 'vision.info.docs.v1',
  activeMachineLibrary: 'vision.active.machine.library.v1',
  lastReport: 'vision.report.v1',
  rootAuth: 'vision.root.auth.v1'
};

const brandKnowledge = {
  Cognex: '算法库成熟、稳定性高、售后网络完善',
  Keyence: '调试效率高、集成便捷、交付节奏快',
  Basler: '性价比高、型号丰富、适配面广',
  Hikrobot: '本地化支持快、成本控制优势明显',
  Omron: '工业场景经验丰富、兼容性较好'
};

const preferredBrandsByCategory = {
  相机: ['Cognex', 'Basler', 'Hikrobot'],
  镜头: ['Computar', 'Tamron', 'Kowa'],
  光源: ['CCS', 'OPT', 'SmartMore'],
  控制器: ['Cognex', 'Omron', 'Keyence']
};

const state = {
  docs: loadState(storageKeys.docs, []),
  refDocs: loadState(storageKeys.refDocs, []),
  productTypes: loadState(storageKeys.productTypes, []),
  agreementLibrary: loadState(storageKeys.agreementLibrary, []),
  reportLibrary: loadState(storageKeys.reportLibrary, []),
  costLibrary: loadState(storageKeys.costLibrary, []),
  focusRules: loadState(storageKeys.focusRules, []),
  infoDocs: loadState(storageKeys.infoDocs, []),
  machineLibraries: [],
  activeMachineLibrary: loadState(storageKeys.activeMachineLibrary, ''),
  parts: loadState(storageKeys.parts, defaultParts()),
  lastEvaluation: loadState(storageKeys.lastReport, null),
  lastAssessment: null,
  lastProtocolProfile: null,
  partPriceImportLog: null,
  isRoot: loadState(storageKeys.rootAuth, false),
  activeHash: '#module-home',
  routeHistory: [],
  activeVisionTab: 'import'
};

const moduleRouter = {
  links: [],
  sectionMap: new Map(),
  labelMap: new Map()
};

init();

function init() {
  bindEvents();
  setupModuleNavigation();
  setupVisionTabs();
  setupMaintainTabs();
  renderDocSummary();
  renderAssessmentSummary();
  renderDocNotes();
  renderRefDocSummary();
  renderAgreementLibraryTable();
  renderAgreementFilterOptions();
  renderReportLibraryTable();
  renderCostLibraryTable();
  renderFocusRuleTable();
  renderInfoDocTable();
  renderAgreementImportSummary();
  renderReportImportSummary();
  renderCostImportSummary();
  renderProductTypeTable();
  renderPartsTable(state.parts);
  renderPartPriceImportLog();
  renderLibraryFilterOptions();
  renderLibraryPanels();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderReportPreview();
  renderDashboard();
  renderFrameworkBoards();
  renderAdminContent();
  renderMachineLibraryStatus(`当前：${machineLabel()}`);
  renderExistingStationSuggestions();
  fetchMachineLibraryList();
}

function bindEvents() {
  bindIfExists('parseBtn', 'click', parseDocuments);
  bindIfExists('loadRefBtn', 'click', loadReferenceDocuments);
  bindIfExists('loadAgreementLibBtn', 'click', loadAgreementLibrary);
  bindIfExists('agreementMachineFilter', 'change', renderAgreementLibraryTable);
  bindIfExists('agreementStationFilter', 'change', renderAgreementLibraryTable);
  bindIfExists('agreementMachineTypeInput', 'input', renderExistingStationSuggestions);
  bindIfExists('reportMachineTypeInput', 'input', renderExistingStationSuggestions);
  bindIfExists('costMachineTypeInput', 'input', renderExistingStationSuggestions);
  bindIfExists('loadInfoDocBtn', 'click', loadInfoDocuments);
  bindIfExists('createMachineLibraryBtn', 'click', createMachineLibrary);
  bindIfExists('loadMachineLibraryBtn', 'click', loadMachineLibraryFromSelection);
  bindIfExists('saveMachineLibraryBtn', 'click', saveCurrentToMachineLibrary);
  bindIfExists('machineLibrarySelect', 'change', handleMachineLibrarySelectionChange);
  bindIfExists('importPartPriceBtn', 'click', importPartPriceTable);
  bindIfExists('loadReportBtn', 'click', loadReportLibrary);
  bindIfExists('loadCostBtn', 'click', loadCostLibrary);
  bindIfExists('parsePreviewBtn', 'click', parsePreviewDocument);
  bindIfExists('libMachineSelect', 'change', renderLibraryPanels);
  bindIfExists('libStationSelect', 'change', renderLibraryPanels);
  bindIfExists('focusRuleForm', 'submit', addFocusRule);
  bindIfExists('productTypeForm', 'submit', addProductType);
  bindIfExists('partForm', 'submit', addPart);
  bindIfExists('partSearch', 'input', handlePartSearch);
  bindIfExists('evalForm', 'submit', runEvaluation);
  bindIfExists('exportMd', 'click', () => exportReport('md'));
  bindIfExists('exportJson', 'click', () => exportReport('json'));
  bindIfExists('backModuleBtn', 'click', goToPreviousModule);
  bindIfExists('rootUnlockBtn', 'click', handleRootUnlock);
  document.querySelectorAll('[data-go-hash]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetHash = button.getAttribute('data-go-hash');
      navigateModule(targetHash, { recordHistory: true, updateHash: true });
    });
  });
}

function bindIfExists(elementId, eventName, handler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function setupMaintainTabs() {
  const buttons = Array.from(document.querySelectorAll('.maintain-tab-btn'));
  const panes = {
    protocol: document.getElementById('maintain-pane-protocol'),
    report: document.getElementById('maintain-pane-report'),
    cost: document.getElementById('maintain-pane-cost'),
    part: document.getElementById('maintain-pane-part'),
    library: document.getElementById('maintain-pane-library')
  };

  const setTab = (tabName) => {
    if (!panes[tabName]) return;
    Object.keys(panes).forEach((key) => {
      panes[key].classList.toggle('is-hidden', key !== tabName);
    });
    buttons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-maintain-tab') === tabName);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => setTab(button.getAttribute('data-maintain-tab')));
  });

  setTab('protocol');
}

function currentMachineLibrary() {
  const select = document.getElementById('machineLibrarySelect');
  return (select && select.value) || state.activeMachineLibrary || '';
}

function machineLabel() {
  return currentMachineLibrary() || '未选择';
}

function setupVisionTabs() {
  const tabButtons = Array.from(document.querySelectorAll('.vision-tab-btn'));
  const panes = {
    import: document.getElementById('vision-pane-import'),
    maintain: document.getElementById('vision-pane-maintain'),
    evaluate: document.getElementById('vision-pane-evaluate'),
    report: document.getElementById('vision-pane-report')
  };

  function setVisionTab(tabName) {
    if (!panes[tabName]) {
      return;
    }

    state.activeVisionTab = tabName;
    Object.keys(panes).forEach((key) => {
      panes[key].classList.toggle('is-hidden', key !== tabName);
    });

    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-vision-tab') === tabName);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setVisionTab(button.getAttribute('data-vision-tab'));
    });
  });

  setVisionTab(state.activeVisionTab);
}

function setupModuleNavigation() {
  moduleRouter.links = Array.from(document.querySelectorAll('.module-nav-link'));
  const sections = Array.from(document.querySelectorAll('.module-card'));
  if (!moduleRouter.links.length || !sections.length) {
    return;
  }

  moduleRouter.sectionMap = new Map();
  moduleRouter.labelMap = new Map();
  sections.forEach((section) => moduleRouter.sectionMap.set(`#${section.id}`, section));
  moduleRouter.links.forEach((link) => {
    moduleRouter.labelMap.set(link.getAttribute('href'), link.textContent.trim());
  });

  moduleRouter.links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetHash = link.getAttribute('href');
      if (!targetHash) return;
      navigateModule(targetHash, { recordHistory: true, updateHash: true });
    });
  });

  window.addEventListener('hashchange', () => {
    navigateModule(window.location.hash, { recordHistory: false, updateHash: false });
  });

  navigateModule(window.location.hash || '#module-home', { recordHistory: false, updateHash: true });
}

function navigateModule(targetHash, options = {}) {
  const { recordHistory = true, updateHash = true } = options;
  if (!moduleRouter.sectionMap.has(targetHash)) {
    return;
  }

  if (recordHistory && state.activeHash && state.activeHash !== targetHash) {
    state.routeHistory.push(state.activeHash);
    if (state.routeHistory.length > 20) {
      state.routeHistory.shift();
    }
  }

  state.activeHash = targetHash;
  moduleRouter.sectionMap.forEach((section, hash) => {
    section.classList.toggle('is-hidden', hash !== targetHash);
  });

  moduleRouter.links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === targetHash);
  });

  if (updateHash && window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }

  updateRouteHeader();
}

function goToPreviousModule() {
  if (!state.routeHistory.length) {
    return;
  }

  const previousHash = state.routeHistory.pop();
  navigateModule(previousHash, { recordHistory: false, updateHash: true });
}

function updateRouteHeader() {
  const breadcrumb = document.getElementById('breadcrumbCurrent');
  const backButton = document.getElementById('backModuleBtn');
  const currentLabel = moduleRouter.labelMap.get(state.activeHash) || '首页仪表盘';
  breadcrumb.textContent = `首页 / ${currentLabel}`;
  backButton.disabled = state.routeHistory.length === 0;
}

function renderDashboard() {
  const container = document.getElementById('dashboardStats');
  if (!container) {
    return;
  }

  const reportCount = state.lastEvaluation ? 1 : 0;
  const lastCost = state.lastEvaluation ? `¥${state.lastEvaluation.cost.totalCost.toFixed(2)}` : '未生成';
  const lastTime = state.lastEvaluation ? new Date(state.lastEvaluation.generatedAt).toLocaleString('zh-CN') : '无';

  const metrics = [
    { title: '已导入资料', value: String(state.docs.length) },
    { title: '参考文档数', value: String(state.refDocs.length) },
    { title: '产品类型能力', value: String(state.productTypes.length) },
    { title: '标准件数量', value: String(state.parts.length) },
    { title: '报告数量', value: String(reportCount) },
    { title: '最近总成本', value: lastCost },
    { title: '最近评估时间', value: lastTime },
    { title: 'Root状态', value: state.isRoot ? '已授权' : '未授权' }
  ];

  container.innerHTML = metrics.map((item) => `
    <div class="metric-card">
      <div class="metric-title">${escapeHtml(item.title)}</div>
      <div class="metric-value">${escapeHtml(item.value)}</div>
    </div>
  `).join('');
}

function renderFrameworkBoards() {
  renderContentTypeBoard();
  renderFlowStatusBoard();
  renderOutputStatusBoard();
}

function renderContentTypeBoard() {
  const container = document.getElementById('contentTypeBoard');
  if (!container) return;

  const countByType = {
    协议资料: state.docs.length,
    历史技术协议库: state.agreementLibrary.length,
    提供资料模板: state.refDocs.length,
    信息文档知识库: state.infoDocs.length,
    基础设计报告: state.lastEvaluation ? 1 : 0,
    报价单: state.lastEvaluation ? 1 : 0,
    工程师备注文档: state.docs.filter((doc) => (doc.note || '').trim().length > 0).length,
    相机光源统计表: state.lastEvaluation ? 1 : 0
  };

  container.innerHTML = Object.keys(countByType).map((name) => `
    <div class="metric-card">
      <div class="metric-title">${escapeHtml(name)}</div>
      <div class="metric-value">${countByType[name]}</div>
    </div>
  `).join('');
}

function renderFlowStatusBoard() {
  const container = document.getElementById('flowStatusBoard');
  if (!container) return;

  const flow = [
    { name: '协议资料导入', done: state.docs.length > 0 },
    { name: '资料库维护完成', done: state.agreementLibrary.length > 0 && state.focusRules.length > 0 },
    { name: '模板/知识文档加载', done: state.refDocs.length > 0 || state.infoDocs.length > 0 },
    { name: '规则与能力维护', done: state.productTypes.length > 0 && state.parts.length > 0 },
    { name: '协议对比与差异备注', done: Boolean(state.lastAssessment && state.lastAssessment.comparison) },
    { name: '评估报告与报价输出', done: Boolean(state.lastEvaluation) }
  ];

  container.innerHTML = flow.map((step, index) => {
    const statusText = step.done ? '已完成' : '待完善';
    const cls = step.done ? 'ok' : 'warn';
    return `<div><strong>${index + 1}. ${escapeHtml(step.name)}</strong> <span class="${cls}">${statusText}</span></div>`;
  }).join('');
}

function renderOutputStatusBoard() {
  const container = document.getElementById('outputStatusBoard');
  if (!container) return;

  const outputs = [
    { name: '基础设计报告', status: state.lastEvaluation ? '已生成基础版本' : '待生成' },
    { name: '报价单', status: state.lastEvaluation ? '可导出后映射报价模板' : '待生成' },
    { name: '相机光源统计表', status: state.parts.length ? '已有标准件基础，可生成统计草稿' : '需先维护标准件' }
  ];

  container.innerHTML = outputs.map((item) => `
    <div class="metric-card">
      <div class="metric-title">${escapeHtml(item.name)}</div>
      <div class="small">${escapeHtml(item.status)}</div>
    </div>
  `).join('');
}

function countDocType(extList, docs) {
  return docs.filter((doc) => extList.includes((doc.ext || '').toLowerCase())).length;
}

function handleRootUnlock() {
  const input = document.getElementById('rootTokenInput');
  const token = input.value.trim();
  if (!token) {
    alert('请输入Root口令。');
    return;
  }

  if (token === 'root123') {
    state.isRoot = true;
    localStorage.setItem(storageKeys.rootAuth, JSON.stringify(true));
    input.value = '';
    renderAdminContent();
    renderDashboard();
    alert('Root验证成功。');
    return;
  }

  state.isRoot = false;
  localStorage.setItem(storageKeys.rootAuth, JSON.stringify(false));
  renderAdminContent();
  renderDashboard();
  alert('口令错误，请重试。');
}

function renderAdminContent() {
  const container = document.getElementById('adminContent');
  if (!container) {
    return;
  }

  if (!state.isRoot) {
    container.innerHTML = '<span class="warn">未授权：请先验证Root权限后进入管理配置。</span>';
    return;
  }

  container.innerHTML = `
    <div class="ok">Root已授权，可执行管理级配置。</div>
    <ul>
      <li>品牌知识库维护（优先级、替代关系、优势标签）</li>
      <li>成本规则参数管理（集成系数、风险因子）</li>
      <li>角色权限策略（设计/产品/管理）</li>
      <li>操作审计与发布审批</li>
    </ul>
  `;
}

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function persistState() {
  localStorage.setItem(storageKeys.parts, JSON.stringify(state.parts));
  localStorage.setItem(storageKeys.docs, JSON.stringify(state.docs));
  localStorage.setItem(storageKeys.refDocs, JSON.stringify(state.refDocs));
  localStorage.setItem(storageKeys.productTypes, JSON.stringify(state.productTypes));
  localStorage.setItem(storageKeys.agreementLibrary, JSON.stringify(state.agreementLibrary));
  localStorage.setItem(storageKeys.reportLibrary, JSON.stringify(state.reportLibrary));
  localStorage.setItem(storageKeys.costLibrary, JSON.stringify(state.costLibrary));
  localStorage.setItem(storageKeys.focusRules, JSON.stringify(state.focusRules));
  localStorage.setItem(storageKeys.infoDocs, JSON.stringify(state.infoDocs));
  localStorage.setItem(storageKeys.activeMachineLibrary, JSON.stringify(state.activeMachineLibrary || ''));
  if (state.lastEvaluation) {
    localStorage.setItem(storageKeys.lastReport, JSON.stringify(state.lastEvaluation));
  }
}

function machineLibrarySnapshot() {
  return {
    agreementLibrary: state.agreementLibrary,
    reportLibrary: state.reportLibrary,
    costLibrary: state.costLibrary,
    parts: state.parts,
    productTypes: state.productTypes,
    focusRules: state.focusRules,
    infoDocs: state.infoDocs,
    refDocs: state.refDocs
  };
}

function triggerMachineLibraryAutoSave(reason = '') {
  const machineType = currentMachineLibrary();
  if (!machineType) return;

  requestJson('/api/machine-libraries/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      machineType,
      data: machineLibrarySnapshot()
    })
  }).then(() => {
    renderMachineLibraryStatus(`已自动保存到机型库：${machineType}${reason ? `（${reason}）` : ''}`);
    return fetchMachineLibraryList();
  }).catch((error) => {
    renderMachineLibraryStatus(`自动保存失败：${error.message}`, 'warn');
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `请求失败(${response.status})`);
  }
  return data;
}

function renderMachineLibraryStatus(message, level = 'small') {
  const panel = document.getElementById('machineLibraryStatus');
  if (!panel) return;
  panel.innerHTML = `<span class="${level}">机型库状态：${escapeHtml(message)}</span>`;
}

function renderMachineLibrarySelect() {
  const select = document.getElementById('machineLibrarySelect');
  if (!select) return;
  const options = ['<option value="">选择机型库</option>']
    .concat(state.machineLibraries.map((item) => `<option value="${escapeHtml(item.machineType)}">${escapeHtml(item.machineType)}</option>`));
  select.innerHTML = options.join('');
  if (state.activeMachineLibrary) {
    select.value = state.activeMachineLibrary;
  }
}

async function fetchMachineLibraryList() {
  try {
    const payload = await requestJson('/api/machine-libraries');
    state.machineLibraries = Array.isArray(payload.items) ? payload.items : [];
    renderMachineLibrarySelect();
    renderMachineLibraryStatus(`已加载 ${state.machineLibraries.length} 个机型库；当前：${machineLabel()}`);
  } catch (error) {
    renderMachineLibraryStatus(`读取失败：${error.message}`, 'warn');
  }
}

async function createMachineLibrary() {
  const input = document.getElementById('machineLibraryNameInput');
  const machineType = (input && input.value ? input.value : '').trim();
  if (!machineType) {
    alert('请输入机型库名称。');
    return;
  }
  try {
    await requestJson('/api/machine-libraries/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineType })
    });
    state.activeMachineLibrary = machineType;
    persistState();
    if (input) input.value = '';
    await fetchMachineLibraryList();
    renderMachineLibraryStatus(`已创建并选中机型库：${machineType}`);
  } catch (error) {
    alert(`创建失败：${error.message}`);
    renderMachineLibraryStatus(`创建失败：${error.message}`, 'warn');
  }
}

function handleMachineLibrarySelectionChange(event) {
  state.activeMachineLibrary = (event.target.value || '').trim();
  persistState();
  renderMachineLibraryStatus(`当前选择：${machineLabel()}`);
  renderExistingStationSuggestions();
}

async function loadMachineLibraryFromSelection() {
  const machineType = currentMachineLibrary();
  if (!machineType) {
    alert('请先选择机型库。');
    return;
  }
  try {
    const payload = await requestJson(`/api/machine-libraries/load?machineType=${encodeURIComponent(machineType)}`);
    const data = payload.data || {};
    state.agreementLibrary = Array.isArray(data.agreementLibrary) ? data.agreementLibrary : [];
    state.reportLibrary = Array.isArray(data.reportLibrary) ? data.reportLibrary : [];
    state.costLibrary = Array.isArray(data.costLibrary) ? data.costLibrary : [];
    state.parts = Array.isArray(data.parts) ? data.parts : [];
    state.productTypes = Array.isArray(data.productTypes) ? data.productTypes : [];
    state.focusRules = Array.isArray(data.focusRules) ? data.focusRules : [];
    state.infoDocs = Array.isArray(data.infoDocs) ? data.infoDocs : [];
    state.refDocs = Array.isArray(data.refDocs) ? data.refDocs : [];
    state.activeMachineLibrary = machineType;
    refreshLastAssessment();
    persistState();
    renderAgreementFilterOptions();
    renderAgreementLibraryTable();
    renderReportLibraryTable();
    renderCostLibraryTable();
    renderFocusRuleTable();
    renderInfoDocTable();
    renderProductTypeTable();
    renderPartsTable(state.parts);
    renderRefDocSummary();
    renderLibraryFilterOptions();
    renderLibraryPanels();
    renderAgreementImportSummary();
    renderReportImportSummary();
    renderCostImportSummary();
    renderAssessmentSummary();
    renderProtocolDiffPanel();
    renderQuotePreview();
    renderDashboard();
    renderFrameworkBoards();
    renderMachineLibrarySelect();
    renderMachineLibraryStatus(`已加载机型库：${machineType}`);
    renderExistingStationSuggestions();
  } catch (error) {
    alert(`加载失败：${error.message}`);
    renderMachineLibraryStatus(`加载失败：${error.message}`, 'warn');
  }
}

function normalizeMachineBinding() {
  const machineType = currentMachineLibrary();
  if (!machineType) return;
  state.agreementLibrary.forEach((item) => {
    if (!item.machineType || item.machineType === '待确认机型') item.machineType = machineType;
  });
  state.reportLibrary.forEach((item) => {
    if (!item.machineType || item.machineType === '待确认机型') item.machineType = machineType;
  });
  state.costLibrary.forEach((item) => {
    if (!item.machineType || item.machineType === '待确认机型') item.machineType = machineType;
  });
  state.parts.forEach((item) => {
    if (!item.machineType) item.machineType = machineType;
  });
  state.productTypes.forEach((item) => {
    if (!item.machineType) item.machineType = machineType;
  });
}

function collectStationsByMachine(machineType) {
  if (!machineType) return [];
  return unique([
    ...state.agreementLibrary.filter((item) => (item.machineType || '') === machineType).flatMap((item) => item.stations || []),
    ...state.reportLibrary.filter((item) => (item.machineType || '') === machineType).flatMap((item) => item.stations || []),
    ...state.costLibrary.filter((item) => (item.machineType || '') === machineType).flatMap((item) => item.stations || []),
    ...state.parts.filter((item) => (item.machineType || '') === machineType).flatMap((item) => item.stationScope || [])
  ].filter(Boolean));
}

function renderExistingStationSuggestions() {
  const agreementMachine = (document.getElementById('agreementMachineTypeInput')?.value || '').trim() || currentMachineLibrary();
  const reportMachine = (document.getElementById('reportMachineTypeInput')?.value || '').trim() || currentMachineLibrary();
  const costMachine = (document.getElementById('costMachineTypeInput')?.value || '').trim() || currentMachineLibrary();

  const agreementPanel = document.getElementById('agreementStationSuggestion');
  const reportPanel = document.getElementById('reportStationSuggestion');
  const costPanel = document.getElementById('costStationSuggestion');

  if (agreementPanel) {
    const stations = collectStationsByMachine(agreementMachine);
    agreementPanel.textContent = `机型已有关联工位：${stations.length ? stations.join('、') : '暂无'}`;
  }
  if (reportPanel) {
    const stations = collectStationsByMachine(reportMachine);
    reportPanel.textContent = `机型已有关联工位：${stations.length ? stations.join('、') : '暂无'}`;
  }
  if (costPanel) {
    const stations = collectStationsByMachine(costMachine);
    costPanel.textContent = `机型已有关联工位：${stations.length ? stations.join('、') : '暂无'}`;
  }
}

async function saveCurrentToMachineLibrary() {
  const machineType = currentMachineLibrary();
  if (!machineType) {
    alert('请先选择机型库再保存。');
    return;
  }
  try {
    normalizeMachineBinding();
    const payload = {
      machineType,
      data: machineLibrarySnapshot()
    };
    await requestJson('/api/machine-libraries/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    persistState();
    await fetchMachineLibraryList();
    renderMachineLibraryStatus(`已保存到机型库：${machineType}`);
  } catch (error) {
    alert(`保存失败：${error.message}`);
    renderMachineLibraryStatus(`保存失败：${error.message}`, 'warn');
  }
}

function refreshLastAssessment() {
  if (!state.docs.length) {
    state.lastAssessment = null;
    state.lastProtocolProfile = null;
    return;
  }
  state.lastProtocolProfile = buildProtocolProfileFromDocs(state.docs);
  state.lastAssessment = generateComprehensiveAssessment(state.docs, state.refDocs, state.parts, state.productTypes);
  state.lastAssessment.protocolProfile = state.lastProtocolProfile;
  state.lastAssessment.comparison = compareWithKnowledgeBase(state.docs, state.agreementLibrary, state.focusRules, state.infoDocs);
}

function defaultParts() {
  return [
    { id: uid(), category: '相机', name: '工业面阵相机', model: 'CA-5000', brand: 'Basler', price: 8200, specPrecisionUm: 12, leadTimeDays: 14 },
    { id: uid(), category: '相机', name: '高精度相机', model: 'MV-9000', brand: 'Hikrobot', price: 7600, specPrecisionUm: 8, leadTimeDays: 10 },
    { id: uid(), category: '镜头', name: '定焦镜头', model: 'LM16XC', brand: 'Computar', price: 2100, specPrecisionUm: 8, leadTimeDays: 12 },
    { id: uid(), category: '光源', name: '环形光源', model: 'RL-120', brand: 'OPT', price: 980, specPrecisionUm: 15, leadTimeDays: 7 },
    { id: uid(), category: '控制器', name: '视觉控制器', model: 'VC-Pro', brand: 'Omron', price: 12600, specPrecisionUm: 10, leadTimeDays: 18 }
  ];
}

async function parseDocuments() {
  const fileInput = document.getElementById('docInput');
  const folderInput = document.getElementById('folderInput');
  const fileList = Array.from(fileInput.files || []);
  const folderFiles = Array.from(folderInput.files || []);

  const files = deduplicateFiles([...fileList, ...folderFiles]);
  if (!files.length) {
    alert('请先选择文件或文件夹。');
    return;
  }

  const results = [];
  for (const file of files) {
    const result = await parseSingleFile(file);
    results.push(result);
  }

  state.docs = results.map((item) => ({
    fileName: item.fileName,
    filePath: item.filePath,
    ext: item.ext,
    parseLevel: item.parseLevel,
    highlights: item.highlights,
    textSample: item.textSample,
    note: ''
  }));

  refreshLastAssessment();

  persistState();
  renderDocSummary();
  renderAssessmentSummary();
  renderDocNotes();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
}

async function parseSingleFile(file) {
  const filePath = file.webkitRelativePath || file.name;
  const ext = extensionOf(file.name);
  if (['txt', 'md', 'csv', 'json'].includes(ext)) {
    const text = await file.text();
    return makeParsedResult(file.name, filePath, ext, 'native', extractHighlights(text), text);
  }

  if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
    const bytes = await file.arrayBuffer();
    const text = binaryToText(bytes);
    const highlights = extractHighlights(text);
    highlights.push('已走预留解析流程：建议接入专业解析引擎提高准确率');
    return makeParsedResult(file.name, filePath, ext, 'reserved', highlights, text);
  }

  return makeParsedResult(file.name, filePath, ext, 'unknown', ['暂不支持的类型，已保留记录'], '');
}

function makeParsedResult(fileName, filePath, ext, parseLevel, highlights, text) {
  return {
    fileName,
    filePath,
    ext,
    parseLevel,
    highlights: unique(highlights).slice(0, 8),
    textSample: String(text || '').slice(0, 3000)
  };
}

function extractHighlights(text) {
  const safeText = (text || '').slice(0, 40000);
  const hits = [];

  const precisionMatch = safeText.match(/(精度|accuracy)[^\d]{0,8}(\d+(?:\.\d+)?)\s*(um|μm|mm)/i);
  if (precisionMatch) hits.push(`识别精度要求: ${precisionMatch[2]} ${precisionMatch[3]}`);

  const speedMatch = safeText.match(/(节拍|产能|speed)[^\d]{0,8}(\d+(?:\.\d+)?)\s*(件\/分|ppm|pcs\/min)/i);
  if (speedMatch) hits.push(`识别节拍要求: ${speedMatch[2]} ${speedMatch[3]}`);

  const keywords = ['缺陷', '划痕', '尺寸', '定位', '同轴光', '背光', '二维码'];
  const found = keywords.filter((word) => safeText.includes(word));
  if (found.length) hits.push(`识别检测要点: ${found.join('、')}`);

  const possibleBrand = Object.keys(brandKnowledge).filter((brand) => safeText.toLowerCase().includes(brand.toLowerCase()));
  if (possibleBrand.length) hits.push(`识别品牌偏好: ${possibleBrand.join('、')}`);

  if (!hits.length) hits.push('已提取文本，但未识别到关键参数，请补充结构化输入。');
  return hits;
}

function binaryToText(arrayBuffer) {
  const view = new Uint8Array(arrayBuffer);
  let output = '';
  for (let i = 0; i < view.length; i += 1) {
    const ch = view[i];
    output += ch >= 32 && ch <= 126 ? String.fromCharCode(ch) : ' ';
    if (output.length >= 40000) break;
  }
  return output;
}

function deduplicateFiles(files) {
  const map = new Map();
  files.forEach((file) => {
    const key = `${file.name}|${file.size}|${file.lastModified}|${file.webkitRelativePath || ''}`;
    map.set(key, file);
  });
  return Array.from(map.values());
}

async function loadAgreementLibrary() {
  const input = document.getElementById('agreementLibInput');
  const machineTypeManual = document.getElementById('agreementMachineTypeInput').value.trim();
  const activeMachineType = currentMachineLibrary();
  const stationManualRaw = document.getElementById('agreementStationInput').value.trim();
  const stationManual = stationManualRaw ? stationManualRaw.split(/[，,、]/).map((item) => item.trim()).filter(Boolean) : [];
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择历史协议文件。');
    return;
  }

  const records = [];
  for (const file of files) {
    const text = await readFileTextFlexible(file);
    const profile = buildProtocolProfileFromText(text, file.name);
    records.push({
      id: uid(),
      name: file.name,
      ext: extensionOf(file.name),
      uploadedAt: new Date().toISOString(),
      machineType: machineTypeManual || (activeMachineType || profile.machineType),
      stations: stationManual.length ? stationManual : profile.stations,
      precisionUm: profile.precisionUm,
      solutionType: profile.solutionType,
      standardHardware: profile.standardHardware,
      performanceSummary: profile.performanceSummary,
      text: text.slice(0, 20000),
      highlights: extractHighlights(text)
    });
  }

  state.agreementLibrary = mergeByName(state.agreementLibrary, records);
  renderAgreementFilterOptions();
  renderLibraryFilterOptions();
  refreshLastAssessment();
  persistState();
  renderAgreementLibraryTable();
  renderAgreementImportSummary();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('协议导入');
  renderExistingStationSuggestions();

  document.getElementById('agreementMachineTypeInput').value = '';
  document.getElementById('agreementStationInput').value = '';
}

async function loadReportLibrary() {
  const input = document.getElementById('reportFileInput');
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择视觉方案报告。');
    return;
  }

  const machineManual = (document.getElementById('reportMachineTypeInput').value || '').trim();
  const activeMachineType = currentMachineLibrary();
  const stationManualRaw = (document.getElementById('reportStationInput').value || '').trim();
  const stationManual = stationManualRaw ? stationManualRaw.split(/[，,、]/).map((item) => item.trim()).filter(Boolean) : [];

  const records = [];
  for (const file of files) {
    const text = await readFileTextFlexible(file);
    const profile = buildProtocolProfileFromText(text, file.name);
    const stationDetailsAuto = inferStationDetails(text, file.name, profile.solutionType, profile.precisionUm);
    const stationDetails = stationManual.length
      ? stationManual.map((station, index) => ({
        stationNo: normalizeStationNo(station) || `工位${index + 1}`,
        stationName: '',
        precisionUm: profile.precisionUm || '',
        solutionContent: profile.solutionType || ''
      }))
      : stationDetailsAuto;

    const stations = stationDetails.map((item) => item.stationNo);
    const stationConfigSummary = stationDetails
      .map((item) => `${item.stationNo}${item.stationName ? ` ${item.stationName}` : ''}`)
      .join('；');

    records.push({
      id: uid(),
      name: file.name,
      ext: extensionOf(file.name),
      uploadedAt: new Date().toISOString(),
      machineType: machineManual || (activeMachineType || profile.machineType),
      stations,
      stationDetails,
      solutionType: profile.solutionType,
      stationConfigSummary: stationConfigSummary || (stations || []).join('、'),
      parseNote: text.trim().length < 30 ? '解析内容较少，请手动补充机型/工位/方案信息' : '解析成功',
      text: text.slice(0, 20000),
      highlights: extractHighlights(text)
    });
  }

  state.reportLibrary = mergeByName(state.reportLibrary, records);
  renderLibraryFilterOptions();
  refreshLastAssessment();
  persistState();
  renderReportLibraryTable();
  renderReportImportSummary();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('方案报告导入');
  renderExistingStationSuggestions();
}

async function loadCostLibrary() {
  const input = document.getElementById('costFileInput');
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择成本预估表。');
    return;
  }

  const machineManual = (document.getElementById('costMachineTypeInput').value || '').trim();
  const activeMachineType = currentMachineLibrary();
  const stationManualRaw = (document.getElementById('costStationInput').value || '').trim();
  const stationManual = stationManualRaw ? stationManualRaw.split(/[，,、]/).map((item) => item.trim()).filter(Boolean) : [];

  const records = [];
  for (const file of files) {
    const text = await readFileTextFlexible(file);
    const ext = extensionOf(file.name);
    const rows = parsePriceRows(text, ext);
    const total = rows.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const parseNote = rows.length
      ? `已解析 ${rows.length} 条成本项`
      : (['xlsx', 'xls'].includes(ext) ? '当前无第三方解析器，建议先另存为 CSV/TXT/JSON 再导入，或手动编辑补录' : '未识别到成本条目，请手动编辑补录');
    records.push({
      id: uid(),
      name: file.name,
      ext,
      uploadedAt: new Date().toISOString(),
      machineType: machineManual || (activeMachineType || inferMachineType(text, file.name)),
      stations: stationManual.length ? stationManual : inferStations(text, file.name),
      rowCount: rows.length,
      totalCost: Number(total.toFixed(2)),
      parseNote,
      text: text.slice(0, 20000)
    });
  }

  state.costLibrary = mergeByName(state.costLibrary, records);
  renderLibraryFilterOptions();
  refreshLastAssessment();
  persistState();
  renderCostLibraryTable();
  renderCostImportSummary();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('成本表导入');
  renderExistingStationSuggestions();
}

async function loadInfoDocuments() {
  const input = document.getElementById('infoDocInput');
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择信息文档。');
    return;
  }

  const docs = [];
  for (const file of files) {
    const text = await readFileTextFlexible(file);
    docs.push({
      id: uid(),
      name: file.name,
      ext: extensionOf(file.name),
      uploadedAt: new Date().toISOString(),
      text: text.slice(0, 16000),
      highlights: extractHighlights(text)
    });
  }

  state.infoDocs = mergeByName(state.infoDocs, docs);
  refreshLastAssessment();
  persistState();
  renderInfoDocTable();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
}

function addFocusRule(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const keyword = String(formData.get('keyword')).trim();
  const weight = Number(formData.get('weight'));
  const description = String(formData.get('description')).trim();

  if (!keyword || Number.isNaN(weight) || !description) {
    alert('关注规则信息不完整。');
    return;
  }

  state.focusRules.push({ id: uid(), keyword, weight, description, machineType: currentMachineLibrary() || '' });
  refreshLastAssessment();
  persistState();
  renderFocusRuleTable();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  event.target.reset();
}

function renderAgreementLibraryTable() {
  const container = document.getElementById('agreementLibTable');
  if (!container) return;
  if (!state.agreementLibrary.length) {
    container.innerHTML = '<span class="small">暂无历史技术协议。</span>';
    return;
  }

  const machineFilter = document.getElementById('agreementMachineFilter').value;
  const stationFilter = document.getElementById('agreementStationFilter').value;

  const rowsData = state.agreementLibrary.filter((item) => {
    const machinePass = !machineFilter || (item.machineType || '') === machineFilter;
    const stationPass = !stationFilter || (item.stations || []).includes(stationFilter);
    return machinePass && stationPass;
  });

  if (!rowsData.length) {
    container.innerHTML = '<span class="small">当前筛选条件下无历史协议。</span>';
    return;
  }

  const rows = rowsData.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.machineType || '-')}</td>
      <td>${escapeHtml((item.stations || []).join('、') || '-')}</td>
      <td>${escapeHtml(item.solutionType || '-')}</td>
      <td>${item.precisionUm || '-'}</td>
      <td>${escapeHtml(item.ext || '-')}</td>
      <td>${escapeHtml(new Date(item.uploadedAt).toLocaleString('zh-CN'))}</td>
      <td>
        <button class="edit-agreement-btn" data-id="${item.id}">编辑</button>
        <button class="delete-agreement-btn" data-id="${item.id}">删除</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `<table><thead><tr><th>文件名</th><th>机型</th><th>工位</th><th>方案</th><th>精度(um)</th><th>类型</th><th>导入时间</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`;
  container.querySelectorAll('.edit-agreement-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      editAgreementRecord(id);
    });
  });
  container.querySelectorAll('.delete-agreement-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.agreementLibrary = state.agreementLibrary.filter((item) => item.id !== id);
      renderAgreementFilterOptions();
      refreshLastAssessment();
      persistState();
      renderAgreementLibraryTable();
      renderAgreementImportSummary();
      renderLibraryFilterOptions();
      renderLibraryPanels();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
      triggerMachineLibraryAutoSave('协议删除');
    });
  });
}

function renderAgreementFilterOptions() {
  const machineSelect = document.getElementById('agreementMachineFilter');
  const stationSelect = document.getElementById('agreementStationFilter');
  if (!machineSelect || !stationSelect) return;

  const currentMachine = machineSelect.value;
  const currentStation = stationSelect.value;

  const machines = unique(state.agreementLibrary.map((item) => item.machineType).filter(Boolean));
  const stations = unique(state.agreementLibrary.flatMap((item) => item.stations || []).filter(Boolean));

  machineSelect.innerHTML = '<option value="">机型筛选（全部）</option>' + machines.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
  stationSelect.innerHTML = '<option value="">工位筛选（全部）</option>' + stations.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');

  if (machines.includes(currentMachine)) machineSelect.value = currentMachine;
  if (stations.includes(currentStation)) stationSelect.value = currentStation;
}

function renderLibraryFilterOptions() {
  const machineSelect = document.getElementById('libMachineSelect');
  const stationSelect = document.getElementById('libStationSelect');
  if (!machineSelect || !stationSelect) return;

  const machines = unique([
    ...state.agreementLibrary.map((item) => item.machineType),
    ...state.reportLibrary.map((item) => item.machineType),
    ...state.costLibrary.map((item) => item.machineType),
    ...state.parts.map((item) => item.machineType || '')
  ].filter(Boolean));

  const stations = unique([
    ...state.agreementLibrary.flatMap((item) => item.stations || []),
    ...state.reportLibrary.flatMap((item) => item.stations || []),
    ...state.costLibrary.flatMap((item) => item.stations || []),
    ...state.parts.flatMap((item) => item.stationScope || [])
  ].filter(Boolean));

  machineSelect.innerHTML = '<option value="ALL">机型：ALL</option>' + machines.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
  stationSelect.innerHTML = '<option value="ALL">ALL</option>' + stations.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
}

function getLibrarySelection() {
  const machineSelect = document.getElementById('libMachineSelect');
  const stationSelect = document.getElementById('libStationSelect');
  const machine = machineSelect ? machineSelect.value : 'ALL';
  const stations = stationSelect
    ? Array.from(stationSelect.selectedOptions).map((option) => option.value).filter((value) => value !== 'ALL')
    : [];
  return { machine, stations };
}

function renderLibraryPanels() {
  const { machine, stations } = getLibrarySelection();
  const matchMachine = (item) => machine === 'ALL' || (item.machineType || '') === machine;
  const matchStations = (item) => !stations.length || stations.some((station) => (item.stations || item.stationScope || []).includes(station));

  const protocolRows = state.agreementLibrary.filter((item) => matchMachine(item) && matchStations(item));
  const reportRows = state.reportLibrary.filter((item) => matchMachine(item) && matchStations(item));
  const partRows = state.parts.filter((item) => {
    const itemMachine = item.machineType || 'ALL';
    const itemStations = item.stationScope || [];
    const machinePass = machine === 'ALL' || itemMachine === machine || itemMachine === 'ALL';
    const stationPass = !stations.length || !itemStations.length || stations.some((station) => itemStations.includes(station));
    return machinePass && stationPass;
  });
  const costRows = state.costLibrary.filter((item) => matchMachine(item) && matchStations(item));

  setPanelSummary('libProtocolPanel', '视觉协议内容', protocolRows.map((item) => `${item.name}｜方案:${item.solutionType || '-'}｜精度:${item.precisionUm || '-'}um`));
  setPanelSummary('libReportPanel', '基础方案预览', reportRows.map((item) => `${item.name}｜工位:${(item.stations || []).join('、') || '-'}｜${item.solutionType || '-'}`));
  setPanelSummary('libPartsPanel', '标准件表格', partRows.map((item) => `${item.category}-${item.model} ¥${Number(item.price || 0).toFixed(2)}`));
  setPanelSummary('libCostPanel', '成本页面', costRows.map((item) => `${item.name}｜条目:${item.rowCount}｜合计:¥${Number(item.totalCost || 0).toFixed(2)}`));
}

function setPanelSummary(panelId, title, lines) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (!lines.length) {
    panel.innerHTML = `<strong>${escapeHtml(title)}</strong><div class="small">暂无匹配内容</div>`;
    return;
  }
  panel.innerHTML = `<strong>${escapeHtml(title)}</strong><ul class="summary-list">${lines.slice(0, 8).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
}

function renderAgreementImportSummary() {
  const panel = document.getElementById('agreementImportSummary');
  if (!panel) return;
  if (!state.agreementLibrary.length) {
    panel.innerHTML = '<span class="small">暂无签字版协议总结。</span>';
    return;
  }
  const latest = state.agreementLibrary[state.agreementLibrary.length - 1];
  panel.innerHTML = `<strong>最新协议自动总结</strong><ul class="summary-list"><li>机型：${escapeHtml(latest.machineType || '待确认')}</li><li>工位：${escapeHtml((latest.stations || []).join('、') || '待确认')}</li><li>方案：${escapeHtml(latest.solutionType || '待确认')}</li><li>精度：${latest.precisionUm || '待确认'} um</li><li>性能总结：${escapeHtml(latest.performanceSummary || '待生成')}</li></ul>`;
}

function renderReportImportSummary() {
  const panel = document.getElementById('reportImportSummary');
  if (!panel) return;
  if (!state.reportLibrary.length) {
    panel.innerHTML = '<span class="small">暂无方案报告总结。</span>';
    return;
  }
  const latest = state.reportLibrary[state.reportLibrary.length - 1];
  panel.innerHTML = `<strong>最新方案报告解析</strong><ul class="summary-list"><li>机型：${escapeHtml(latest.machineType || '待确认')}</li><li>工位配置：${escapeHtml(latest.stationConfigSummary || '待确认')}</li><li>方案类型：${escapeHtml(latest.solutionType || '待确认')}</li><li>解析说明：${escapeHtml(latest.parseNote || '正常')}</li></ul>`;
}

function renderCostImportSummary() {
  const panel = document.getElementById('costImportSummary');
  if (!panel) return;
  if (!state.costLibrary.length) {
    panel.innerHTML = '<span class="small">暂无成本预估总结。</span>';
    return;
  }
  const latest = state.costLibrary[state.costLibrary.length - 1];
  panel.innerHTML = `<strong>最新成本表汇总</strong><ul class="summary-list"><li>机型：${escapeHtml(latest.machineType || '待确认')}</li><li>工位：${escapeHtml((latest.stations || []).join('、') || '待确认')}</li><li>条目数：${latest.rowCount}</li><li>合计：¥${Number(latest.totalCost || 0).toFixed(2)}</li><li>解析说明：${escapeHtml(latest.parseNote || '正常')}</li></ul>`;
}

function renderReportLibraryTable() {
  const panel = document.getElementById('reportLibraryTable');
  if (!panel) return;
  const activeMachine = currentMachineLibrary();
  const rowsData = activeMachine
    ? state.reportLibrary.filter((item) => (item.machineType || '') === activeMachine)
    : state.reportLibrary;
  if (!rowsData.length) {
    panel.innerHTML = '<span class="small">暂无视觉方案报告。</span>';
    return;
  }
  const rows = [];
  rowsData.forEach((item) => {
    const details = Array.isArray(item.stationDetails) && item.stationDetails.length
      ? item.stationDetails
      : (item.stations || []).map((stationNo) => ({
        stationNo,
        stationName: '',
        precisionUm: '',
        solutionContent: item.solutionType || ''
      }));

    if (!details.length) {
      details.push({ stationNo: '待确认工位', stationName: '', precisionUm: '', solutionContent: item.solutionType || '' });
    }

    details.forEach((detail, index) => {
      rows.push(`<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.machineType || '-')}</td><td>${escapeHtml(detail.stationNo || '-')}</td><td>${escapeHtml(detail.stationName || '-')}</td><td>${detail.precisionUm || '-'}</td><td>${escapeHtml(detail.solutionContent || item.solutionType || '-')}</td><td>${escapeHtml(item.parseNote || '-')}</td><td><button class="edit-report-station-btn" data-id="${item.id}" data-index="${index}">编辑工位</button><button class="edit-report-btn" data-id="${item.id}">编辑文件</button><button class="delete-report-btn" data-id="${item.id}">删除</button></td></tr>`);
    });
  });

  panel.innerHTML = `<table><thead><tr><th>文件名</th><th>机型</th><th>工位</th><th>工位内容</th><th>精度(um)</th><th>方案内容</th><th>解析说明</th><th>操作</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;

  panel.querySelectorAll('.edit-report-station-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const index = Number(button.dataset.index);
      editReportStationRecord(id, index);
    });
  });
  panel.querySelectorAll('.edit-report-btn').forEach((button) => {
    button.addEventListener('click', () => editReportRecord(button.dataset.id));
  });
  panel.querySelectorAll('.delete-report-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.reportLibrary = state.reportLibrary.filter((item) => item.id !== id);
      refreshLastAssessment();
      persistState();
      renderReportLibraryTable();
      renderReportImportSummary();
      renderLibraryFilterOptions();
      renderLibraryPanels();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
      triggerMachineLibraryAutoSave('方案删除');
    });
  });
}

function renderCostLibraryTable() {
  const panel = document.getElementById('costLibraryTable');
  if (!panel) return;
  const activeMachine = currentMachineLibrary();
  const rowsData = activeMachine
    ? state.costLibrary.filter((item) => (item.machineType || '') === activeMachine)
    : state.costLibrary;
  if (!rowsData.length) {
    panel.innerHTML = '<span class="small">暂无成本预估表。</span>';
    return;
  }
  const rows = rowsData.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.machineType || '-')}</td><td>${escapeHtml((item.stations || []).join('、') || '-')}</td><td>${item.rowCount}</td><td>¥${Number(item.totalCost || 0).toFixed(2)}</td><td>${escapeHtml(item.parseNote || '-')}</td><td><button class="edit-cost-btn" data-id="${item.id}">编辑</button><button class="delete-cost-btn" data-id="${item.id}">删除</button></td></tr>`).join('');
  panel.innerHTML = `<table><thead><tr><th>文件名</th><th>机型</th><th>工位</th><th>条目数</th><th>合计</th><th>解析说明</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`;

  panel.querySelectorAll('.edit-cost-btn').forEach((button) => {
    button.addEventListener('click', () => editCostRecord(button.dataset.id));
  });
  panel.querySelectorAll('.delete-cost-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.costLibrary = state.costLibrary.filter((item) => item.id !== id);
      refreshLastAssessment();
      persistState();
      renderCostLibraryTable();
      renderCostImportSummary();
      renderLibraryFilterOptions();
      renderLibraryPanels();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
      triggerMachineLibraryAutoSave('成本删除');
    });
  });
}

function editAgreementRecord(id) {
  const record = state.agreementLibrary.find((item) => item.id === id);
  if (!record) return;

  const machineType = prompt('编辑机型：', record.machineType || '');
  if (machineType === null) return;
  const stationsText = prompt('编辑工位（逗号分隔）：', (record.stations || []).join(','));
  if (stationsText === null) return;
  const solutionType = prompt('编辑方案类型：', record.solutionType || '');
  if (solutionType === null) return;
  const precisionText = prompt('编辑精度要求(um)：', record.precisionUm ? String(record.precisionUm) : '');
  if (precisionText === null) return;

  record.machineType = machineType.trim();
  record.stations = stationsText.split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
  record.solutionType = solutionType.trim();
  const precisionNum = Number(precisionText);
  record.precisionUm = Number.isNaN(precisionNum) ? record.precisionUm : precisionNum;

  renderAgreementFilterOptions();
  refreshLastAssessment();
  persistState();
  renderAgreementLibraryTable();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  renderAgreementImportSummary();
  renderLibraryFilterOptions();
  renderLibraryPanels();
  triggerMachineLibraryAutoSave('协议编辑');
}

function editReportRecord(id) {
  const record = state.reportLibrary.find((item) => item.id === id);
  if (!record) return;

  const machineType = prompt('编辑机型：', record.machineType || '');
  if (machineType === null) return;
  const stationsText = prompt('编辑工位（逗号分隔）：', (record.stations || []).join(','));
  if (stationsText === null) return;
  const solutionType = prompt('编辑方案类型：', record.solutionType || '');
  if (solutionType === null) return;

  record.machineType = machineType.trim();
  record.stations = stationsText.split(/[，,、]/).map((item) => normalizeStationNo(item.trim()) || item.trim()).filter(Boolean);
  record.solutionType = solutionType.trim();
  if (!Array.isArray(record.stationDetails) || !record.stationDetails.length) {
    record.stationDetails = record.stations.map((stationNo) => ({
      stationNo,
      stationName: '',
      precisionUm: '',
      solutionContent: record.solutionType || ''
    }));
  }
  rebuildReportRecordDerivedFields(record);

  refreshLastAssessment();
  persistState();
  renderReportLibraryTable();
  renderReportImportSummary();
  renderLibraryFilterOptions();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('方案编辑');
}

function editReportStationRecord(id, stationIndex) {
  const record = state.reportLibrary.find((item) => item.id === id);
  if (!record) return;
  if (!Array.isArray(record.stationDetails) || !record.stationDetails.length) {
    record.stationDetails = (record.stations || []).map((stationNo) => ({
      stationNo,
      stationName: '',
      precisionUm: '',
      solutionContent: record.solutionType || ''
    }));
  }

  const target = record.stationDetails[stationIndex];
  if (!target) return;

  const stationNoInput = prompt('编辑工位编号（如1站/工位1）：', target.stationNo || '');
  if (stationNoInput === null) return;
  const stationNameInput = prompt('编辑工位内容（如阴极模切后切口检测）：', target.stationName || '');
  if (stationNameInput === null) return;
  const precisionInput = prompt('编辑工位精度(um)：', target.precisionUm === '' ? '' : String(target.precisionUm));
  if (precisionInput === null) return;
  const solutionInput = prompt('编辑工位方案内容：', target.solutionContent || record.solutionType || '');
  if (solutionInput === null) return;

  const precisionNum = Number(precisionInput);
  target.stationNo = normalizeStationNo(stationNoInput.trim()) || stationNoInput.trim();
  target.stationName = stationNameInput.trim();
  target.precisionUm = precisionInput.trim() === '' || Number.isNaN(precisionNum) ? '' : precisionNum;
  target.solutionContent = solutionInput.trim();

  rebuildReportRecordDerivedFields(record);
  refreshLastAssessment();
  persistState();
  renderReportLibraryTable();
  renderReportImportSummary();
  renderLibraryFilterOptions();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('方案工位编辑');
}

function rebuildReportRecordDerivedFields(record) {
  const details = Array.isArray(record.stationDetails) ? record.stationDetails : [];
  record.stations = details.map((item) => item.stationNo).filter(Boolean);
  record.stationConfigSummary = details
    .map((item) => `${item.stationNo || ''}${item.stationName ? ` ${item.stationName}` : ''}`.trim())
    .filter(Boolean)
    .join('；');
}

function editCostRecord(id) {
  const record = state.costLibrary.find((item) => item.id === id);
  if (!record) return;

  const machineType = prompt('编辑机型：', record.machineType || '');
  if (machineType === null) return;
  const stationsText = prompt('编辑工位（逗号分隔）：', (record.stations || []).join(','));
  if (stationsText === null) return;
  const rowCountText = prompt('编辑条目数：', String(record.rowCount || 0));
  if (rowCountText === null) return;
  const totalText = prompt('编辑合计金额：', String(record.totalCost || 0));
  if (totalText === null) return;

  const rowCount = Number(rowCountText);
  const totalCost = Number(totalText);
  record.machineType = machineType.trim();
  record.stations = stationsText.split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
  record.rowCount = Number.isNaN(rowCount) ? record.rowCount : rowCount;
  record.totalCost = Number.isNaN(totalCost) ? record.totalCost : Number(totalCost.toFixed(2));

  refreshLastAssessment();
  persistState();
  renderCostLibraryTable();
  renderCostImportSummary();
  renderLibraryFilterOptions();
  renderLibraryPanels();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('成本编辑');
}

function renderFocusRuleTable() {
  const container = document.getElementById('focusRuleTable');
  if (!container) return;
  if (!state.focusRules.length) {
    container.innerHTML = '<span class="small">暂无关注信息规则。</span>';
    return;
  }

  const rows = state.focusRules.map((item) => `
    <tr>
      <td>${escapeHtml(item.keyword)}</td>
      <td>${item.weight}</td>
      <td>${escapeHtml(item.description)}</td>
      <td><button class="delete-focus-btn" data-id="${item.id}">删除</button></td>
    </tr>
  `).join('');

  container.innerHTML = `<table><thead><tr><th>关键词</th><th>权重</th><th>说明</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`;
  container.querySelectorAll('.delete-focus-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.focusRules = state.focusRules.filter((item) => item.id !== id);
      refreshLastAssessment();
      persistState();
      renderFocusRuleTable();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
      triggerMachineLibraryAutoSave('关注规则删除');
    });
  });
}

function renderInfoDocTable() {
  const container = document.getElementById('infoDocTable');
  if (!container) return;
  if (!state.infoDocs.length) {
    container.innerHTML = '<span class="small">暂无信息文档。</span>';
    return;
  }

  const rows = state.infoDocs.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.ext || '-')}</td>
      <td>${escapeHtml(new Date(item.uploadedAt).toLocaleString('zh-CN'))}</td>
      <td><button class="delete-info-doc-btn" data-id="${item.id}">删除</button></td>
    </tr>
  `).join('');

  container.innerHTML = `<table><thead><tr><th>文件名</th><th>类型</th><th>导入时间</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`;
  container.querySelectorAll('.delete-info-doc-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.infoDocs = state.infoDocs.filter((item) => item.id !== id);
      refreshLastAssessment();
      persistState();
      renderInfoDocTable();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
      triggerMachineLibraryAutoSave('信息文档删除');
    });
  });
}

function compareWithKnowledgeBase(currentDocs, agreementLibrary, focusRules, infoDocs) {
  const currentText = currentDocs.map((doc) => doc.textSample || '').join('\n').toLowerCase();
  const libraryText = agreementLibrary.map((doc) => doc.text || '').join('\n').toLowerCase();
  const infoText = infoDocs.map((doc) => doc.text || '').join('\n').toLowerCase();
  const currentProfile = buildProtocolProfileFromDocs(currentDocs);

  const currentFeatures = collectFeatureKeywords(currentText);
  const knownFeatures = unique([...collectFeatureKeywords(libraryText), ...collectFeatureKeywords(infoText)]);
  const newFeatures = currentFeatures.filter((item) => !knownFeatures.includes(item));

  const focusHits = focusRules.filter((rule) => currentText.includes(rule.keyword.toLowerCase()));
  const focusMissing = focusRules.filter((rule) => !currentText.includes(rule.keyword.toLowerCase()));

  const similarity = scoreMatch(currentFeatures, knownFeatures);
  const riskScore = Math.max(0, 100 - Math.round(similarity * 60) - focusHits.reduce((sum, item) => sum + item.weight, 0));

  const notes = [];
  const libraryMachines = unique(agreementLibrary.map((item) => item.machineType).filter(Boolean));
  if (currentProfile.machineType && libraryMachines.length && !libraryMachines.includes(currentProfile.machineType)) {
    notes.push(`机型差异：当前识别为 ${currentProfile.machineType}，资料库暂无同机型样本`);
  }

  const libraryStations = unique(agreementLibrary.flatMap((item) => item.stations || []).filter(Boolean));
  const newStations = currentProfile.stations.filter((item) => !libraryStations.includes(item));
  if (newStations.length) {
    notes.push(`工位差异：新增工位 ${newStations.join('、')}`);
  }

  if (newFeatures.length) notes.push(`发现新增检测关注项：${newFeatures.join('、')}`);
  if (focusMissing.length) notes.push(`未覆盖关注规则：${focusMissing.map((item) => item.keyword).join('、')}`);
  if (!notes.length) notes.push('当前协议与资料库高度一致，未发现明显差异点。');

  return {
    similarity,
    riskScore,
    focusHits,
    focusMissing,
    newFeatures,
    profile: currentProfile,
    notes
  };
}

function renderProtocolDiffPanel() {
  const container = document.getElementById('protocolDiffPanel');
  if (!container) return;

  const comparison = state.lastAssessment && state.lastAssessment.comparison;
  if (!comparison) {
    container.innerHTML = '<span class="small">暂无协议差异备注，请先导入并解析新协议。</span>';
    return;
  }

  const similarity = Math.round(comparison.similarity * 100);
  container.innerHTML = `
    <strong>协议差异点备注</strong>
    <div>资料库相似度：${similarity}% ｜ 风险分：${comparison.riskScore}</div>
    <div>识别机型：${escapeHtml((comparison.profile && comparison.profile.machineType) || '待识别')} ｜ 识别工位：${escapeHtml((comparison.profile && comparison.profile.stations.join('、')) || '待识别')}</div>
    <ul class="summary-list">${comparison.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  `;
}

function renderQuotePreview() {
  const container = document.getElementById('quotePreview');
  if (!container) return;

  if (!state.lastEvaluation) {
    container.innerHTML = '<span class="small">暂无报价预览，请先执行评估。</span>';
    return;
  }

  const quote = buildQuoteFromEvaluation(state.lastEvaluation, state.lastAssessment);
  container.innerHTML = `
    <strong>报价预览</strong>
    <table>
      <thead><tr><th>项目</th><th>金额(¥)</th><th>说明</th></tr></thead>
      <tbody>
        ${quote.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.amount.toFixed(2)}</td><td>${escapeHtml(item.note)}</td></tr>`).join('')}
        <tr><td><strong>总计</strong></td><td><strong>${quote.total.toFixed(2)}</strong></td><td>基础估算</td></tr>
      </tbody>
    </table>
  `;
}

function buildQuoteFromEvaluation(evaluation, assessment) {
  const items = [];
  ['相机', '镜头', '光源', '控制器'].forEach((category) => {
    const part = evaluation.recommended[category];
    if (part) {
      items.push({ name: `${category}-${part.model}`, amount: Number(part.price), note: `${part.brand}` });
    }
  });

  items.push({ name: '软件集成包', amount: Number((evaluation.cost.hardwareCost * 0.18).toFixed(2)), note: '视觉算法/通讯/调试' });
  if (assessment && assessment.requiredKeywords && assessment.requiredKeywords.includes('二维码')) {
    items.push({ name: 'OCR/条码扩展包', amount: 6000, note: '按关键词自动追加' });
  }
  if (assessment && assessment.comparison && assessment.comparison.riskScore > 55) {
    items.push({ name: '风险缓冲费', amount: 8000, note: '协议差异风险较高' });
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return { items, total };
}

async function importPartPriceTable() {
  const input = document.getElementById('partPriceFileInput');
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择价格表文件。');
    return;
  }

  let updatedCount = 0;
  const logs = [];

  for (const file of files) {
    const ext = extensionOf(file.name);
    const text = await readFileTextFlexible(file);
    const rows = parsePriceRows(text, ext);
    rows.forEach((row) => {
      const target = state.parts.find((part) => part.model.toLowerCase() === row.model.toLowerCase());
      if (target) {
        target.price = row.price;
        if (row.brand) target.brand = row.brand;
        updatedCount += 1;
      }
    });
    logs.push(`${file.name}: 识别 ${rows.length} 条，更新 ${rows.filter((row) => state.parts.some((part) => part.model.toLowerCase() === row.model.toLowerCase())).length} 条`);
  }

  state.partPriceImportLog = { updatedAt: new Date().toISOString(), updatedCount, logs };
  refreshLastAssessment();
  persistState();
  renderPartsTable(state.parts);
  renderPartPriceImportLog();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
}

function renderPartPriceImportLog() {
  const container = document.getElementById('partPriceImportLog');
  if (!container) return;
  if (!state.partPriceImportLog) {
    container.innerHTML = '<span class="small">暂无价格表导入记录。</span>';
    return;
  }

  container.innerHTML = `
    <div><strong>最近导入：</strong>${new Date(state.partPriceImportLog.updatedAt).toLocaleString('zh-CN')}，更新标准件 ${state.partPriceImportLog.updatedCount} 条</div>
    <ul class="summary-list">${state.partPriceImportLog.logs.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
  `;
}

function parsePriceRows(text, ext) {
  const rows = [];
  if (ext === 'json') {
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
      list.forEach((item) => {
        if (!item) return;
        const model = String(item.model || item.型号 || '').trim();
        const price = Number(item.price || item.单价 || item.价格);
        if (!model || Number.isNaN(price)) return;
        rows.push({ model, price, brand: String(item.brand || item.品牌 || '').trim() });
      });
      return rows;
    } catch (error) {
      return rows;
    }
  }

  String(text).split(/\r?\n/).forEach((line) => {
    const cols = line.split(/[\t,，;]/).map((item) => item.trim()).filter(Boolean);
    if (cols.length < 2) return;
    const price = Number(cols[cols.length - 1].replace(/[¥￥]/g, ''));
    if (Number.isNaN(price)) return;
    const model = cols[0];
    const brand = cols.length >= 3 ? cols[1] : '';
    rows.push({ model, brand, price });
  });
  return rows;
}

async function readFileTextFlexible(file) {
  const ext = extensionOf(file.name);
  if (['txt', 'md', 'csv', 'json'].includes(ext)) {
    return file.text();
  }
  const bytes = await file.arrayBuffer();

  if (['pptx', 'docx', 'xlsx'].includes(ext)) {
    const officeText = await extractOfficeOpenXmlText(bytes, ext);
    if (officeText && officeText.trim()) {
      return officeText;
    }
  }

  return binaryToText(bytes);
}

async function parsePreviewDocument() {
  const input = document.getElementById('parsePreviewFileInput');
  const statusPanel = document.getElementById('parsePreviewStatus');
  const stationPanel = document.getElementById('parsePreviewStations');
  const textPanel = document.getElementById('parsePreviewText');

  if (!input || !input.files || !input.files.length) {
    if (statusPanel) statusPanel.textContent = '未选择文件。';
    if (stationPanel) stationPanel.innerHTML = '';
    if (textPanel) textPanel.innerHTML = '';
    return;
  }

  const file = input.files[0];
  if (statusPanel) statusPanel.textContent = `解析中：${file.name}`;

  try {
    const text = await readFileTextFlexible(file);
    const profile = buildProtocolProfileFromText(text, file.name);
    const stationParsing = parseStationIntelligence(text, file.name, {
      defaultSolutionType: profile.solutionType,
      defaultPrecisionUm: profile.precisionUm
    });
    profile.stations = stationParsing.stations;
    renderParsePreviewPanels(file, profile, stationParsing, text);
    if (statusPanel) statusPanel.textContent = `解析完成：${file.name}`;
  } catch (error) {
    if (statusPanel) statusPanel.textContent = `解析失败：${error.message}`;
  }
}

function renderParsePreviewPanels(file, profile, stationParsing, text) {
  const stationPanel = document.getElementById('parsePreviewStations');
  const textPanel = document.getElementById('parsePreviewText');
  const ext = extensionOf(file.name).toUpperCase();
  const highlights = extractHighlights(text);
  const stationDetails = stationParsing && Array.isArray(stationParsing.stationDetails) ? stationParsing.stationDetails : [];
  const stationEvidence = stationParsing && Array.isArray(stationParsing.evidence) ? stationParsing.evidence : [];
  const parseLevel = ['TXT', 'MD', 'CSV', 'JSON'].includes(ext) ? 'native' : (['PPTX', 'DOCX', 'XLSX', 'PDF', 'DOC', 'XLS'].includes(ext) ? 'openxml/binary' : 'unknown');

  if (stationPanel) {
    const detailRows = (stationDetails || []).map((item) => `
      <tr>
        <td>${escapeHtml(item.stationNo || '-')}</td>
        <td>${escapeHtml(item.stationName || '-')}</td>
        <td>${item.precisionUm === '' || item.precisionUm === null ? '-' : item.precisionUm}</td>
        <td>${escapeHtml(item.solutionContent || profile.solutionType || '-')}</td>
      </tr>
    `).join('');

    const evidenceRows = stationEvidence.map((item) => `
      <tr>
        <td>${escapeHtml(item.stationNo || '-')}</td>
        <td>${escapeHtml(item.confidence || '-')}</td>
        <td>${escapeHtml(item.rule || '-')}</td>
        <td>${escapeHtml(item.source || '-')}</td>
        <td>${escapeHtml(item.snippet || '-')}</td>
      </tr>
    `).join('');

    stationPanel.innerHTML = `
      <div><strong>文件：</strong>${escapeHtml(file.name)} ｜ 类型：${escapeHtml(ext || '-')}</div>
      <div>解析模式：${escapeHtml(parseLevel)} ｜ 字符数：${String(text || '').length}</div>
      <div>机型：${escapeHtml(profile.machineType || '待确认')} ｜ 精度：${profile.precisionUm || '待确认'}um ｜ 方案：${escapeHtml(profile.solutionType || '待确认')}</div>
      <div>识别工位：${escapeHtml((profile.stations || []).join('、') || '未识别')}</div>
      ${detailRows ? `<table><thead><tr><th>工位编号</th><th>工位内容</th><th>精度(um)</th><th>方案内容</th></tr></thead><tbody>${detailRows}</tbody></table>` : '<div class="small">未识别到工位详情。</div>'}
      ${evidenceRows ? `<div class="small"><strong>命中证据</strong></div><table><thead><tr><th>工位</th><th>置信度</th><th>规则</th><th>来源</th><th>命中片段</th></tr></thead><tbody>${evidenceRows}</tbody></table>` : '<div class="small">未生成命中证据。</div>'}
      <div class="small">关键提示：${highlights.length ? highlights.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('') : '无'}</div>
    `;
  }

  if (textPanel) {
    const snippet = String(text || '').slice(0, 2000);
    textPanel.innerHTML = `
      <div><strong>文本片段</strong>（前2000字符，共${String(text || '').length}）</div>
      <pre>${escapeHtml(snippet)}</pre>
    `;
  }
}

async function extractOfficeOpenXmlText(arrayBuffer, ext) {
  try {
    const entries = parseZipEntries(arrayBuffer);
    if (!entries.length) return '';

    let targetNames = [];
    if (ext === 'pptx') {
      targetNames = entries
        .map((item) => item.fileName)
        .filter((name) => (name.startsWith('ppt/slides/slide') && name.endsWith('.xml')) || (name.startsWith('ppt/notesSlides/notesSlide') && name.endsWith('.xml')))
        .sort();
    } else if (ext === 'docx') {
      targetNames = entries
        .map((item) => item.fileName)
        .filter((name) => name === 'word/document.xml' || name.startsWith('word/header') || name.startsWith('word/footer'))
        .sort();
    } else if (ext === 'xlsx') {
      targetNames = entries
        .map((item) => item.fileName)
        .filter((name) => name === 'xl/sharedStrings.xml' || (name.startsWith('xl/worksheets/sheet') && name.endsWith('.xml')))
        .sort();
    }

    if (!targetNames.length) return '';

    const chunks = [];
    for (const fileName of targetNames) {
      const entry = entries.find((item) => item.fileName === fileName);
      if (!entry) continue;
      const compressed = readZipEntryCompressedData(arrayBuffer, entry);
      const rawBytes = await inflateZipEntryData(compressed, entry.compressionMethod);
      const xmlText = new TextDecoder('utf-8').decode(rawBytes);
      const plain = xmlToPlainText(xmlText);
      if (plain.trim()) chunks.push(plain);
    }

    return chunks.join('\n');
  } catch (error) {
    return '';
  }
}

function parseZipEntries(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const total = view.byteLength;
  const minEocdSize = 22;
  const maxComment = 65535;
  const start = Math.max(0, total - (minEocdSize + maxComment));

  let eocdOffset = -1;
  for (let offset = total - minEocdSize; offset >= start; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) return [];

  const centralDirSize = view.getUint32(eocdOffset + 12, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  if (!centralDirSize || centralDirOffset < 0 || centralDirOffset >= total) return [];

  const entries = [];
  let cursor = centralDirOffset;
  const centralDirEnd = centralDirOffset + centralDirSize;

  while (cursor + 46 <= centralDirEnd && cursor + 46 <= total) {
    const sig = view.getUint32(cursor, true);
    if (sig !== 0x02014b50) break;

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const fileNameStart = cursor + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    if (fileNameEnd > total) break;
    const fileName = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer.slice(fileNameStart, fileNameEnd)));

    entries.push({ fileName, compressionMethod, compressedSize, localHeaderOffset });
    cursor = fileNameEnd + extraLength + commentLength;
  }

  return entries;
}

function readZipEntryCompressedData(arrayBuffer, entry) {
  const view = new DataView(arrayBuffer);
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error('Invalid local header');
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  return new Uint8Array(arrayBuffer.slice(dataStart, dataEnd));
}

async function inflateZipEntryData(compressedData, compressionMethod) {
  if (compressionMethod === 0) {
    return compressedData;
  }

  if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([compressedData]).stream().pipeThrough(ds);
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  return compressedData;
}

function xmlToPlainText(xml) {
  return String(xml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function mergeByName(existing, incoming) {
  const map = new Map();
  existing.forEach((item) => map.set(item.name, item));
  incoming.forEach((item) => map.set(item.name, item));
  return Array.from(map.values());
}

function buildProtocolProfileFromDocs(docs) {
  const text = docs.map((doc) => doc.textSample || '').join('\n');
  const fileName = docs[0] ? docs[0].fileName : '';
  return buildProtocolProfileFromText(text, fileName);
}

function buildProtocolProfileFromText(text, fileName = '') {
  const lower = String(text || '').toLowerCase();
  const machineType = inferMachineType(lower, fileName);
  const stations = inferStations(text, fileName);
  const precisionUm = inferPrecision(text);
  const solutionType = inferSolutionType(lower);
  const standardHardware = inferHardwareMentions(text);

  return {
    machineType,
    stations,
    precisionUm,
    solutionType,
    standardHardware,
    performanceSummary: buildPerformanceSummary({ machineType, stations, precisionUm, solutionType, standardHardware })
  };
}

function inferMachineType(text, fileName) {
  const source = `${text} ${fileName}`.toLowerCase();
  if (source.includes('卷绕')) return '卷绕机';
  if (source.includes('焊接')) return '焊接机';
  if (source.includes('模切')) return '模切机';
  if (source.includes('装配')) return '装配设备';
  return '待确认机型';
}

// P0解析核心：多规则抽取工位并输出“可解释证据”，用于提升准确率与可审计性。
function parseStationIntelligence(text, fileName = '', options = {}) {
  const sourceText = String(text || '');
  const fileNameText = String(fileName || '');
  const combinedSource = `${sourceText}\n${fileNameText}`
    .replace(/[（(]/g, ' ')
    .replace(/[）)]/g, ' ')
    .replace(/[【】\[\]]/g, ' ');

  const stationEvidence = [];

  const addEvidence = (rawNo, rule, source, matchIndex, matchText, confidence, stationName = '') => {
    const stationNo = normalizeStationNo(rawNo);
    if (!stationNo) return;

    const snippet = extractSnippet(combinedSource, matchIndex, String(matchText || '').length || 8);
    stationEvidence.push({
      stationNo,
      stationName: stationName || '',
      rule,
      source,
      confidence,
      snippet
    });
  };

  // 数字工位规则：覆盖“1工位/工位1/STN-01/S01/第3工位/3#站”等常见写法。
  const numericRules = [
    { name: '数字后缀工位', regex: /(?:第\s*)?(\d{1,3})\s*(?:工位|工站|站位|站)\b/gi, source: '正文', confidence: '高' },
    { name: '工位前缀数字', regex: /(?:工位|工站|站位|站)\s*[-_#:：]?\s*0*(\d{1,3})\b/gi, source: '正文', confidence: '高' },
    { name: '英文station前缀', regex: /(?:station|stn|sta)\s*[-_#:：]?\s*0*(\d{1,3})\b/gi, source: '正文', confidence: '高' },
    { name: 'S编号工位', regex: /\bS\s*[-_#:：]?\s*0*(\d{1,3})\b/g, source: '正文', confidence: '中' },
    { name: '#号工位', regex: /(\d{1,3})\s*#\s*(?:站|工位|工站)\b/gi, source: '正文', confidence: '高' },
    { name: '文件名数字工位', regex: /(\d{1,3})\s*(?:站|工位|工站|station|stn|sta)\b/gi, source: '文件名', confidence: '中', useFileName: true }
  ];

  numericRules.forEach((rule) => {
    const ruleSource = rule.useFileName ? fileNameText : combinedSource;
    if (!ruleSource) return;

    let match = rule.regex.exec(ruleSource);
    while (match) {
      const stationName = inferStationNameFromContext(ruleSource, match.index, match[0].length);
      addEvidence(match[1], rule.name, rule.source, match.index, match[0], rule.confidence, stationName);
      match = rule.regex.exec(ruleSource);
    }
  });

  // 中文数字规则：覆盖“一站/第二工位/十号工位”等表达。
  const chineseNumberRule = /(?:第\s*)?([一二三四五六七八九十百零〇两]{1,5})\s*(?:工位|工站|站位|站)\b/g;
  let chineseMatch = chineseNumberRule.exec(combinedSource);
  while (chineseMatch) {
    const no = chineseNumeralToNumber(chineseMatch[1]);
    if (no !== null) {
      const stationName = inferStationNameFromContext(combinedSource, chineseMatch.index, chineseMatch[0].length);
      addEvidence(String(no), '中文数字工位', '正文', chineseMatch.index, chineseMatch[0], '高', stationName);
    }
    chineseMatch = chineseNumberRule.exec(combinedSource);
  }

  const uniqueStations = unique(stationEvidence.map((item) => item.stationNo).filter(Boolean));
  let stations = uniqueStations.sort((left, right) => parseStationOrder(left) - parseStationOrder(right));

  if (!stations.length) {
    const keywordMap = [
      { keys: ['上料', '上料工位', 'feed'], label: '上料站' },
      { keys: ['检测', '检测工位', 'inspection'], label: '检测站' },
      { keys: ['复检', '复判'], label: '复检站' },
      { keys: ['扫码', '条码', '二维码', 'ocr'], label: '扫码站' },
      { keys: ['下料', '下料工位', 'unload'], label: '下料站' }
    ];

    const lower = combinedSource.toLowerCase();
    keywordMap.forEach((item) => {
      const matchedKeyword = item.keys.find((key) => lower.includes(key.toLowerCase()));
      if (!matchedKeyword) return;

      stations.push(item.label);
      stationEvidence.push({
        stationNo: item.label,
        stationName: '',
        rule: `关键词(${matchedKeyword})`,
        source: '正文',
        confidence: '低',
        snippet: matchedKeyword
      });
    });

    stations = unique(stations);
  }

  if (!stations.length) {
    stations = ['待确认工位'];
    stationEvidence.push({
      stationNo: '待确认工位',
      stationName: '',
      rule: '兜底策略',
      source: '系统',
      confidence: '低',
      snippet: '未匹配到工位编号与关键词'
    });
  }

  const stationDetails = stations.map((stationNo) => {
    const evidences = stationEvidence.filter((item) => item.stationNo === stationNo);
    const selectedName = chooseBestStationName(evidences.map((item) => item.stationName));

    return {
      stationNo,
      stationName: selectedName,
      precisionUm: options.defaultPrecisionUm || '',
      solutionContent: options.defaultSolutionType || '',
      confidence: pickBestConfidence(evidences.map((item) => item.confidence))
    };
  }).sort((left, right) => parseStationOrder(left.stationNo) - parseStationOrder(right.stationNo));

  const dedupEvidence = [];
  const evidenceSet = new Set();
  stationEvidence.forEach((item) => {
    const key = `${item.stationNo}|${item.rule}|${item.source}|${item.snippet}`;
    if (evidenceSet.has(key)) return;
    evidenceSet.add(key);
    dedupEvidence.push(item);
  });

  return {
    stations,
    stationDetails,
    evidence: dedupEvidence.sort((left, right) => parseStationOrder(left.stationNo) - parseStationOrder(right.stationNo))
  };
}

function inferStations(text, fileName = '') {
  return parseStationIntelligence(text, fileName).stations;
}

function inferStationDetails(text, fileName = '', defaultSolutionType = '', defaultPrecisionUm = '') {
  const parsed = parseStationIntelligence(text, fileName, {
    defaultSolutionType,
    defaultPrecisionUm
  });
  return parsed.stationDetails;
}

function parseStationOrder(label) {
  const matched = String(label || '').match(/(\d+)/);
  const no = matched ? Number(matched[1]) : Number.MAX_SAFE_INTEGER;
  return Number.isNaN(no) ? Number.MAX_SAFE_INTEGER : no;
}

function normalizeStationNo(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const digitMatched = raw.match(/(\d{1,3})/);
  if (digitMatched) {
    return `${Number(digitMatched[1])}站`;
  }

  const chineseMatched = raw.match(/([一二三四五六七八九十百零〇两]{1,5})/);
  if (chineseMatched) {
    const no = chineseNumeralToNumber(chineseMatched[1]);
    if (no !== null) {
      return `${no}站`;
    }
  }

  return raw;
}

// 中文数字转阿拉伯数字：支持“十/十一/二十/两”等常见工位编号表达。
function chineseNumeralToNumber(text) {
  const source = String(text || '').trim();
  if (!source) return null;
  const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

  if (source === '十') return 10;

  if (source.includes('百')) {
    const [leftPart, rightPartRaw] = source.split('百');
    const left = digits[leftPart] || (leftPart === '' ? 1 : null);
    if (left === null) return null;
    const right = rightPartRaw ? chineseNumeralToNumber(rightPartRaw) : 0;
    if (right === null) return null;
    return left * 100 + right;
  }

  if (source.includes('十')) {
    const [leftPart, rightPart] = source.split('十');
    const left = leftPart ? digits[leftPart] : 1;
    if (typeof left !== 'number') return null;
    if (!rightPart) return left * 10;
    const right = digits[rightPart];
    if (typeof right !== 'number') return null;
    return left * 10 + right;
  }

  if (source.length === 1 && Object.prototype.hasOwnProperty.call(digits, source)) {
    return digits[source];
  }

  return null;
}

function inferStationNameFromContext(source, startIndex, matchedLength) {
  const tail = String(source || '')
    .slice(startIndex + matchedLength, startIndex + matchedLength + 42)
    .replace(/[\r\n]+/g, ' ');

  const matched = tail.match(/^[：:、\-\s]*(?:为|是|负责|包含)?\s*([^，。,；;:\-|\n\r]{2,24})/);
  if (!matched) return '';

  const candidate = String(matched[1] || '')
    .replace(/^(工位|站位|station|stn)/i, '')
    .replace(/(工位|站位|方案|要求)$/i, '')
    .trim();

  if (!candidate || candidate.length < 2) return '';
  return candidate;
}

function extractSnippet(source, startIndex, matchedLength) {
  const text = String(source || '');
  const start = Math.max(0, startIndex - 14);
  const end = Math.min(text.length, startIndex + matchedLength + 20);
  return text.slice(start, end).replace(/[\r\n]+/g, ' ').trim();
}

function chooseBestStationName(nameList) {
  const candidates = (nameList || []).map((item) => String(item || '').trim()).filter(Boolean);
  if (!candidates.length) return '';
  return candidates.sort((left, right) => right.length - left.length)[0];
}

function pickBestConfidence(confidences) {
  const levels = ['高', '中', '低'];
  for (const level of levels) {
    if ((confidences || []).includes(level)) return level;
  }
  return '低';
}

function inferPrecision(text) {
  const m = String(text).match(/(精度|accuracy)[^\d]{0,8}(\d+(?:\.\d+)?)\s*(um|μm|mm)/i);
  if (!m) return null;
  const value = Number(m[2]);
  if (Number.isNaN(value)) return null;
  if ((m[3] || '').toLowerCase() === 'mm') {
    return Number((value * 1000).toFixed(2));
  }
  return value;
}

function inferSolutionType(text) {
  if (text.includes('ocr') || text.includes('二维码')) return '识别+检测复合方案';
  if (text.includes('缺陷') || text.includes('划痕')) return '外观缺陷检测方案';
  if (text.includes('尺寸') || text.includes('测量')) return '尺寸测量方案';
  return '通用视觉检测方案';
}

function inferHardwareMentions(text) {
  const words = ['相机', '镜头', '光源', '控制器', '工控机', '传感器'];
  return words.filter((item) => String(text).includes(item));
}

function buildPerformanceSummary(profile) {
  return `机型：${profile.machineType}；工位：${profile.stations.join('、')}；精度：${profile.precisionUm || '待确认'}um；方案：${profile.solutionType}；硬件：${profile.standardHardware.join('、') || '待确认'}`;
}

async function loadReferenceDocuments() {
  const input = document.getElementById('refDocInput');
  const files = Array.from(input.files || []);
  if (!files.length) {
    alert('请先选择参考文档。');
    return;
  }

  const docs = [];
  for (const file of files) {
    const ext = extensionOf(file.name);
    const text = ['txt', 'md', 'csv', 'json'].includes(ext)
      ? await file.text()
      : binaryToText(await file.arrayBuffer());
    docs.push({
      id: uid(),
      name: file.name,
      ext,
      text: String(text || '').slice(0, 12000),
      highlights: extractHighlights(text)
    });
  }

  state.refDocs = docs;
  refreshLastAssessment();
  persistState();
  renderRefDocSummary();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
}

function addProductType(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const record = {
    id: uid(),
    productType: String(formData.get('productType')).trim(),
    stationName: String(formData.get('stationName')).trim(),
    stationCapability: String(formData.get('stationCapability')).trim(),
    cycleTimeSec: Number(formData.get('cycleTimeSec')),
    machineType: currentMachineLibrary() || ''
  };

  if (!record.productType || !record.stationName || !record.stationCapability || Number.isNaN(record.cycleTimeSec)) {
    alert('产品类型维护信息不完整。');
    return;
  }

  state.productTypes.push(record);
  refreshLastAssessment();
  persistState();
  renderProductTypeTable();
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  event.target.reset();
  renderFrameworkBoards();
  triggerMachineLibraryAutoSave('工位能力新增');
}

function renderRefDocSummary() {
  const container = document.getElementById('refDocSummary');
  if (!container) return;

  if (!state.refDocs.length) {
    container.innerHTML = '<span class="small">暂无参考文档。</span>';
    return;
  }

  container.innerHTML = state.refDocs.map((doc) => {
    const tags = (doc.highlights || []).slice(0, 3).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('');
    return `<div><strong>${escapeHtml(doc.name)}</strong> <span class="small">(${escapeHtml(doc.ext || 'unknown')})</span><div>${tags}</div></div>`;
  }).join('<hr/>');
}

function renderProductTypeTable() {
  const container = document.getElementById('productTypeTable');
  if (!container) return;

  if (!state.productTypes.length) {
    container.innerHTML = '<span class="small">暂无产品类型能力数据。</span>';
    return;
  }

  const rows = state.productTypes.map((item) => `
    <tr>
      <td>${escapeHtml(item.machineType || '-')}</td>
      <td>${escapeHtml(item.productType)}</td>
      <td>${escapeHtml(item.stationName)}</td>
      <td>${escapeHtml(item.stationCapability)}</td>
      <td>${item.cycleTimeSec}</td>
      <td><button class="delete-product-type-btn" data-id="${item.id}">删除</button></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr><th>机型</th><th>产品类型</th><th>工位内容</th><th>工位能力</th><th>工位节拍(s)</th><th>操作</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('.delete-product-type-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.productTypes = state.productTypes.filter((item) => item.id !== id);
      refreshLastAssessment();
      persistState();
      renderProductTypeTable();
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
    });
  });
}

function generateComprehensiveAssessment(docs, refDocs, parts, productTypes) {
  const joinedText = docs.map((doc) => doc.textSample || '').join('\n').toLowerCase();
  const joinedRefText = refDocs.map((doc) => doc.text || '').join('\n').toLowerCase();

  const precisionCandidate = firstNumberFromHighlights(docs, /精度要求:\s*(\d+(?:\.\d+)?)/i, 20);
  const speedCandidate = firstNumberFromHighlights(docs, /节拍要求:\s*(\d+(?:\.\d+)?)/i, 60);
  const fovEstimate = joinedText.includes('大视野') ? 160 : 90;

  const inferInput = {
    productName: inferProductName(docs),
    targetPrecisionUm: precisionCandidate,
    fovWidthMm: fovEstimate,
    lineSpeedPpm: speedCandidate,
    preferredBrand: inferPreferredBrand(joinedText)
  };

  const plan = calculateVisionPlan(inferInput, parts);
  const pixelNeed = Math.ceil((inferInput.fovWidthMm * 1000) / Math.max(1, plan.requiredResolutionUm));
  const requiredMegaPixel = Number(((pixelNeed * pixelNeed) / 1000000).toFixed(2));

  const requiredKeywords = collectFeatureKeywords(joinedText);
  const refKeywords = collectFeatureKeywords(joinedRefText);
  const featureMatchRate = scoreMatch(requiredKeywords, refKeywords);

  const stationMatch = scoreStationCapability(requiredKeywords, productTypes);
  const capabilityScore = Math.round(((featureMatchRate + stationMatch) / 2) * 100);

  return {
    inferInput,
    plan,
    requiredMegaPixel,
    requiredKeywords,
    featureMatchRate,
    stationMatch,
    capabilityScore,
    recommendation: buildAssessmentRecommendation(plan, capabilityScore, requiredKeywords)
  };
}

function renderAssessmentSummary() {
  const container = document.getElementById('assessmentSummary');
  if (!container) return;

  if (!state.lastAssessment) {
    container.innerHTML = '<span class="small">暂无综合评估描述，请先导入资料并解析。</span>';
    return;
  }

  const assess = state.lastAssessment;
  const profile = assess.protocolProfile || state.lastProtocolProfile;
  const featureRate = Math.round(assess.featureMatchRate * 100);
  const stationRate = Math.round(assess.stationMatch * 100);
  const summaryItems = [
    `协议画像：机型 ${profile ? profile.machineType : '待识别'}；工位 ${profile ? profile.stations.join('、') : '待识别'}；方案 ${profile ? profile.solutionType : '待识别'}`,
    `目标产品判定：${assess.inferInput.productName}`,
    `自主推断参数：目标精度 ${assess.inferInput.targetPrecisionUm}um，视野 ${assess.inferInput.fovWidthMm}mm，节拍 ${assess.inferInput.lineSpeedPpm}ppm`,
    `硬件计算：建议分辨能力 ${assess.plan.requiredResolutionUm}um，建议像素能力约 ${assess.requiredMegaPixel}MP`,
    `检测能力匹配：特征匹配 ${featureRate}% / 工位能力匹配 ${stationRate}% / 综合 ${assess.capabilityScore}%`,
    `软件功能匹配：${assess.requiredKeywords.length ? assess.requiredKeywords.join('、') : '未识别关键功能词'}`,
    `方案报告摘要：${profile ? profile.solutionType : '通用视觉方案'}（可在历史协议库手动编辑后重新生成）`,
    `性能总结：${profile ? profile.performanceSummary : '暂无'}`,
    `重点评估结论：${assess.recommendation}`
  ];

  container.innerHTML = `<strong>重点评估内容描述</strong><span class="score-chip">综合分 ${assess.capabilityScore}</span><ul class="summary-list">${summaryItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function buildAssessmentRecommendation(plan, capabilityScore, keywords) {
  const camera = plan.recommended['相机'];
  const control = plan.recommended['控制器'];
  const core = [];
  if (camera) core.push(`相机优先选 ${camera.brand} ${camera.model}`);
  if (control) core.push(`控制器建议 ${control.brand} ${control.model}`);

  if (keywords.includes('二维码')) {
    core.push('需启用条码/OCR算法包');
  }
  if (keywords.includes('划痕') || keywords.includes('缺陷')) {
    core.push('建议叠加缺陷分级与复检流程');
  }

  if (capabilityScore >= 80) {
    return `方案匹配度高，可进入报价阶段；${core.join('；')}`;
  }
  if (capabilityScore >= 60) {
    return `方案可行但需补充验证样本；${core.join('；')}`;
  }
  return `当前匹配度偏低，建议先完善参考文档与工位能力定义；${core.join('；')}`;
}

function collectFeatureKeywords(text) {
  const library = ['缺陷', '划痕', '尺寸', '定位', '二维码', 'OCR', '测量', '分拣'];
  return library.filter((item) => text.toLowerCase().includes(item.toLowerCase()));
}

function scoreMatch(required, available) {
  if (!required.length) return 0.55;
  const hit = required.filter((item) => available.includes(item));
  return hit.length / required.length;
}

function scoreStationCapability(required, productTypes) {
  if (!required.length || !productTypes.length) return 0.4;
  const capabilityText = productTypes.map((item) => item.stationCapability).join(' ').toLowerCase();
  const hit = required.filter((item) => capabilityText.includes(item.toLowerCase()));
  return hit.length / required.length;
}

function firstNumberFromHighlights(docs, regex, fallback) {
  for (const doc of docs) {
    for (const item of doc.highlights || []) {
      const match = String(item).match(regex);
      if (match) {
        const value = Number(match[1]);
        if (!Number.isNaN(value)) return value;
      }
    }
  }
  return fallback;
}

function inferPreferredBrand(text) {
  const match = Object.keys(brandKnowledge).find((brand) => text.includes(brand.toLowerCase()));
  return match || '';
}

function inferProductName(docs) {
  const names = docs.map((doc) => doc.fileName || '');
  if (names.some((name) => name.includes('电池'))) return '电池类产品';
  if (names.some((name) => name.includes('壳') || name.includes('外观'))) return '外观件产品';
  return '待识别产品';
}

function renderDocSummary() {
  const container = document.getElementById('docSummary');
  if (!state.docs.length) {
    container.innerHTML = '<span class="small">暂无解析结果。</span>';
    return;
  }

  container.innerHTML = state.docs.map((doc) => {
    const tags = doc.highlights.map((h) => `<span class="tag">${escapeHtml(h)}</span>`).join('');
    return `
      <div>
        <strong>${escapeHtml(doc.fileName)}</strong>
        <span class="small">(${doc.ext.toUpperCase()} / ${doc.parseLevel})</span>
        <div class="small">路径：${escapeHtml(doc.filePath || doc.fileName)}</div>
        <div>${tags}</div>
      </div>
    `;
  }).join('<hr/>');
}

function renderDocNotes() {
  const container = document.getElementById('docNotes');
  if (!state.docs.length) {
    container.innerHTML = '<span class="small">无原档备注。</span>';
    return;
  }

  container.innerHTML = state.docs.map((doc, index) => `
    <div>
      <div><strong>${escapeHtml(doc.fileName)}</strong> 备注：</div>
      <textarea data-index="${index}" rows="2" placeholder="输入该原档备注...">${escapeHtml(doc.note || '')}</textarea>
    </div>
  `).join('<hr/>');

  container.querySelectorAll('textarea').forEach((area) => {
    area.addEventListener('change', (event) => {
      const idx = Number(event.target.dataset.index);
      state.docs[idx].note = event.target.value.trim();
      persistState();
      renderFrameworkBoards();
    });
  });
}

function addPart(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const part = {
    id: uid(),
    category: String(formData.get('category')).trim(),
    name: String(formData.get('name')).trim(),
    model: String(formData.get('model')).trim(),
    brand: String(formData.get('brand')).trim(),
    price: Number(formData.get('price')),
    specPrecisionUm: Number(formData.get('specPrecisionUm')),
    leadTimeDays: Number(formData.get('leadTimeDays')),
    machineType: String(formData.get('machineType') || '').trim() || currentMachineLibrary() || '',
    stationScope: String(formData.get('stationScope') || '').split(/[，,、]/).map((item) => item.trim()).filter(Boolean)
  };

  if (!part.category || !part.name || !part.model || !part.brand || Number.isNaN(part.price)) {
    alert('标准件信息不完整。');
    return;
  }

  state.parts.push(part);
  refreshLastAssessment();
  persistState();
  renderPartsTable(state.parts);
  renderAssessmentSummary();
  renderProtocolDiffPanel();
  renderQuotePreview();
  renderDashboard();
  renderFrameworkBoards();
  event.target.reset();
  triggerMachineLibraryAutoSave('标准件新增');
}

function handlePartSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  if (!query) {
    renderPartsTable(state.parts);
    return;
  }

  const filtered = state.parts.filter((part) => {
    const text = `${part.category} ${part.model} ${part.brand} ${part.name} ${part.machineType || ''} ${(part.stationScope || []).join(' ')}`.toLowerCase();
    return text.includes(query);
  });

  renderPartsTable(filtered);
}

function renderPartsTable(rows) {
  const container = document.getElementById('partTable');
  if (!rows.length) {
    container.innerHTML = '<span class="small">无标准件数据。</span>';
    return;
  }

  const tableRows = rows.map((part) => `
    <tr>
      <td>${escapeHtml(part.category)}</td>
      <td>${escapeHtml(part.name)}</td>
      <td>${escapeHtml(part.model)}</td>
      <td>${escapeHtml(part.brand)}</td>
      <td>${part.price.toFixed(2)}</td>
      <td>${part.specPrecisionUm}</td>
      <td>${part.leadTimeDays}</td>
      <td>${escapeHtml(part.machineType || '-')}</td>
      <td>${escapeHtml((part.stationScope || []).join('、') || '-')}</td>
      <td><button data-id="${part.id}" class="delete-btn">删除</button></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>类别</th>
          <th>名称</th>
          <th>型号</th>
          <th>品牌</th>
          <th>单价</th>
          <th>精度能力(um)</th>
          <th>交期(天)</th>
          <th>机型</th>
          <th>工位</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  container.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      state.parts = state.parts.filter((part) => part.id !== id);
      refreshLastAssessment();
      persistState();
      renderPartsTable(state.parts);
      renderAssessmentSummary();
      renderProtocolDiffPanel();
      renderQuotePreview();
      renderDashboard();
      renderFrameworkBoards();
    });
  });
}

function runEvaluation(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const input = {
    productName: String(formData.get('productName')).trim(),
    targetPrecisionUm: Number(formData.get('targetPrecisionUm')),
    fovWidthMm: Number(formData.get('fovWidthMm')),
    lineSpeedPpm: Number(formData.get('lineSpeedPpm')),
    preferredBrand: String(formData.get('preferredBrand')).trim()
  };

  const evaluation = calculateVisionPlan(input, state.parts);
  state.lastEvaluation = evaluation;
  persistState();

  renderEvaluation(evaluation);
  renderBrandGuide(evaluation);
  renderQuotePreview();
  renderProtocolDiffPanel();
  renderReportPreview();
  renderDashboard();
  renderFrameworkBoards();
}

function calculateVisionPlan(input, parts) {
  const requiredResolutionUm = Number((input.targetPrecisionUm / 2.5).toFixed(2));
  const recommended = {};

  for (const category of ['相机', '镜头', '光源', '控制器']) {
    const options = parts
      .filter((item) => item.category === category)
      .sort((a, b) => a.price - b.price);

    const selected = options.find((item) => item.specPrecisionUm <= requiredResolutionUm) || options[0] || null;
    recommended[category] = selected;
  }

  const selectedList = Object.values(recommended).filter(Boolean);
  const hardwareCost = selectedList.reduce((sum, item) => sum + item.price, 0);
  const integrationCost = Number((hardwareCost * 0.28).toFixed(2));
  const riskFactor = input.lineSpeedPpm > 120 ? 1.15 : 1.0;
  const totalCost = Number(((hardwareCost + integrationCost) * riskFactor).toFixed(2));

  return {
    input,
    generatedAt: new Date().toISOString(),
    requiredResolutionUm,
    recommended,
    cost: {
      hardwareCost: Number(hardwareCost.toFixed(2)),
      integrationCost,
      speedRiskFactor: riskFactor,
      totalCost
    },
    brandAdvice: generateBrandAdvice(input.preferredBrand, recommended)
  };
}

function generateBrandAdvice(preferredBrand, recommended) {
  if (!preferredBrand) {
    return {
      status: 'none',
      message: '未指定强制品牌，采用综合性价比推荐。',
      suggestions: []
    };
  }

  const selectedBrands = Object.values(recommended)
    .filter(Boolean)
    .map((item) => ({ category: item.category, brand: item.brand }));

  const deviation = selectedBrands.filter((item) => item.brand.toLowerCase() !== preferredBrand.toLowerCase());
  if (!deviation.length) {
    return {
      status: 'aligned',
      message: `当前方案与指定品牌 ${preferredBrand} 保持一致。`,
      suggestions: []
    };
  }

  const suggestions = deviation.map((item) => {
    const candidates = preferredBrandsByCategory[item.category] || [];
    const fallbackBrand = candidates[0] || item.brand;
    return {
      category: item.category,
      currentBrand: item.brand,
      recommendBrand: fallbackBrand,
      benefit: brandKnowledge[fallbackBrand] || '具备更优供应链与调试支持能力'
    };
  });

  return {
    status: 'deviated',
    message: `检测到与指定品牌 ${preferredBrand} 存在偏离，建议参考替代品牌优点。`,
    suggestions
  };
}

function renderEvaluation(evaluation) {
  const container = document.getElementById('evalResult');
  const rows = ['相机', '镜头', '光源', '控制器'].map((category) => {
    const item = evaluation.recommended[category];
    if (!item) return `<li>${category}: 无可用标准件</li>`;
    return `<li>${category}: ${escapeHtml(item.brand)} ${escapeHtml(item.model)} / ¥${item.price.toFixed(2)}</li>`;
  }).join('');

  container.innerHTML = `
    <div><strong>产品：</strong>${escapeHtml(evaluation.input.productName)}</div>
    <div><strong>目标精度：</strong>${evaluation.input.targetPrecisionUm} um</div>
    <div><strong>建议分辨能力：</strong>${evaluation.requiredResolutionUm} um</div>
    <ul>${rows}</ul>
    <div class="ok"><strong>硬件成本：</strong>¥${evaluation.cost.hardwareCost.toFixed(2)}</div>
    <div><strong>集成成本：</strong>¥${evaluation.cost.integrationCost.toFixed(2)}</div>
    <div class="warn"><strong>总估算：</strong>¥${evaluation.cost.totalCost.toFixed(2)} (风险系数 ${evaluation.cost.speedRiskFactor})</div>
  `;
}

function renderBrandGuide(evaluation) {
  const container = document.getElementById('brandGuide');
  const advice = evaluation.brandAdvice;
  if (advice.status === 'none' || advice.status === 'aligned') {
    container.innerHTML = `<span class="ok">${escapeHtml(advice.message)}</span>`;
    return;
  }

  const lines = advice.suggestions.map((item) => `
    <li>${escapeHtml(item.category)}: 当前 ${escapeHtml(item.currentBrand)} → 推荐 ${escapeHtml(item.recommendBrand)}；优点：${escapeHtml(item.benefit)}</li>
  `).join('');

  container.innerHTML = `
    <div class="warn">${escapeHtml(advice.message)}</div>
    <ul>${lines}</ul>
  `;
}

function buildReport() {
  if (!state.lastEvaluation) return null;
  const quote = buildQuoteFromEvaluation(state.lastEvaluation, state.lastAssessment);
  return {
    title: '视觉评估与成本核算报告',
    generatedAt: state.lastEvaluation.generatedAt,
    evaluation: state.lastEvaluation,
    comprehensiveAssessment: state.lastAssessment,
    protocolDiff: state.lastAssessment ? state.lastAssessment.comparison : null,
    quote,
    sourceDocs: state.docs,
    referenceDocs: state.refDocs,
    productTypes: state.productTypes
  };
}

function reportToMarkdown(report) {
  const evalData = report.evaluation;
  const parts = ['相机', '镜头', '光源', '控制器'].map((category) => {
    const item = evalData.recommended[category];
    return item
      ? `- ${category}: ${item.brand} ${item.model} / ¥${item.price}`
      : `- ${category}: 无`;
  }).join('\n');

  const notes = report.sourceDocs.map((doc) => `- ${doc.fileName}: ${doc.note || '无备注'}`).join('\n');
  const highlights = report.sourceDocs.map((doc) => `- ${doc.fileName}: ${doc.highlights.join('；')}`).join('\n');
  const summary = report.comprehensiveAssessment
    ? `- 综合评分: ${report.comprehensiveAssessment.capabilityScore}\n- 重点结论: ${report.comprehensiveAssessment.recommendation}`
    : '- 无';
  const diffNotes = report.protocolDiff
    ? report.protocolDiff.notes.map((item) => `- ${item}`).join('\n')
    : '- 无';
  const quoteLines = report.quote
    ? report.quote.items.map((item) => `- ${item.name}: ¥${item.amount}（${item.note}）`).join('\n') + `\n- 合计: ¥${report.quote.total.toFixed(2)}`
    : '- 无';

  return `# ${report.title}

- 生成时间: ${report.generatedAt}
- 产品: ${evalData.input.productName}
- 目标精度: ${evalData.input.targetPrecisionUm} um
- 建议分辨能力: ${evalData.requiredResolutionUm} um

## 推荐标准件
${parts}

## 成本核算
- 硬件成本: ¥${evalData.cost.hardwareCost}
- 集成成本: ¥${evalData.cost.integrationCost}
- 风险系数: ${evalData.cost.speedRiskFactor}
- 总成本: ¥${evalData.cost.totalCost}

## 品牌偏离指引
- 状态: ${evalData.brandAdvice.status}
- 说明: ${evalData.brandAdvice.message}

## 客户资料关键提取
${highlights || '- 无'}

## 综合评估描述
${summary}

## 协议差异点
${diffNotes}

## 报价输出
${quoteLines}

## 原档备注
${notes || '- 无'}
`;
}

function renderReportPreview() {
  const preview = document.getElementById('reportPreview');
  const report = buildReport();
  if (!report) {
    preview.innerHTML = '<span class="small">暂无报告，请先执行评估。</span>';
    return;
  }
  const markdown = reportToMarkdown(report);
  preview.textContent = markdown.slice(0, 1200);
}

function exportReport(type) {
  const report = buildReport();
  if (!report) {
    alert('请先完成评估再导出。');
    return;
  }

  if (type === 'md') {
    const content = reportToMarkdown(report);
    downloadFile('评估报告.md', content, 'text/markdown;charset=utf-8');
    return;
  }

  if (type === 'json') {
    downloadFile('评估报告.json', JSON.stringify(report, null, 2), 'application/json;charset=utf-8');
  }
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function extensionOf(fileName) {
  const parts = String(fileName).toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function unique(items) {
  return Array.from(new Set(items));
}

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
