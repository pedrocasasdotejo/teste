/* 
   app.js - CASAS DO TEJO v3.2 (VERSÃO FINAL INTEGRAL)
   Lógica: Sincronização GitHub + Pasta Mãe Drive + Navegação Completa
*/

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let bd = { zonas: [] };
let consultoria = JSON.parse(localStorage.getItem('ce_consultoria')) || { info: {}, anomalias: [] };
let editingIdx = -1;
let currentPhotos = [];
let selectedCausas = new Set();
let selectedSolucoes = new Set();
let customCausas = [];
let customSolucoes = [];
let currentSev = null;
let isRecording = false;
let isSaving = false;
let toastTimer = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
  loadInfo();
  updateHomeStats();
  setDefaultDate();
  loadCfg();
  
  // 1. Tenta carregar a base de dados do GitHub
  await carregarBDDoGitHub();
  
  // 2. Prepara a interface
  populateZonas();
  renderLista();
});

// --- SINCRONIZAÇÃO COM GITHUB ---
async function carregarBDDoGitHub() {
  const el = document.getElementById('bd-status');
  if(el) el.textContent = 'A sincronizar com o GitHub...';
  
  const timestamp = new Date().getTime();
  const urlGitHub = './anomalias_base_dados.json?v=' + timestamp;
  
  try {
    const res = await fetch(urlGitHub, { cache: "no-store" });
    if (res.ok) {
      bd = await res.json();
      localStorage.setItem('ce_bd', JSON.stringify(bd));
      if(el) el.textContent = '✓ Tabela Técnica Casas do Tejo ativa';
    }
  } catch (err) {
    console.warn('Usando cópia local da BD.');
    bd = JSON.parse(localStorage.getItem('ce_bd')) || { zonas: [] };
    if(el) el.textContent = '⚠️ Modo Offline (Cópia Local)';
  }
}

// --- NAVEGAÇÃO ENTRE ECRÃS ---
function showScreen(name) {
  // Se for para criar anomalia, verifica se o Drive está configurado
  if (name === 'nova') {
    const sUrl = localStorage.getItem('ce_script_url');
    const fId = localStorage.getItem('ce_drive_folder_id');
    if (!sUrl || !fId) {
      showToast("⚠️ Configura o Drive primeiro nas Configurações!");
      showScreen('settings');
      return;
    }
    
    // Lógica Multifamiliar: Mostra ou esconde campos
    const tipo = document.getElementById('info-tipo').value;
    const multiBox = document.getElementById('campo-multifamiliar-container');
    if (tipo === 'Habitação multifamiliar') {
      multiBox.style.display = 'block';
      onAmbitoMultifamiliarChange();
    } else {
      multiBox.style.display = 'none';
    }
    if (editingIdx === -1) resetNovaForm();
  }

  // Atualiza visualmente os ecrãs
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if(target) target.classList.add('active');

  // Atualiza os botões da barra inferior
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const m = { home: 'nav-home', lista: 'nav-anomalias', export: 'nav-export', settings: 'nav-settings' };
  if (m[name]) {
    const navBtn = document.getElementById(m[name]);
    if(navBtn) navBtn.classList.add('active');
  }

  // Gere o botão flutuante (+)
  const fab = document.getElementById('fab');
  if(fab) fab.style.display = (name === 'nova' || name === 'settings') ? 'none' : 'flex';

  // Atualiza resumos se for para o ecrã de exportação
  if(name === 'export') atualizarResumoExport();
}

function onAmbitoMultifamiliarChange() {
  const tipo = document.getElementById('multifamiliar-tipo').value;
  const detalheInput = document.getElementById('multifamiliar-detalhe');
  detalheInput.style.display = (tipo === 'Fracção') ? 'block' : 'none';
}

// --- GESTÃO DE DADOS GERAIS ---
function saveInfo() {
  consultoria.info = {
    cliente: document.getElementById('info-cliente').value.trim(),
    morada: document.getElementById('info-morada').value,
    localidade: document.getElementById('info-localidade').value,
    tipo: document.getElementById('info-tipo').value,
    data: document.getElementById('info-data').value,
    obs: document.getElementById('info-obs').value
  };
  localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
  updateHomeStats();
}

function loadInfo() {
  const i = consultoria.info || {};
  document.getElementById('info-cliente').value = i.cliente || '';
  document.getElementById('info-morada').value = i.morada || '';
  document.getElementById('info-localidade').value = i.localidade || '';
  document.getElementById('info-tipo').value = i.tipo || '';
  document.getElementById('info-data').value = i.data || '';
  document.getElementById('info-obs').value = i.obs || '';
}

function updateHomeStats() {
  const i = consultoria.info || {};
  document.getElementById('home-titulo').textContent = i.cliente || 'Nova consultoria';
  document.getElementById('home-morada').textContent = i.morada ? i.morada + (i.localidade ? ', ' + i.localidade : '') : 'Define o cliente para criar a pasta no Drive';
  document.getElementById('home-count-an').textContent = consultoria.anomalias.length;
  let totalFotos = 0;
  consultoria.anomalias.forEach(a => totalFotos += (a.fotos ? a.fotos.length : 0));
  document.getElementById('home-count-foto').textContent = totalFotos;
  document.getElementById('home-data').textContent = i.data ? i.data.split('-').reverse().join('/') : '—';
}

