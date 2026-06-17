/* app.js - CASAS DO TEJO v3.7 (PRODUÇÃO EM CONFORTO) */

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
  checkSpeechAPI();
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
      if(el) el.textContent = '✓ Tabela Técnico-Patológica Ativa';
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
  document.getElementById('home-morada').textContent = i.morada ? i.morada + (i.localidade ? ', ' + i.localidade : '') : 'Define o cliente abaixo para criar a pasta no Drive';
  document.getElementById('home-count-an').textContent = consultoria.anomalias ? consultoria.anomalias.length : 0;
  let totalFotos = 0;
  if (consultoria.anomalias) {
    consultoria.anomalias.forEach(a => totalFotos += (a.fotos ? a.fotos.length : 0));
  }
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
    if (cardNota && an.notas_tecnicas) {
      cardNota.style.display = 'block';
      document.getElementById('nota-tecnica-text').textContent = an.notas_tecnicas;
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
    novaAnomalia.fotos = await uploadFotosDrive(novaAnomalia, consultoria.anomalias.length + 1, pastaMae, localFisico);
  }
  consultoria.anomalias.push(novaAnomalia);
  localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
  await autoSaveToDrive(pastaMae);
  isSaving = false; showToast("✓ Sincronizado!"); showScreen('lista'); renderLista(); updateHomeStats();
}

async function uploadFotosDrive(anomalia, num, pastaMae, localFisico) {
  const sUrl = localStorage.getItem('ce_script_url');
  const rootId = localStorage.getItem('ce_drive_folder_id');
  const refs = [];
  for (const foto of currentPhotos) {
    const payload = { action: "uploadFoto", folderId: rootId, parentFolderName: pastaMae, locationFolder: localFisico, anomaliaNum: num, anomaliaNome: anomalia.anomalia_nome, fotoName: Date.now() + ".jpg", fotoBase64: foto.dataUrl };
    try {
      const res = await fetch(sUrl, { method: 'POST', body: JSON.stringify(payload) });
      const rd = await res.json();
      if (rd.success) refs.push({ id: rd.id, driveUrl: rd.driveUrl });
    } catch (e) { console.error(e); }
  }
  return refs;
}

async function autoSaveToDrive(pastaMae) {
  const sUrl = localStorage.getItem('ce_script_url');
  const rootId = localStorage.getItem('ce_drive_folder_id');
  if(!sUrl || !rootId) return;
  try {
    const payload = { action: "autoSaveJson", folderId: rootId, parentFolderName: pastaMae, fileName: pastaMae + ".json", consultoria: consultoria };
    await fetch(sUrl, { method: 'POST', body: JSON.stringify(payload) });
  } catch (e) { console.error(e); }
}

function handlePhotos(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => { currentPhotos.push({ dataUrl: e.target.result, name: file.name }); renderPhotos(); };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  const grid = document.getElementById('photos-grid');
  if(!grid) return; grid.innerHTML = '';
  currentPhotos.forEach((p, i) => {
    const div = document.createElement('div'); div.className = 'photo-thumb';
    div.innerHTML = `<img src="${p.dataUrl}"><button class="photo-del" onclick="currentPhotos.splice(${i},1);renderPhotos();">✕</button>`;
    grid.appendChild(div);
  });
}

function renderLista() {
  const container = document.getElementById('lista-container');
  const countLabel = document.getElementById('lista-count');
  if(!container || !countLabel) return;
  container.innerHTML = ''; countLabel.textContent = consultoria.anomalias.length + ' REGISTOS';
  if (consultoria.anomalias.length === 0) { container.innerHTML = '<div class="empty">Sem registos.</div>'; return; }
  consultoria.anomalias.forEach((a, i) => {
    const div = document.createElement('div'); div.className = 'anomalia-item'; div.onclick = () => verDetalhe(i);
    div.innerHTML = `<div class="anomalia-item-header"><div style="flex:1"><div class="anomalia-item-title">${i + 1}. ${a.anomalia_nome}</div><div class="anomalia-item-meta">${a.ambito} | ${a.zona}</div></div><span class="sev-badge ${a.severidade}">${a.severidade}</span></div>`;
    container.appendChild(div);
  });
}

function verDetalhe(idx) {
  const a = consultoria.anomalias[idx];
  const body = document.getElementById('modal-detalhe-body');
  if(!body) return;
  body.innerHTML = `<h2 style="color:var(--accent); font-size:18px;">${a.anomalia_nome}</h2><p style="font-size:12px; color:var(--text2); margin-bottom:12px;">${a.zona} | ${a.ambito}</p><div style="font-size:13px; margin-bottom:8px;"><strong>Severidade:</strong> <span class="sev-badge ${a.severidade}">${a.severidade}</span></div><div style="font-size:13px; margin-bottom:8px;"><strong>Causas:</strong> ${a.causas.join(', ') || '—'}</div><div style="font-size:13px; margin-bottom:8px;"><strong>Soluções:</strong> ${a.solucoes.join(', ') || '—'}</div><p style="font-size:13px; background:var(--surface2); padding:8px; border-radius:6px; margin-top:8px;">${a.observacoes || 'Sem observações.'}</p>`;
  const delBtn = document.getElementById('btn-del-anomalia');
  if(delBtn) delBtn.onclick = () => eliminarAnomalia(idx);
  document.getElementById('modal-detalhe').classList.add('open');
}

