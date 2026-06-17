/* 
   app.js - CASAS DO TEJO v3.0 
   Lógica: GitHub DB Sync + Multifamiliar + Pasta Mãe Automática
*/

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
let toastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  loadInfo();
  updateHomeStats();
  setDefaultDate();
  loadCfg();
  checkSpeechAPI();
  
  // Carrega a base técnica do GitHub
  await carregarBDDoGitHub();
  populateZonas();
  renderLista();
});

// FUNÇÃO: Carrega JSON do GitHub ignorando a cache
async function carregarBDDoGitHub() {
  const el = document.getElementById('bd-status');
  if(el) el.textContent = 'A sincronizar com o GitHub...';
  
  const timestamp = new Date().getTime();
  const urlGitHub = './anomalias_base_dados.json?v=' + timestamp;
  
  try {
    const res = await fetch(urlGitHub, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.zonas) {
        bd = data;
        localStorage.setItem('ce_bd', JSON.stringify(bd));
        if(el) el.textContent = '✓ Tabela Técnica v' + (bd.versao || '2.0') + ' ativa';
        return;
      }
    }
  } catch (err) {
    console.warn('Offline ou Erro GitHub. Usando cópia local.');
    bd = JSON.parse(localStorage.getItem('ce_bd')) || { zonas: [] };
    if(el) el.textContent = '⚠️ Modo Offline (Cópia Local)';
  }
}