// --- GESTÃO DE ANOMALIAS ---
function populateZonas() {
  const sel = document.getElementById('sel-zona');
  sel.innerHTML = '<option value="">— Seleccionar zona —</option>';
  bd.zonas.forEach(z => {
    const opt = document.createElement('option');
    opt.value = z.id;
    opt.textContent = z.nome;
    sel.appendChild(opt);
  });
}

function onZonaChange() {
  const zid = document.getElementById('sel-zona').value;
  const sa = document.getElementById('sel-anomalia');
  sa.innerHTML = '';
  if (!zid) {
    sa.disabled = true;
    sa.innerHTML = '<option>— Primeiro seleccionar zona —</option>';
    return;
  }
  const z = bd.zonas.find(x => x.id === zid);
  sa.disabled = false;
  sa.innerHTML = '<option value="">— Seleccionar anomalia —</option>';
  if(z && z.anomalias) {
    z.anomalias.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.nome;
      sa.appendChild(opt);
    });
  }
  clearAnomaliaFields();
}

function onAnomaliaChange() {
  const zid = document.getElementById('sel-zona').value;
  const aid = document.getElementById('sel-anomalia').value;
  clearAnomaliaFields();
  if (!aid) return;
  const z = bd.zonas.find(x => x.id === zid);
  const an = z.anomalias.find(a => a.id === aid);
  if (an) {
    if(an.severidade_padrao) setSev(an.severidade_padrao);
    renderChips('causas-chips', an.causas, selectedCausas);
    renderChips('solucoes-chips', an.solucoes, selectedSolucoes);
    if (an.notas_tecnicas) {
      document.getElementById('nota-tecnica-card').style.display = 'block';
      document.getElementById('nota-tecnica-text').textContent = an.notas_tecnicas;
    }
  }
}

function setSev(sev) {
  currentSev = sev;
  document.querySelectorAll('.sev-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sev === sev);
  });
}

function renderChips(containerId, items, selectionSet) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if(!items) return;
  items.forEach((text, idx) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (selectionSet.has(idx) ? ' selected' : '');
    chip.textContent = text;
    chip.onclick = () => {
      if (selectionSet.has(idx)) selectionSet.delete(idx);
      else selectionSet.add(idx);
      chip.classList.toggle('selected');
    };
    container.appendChild(chip);
  });
}

// --- SALVAR E SINCRONIZAR (PASTA MÃE) ---
async function saveAnomalia() {
  if (isSaving) return;
  const zid = document.getElementById('sel-zona').value;
  const aid = document.getElementById('sel-anomalia').value;
  if (!zid || !aid || !currentSev) { showToast('Preenche os campos obrigatórios!'); return; }

  isSaving = true;
  const btn = document.getElementById('btn-guardar-anomalia');
  btn.disabled = true; 
  btn.textContent = "A sincronizar...";

  const info = consultoria.info || {};
  // Nome da Pasta Mãe (Ex: Cliente_Data)
  const pastaMae = (info.cliente || "Consultoria").replace(/\s+/g, '_') + "_" + (info.data || "SemData").replace(/-/g, '_');
  
  // Localização Física (Fração ou Zona Comum)
  let localFisico = "Geral";
  if (info.tipo === 'Habitação multifamiliar') {
    const ambito = document.getElementById('multifamiliar-tipo').value;
    if(ambito === 'Zona Comum') {
      localFisico = "Zonas_Comuns";
    } else {
      const detalhe = document.getElementById('multifamiliar-detalhe').value.trim();
      localFisico = "Fracção_" + (detalhe ? detalhe.replace(/\s+/g, '_') : "Nao_Identificada");
    }
  }

  const z = bd.zonas.find(x => x.id === zid);
  const an = z.anomalias.find(a => a.id === aid);
  const totalJaExistente = consultoria.anomalias.length;

  const novaAnomalia = {
    id: Date.now(),
    zona: z.nome,
    anomalia_nome: an.nome,
    severidade: currentSev,
    causas: [...Array.from(selectedCausas).map(idx => an.causas[idx]), ...customCausas],
    solucoes: [...Array.from(selectedSolucoes).map(idx => an.solucoes[idx]), ...customSolucoes],
    observacoes: document.getElementById('obs-text').value,
    fotos: [],
    ambito: localFisico
  };

  // Upload das fotos
  if (currentPhotos.length > 0) {
    showToast("A enviar fotos para o Drive...");
    novaAnomalia.fotos = await uploadFotosDrive(novaAnomalia, totalJaExistente + 1, pastaMae, localFisico);
  }

  consultoria.anomalias.push(novaAnomalia);
  localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
  
  // Auto-save do JSON na pasta do cliente
  await autoSaveToDrive(pastaMae);

  isSaving = false;
  showToast("✓ Registado e Sincronizado!");
  showScreen('lista');
  renderLista();
  updateHomeStats();
}