function eliminarAnomalia(idx) {
  if (confirm("Eliminar registo?")) {
    consultoria.anomalias.splice(idx, 1); localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
    document.getElementById('modal-detalhe').classList.remove('open'); renderLista(); updateHomeStats();
  }
}

function loadCfg() {
  document.getElementById('cfg-script-url').value = localStorage.getItem('ce_script_url') || '';
  document.getElementById('cfg-folder-id').value = localStorage.getItem('ce_drive_folder_id') || '';
}

function saveCfg() {
  localStorage.setItem('ce_script_url', document.getElementById('cfg-script-url').value.trim());
  localStorage.setItem('ce_drive_folder_id', document.getElementById('cfg-folder-id').value.trim());
  showToast("Configurações guardadas!");
}

async function testarDrive() {
  const url = document.getElementById('cfg-script-url').value;
  const fid = document.getElementById('cfg-folder-id').value;
  const statusEl = document.getElementById('drive-auth-status');
  if(!url || !fid) { showToast("Preenche os campos!"); return; }
  statusEl.textContent = "A validar ligação..."; statusEl.style.color = "var(--accent)";
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ action: "testDrive", folderId: fid }) });
    const rd = await res.json();
    if(rd.success) { statusEl.textContent = "✓ LIGAÇÃO ESTABELECIDA"; statusEl.style.color = "var(--success)"; }
    else { statusEl.textContent = "❌ ERRO: " + rd.error; statusEl.style.color = "var(--danger)"; }
  } catch (e) { statusEl.textContent = "❌ ERRO DE REDE."; statusEl.style.color = "var(--danger)"; }
}

function atualizarResumoExport() {
  const i = consultoria.info || {};
  document.getElementById('exp-cliente').textContent = i.cliente || '—';
  document.getElementById('exp-data').textContent = i.data ? i.data.split('-').reverse().join('/') : '—';
  document.getElementById('exp-count').textContent = consultoria.anomalias.length;
  let tf = 0; consultoria.anomalias.forEach(a => tf += (a.fotos ? a.fotos.length : 0));
  document.getElementById('exp-fotos').textContent = tf;
}

function gerarResumo() {
  const i = consultoria.info || {};
  let txt = `RELATÓRIO DE VISTORIA - CASAS DO TEJO\nCliente: ${i.cliente || '—'}\nMorada: ${i.morada || '—'}, ${i.localidade || '—'}\nData: ${i.data || '—'}\n------------------------------------------\n\n`;
  consultoria.anomalias.forEach((a, idx) => {
    txt += `${idx + 1}. ${a.anomalia_nome} (${a.severidade})\n   Local: ${a.zona} | ${a.ambito}\n   Causas: ${a.causas.join(', ') || '—'}\n   Solução: ${a.solucoes.join(', ') || '—'}\n`;
    if (a.observacoes) txt += `   Obs: ${a.observacoes}\n`;
    txt += `\n`;
  });
  document.getElementById('resumo-text').value = txt; document.getElementById('resumo-output').style.display = 'block';
}

function copiarResumo() {
  const area = document.getElementById('resumo-text'); area.select(); document.execCommand('copy');
  showToast("Relatório copiado!");
}

function openAddZona() { document.getElementById('add-zona-modal').classList.add('open'); }
function closeAddZona() { document.getElementById('add-zona-modal').classList.remove('open'); document.getElementById('add-zona-input').value = ''; }
function confirmAddZona() {
  const val = document.getElementById('add-zona-input').value.trim(); if(!val) return;
  const newId = 'custom_' + Date.now(); bd.zonas.push({ id: newId, nome: val, anomalias: [] });
  populateZonas(); document.getElementById('sel-zona').value = newId; onZonaChange(); closeAddZona();
}
function openAddAnomalia() { document.getElementById('add-anomalia-modal').classList.add('open'); }
function closeAddAnomalia() { document.getElementById('add-anomalia-modal').classList.remove('open'); document.getElementById('add-anomalia-input').value = ''; }
function confirmAddAnomalia() {
  const val = document.getElementById('add-anomalia-input').value.trim(); const zid = document.getElementById('sel-zona').value; if(!val || !zid) return;
  const z = bd.zonas.find(x => x.id === zid); const newId = 'an_custom_' + Date.now();
  z.anomalias.push({ id: newId, nome: val, causas: [], solucoes: [], severidade_padrao: 'M' });
  onZonaChange(); document.getElementById('sel-anomalia').value = newId; onAnomaliaChange(); closeAddAnomalia();
}

