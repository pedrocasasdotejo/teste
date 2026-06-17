/* app.js - VERSÃO CORRIGIDA CASAS DO TEJO 3.1 */

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
let recognition = null;
let isSaving = false;

document.addEventListener('DOMContentLoaded', async () => {
  loadInfo();
  updateHomeStats();
  setDefaultDate();
  loadCfg();
  checkSpeechAPI();
  await carregarBDDoGitHub();
  populateZonas();
  renderLista();
});

async function carregarBDDoGitHub() {
  const el = document.getElementById('bd-status');
  const timestamp = new Date().getTime();
  try {
    const res = await fetch('./anomalias_base_dados.json?v=' + timestamp, { cache: "no-store" });
    if (res.ok) {
      bd = await res.json();
      localStorage.setItem('ce_bd', JSON.stringify(bd));
      if(el) el.textContent = '✓ Tabela Técnica v' + (bd.versao || '2.0') + ' ativa';
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
      showScreen('settings');
      return;
    }
    const tipo = document.getElementById('info-tipo').value;
    document.getElementById('campo-multifamiliar-container').style.display = (tipo === 'Habitação multifamiliar') ? 'block' : 'none';
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  const m = { home: 'nav-home', lista: 'nav-anomalias', export: 'nav-export', settings: 'nav-settings' };
  if (m[name]) document.getElementById(m[name]).classList.add('active');
  document.getElementById('fab').style.display = (name === 'nova') ? 'none' : 'flex';
  if (name === 'nova' && editingIdx === -1) resetNovaForm();
}

function onAmbitoMultifamiliarChange() {
  const tipo = document.getElementById('multifamiliar-tipo').value;
  document.getElementById('multifamiliar-detalhe').style.display = (tipo === 'Fracção') ? 'block' : 'none';
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
  document.getElementById('home-morada').textContent = i.morada ? i.morada + ', ' + (i.localidade || '') : 'Preenche os dados iniciais';
  document.getElementById('home-count-an').textContent = consultoria.anomalias.length;
  const tf = consultoria.anomalias.reduce((s, a) => s + (a.fotos ? a.fotos.length : 0), 0);
  document.getElementById('home-count-foto').textContent = tf;
  document.getElementById('home-data').textContent = i.data ? i.data.split('-').reverse().join('/') : '—';
}

async function saveAnomalia() {
  if (isSaving) return;
  const zid = document.getElementById('sel-zona').value;
  const aid = document.getElementById('sel-anomalia').value;
  if (!zid || !aid || !currentSev) { showToast('Preenche os campos obrigatórios!'); return; }

  isSaving = true;
  const btn = document.getElementById('btn-guardar-anomalia');
  btn.disabled = true; btn.textContent = "A sincronizar...";

  const i = consultoria.info || {};
  const pastaMae = (i.cliente || "Consultoria").replace(/\s+/g, '_') + "_" + (i.data || "Hoje").replace(/-/g, '_');
  
  let localFisico = "Geral";
  if (i.tipo === 'Habitação multifamiliar') {
    const ambito = document.getElementById('multifamiliar-tipo').value;
    localFisico = (ambito === 'Zona Comum') ? "Zonas_Comuns" : "Fracção_" + document.getElementById('multifamiliar-detalhe').value.trim().replace(/\s+/g, '_');
  }

  const z = bd.zonas.find(x => x.id === zid);
  const an = z.anomalias.find(a => a.id === aid);

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

  if (currentPhotos.length > 0) {
    showToast("A enviar fotos...");
    novaAnomalia.fotos = await uploadFotosDrive(novaAnomalia, consultoria.anomalias.length + 1, pastaMae, localFisico);
  }

  consultoria.anomalias.push(novaAnomalia);
  localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));
  await autoSaveToDrive(pastaMae);

  isSaving = false;
  showToast("✓ Sincronizado!");
  showScreen('lista');
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
  try {
    const payload = { action: "autoSaveJson", folderId: rootId, parentFolderName: pastaMae, fileName: pastaMae + ".json", consultoria: consultoria };
    await fetch(sUrl, { method: 'POST', body: JSON.stringify(payload) });
  } catch (e) { console.error(e); }
}