async function uploadFotosDrive(anomalia, num, pastaMae, localFisico) {
  const sUrl = localStorage.getItem('ce_script_url');
  const rootId = localStorage.getItem('ce_drive_folder_id');
  const refs = [];
  
  for (const foto of currentPhotos) {
    const payload = {
      action: "uploadFoto",
      folderId: rootId,
      parentFolderName: pastaMae,
      locationFolder: localFisico,
      anomaliaNum: num,
      anomaliaNome: anomalia.anomalia_nome,
      fotoName: Date.now() + ".jpg",
      fotoBase64: foto.dataUrl
    };
    try {
      const res = await fetch(sUrl, { method: 'POST', body: JSON.stringify(payload) });
      const rd = await res.json();
      if (rd.success) refs.push({ id: rd.id, driveUrl: rd.driveUrl });
    } catch (e) { console.error("Erro foto:", e); }
  }
  return refs;
}

async function autoSaveToDrive(pastaMae) {
  const sUrl = localStorage.getItem('ce_script_url');
  const rootId = localStorage.getItem('ce_drive_folder_id');
  try {
    const payload = {
      action: "autoSaveJson",
      folderId: rootId,
      parentFolderName: pastaMae,
      fileName: pastaMae + ".json",
      consultoria: consultoria
    };
    await fetch(sUrl, { method: 'POST', body: JSON.stringify(payload) });
  } catch (e) { console.error("Erro AutoSave:", e); }
}

// --- FOTOS ---
function handlePhotos(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentPhotos.push({ dataUrl: e.target.result, name: file.name });
      renderPhotos();
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  const grid = document.getElementById('photos-grid');
  grid.innerHTML = '';
  currentPhotos.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    div.innerHTML = `<img src="${p.dataUrl}"><button class="photo-del" onclick="currentPhotos.splice(${i},1);renderPhotos();">✕</button>`;
    grid.appendChild(div);
  });
}

// --- LISTA E EDIÇÃO ---
function renderLista() {
  const container = document.getElementById('lista-container');
  const countLabel = document.getElementById('lista-count');
  container.innerHTML = '';
  countLabel.textContent = consultoria.anomalias.length + ' REGISTOS';

  if (consultoria.anomalias.length === 0) {
    container.innerHTML = '<div class="empty">Sem registos de patologias.</div>';
    return;
  }

  consultoria.anomalias.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'anomalia-item';
    div.onclick = () => verDetalhe(i);
    div.innerHTML = `
      <div class="anomalia-item-header">
        <div style="flex:1">
          <div class="anomalia-item-title">${i + 1}. ${a.anomalia_nome}</div>
          <div class="anomalia-item-meta">${a.ambito} | ${a.zona}</div>
        </div>
        <span class="sev-badge ${a.severidade}">${a.severidade}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

function verDetalhe(idx) {
  const a = consultoria.anomalias[idx];
  const body = document.getElementById('modal-detalhe-body');
  body.innerHTML = `
    <h2 style="color:var(--accent); font-size:18px;">${a.anomalia_nome}</h2>
    <p style="font-size:12px; color:var(--text2); margin-bottom:12px;">${a.zona} | ${a.ambito}</p>
    <div style="font-size:13px; margin-bottom:8px;"><strong>Severidade:</strong> <span class="sev-badge ${a.severidade}">${a.severidade}</span></div>
    <div style="font-size:13px; margin-bottom:8px;"><strong>Causas:</strong> ${a.causas.join(', ') || '—'}</div>
    <div style="font-size:13px; margin-bottom:8px;"><strong>Soluções:</strong> ${a.solucoes.join(', ') || '—'}</div>
    <p style="font-size:13px; background:var(--surface2); padding:8px; border-radius:6px; margin-top:8px;">${a.observacoes || 'Sem observações.'}</p>
  `;
  document.getElementById('btn-del-anomalia').onclick = () => eliminarAnomalia(idx);
  document.getElementById('modal-detalhe').classList.add('open');
}

function eliminarAnomalia(idx) {
  if (confirm("Eliminar este registo permanentemente?")) {
    consultoria.anomalias.splice(idx, 1);
    localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
    document.getElementById('modal-detalhe').classList.remove('open');
    renderLista();
    updateHomeStats();
  }
}

// --- CONFIGURAÇÕES E EXPORTAÇÃO ---
function loadCfg() {
  document.getElementById('cfg-script-url').value = localStorage.getItem('ce_script_url') || '';
  document.getElementById('cfg-folder-id').value = localStorage.getItem('ce_drive_folder_id') || '';
}

function saveCfg() {
  localStorage.setItem('ce_script_url', document.getElementById('cfg-script-url').value.trim());
  localStorage.setItem('ce_drive_folder_id', document.getElementById('cfg-folder-id').value.trim());
  showToast("Configurações Casas do Tejo guardadas!");
}

async function testarDrive() {
  const url = document.getElementById('cfg-script-url').value;
  const fid = document.getElementById('cfg-folder-id').value;
  const statusEl = document.getElementById('drive-auth-status');
  if(!url || !fid) { showToast("Preenche os campos!"); return; }