function showToast(m) {
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = m; t.className = 'toast show'; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 3000);
}
function setDefaultDate() { if (document.getElementById('info-data') && !document.getElementById('info-data').value) document.getElementById('info-data').value = new Date().toISOString().split('T')[0]; }
function resetNovaForm() {
  isSaving = false; const btnGuardar = document.getElementById('btn-guardar-anomalia'); if(btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = "GUARDAR E SINCRONIZAR"; }
  document.getElementById('sel-zona').value = ''; document.getElementById('sel-anomalia').disabled = true; document.getElementById('obs-text').value = '';
  currentPhotos = []; currentSev = null; document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active')); renderPhotos(); clearAnomaliaFields();
}
function clearAnomaliaFields() {
  selectedCausas = new Set(); selectedSolucoes = new Set(); customCausas = []; customSolucoes = [];
  ['causas-chips', 'solucoes-chips', 'causas-custom-list', 'solucoes-custom-list'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
  if(document.getElementById('nota-tecnica-card')) document.getElementById('nota-tecnica-card').style.display = 'none';
}
function addCausaCustom() {
  const v = document.getElementById('causa-custom').value.trim(); if(!v) return; customCausas.push(v);
  const div = document.createElement('div'); div.style.fontSize = '12px'; div.style.marginTop = '4px'; div.textContent = '• ' + v;
  document.getElementById('causas-custom-list').appendChild(div); document.getElementById('causa-custom').value = '';
}
function addSolucaoCustom() {
  const v = document.getElementById('solucao-custom').value.trim(); if(!v) return; customSolucoes.push(v);
  const div = document.createElement('div'); div.style.fontSize = '12px'; div.style.marginTop = '4px'; div.textContent = '• ' + v;
  document.getElementById('solucoes-custom-list').appendChild(div); document.getElementById('solucao-custom').value = '';
}
function exportarJSON() {
  const data = JSON.stringify(consultoria, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `Consultoria_${consultoria.info.cliente || 'CasasDoTejo'}.json`; a.click();
}
function confirmarLimpar() { document.getElementById('modal-limpar').classList.add('open'); }
function limparTudo() { localStorage.removeItem('ce_consultoria'); location.reload(); }
function exportarBD() {
  const data = JSON.stringify(bd, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'anomalias_base_dados.json'; a.click();
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) { showToast("⚠️ Nenhum ficheiro selecionado."); return; }
  showToast("⏳ A ler ficheiro de backup...");
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const texto = e.target.result;
      if (!texto || texto.trim() === "") { showToast("❌ O ficheiro está vazio."); return; }
      const dadosImportados = JSON.parse(texto);
      if (!dadosImportados.info || !dadosImportados.anomalias) { showToast("⚠️ Estrutura inválida. Não é da Casas do Tejo."); return; }
      consultoria = dadosImportados;
      localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
      loadInfo();
      updateHomeStats();
      renderLista();
      showToast("✓ Consultoria retomada com sucesso!");
      document.getElementById('importJSONInput').value = '';
    } catch (err) {
      console.error("Erro ao processar JSON:", err);
      showToast("❌ Erro de leitura: Ficheiro inválido.");
    }
  };
  reader.onerror = function() { showToast("❌ Erro no leitor de ficheiros."); };
  reader.readAsText(file);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'pt-PT';
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecording = true;
    const btn = document.getElementById('rec-btn');
    if(btn) { btn.textContent = '🛑'; btn.style.background = 'var(--danger)'; }
    showToast("🎤 A ouvir... Fale agora.");
  };

  recognition.onresult = (event) => {
    const currentResultIndex = event.resultIndex;
    const transcript = event.results[currentResultIndex][0].transcript;
    const txtArea = document.getElementById('obs-text');
    if(txtArea) { txtArea.value = (txtArea.value + " " + transcript).trim(); }
  };

  recognition.onerror = (event) => {
    console.error("Erro no microfone:", event.error);
    stopRecording();
    showToast("⚠️ Erro no microfone: " + event.error);
  };

  recognition.onend = () => { stopRecording(); };
}

function checkSpeechAPI() {
  if (!SpeechRecognition) {
    const btn = document.getElementById('rec-btn');
    if(btn) btn.style.display = 'none';
    console.warn("Ditado de voz nao suportado neste browser.");
  }
}

function toggleRec() {
  if (!SpeechRecognition) {
    showToast("⚠️ Ditado de voz nao suportado neste dispositivo.");
    return;
  }
  if (isRecording) { recognition.stop(); } else { recognition.start(); }
}

function stopRecording() {
  isRecording = false;
  const btn = document.getElementById('rec-btn');
  if(btn) { btn.textContent = '🎤'; btn.style.background = 'var(--danger-light)'; }
}