async function testarDrive() {
  const sUrl = localStorage.getItem('ce_script_url');
  const fId = localStorage.getItem('ce_drive_folder_id');
  const log = document.getElementById('drive-auth-status');
  if (!sUrl || !fId) { showToast("Preenche os campos primeiro!"); return; }
  log.textContent = "A testar ligação..."; log.style.color = "var(--accent)";
  try {
    const res = await fetch(sUrl, { method: 'POST', body: JSON.stringify({ action: "testDrive", folderId: fId }) });
    const rd = await res.json();
    if (rd.success) { log.textContent = "✓ Ligação OK: " + rd.folderName; log.style.color = "var(--success)"; }
    else { log.textContent = "❌ Erro: " + rd.error; log.style.color = "var(--danger)"; }
  } catch (e) { log.textContent = "❌ Erro Rede: Failed to fetch (Verifica as permissões 'Anyone' no Script)"; log.style.color = "var(--danger)"; }
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

/* Restantes funções auxiliares (Zonas, Chips, Audio) - Manter iguais */
function populateZonas() { const sel = document.getElementById('sel-zona'); sel.innerHTML = '<option value="">— Seleccionar zona —</option>'; bd.zonas.forEach(z => { const o = document.createElement('option'); o.value = z.id; o.textContent = z.nome; sel.appendChild(o); }); }
function onZonaChange() { const zid = document.getElementById('sel-zona').value; const sa = document.getElementById('sel-anomalia'); sa.innerHTML = ''; if (!zid) { sa.disabled = true; sa.innerHTML = '<option>— Primeiro seleccionar zona —</option>'; return; } const z = bd.zonas.find(x => x.id === zid); sa.disabled = false; sa.innerHTML = '<option value="">— Seleccionar anomalia —</option>'; z.anomalias.forEach(a => { const o = document.createElement('option'); o.value = a.id; o.textContent = a.nome; sa.appendChild(o); }); clearAnomaliaFields(); }
function onAnomaliaChange() { const zid = document.getElementById('sel-zona').value, aid = document.getElementById('sel-anomalia').value; clearAnomaliaFields(); if (!aid) return; const z = bd.zonas.find(x => x.id === zid), an = z.anomalias.find(a => a.id === aid); setSev(an.severidade_padrao); renderChips('causas-chips', an.causas, selectedCausas); renderChips('solucoes-chips', an.solucoes, selectedSolucoes); if (an.notas_tecnicas) { document.getElementById('nota-tecnica-card').style.display = 'block'; document.getElementById('nota-tecnica-text').textContent = an.notas_tecnicas; } }
function setSev(sev) { currentSev = sev; document.querySelectorAll('.sev-btn').forEach(b => b.classList.toggle('active', b.dataset.sev === sev)); }
function clearAnomaliaFields() { selectedCausas = new Set(); selectedSolucoes = new Set(); customCausas = []; customSolucoes = []; ['causas-chips', 'solucoes-chips', 'causas-custom-list', 'solucoes-custom-list'].forEach(id => document.getElementById(id).innerHTML = ''); document.getElementById('nota-tecnica-card').style.display = 'none'; }
function renderChips(cid, items, sel) { const c = document.getElementById(cid); c.innerHTML = ''; items.forEach((item, i) => { const ch = document.createElement('div'); ch.className = 'chip'; ch.textContent = item; ch.onclick = () => { if (sel.has(i)) sel.delete(i); else sel.add(i); ch.classList.toggle('selected', sel.has(i)); }; c.appendChild(ch); }); }
function handlePhotos(event) { Array.from(event.target.files).forEach(file => { const reader = new FileReader(); reader.onload = e => { currentPhotos.push({ dataUrl: e.target.result, name: file.name }); renderPhotos(); }; reader.readAsDataURL(file); }); }
function renderPhotos() { const grid = document.getElementById('photos-grid'); grid.innerHTML = ''; currentPhotos.forEach((p, i) => { const div = document.createElement('div'); div.className = 'photo-thumb'; div.innerHTML = '<img src="' + p.dataUrl + '"><button class="photo-del" onclick="currentPhotos.splice(' + i + ',1);renderPhotos();">✕</button>'; grid.appendChild(div); }); }
function resetNovaForm() { isSaving = false; document.getElementById('btn-guardar-anomalia').disabled = false; document.getElementById('btn-guardar-anomalia').textContent = "GUARDAR E SINCRONIZAR"; document.getElementById('sel-zona').value = ''; document.getElementById('sel-anomalia').disabled = true; document.getElementById('obs-text').value = ''; currentPhotos = []; currentSev = null; document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active')); renderPhotos(); clearAnomaliaFields(); }
function renderLista() { const container = document.getElementById('lista-container'); container.innerHTML = consultoria.anomalias.length === 0 ? '<div class="empty">Sem registos.</div>' : ''; consultoria.anomalias.forEach((a, i) => { const item = document.createElement('div'); item.className = 'anomalia-item'; item.innerHTML = '<div class="anomalia-item-header"><div><div class="anomalia-item-title">' + (i + 1) + '. ' + a.anomalia_nome + '</div><div class="anomalia-item-meta">' + a.ambito + ' | ' + a.zona + '</div></div><span class="sev-badge ' + a.severidade + '">' + a.severidade + '</span></div>'; container.appendChild(item); }); }
function setDefaultDate() { if (!document.getElementById('info-data').value) document.getElementById('info-data').value = new Date().toISOString().split('T')[0]; }
function checkSpeechAPI() { } function toggleRec() { } 
function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.className = 'toast show'; setTimeout(() => t.className = 'toast', 3000); }
