/* app.js - CASAS DO TEJO v3.6 (COM DITADO DE VOZ ATIVO) */

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

document.addEventListener('DOMContentLoaded', async () => {
  loadInfo();
  updateHomeStats();
  setDefaultDate();
  loadCfg();
  await carregarBDDoGitHub();
  populateZonas();
  renderLista();
  checkSpeechAPI(); // Inicializa e valida o estado do microfone no arranque
});

async function carregarBDDoGitHub() {
  const el = document.getElementById('bd-status');
  if(el) el.textContent = 'A sincronizar com o GitHub...';
  const timestamp = new Date().getTime();
  try {
    const res = await fetch('./anomalias_base_dados.json?v=' + timestamp, { cache: "no-store" });
    if (res.ok) {
      bd = await res.json();
      localStorage.setItem('ce_bd', JSON.stringify(bd));
      if(el) el.textContent = '✓ Tabela Técnica Ativa';
    }
  } catch (err) {
    bd = JSON.parse(localStorage.getItem('ce_bd')) || { zonas: [] };
    if(el) el.textContent = '⚠️ Modo Offline';
  }
}

function showScreen(name) {
  if (name === 'nova') {
    const sUrl = localStorage.getItem('ce_script_url');
    const fId = localStorage.getItem('ce_drive_folder_id');
    if (!sUrl || !fId) {
      showToast("⚠️ Configura o Drive primeiro!");
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screen-settings').classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('nav-settings').classList.add('active');
      return;
    }
    const tipo = document.getElementById('info-tipo').value;
    const multiBox = document.getElementById('campo-multifamiliar-container');
    if (multiBox) multiBox.style.display = (tipo === 'Habitação multifamiliar') ? 'block' : 'none';
    if (editingIdx === -1) resetNovaForm();
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if(target) target.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const m = { home: 'nav-home', lista: 'nav-anomalias', export: 'nav-export', settings: 'nav-settings' };
  if (m[name] && document.getElementById(m[name])) document.getElementById(m[name]).classList.add('active');
  const fab = document.getElementById('fab');
  if(fab) fab.style.display = (name === 'nova' || name === 'settings') ? 'none' : 'flex';
  if(name === 'export') atualizarResumoExport();
}

function onAmbitoMultifamiliarChange() {
  const tipo = document.getElementById('multifamiliar-tipo').value;
  const detalheInput = document.getElementById('multifamiliar-detalhe');
  if(detalheInput) detalheInput.style.display = (tipo === 'Fracção') ? 'block' : 'none';
}

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
  document.getElementById('home-morada').textContent = i.morada ? i.morada + (i.localidade ? ', ' + i.localidade : '') : 'Define o cliente para criar a pasta';
  document.getElementById('home-count-an').textContent = consultoria.anomalias.length;
  let totalFotos = 0;
  consultoria.anomalias.forEach(a => totalFotos += (a.fotos ? a.fotos.length : 0));
  document.getElementById('home-count-foto').textContent = totalFotos;
  document.getElementById('home-data').textContent = i.data ? i.data.split('-').reverse().join('/') : '—';
}

function populateZonas() {
  const sel = document.getElementById('sel-zona');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Seleccionar zona —</option>';
  if(bd && bd.zonas) {
    bd.zonas.forEach(z => {
      const opt = document.createElement('option');
      opt.value = z.id; opt.textContent = z.nome; sel.appendChild(opt);
    });
  }
}

function onZonaChange() {
  const zid = document.getElementById('sel-zona').value;
  const sa = document.getElementById('sel-anomalia');
  if(!sa) return;
  sa.innerHTML = '';
  if (!zid) { sa.disabled = true; sa.innerHTML = '<option>— Primeiro seleccionar zona —</option>'; return; }
  const z = bd.zonas.find(x => x.id === zid);
  sa.disabled = false; sa.innerHTML = '<option value="">— Seleccionar anomalia —</option>';
  if(z && z.anomalias) {
    z.anomalias.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.nome; sa.appendChild(opt);
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
    const cardNota = document.getElementById('nota-tecnica-card');
    if (cardNota && an.notes_tecnicas) {
      cardNota.style.display = 'block';
      document.getElementById('nota-tecnica-text').textContent = an.notes_tecnicas;
    }
  }
}

function setSev(sev) {
  currentSev = sev;
  document.querySelectorAll('.sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.sev === sev));
}

function renderChips(containerId, items, selectionSet) {
  const container = document.getElementById(containerId);
  if(!container) return; container.innerHTML = ''; if(!items) return;
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

async function saveAnomalia() {
  if (isSaving) return;
  const zid = document.getElementById('sel-zona').value;
  const aid = document.getElementById('sel-anomalia').value;
  if (!zid || !aid || !currentSev) { showToast('Preenche os campos obrigatórios!'); return; }
  isSaving = true;
  const btn = document.getElementById('btn-guardar-anomalia');
  if(btn) { btn.disabled = true; btn.textContent = "A sincronizar..."; }
  const info = consultoria.info || {};
  const pastaMae = (info.cliente || "Consultoria").replace(/\s+/g, '_') + "_" + (info.data || "SemData").replace(/-/g, '_');
  let localFisico = "Geral";
  if (info.tipo === 'Habitação multifamiliar') {
    const ambito = document.getElementById('multifamiliar-tipo').value;
    if(ambito === 'Zona Comum') { localFisico = "Zonas_Comuns"; } 
    else { const detalhe = document.getElementById('multifamiliar-detalhe').value.trim(); localFisico = "Fracção_" + (detalhe ? detalhe.replace(/\s+/g, '_') : "Nao_Identificada"); }
  }
  const z = bd.zonas.find(x => x.id === zid);
  const an = z.anomalias.find(a => a.id === aid);
  const novaAnomalia = {
    id: Date.now(), zona: z.nome, anomalia_nome: an.nome, severidade: currentSev,
    causas: [...Array.from(selectedCausas).map(idx => an.causas[idx]), ...customCausas],
    solucoes: [...Array.from(selectedSolucoes).map(idx => an.solucoes[idx]), ...customSolucoes],
    observacoes: document.getElementById('obs-text').value, fotos: [], ambito: localFisico
  };
  if (currentPhotos.length > 0) {
    showToast("A enviar fotos...");