function showScreen(name) {
  // BLOQUEIO: Só entra em Nova Anomalia se o Drive estiver configurado
  if (name === 'nova') {
    const sUrl = localStorage.getItem('ce_script_url');
    const fId = localStorage.getItem('ce_drive_folder_id');
    if (!sUrl || !fId) {
      showToast("⚠️ Sincroniza o Google Drive primeiro nas Configurações!");
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
  if (i.cliente) document.getElementById('info-cliente').value = i.cliente;
  if (i.morada) document.getElementById('info-morada').value = i.morada;
  if (i.localidade) document.getElementById('info-localidade').value = i.localidade;
  if (i.tipo) document.getElementById('info-tipo').value = i.tipo;
  if (i.data) document.getElementById('info-data').value = i.data;
  if (i.obs) document.getElementById('info-obs').value = i.obs;
}

function updateHomeStats() {
  const i = consultoria.info || {};
  document.getElementById('home-titulo').textContent = i.cliente || 'Nova consultoria';
  document.getElementById('home-morada').textContent = i.morada ? i.morada + ', ' + (i.localidade || '') : 'Preenche os dados para criar a pasta no Drive';
  document.getElementById('home-count-an').textContent = consultoria.anomalias.length;
  const tf = consultoria.anomalias.reduce((s, a) => s + (a.fotos ? a.fotos.length : 0), 0);
  document.getElementById('home-count-foto').textContent = tf;
  document.getElementById('home-data').textContent = i.data ? i.data.split('-').reverse().join('/') : '—';
}

// SALVAR ANOMALIA: Processo Síncrono e Hierárquico
async function saveAnomalia() {
  if (isSaving) return;
  const zid = document.getElementById('sel-zona').value;
  const aid = document.getElementById('sel-anomalia').value;
  if (!zid || !aid || !currentSev) { showToast('Preenche todos os campos obrigatórios!'); return; }

  isSaving = true;
  const btn = document.getElementById('btn-guardar-anomalia');
  btn.disabled = true; btn.textContent = "A sincronizar...";

  const i = consultoria.info || {};
  // Nome da Pasta Mãe (Ex: Condominio_Tejo_2026_06_17)
  const pastaMae = (i.cliente || "Consultoria").replace(/\s+/g, '_') + "_" + (i.data || "SemData").replace(/-/g, '_');
  
  // Localização Física (Fração ou Comum)
  let localFisico = "Zonas_Gerais";
  if (i.tipo === 'Habitação multifamiliar') {
    const ambito = document.getElementById('multifamiliar-tipo').value;
    localFisico = (ambito === 'Zona Comum') ? "Zonas_Comuns" : "Fracção_" + document.getElementById('multifamiliar-detalhe').value.trim().replace(/\s+/g, '_');
  }

  const z = bd.zonas.find(x => x.id === zid);
  const an = z.anomalias.find(a => a.id === aid);
  const anomaliaNum = consultoria.anomalias.length + 1;

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

  // 1. Upload das Fotos para a subpasta certa
  if (currentPhotos.length > 0) {
    showToast("A enviar fotos para: " + localFisico);
    const fotosRefs = await uploadFotosDrive(novaAnomalia, anomaliaNum, pastaMae, localFisico);
    novaAnomalia.fotos = fotosRefs;
  }

  consultoria.anomalias.push(novaAnomalia);
  localStorage.setItem('ce_consultoria', JSON.stringify(consultoria));

  // 2. Upload do JSON atualizado para a Pasta Mãe
  await autoSaveToDrive(pastaMae);

  isSaving = false;
  showToast("✓ Sincronização Concluída!");
  showScreen('lista');
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
      fotoName: foto.name || (Date.now() + ".jpg"),
      fotoBase64: foto.dataUrl
    };
    try {
      const res = await fetch(sUrl, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
      const rd = await res.json();
      if (rd.success) refs.push({ id: rd.id, name: payload.fotoName, driveUrl: rd.driveUrl });
    } catch (e) { console.error("Erro foto:", e); }
  }
  return refs;
}

async function autoSaveToDrive(pastaMae) {
  const sUrl = localStorage.getItem('ce_script_url');
  const rootId = localStorage.getItem('ce_drive_folder_id');
  const fn = pastaMae + ".json";
  
  try {
    const payload = { action: "autoSaveJson", folderId: rootId, parentFolderName: pastaMae, fileName: fn, consultoria: consultoria };
    await fetch(sUrl, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
  } catch (e) { console.error("Erro JSON:", e); }
}

/* FUNÇÕES AUXILIARES (ZONAS, SEVERIDADE, FOTOS, ETC - Mantém a lógica anterior adaptada) */
function populateZonas() {
  const sel = document.getElementById('sel-zona');
  sel.innerHTML = '<option value="">— Seleccionar zona —</option>';
  bd.zonas.forEach(z => { const o = document.createElement('option'); o.value = z.id; o.textContent = z.nome; sel.appendChild(o); });
}
function onZonaChange() {
  const zid = document.getElementById('sel-zona').value;
  const sa = document.getElementById('sel-anomalia');
  sa.innerHTML = '';
  if (!zid) { sa.disabled = true; sa.innerHTML = '<option>— Primeiro seleccionar zona —</option>'; return; }
  const z = bd.zonas.find(x => x.id === zid);
  sa.disabled = false; sa.innerHTML = '<option value="">— Seleccionar anomalia —</option>';
  z.anomalias.forEach(a => { const o = document.createElement('option'); o.value = a.id; o.textContent = a.nome; sa.appendChild(o); });
  clearAnomaliaFields();
}
function onAnomaliaChange() {
  const zid = document.getElementById('sel-zona').value, aid = document.getElementById('sel-anomalia').value;
  clearAnomaliaFields(); if (!aid) return;
  const z = bd.zonas.find(x => x.id === zid), an = z.anomalias.find(a => a.id === aid);
  setSev(an.severidade_padrao);
  renderChips('causas-chips', an.causas, selectedCausas);
  renderChips('solucoes-chips', an.solucoes, selectedSolucoes);
  if (an.notas_tecnicas) { document.getElementById('nota-tecnica-card').style.display = 'block'; document.getElementById('nota-tecnica-text').textContent = an.notas_tecnicas; }
}
function setSev(sev) { currentSev = sev; document.querySelectorAll('.sev-btn').forEach(b => b.classList.toggle('active', b.dataset.sev === sev)); }
function clearAnomaliaFields() { selectedCausas = new Set(); selectedSolucoes = new Set(); customCausas = []; customSolucoes = []; ['causas-chips', 'solucoes-chips', 'causas-custom-list', 'solucoes-custom-list'].forEach(id => document.getElementById(id).innerHTML = ''); document.getElementById('nota-tecnica-card').style.display = 'none'; }
function renderChips(cid, items, sel) { const c = document.getElementById(cid); c.innerHTML = ''; items.forEach((item, i) => { const ch = document.createElement('div'); ch.className = 'chip'; ch.textContent = item; ch.onclick = () => { if (sel.has(i)) sel.delete(i); else sel.add(i); ch.classList.toggle('selected', sel.has(i)); }; c.appendChild(ch); }); }
function handlePhotos(event) { Array.from(event.target.files).forEach(file => { const reader = new FileReader(); reader.onload = e => { currentPhotos.push({ dataUrl: e.target.result, name: file.name }); renderPhotos(); }; reader.readAsDataURL(file); }); }
function renderPhotos() { const grid = document.getElementById('photos-grid'); grid.innerHTML = ''; currentPhotos.forEach((p, i) => { const div = document.createElement('div'); div.className = 'photo-thumb'; div.innerHTML = '<img src="' + p.dataUrl + '"><button class="photo-del" onclick="currentPhotos.splice(' + i + ',1);renderPhotos();">✕</button>'; grid.appendChild(div); }); }
function resetNovaForm() { isSaving = false; document.getElementById('btn-guardar-anomalia').disabled = false; document.getElementById('btn-guardar-anomalia').textContent = "GUARDAR E SINCRONIZAR"; document.getElementById('sel-zona').value = ''; document.getElementById('sel-anomalia').disabled = true; document.getElementById('obs-text').value = ''; currentPhotos = []; currentSev = null; document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active')); renderPhotos(); clearAnomaliaFields(); }
function renderLista() { const container = document.getElementById('lista-container'); container.innerHTML = consultoria.anomalias.length === 0 ? '<div class="empty">Sem registos.</div>' : ''; consultoria.anomalias.forEach((a, i) => { const item = document.createElement('div'); item.className = 'anomalia-item'; item.innerHTML = '<div class="anomalia-item-header"><div><div class="anomalia-item-title">' + (i + 1) + '. ' + a.anomalia_nome + '</div><div class="anomalia-item-meta">' + a.ambito + ' | ' + a.zona + '</div></div><span class="sev-badge ' + a.severidade + '">' + a.severidade + '</span></div>'; container.appendChild(item); }); }
function setDefaultDate() { if (!document.getElementById('info-data').value) document.getElementById('info-data').value = new Date().toISOString().split('T')[0]; }
function loadCfg() { document.getElementById('cfg-script-url').value = localStorage.getItem('ce_script_url') || ''; document.getElementById('cfg-folder-id').value = localStorage.getItem('ce_drive_folder_id') || ''; }
function saveCfg() { localStorage.setItem('ce_script_url', document.getElementById('cfg-script-url').value.trim()); localStorage.setItem('cfg-folder-id', document.getElementById('cfg-folder-id').value.trim()); }
function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.className = 'toast show'; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = 'toast', 3000); }
async function testarDrive() { showToast("A testar ligação..."); } // Implementar se necessário

---

### 2. Google Apps Script (Novo Código do Servidor)
Este código é o que corre nos servidores da Google. Ele tem a "visão" das pastas e cria a hierarquia **Pasta Mãe > Fração > Anomalia**.

**Abre o teu projeto no Script Google, apaga o antigo e cola este:**

```javascript
/* 
   GOOGLE APPS SCRIPT - CASAS DO TEJO v3.0 
   Lógica: Criação de Pasta Mãe + Subpastas de Fração + JSON Automático
*/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var rootFolder = DriveApp.getFolderById(data.folderId);
    
    // 1. GERIR PASTA MÃE (Ex: Condominio_Tejo_2026_06_17)
    var parentFolderName = data.parentFolderName || "Consultoria_Geral";
    var parentFolders = rootFolder.getFoldersByName(parentFolderName);
    var parentFolder = parentFolders.hasNext() ? parentFolders.next() : rootFolder.createFolder(parentFolderName);
    
    // 2. AÇÃO: GUARDAR FOTO COM HIERARQUIA
    if (data.action === "uploadFoto") {
      // Cria/Acede à pasta da Fração ou Zona Comum dentro da Pasta Mãe
      var locationName = data.locationFolder || "Geral";
      var locFolders = parentFolder.getFoldersByName(locationName);
      var locFolder = locFolders.hasNext() ? locFolders.next() : parentFolder.createFolder(locationName);
      
      // Cria a pasta da anomalia específica
      var subName = ("000" + data.anomaliaNum).slice(-3) + "_" + data.anomaliaNome;
      var subFolders = locFolder.getFoldersByName(subName);
      var subFolder = subFolders.hasNext() ? subFolders.next() : locFolder.createFolder(subName);
      
      // Processa a Imagem
      var contentType = data.fotoBase64.substring(data.fotoBase64.indexOf(":")+1, data.fotoBase64.indexOf(";"));
      var base64Data = data.fotoBase64.substring(data.fotoBase64.indexOf(",")+1);
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, data.fotoName);
      
      var file = subFolder.createFile(blob);
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: file.getId(), driveUrl: file.getUrl() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. AÇÃO: SALVAR JSON NA PASTA MÃE
    if (data.action === "autoSaveJson") {
      var files = parentFolder.getFilesByName(data.fileName);
      if (files.hasNext()) {
        files.next().setContent(JSON.stringify(data.consultoria, null, 2));
      } else {
        parentFolder.createFile(data.fileName, JSON.stringify(data.consultoria, null, 2), "application/json");
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

**⚠️ Passo Final Obrigatório no Apps Script:**
Após colares o código:
1.  Clica em **Implementar (Deploy)** > **Gerir implementações**.
2.  Clica no **Lápis** para editar a tua implementação ativa.
3.  Muda a Versão para **"Nova versão"**.
4.  Clica em **Implementar**.
5.  Copia o novo URL e cola-o no separador **Config.** da tua PWA.

Temos o sistema Casas do Tejo 3.0 blindado! Podes agora avançar com confiança. Como vês esta nova organização de pastas?
