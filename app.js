// app.js - Lógica Central da Aplicação (Versão Corrigida)

const BD_DEFAULT={"versao":"1.0","zonas":[{"id":"fachadas","nome":"Fachadas","anomalias":[{"id":"fach_01","nome":"Fissuras no revestimento","severidade_padrao":"M","causas":["Retração hidráulica do reboco por secagem rápida na aplicação","Ciclos quente-frio com dilatação térmica diferencial","Movimentos diferenciais entre elements estruturais e não estruturais","Falta de manutenção"],"solucoes":["Limpeza e selagem das fissuras com argamassa de cal ou produto elástico compatível","Aplicação de primário de consolidação e posterior pintura com tinta elástica","Em fissuras activas: corte em V, selagem com mástique elástico e remate"],"notas_tecnicas":"Distinguir fissuras passivas (estabilizadas) de activas (em evolução). Fissuras com largura > 0,3 mm devem ser reportadas ao projectista."},{"id":"fach_02","nome":"Infiltrações / humidade de precipitação","severidade_padrao":"G","causas":["Degradação ou ausência de selagem nas juntas de caixilharia","Revestimento de fachada fissurado ou com porosidade elevada","Junta de dilatação selada com material rígido ou degradado","Cornijas ou peitoris sem goteira"],"solucoes":["Inspecção e refechamento de juntas com mástique de poliuretano ou silicone neutro","Aplicação de hidrofugante de superfície em revestimentos porosos","Substituição da selagem da junta de dilatação por perfil elástico adequado","Execução ou reparação de goteiras em peitoris e cornijas"],"notas_tecnicas":"Identificar a origem exacta da infiltração antes de intervir."},{"id":"fach_03","nome":"Armaduras expostas / carbonatação","severidade_padrao":"G","causas":["Recobrimento insuficiente das armaduras na construção","Carbonatação do betão atingindo a armadura","Cloretos em zonas costeiras acelerando a corrosão"],"solucoes":["Remoção do betão degradado até 2 cm além da armadura exposta","Tratamento anticorrosivo das armaduras (primário epoxídico bicomponente)","Reposição do recobrimento com argamassa de reparação estrutural (classe R3/R4)"],"notas_tecnicas":"A extensão da corrosão pode ser superior à visível."},{"id":"fach_04","nome":"Destacamento / empolamento do revestimento","severidade_padrao":"M","causas":["Falta de aderência entre camadas de revestimento","Humidade retida entre suporte e revestimento","Aplicação sobre suporte contaminado"],"solucoes":["Percussão para mapeamento das zonas ocas e remoção selectiva","Limpeza e preparação do suporte","Aplicação de primário de aderência e reposição do revestimento"],"notas_tecnicas":"Utilizar percussão (martelo leve) para identificar extensão das zonas ocas."}]},{"id":"cobertura","nome":"Cobertura","anomalias":[{"id":"cob_01","nome":"Infiltrações pela cobertura","severidade_padrao":"G","causas":["Telhas partidas, deslocadas ou em falta","Degradação ou ausência de impermeabilização na zona de cumeeira, rincões e platibandas","Caleiras e rufos degradados ou mal executados"],"solucoes":["Inspecção completa e substituição de telhas danificadas","Reparação ou substituição de impermeabilização em pontos singulares","Substituição de caleiras e rufos degradados"],"notas_tecnicas":"Verificar estado da estrutura de suporte em coberturas inclinadas."},{"id":"cob_02","nome":"Estrutura de madeira degradada","severidade_padrao":"MG","causas":["Ataque de xilófagos (caruncho, térmitas)","Humidade permanente por infiltrações","Falta de ventilação da caixa de ar"],"solucoes":["Avaliação da extensão do dano — substituição parcial ou total","Tratamento das madeiras sãs com fungicida/insecticida de penetração profunda"],"notas_tecnicas":"Recomendar ensaio de resistógrafo em casos de dúvida."},{"id":"cob_03","nome":"Deformação excessiva da cobertura","severidade_padrao":"MG","causas":["Degradação da estrutura resistente","Sobrecargas não previstas"],"solucoes":["Escoramento de emergência se deformação for activa","Avaliação estrutural por engenheiro antes de qualquer intervenção"],"notas_tecnicas":"ATENÇÃO: deformação visível a olho nu deve ser tratada como situação de risco."}]},{"id":"paredes_interiores","nome":"Paredes Interiores","anomalias":[{"id":"par_01","nome":"Humidade de condensação","severidade_padrao":"M","causas":["Insuficiente isolamento térmico (pontes térmicas)","Ventilação inadequada dos espaços"],"solucoes":["Melhoria do isolamento térmico (reforço interior ou ETICS pelo exterior)","Instalação ou melhoria da ventilação mecânica controlada (VMC)"],"notas_tecnicas":"Distinguir humidade de condensação de infiltração."},{"id":"par_02","nome":"Humidade ascensional","severidade_padrao":"G","causas":["Ausência ou degradação da barreira corta-humidade","Lençol freático elevado"],"solucoes":["Injecção de resinas hidrofóbicas na base das paredes","Drenagem perimetral se causa for lençol freático elevado"],"notas_tecnicas":"Padrão: mancha com limite superior horizontal e aureola de sais."},{"id":"par_03","nome":"Fissuras em paredes de alvenaria","severidade_padrao":"M","causas":["Assentamentos diferenciais de fundações","Variações térmicas e higrométricas","Ausência de juntas de dilatação"],"solucoes":["Monitorização com fissurômetros antes de intervir","Se estabilizadas: selagem com argamassa de cal"],"notas_tecnicas":"Fissuras a 45° nos cantos de vãos sugerem assentamento diferencial."}]},{"id":"pavimentos","nome":"Pavimentos","anomalias":[{"id":"pav_01","nome":"Abatimento / assentamento do pavimento térreo","severidade_padrao":"G","causas":["Humidade do terreno causando erosão","Ausência de laje de betão"],"solucoes":["Demolição do pavimento afectado e análise do terreno","Execução de nova laje de betão armado sobre geotêxtil e tout-venant"],"notas_tecnicas":"Confirmar se abatimento é activo ou estabilizado."},{"id":"pav_02","nome":"Destacamento / som oco em revestimento","severidade_padrao":"L","causas":["Falta de aderência da betonilha ao suporte","Ausência de juntas de dilatação"],"solucoes":["Percussão para mapeamento das zonas ocas","Substituição selectiva das peças com défice de aderência"],"notas_tecnicas":"Em pavimentos radiantes verificar juntas de dilatação."}]},{"id":"instalacoes_sanitarias","nome":"Instalações Sanitárias","anomalias":[{"id":"san_01","nome":"Infiltrações em WC / zonas húmidas","severidade_padrao":"G","causas":["Impermeabilização degradada ou inexistente","Juntas de revestimento abertas"],"solucoes":["Remoção do revestimento e aplicação de membrana impermeável (sistema tanque)","Refechamento de juntas com vedante epoxídico"],"notas_tecnicas":"A membrana deve subir pelo menos 20 cm nas paredes."}]},{"id":"estrutura","nome":"Estrutura","anomalias":[{"id":"est_01","nome":"Fissuras em elementos de betão armado","severidade_padrao":"G","causas":["Corrosão de armaduras por carbonatação","Esforços excessivos","Assentamentos de fundações"],"solucoes":["Avaliação estrutural por engenheiro antes de qualquer intervenção","Injecção de fissuras com resina epoxídica"],"notas_tecnicas":"ATENÇÃO: fissuras em elementos estruturais requerem sempre avaliação por engenheiro."},{"id":"est_02","nome":"Paredes resistentes com fissuras de ligação","severidade_padrao":"M","causas":["Assentamentos diferenciais","Ausência de amarração entre paredes ortogonais"],"solucoes":["Monitorização prévia com fissurômetros","Reforço da ligação com varões injectados"],"notas_tecnicas":"Em alvenaria de pedra, fissuras podem estar estabilizadas há décadas."}]},{"id":"caixilharias_vaos","nome":"Caixilharias e Vãos","anomalias":[{"id":"cai_01","nome":"Infiltrações em caixilharia","severidade_padrao":"M","causas":["Degradação dos vedantes perimetrais","Caixilharia desapertada ou com folgas"],"solucoes":["Remoção e refechamento dos vedantes com silicone neutro","Regulação das ferragens e ajuste das folhas"],"notas_tecnicas":"Verificar se infiltração é pela caixilharia ou pela ligação caixilharia-parede."}]}]};

let bd=JSON.parse(localStorage.getItem('ce_bd'))||BD_DEFAULT;
let consultoria=JSON.parse(localStorage.getItem('ce_consultoria'))||{info:{},anomalias:[]};
let editingIdx=-1;
let currentPhotos=[];
let selectedCausas=new Set();
let selectedSolucoes=new Set();
let customCausas=[];
let customSolucoes=[];
let currentSev=null;
let isRecording=false;
let recognition=null;
let isSaving=false;
let toastTimer=null;
let autoSaveTimer=null;

// Registo PWA nativo
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registado com sucesso.'))
      .catch(err => console.error('Falha ao registar Service Worker:', err));
  });
}

document.addEventListener('DOMContentLoaded',()=>{loadInfo();populateZonas();renderLista();updateHomeStats();setDefaultDate();loadCfg();checkSpeechAPI();});

function setDefaultDate(){if(!document.getElementById('info-data').value){document.getElementById('info-data').value=new Date().toISOString().split('T')[0];saveInfo();}}

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  const m={home:'nav-home',lista:'nav-anomalias',export:'nav-export',settings:'nav-settings'};
  if(m[name])document.getElementById(m[name]).classList.add('active');
  document.getElementById('fab').style.display=(name==='nova')?'none':'flex';
  if(name==='nova'&&editingIdx===-1)resetNovaForm();
  if(name==='lista')renderLista();
  if(name==='export')updateExportScreen();
  if(name==='home')updateHomeStats();
  window.scrollTo(0,0);
}

function saveInfo(){
  consultoria.info={cliente:document.getElementById('info-cliente').value,morada:document.getElementById('info-morada').value,localidade:document.getElementById('info-localidade').value,tipo:document.getElementById('info-tipo').value,data:document.getElementById('info-data').value,obs:document.getElementById('info-obs').value};
  localStorage.setItem('ce_consultoria',JSON.stringify(consultoria));
  scheduleAutoSave();updateHomeStats();
}
function loadInfo(){
  if(!consultoria.info)return;const i=consultoria.info;
  if(i.cliente)document.getElementById('info-cliente').value=i.cliente;
  if(i.morada)document.getElementById('info-morada').value=i.morada;
  if(i.localidade)document.getElementById('info-localidade').value=i.localidade;
  if(i.tipo)document.getElementById('info-tipo').value=i.tipo;
  if(i.data)document.getElementById('info-data').value=i.data;
  if(i.obs)document.getElementById('info-obs').value=i.obs;
}
function updateHomeStats(){
  const i=consultoria.info||{};
  document.getElementById('home-titulo').textContent=i.cliente||'Nova consultoria';
  const m=[i.morada,i.localidade].filter(Boolean).join(', ');
  document.getElementById('home-morada').textContent=m||'Preenche os dados da consultoria abaixo';
  document.getElementById('home-count-an').textContent=consultoria.anomalias.length;
  const tf=consultoria.anomalias.reduce((s,a)=>s+(a.fotos?a.fotos.length:0),0);
  document.getElementById('home-count-foto').textContent=tf;
  document.getElementById('home-data').textContent=i.data?i.data.split('-').reverse().join('/'):'—';
}

function populateZonas(){
  const sel=document.getElementById('sel-zona');
  sel.innerHTML='<option value="">— Seleccionar zona —</option>';
  bd.zonas.forEach(z=>{const o=document.createElement('option');o.value=z.id;o.textContent=z.nome;sel.appendChild(o);});
}
function onZonaChange(){
  const zid=document.getElementById('sel-zona').value;
  const sa=document.getElementById('sel-anomalia');
  sa.innerHTML='';
  if(!zid){sa.disabled=true;sa.innerHTML='<option>— Primeiro seleccionar zona —</option>';return;}
  const z=bd.zonas.find(x=>x.id===zid);
  sa.disabled=false;sa.innerHTML='<option value="">— Seleccionar anomalia —</option>';
  z.anomalias.forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.nome;sa.appendChild(o);});
  clearAnomaliaFields();
}
function onAnomaliaChange(){
  const zid=document.getElementById('sel-zona').value,aid=document.getElementById('sel-anomalia').value;
  clearAnomaliaFields();if(!aid)return;
  const z=bd.zonas.find(x=>x.id===zid),an=z.anomalias.find(a=>a.id===aid);
  setSev(an.severidade_padrao);
  renderChips('causas-chips',an.causas,selectedCausas);
  renderChips('solucoes-chips',an.solucoes,selectedSolucoes);
  if(an.notas_tecnicas){document.getElementById('nota-tecnica-card').style.display='';document.getElementById('nota-tecnica-text').textContent=an.notas_tecnicas;}
}
function clearAnomaliaFields(){
  selectedCausas=new Set();selectedSolucoes=new Set();customCausas=[];customSolucoes=[];
  ['causas-chips','solucoes-chips','causas-custom-list','solucoes-custom-list'].forEach(id=>document.getElementById(id).innerHTML='');
  document.getElementById('nota-tecnica-card').style.display='none';
  document.getElementById('causa-custom').value='';document.getElementById('solucao-custom').value='';
}
function renderChips(cid,items,sel){
  const c=document.getElementById(cid);c.innerHTML='';
  items.forEach((item,i)=>{const ch=document.createElement('div');ch.className='chip';ch.textContent=item;ch.onclick=()=>{if(sel.has(i))sel.delete(i);else sel.add(i);ch.classList.toggle('selected',sel.has(i));};c.appendChild(ch);});
}

function openAddZona(){document.getElementById('add-zona-modal').classList.add('open');setTimeout(()=>document.getElementById('add-zona-input').focus(),100);}
function closeAddZona(){document.getElementById('add-zona-modal').classList.remove('open');document.getElementById('add-zona-input').value='';}
function confirmAddZona(){
  const nome=document.getElementById('add-zona-input').value.trim();if(!nome)return;
  const id='zona_'+Date.now();
  bd.zonas.push({id,nome,anomalias:[]});
  localStorage.setItem('ce_bd',JSON.stringify(bd));
  populateZonas();document.getElementById('sel-zona').value=id;onZonaChange();
  closeAddZona();showToast('Zona "'+nome+'" adicionada ✓');
}
function openAddAnomalia(){
  if(!document.getElementById('sel-zona').value){showToast('Selecciona uma zona primeiro');return;}
  document.getElementById('add-anomalia-modal').classList.add('open');
  setTimeout(()=>document.getElementById('add-anomalia-input').focus(),100);
}
function closeAddAnomalia(){document.getElementById('add-anomalia-modal').classList.remove('open');document.getElementById('add-anomalia-input').value='';}
function confirmAddAnomalia(){
  const nome=document.getElementById('add-anomalia-input').value.trim();if(!nome)return;
  const zid=document.getElementById('sel-zona').value;
  const z=bd.zonas.find(x=>x.id===zid);if(!z)return;
  const id='an_'+Date.now();
  z.anomalias.push({id,nome,severidade_padrao:'M',causas:[],solucoes:[],notas_tecnicas:''});
  localStorage.setItem('ce_bd',JSON.stringify(bd));
  onZonaChange();document.getElementById('sel-anomalia').value=id;onAnomaliaChange();
  closeAddAnomalia();showToast('Anomalia "'+nome+'" adicionada ✓');
}

function setSev(sev){currentSev=sev;document.querySelectorAll('.sev-btn').forEach(b=>b.classList.toggle('active',b.dataset.sev===sev));}

function addCausaCustom(){const v=document.getElementById('causa-custom').value.trim();if(!v)return;customCausas.push(v);document.getElementById('causa-custom').value='';renderCustomList('causas-custom-list',customCausas,'causa');}
function addSolucaoCustom(){const v=document.getElementById('solucao-custom').value.trim();if(!v)return;customSolucoes.push(v);document.getElementById('solucao-custom').value='';renderCustomList('solucoes-custom-list',customSolucoes,'solucao');}
function renderCustomList(cid,arr,type){
  const c=document.getElementById(cid);c.innerHTML='';
  arr.forEach((item,i)=>{const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:6px;margin-top:6px';row.innerHTML='<span style="flex:1;font-size:13px;background:var(--accent-light);color:var(--accent);padding:6px 10px;border-radius:8px">'+item+'</span><button onclick="removeCustom(\''+type+'\','+i+')" style="background:var(--danger-light);color:var(--danger);border:none;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer">✕</button>';c.appendChild(row);});
}
function removeCustom(type,idx){if(type==='causa'){customCausas.splice(idx,1);renderCustomList('causas-custom-list',customCausas,'causa');}else{customSolucoes.splice(idx,1);renderCustomList('solucoes-custom-list',customSolucoes,'solucao');}}

function handlePhotos(event){
  Array.from(event.target.files).forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{currentPhotos.push({dataUrl:e.target.result,name:file.name,file});renderPhotos();};
    reader.readAsDataURL(file);
  });
  event.target.value='';
}
function renderPhotos(){
  const grid=document.getElementById('photos-grid');grid.innerHTML='';
  currentPhotos.forEach((p,i)=>{const div=document.createElement('div');div.className='photo-thumb';div.innerHTML='<img src="'+p.dataUrl+'" alt="foto '+(i+1)+'"><button class="photo-del" onclick="removePhoto('+i+')">✕</button>';grid.appendChild(div);});
}
function removePhoto(idx){currentPhotos.splice(idx,1);renderPhotos();}

function checkSpeechAPI(){if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){const b=document.getElementById('rec-btn');b.title='Reconhecimento de voz não disponível';b.style.opacity='.5';}}
function toggleRec(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showToast('Usa Edge ou Chrome para reconhecimento de voz');return;}
  if(isRecording){isRecording=false;if(recognition){try{recognition.abort();}catch(e){}recognition=null;}document.getElementById('rec-btn').classList.remove('recording');document.getElementById('rec-label').textContent='Gravar áudio';document.getElementById('rec-status').textContent='';}
  else{isRecording=true;document.getElementById('rec-btn').classList.add('recording');document.getElementById('rec-label').textContent='A gravar...';document.getElementById('rec-status').textContent='🔴 Reconhecimento activo — fala naturalmente';startRecognitionSession();}
}
function startRecognitionSession(){
  if(!isRecording)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();recognition.lang='pt-PT';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onresult=e=>{if(e.results.length>0&&e.results[0].isFinal){const t=e.results[0][0].transcript.trim();const ta=document.getElementById('obs-text');ta.value=ta.value+(ta.value&&!ta.value.endsWith(' ')?' ':'')+t+' ';}};
  recognition.onerror=e=>{if(e.error==='no-speech'||e.error==='aborted')return;if(e.error==='not-allowed'){showToast('Permissão de microfone negada');isRecording=false;document.getElementById('rec-btn').classList.remove('recording');document.getElementById('rec-label').textContent='Gravar áudio';document.getElementById('rec-status').textContent='';}};
  recognition.onend=()=>{if(isRecording)setTimeout(startRecognitionSession,200);};
  try{recognition.start();}catch(e){if(isRecording)setTimeout(startRecognitionSession,500);}
}

async function saveAnomalia(){
  if(isSaving)return;
  const zid=document.getElementById('sel-zona').value,aid=document.getElementById('sel-anomalia').value;
  if(!zid||!aid){showToast('Selecciona zona e anomalia');return;}
  if(!currentSev){showToast('Selecciona a severidade');return;}
  isSaving=true;
  const btn=document.getElementById('btn-guardar-anomalia');
  if(btn){btn.disabled=true;btn.style.opacity='.6';}
  const z=bd.zonas.find(x=>x.id===zid),an=z.anomalias.find(a=>a.id===aid);
  const causasF=[...Array.from(selectedCausas).map(i=>an.causas[i]),...customCausas];
  const solucoesF=[...Array.from(selectedSolucoes).map(i=>an.solucoes[i]),...customSolucoes];
  const wasEditing=editingIdx>=0;
  const anomaliaNum=wasEditing?editingIdx+1:consultoria.anomalias.length+1;
  const anomalia={
    id:wasEditing?consultoria.anomalias[editingIdx].id:Date.now(),
    zona:z.nome,zona_id:zid,anomalia_id:aid,anomalia_nome:an.nome,
    severidade:currentSev,causas:causasF,solucoes:solucoesF,
    observacoes:document.getElementById('obs-text').value,
    fotos:wasEditing?consultoria.anomalias[editingIdx].fotos:[],
    timestamp:new Date().toISOString()
  };
  if(wasEditing)consultoria.anomalias[editingIdx]=anomalia;
  else consultoria.anomalias.push(anomalia);
  
  if(currentPhotos.length>0){
    const sUrl=localStorage.getItem('ce_script_url');
    if(sUrl){
      showToast('A enviar fotos para Drive...');
      const refs=await uploadFotosDrive(anomalia,anomaliaNum);
      anomalia.fotos=[...anomalia.fotos,...refs];
    }else{
      setDriveLog('Fotos não enviadas: URL do Script em falta.','danger');
    }
  }
  localStorage.setItem('ce_consultoria',JSON.stringify(consultoria));
  scheduleAutoSave();
  updateHomeStats();
  isSaving=false;
  if(btn){btn.disabled=false;btn.style.opacity='';}
  showToast(wasEditing?'Anomalia actualizada ✓':'Anomalia guardada ✓');
  setTimeout(()=>showScreen('lista'),350);
}

function resetNovaForm(){
  isSaving=false;
  const btn=document.getElementById('btn-guardar-anomalia');
  if(btn){btn.disabled=false;btn.style.opacity='';}
  document.getElementById('sel-zona').value='';
  document.getElementById('sel-anomalia').value='';
  document.getElementById('sel-anomalia').disabled=true;
  document.getElementById('sel-anomalia').innerHTML='<option>— Primeiro seleccionar zona —</option>';
  clearAnomaliaFields();
  currentPhotos=[];currentSev=null;
  document.querySelectorAll('.sev-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('obs-text').value='';
  document.getElementById('photos-grid').innerHTML='';
  document.getElementById('nova-screen-title').textContent='Nova Anomalia';
  if(isRecording)toggleRec();
}

function renderLista(){
  const container=document.getElementById('lista-container');
  const count=consultoria.anomalias.length;
  document.getElementById('lista-count').textContent=count+(count===1?' registo':' registos');
  if(count===0){container.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div style="font-size:14px">Sem anomalias registadas.<br>Usa o botão + para adicionar.</div></div>';return;}
  container.innerHTML='';
  consultoria.anomalias.forEach((a,idx)=>{
    const div=document.createElement('div');div.className='anomalia-item';div.onclick=()=>showDetalhe(idx);
    const fc=a.fotos?a.fotos.length:0;
    div.innerHTML='<div class="anomalia-item-header"><div><div class="anomalia-item-title">'+(idx+1)+'. '+a.anomalia_nome+'</div><div class="anomalia-item-meta">'+a.zona+' · '+a.causas.length+' causa(s) · '+fc+' foto(s)</div></div><span class="sev-badge '+a.severidade+'">'+a.severidade+'</span></div>';
    container.appendChild(div);
  });
}

function showDetalhe(idx){
  const a=consultoria.anomalias[idx];
  const body=document.getElementById('modal-detalhe-body');
  const fotosHtml=a.fotos&&a.fotos.length?'<div style="margin-top:8px"><div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">Fotografias ('+a.fotos.length+')</div>'+a.fotos.map(f=>'<div style="font-size:13px;padding:3px 0;color:var(--text2)">📎 '+(f.name||f.id)+(f.driveUrl?'  <a href="'+f.driveUrl+'" target="_blank" style="color:var(--accent);font-size:12px">Ver no Drive</a>':'')+'</div>').join('')+'</div>':'';
  body.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px"><div style="font-size:16px;font-weight:700;flex:1">'+(idx+1)+'. '+a.anomalia_nome+'</div><span class="sev-badge '+a.severidade+'" style="font-size:13px;padding:5px 12px">'+a.severidade+'</span></div><div style="font-size:12px;color:var(--text3);margin-bottom:12px">'+a.zona+'</div>'+(a.causas.length?'<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">Causas</div>'+a.causas.map(c=>'<div style="font-size:13px;padding:5px 0;border-bottom:1px solid var(--border);line-height:1.4">'+c+'</div>').join('')+'</div>':'')+(a.solucoes.length?'<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">Reparação</div>'+a.solucoes.map(s=>'<div style="font-size:13px;padding:5px 0;border-bottom:1px solid var(--border);line-height:1.4">'+s+'</div>').join('')+'</div>':'')+(a.observacoes?'<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:6px">Observações</div><div style="font-size:13px;line-height:1.5">'+a.observacoes+'</div></div>':'')+fotosHtml;
  document.getElementById('btn-del-anomalia').onclick=()=>deleteAnomalia(idx);
  document.getElementById('modal-detalhe').classList.add('open');
}
function deleteAnomalia(idx){consultoria.anomalias.splice(idx,1);localStorage.setItem('ce_consultoria',JSON.stringify(consultoria));document.getElementById('modal-detalhe').classList.remove('open');renderLista();updateHomeStats();showToast('Anomalia eliminada');}

function updateExportScreen(){
  const i=consultoria.info||{};
  document.getElementById('exp-cliente').textContent=i.cliente||'—';
  document.getElementById('exp-count').textContent=consultoria.anomalias.length;
  const tf=consultoria.anomalias.reduce((s,a)=>s+(a.fotos?a.fotos.length:0),0);
  document.getElementById('exp-fotos').textContent=tf;
  document.getElementById('exp-data').textContent=i.data?i.data.split('-').reverse().join('/'):'—';
  updateDriveStatus();document.getElementById('resumo-output').style.display='none';
}
function exportarJSON(){
  if(!consultoria.anomalias.length){showToast('Sem anomalias para exportar');return;}
  const blob=new Blob([JSON.stringify(consultoria,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  const c=(consultoria.info&&consultoria.info.cliente)?consultoria.info.cliente.replace(/\s+/g,'_'):'consultoria';
  const d=(consultoria.info&&consultoria.info.data)?'_'+consultoria.info.data:'';
  a.href=url;a.download=c+d+'.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast('JSON exportado ✓');
}
function gerarResumo(){
  if(!consultoria.anomalias.length){showToast('Sem anomalias para resumir');return;}
  const i=consultoria.info||{};
  const sl={ML:'Muito Ligeira',L:'Ligeira',M:'Média',G:'Grave',MG:'Muito Grave'};
  let txt='RESUMO DE CONSULTORIA\n'+'='.repeat(55)+'\n\n';
  if(i.cliente)txt+='Cliente: '+i.cliente+'\n';
  if(i.morada||i.localidade)txt+='Morada: '+[i.morada,i.localidade].filter(Boolean).join(', ')+'\n';
  if(i.tipo)txt+='Tipo de imóvel: '+i.tipo+'\n';
  if(i.data)txt+='Data da visita: '+i.data.split('-').reverse().join('/')+'\n';
  txt+='\n';if(i.obs)txt+='Observações gerais:\n'+i.obs+'\n\n';
  txt+='ANOMALIAS IDENTIFICADAS ('+consultoria.anomalias.length+')\n'+'─'.repeat(40)+'\n\n';
  consultoria.anomalias.forEach((a,idx)=>{
    txt+=(idx+1)+'. '+a.anomalia_nome.toUpperCase()+'\n';
    txt+='   Zona: '+a.zona+' | Severidade: '+(sl[a.severidade]||a.severidade)+'\n';
    if(a.causas.length){txt+='   Causas:\n';a.causas.forEach(c=>txt+='   • '+c+'\n');}
    if(a.solucoes.length){txt+='   Reparação:\n';a.solucoes.forEach(s=>txt+='   • '+s+'\n');}
    if(a.observacoes)txt+='   Notas: '+a.observacoes+'\n';
    txt+='\n';
  });
  document.getElementById('resumo-text').value=txt;document.getElementById('resumo-output').style.display='';
}
function copiarResumo(){navigator.clipboard.writeText(document.getElementById('resumo-text').value).then(()=>showToast('Resumo copiado ✓')).catch(()=>showToast('Erro ao copiar'));}
function confirmarLimpar(){document.getElementById('modal-limpar').classList.add('open');}
function limparTudo(){
  consultoria={info:{},anomalias:[]};
  localStorage.setItem('ce_consultoria',JSON.stringify(consultoria));
  document.getElementById('modal-limpar').classList.remove('open');
  ['info-cliente','info-morada','info-localidade','info-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('info-tipo').value='';setDefaultDate();updateHomeStats();renderLista();showToast('Consultoria limpa ✓');showScreen('home');
}

function carregarBD(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{try{const n=JSON.parse(e.target.result);if(!n.zonas)throw new Error('JSON inválido');bd=n;localStorage.setItem('ce_bd',JSON.stringify(bd));populateZonas();const c=bd.zonas.reduce((s,z)=>s+z.anomalias.length,0);document.getElementById('bd-status').textContent='✓ '+bd.zonas.length+' zonas, '+c+' anomalias';showToast('Base de dados actualizada ✓');}catch{showToast('Erro: ficheiro JSON inválido');}};
  reader.readAsText(file);event.target.value='';
}
function exportarBD(){const blob=new Blob([JSON.stringify(bd,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='anomalias_base_dados.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}
function importarConsultoria(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.anomalias)throw new Error('Estrutura não reconhecida');if(consultoria.anomalias.length>0&&!confirm('Tens '+consultoria.anomalias.length+' anomalia(s). Substituir?'))return;consultoria=d;localStorage.setItem('ce_consultoria',JSON.stringify(consultoria));loadInfo();updateHomeStats();showToast('Importada ✓ ('+consultoria.anomalias.length+' anomalias)');}catch(err){showToast('Erro: '+err.message);}};
  reader.readAsText(file);event.target.value='';
}

function loadCfg(){
  document.getElementById('cfg-script-url').value=localStorage.getItem('ce_script_url')||'';
  document.getElementById('cfg-folder-id').value=localStorage.getItem('ce_drive_folder_id')||'';
  updateDriveStatus();
}
function saveCfg(){
  localStorage.setItem('ce_script_url',document.getElementById('cfg-script-url').value.trim());
  localStorage.setItem('ce_drive_folder_id',document.getElementById('cfg-folder-id').value.trim());
  updateDriveStatus();
}
function updateDriveStatus(){
  const badge=document.getElementById('drive-status-badge'),txt=document.getElementById('drive-status-text');
  if(localStorage.getItem('ce_script_url') && localStorage.getItem('ce_drive_folder_id')){badge.className='drive-badge connected';txt.textContent='Script Bridge Ativo';}
  else{badge.className='drive-badge disconnected';txt.textContent='Não configurado';}
}
function setDriveLog(msg,type){
  const col=type==='success'?'var(--success)':type==='danger'?'var(--danger)':'var(--text2)';
  const el=document.getElementById('drive-auth-status');if(el){el.textContent=msg;el.style.color=col;}
  const el2=document.getElementById('drive-export-log');if(el2){el2.textContent=msg;el2.style.color=col;}
}

async function uploadFotosDrive(anomalia,anomaliaNum){
  const sUrl=localStorage.getItem('ce_script_url');
  const fId=localStorage.getItem('ce_drive_folder_id');
  if(!sUrl||!fId||!currentPhotos.length)return[];
  
  const refs=[];
  for(const foto of currentPhotos){
    try{
      const payload={
        action:"uploadFoto",
        folderId:fId,
        anomaliaNum:anomaliaNum,
        anomaliaNome:anomalia.anomalia_nome,
        fotoName:foto.name||(Date.now()+".jpg"),
        fotoBase64:foto.dataUrl
      };
      const res=await fetch(sUrl,{method:'POST',mode:'cors',body:JSON.stringify(payload)});
      if(res.ok){
        const rd=await res.json();
        if(rd.success) refs.push({id:rd.id,name:payload.fotoName,driveUrl:rd.driveUrl});
      }
    }catch(e){console.error(e);}
  }
  if(refs.length>0){setDriveLog('✓ '+refs.length+' foto(s) enviadas via Bridge.','success');}
  return refs;
}

function scheduleAutoSave(){clearTimeout(autoSaveTimer);autoSaveTimer=setTimeout(autoSaveToDrive,3000);}
async function autoSaveToDrive(){
  const sUrl=localStorage.getItem('ce_script_url');
  const fId=localStorage.getItem('ce_drive_folder_id');
  if(!sUrl||!fId||!consultoria.anomalias.length)return;
  
  const cr=(consultoria.info&&consultoria.info.cliente)?consultoria.info.cliente:'consultoria';
  const fn=cr.replace(/[^a-zA-Z0-9]/g,'_')+'_em_curso.json';
  
  try{
    const payload={action:"autoSaveJson",folderId:fId,fileName:fn,consultoria:consultoria};
    const res=await fetch(sUrl,{method:'POST',mode:'cors',body:JSON.stringify(payload)});
    if(res.ok){
      const rd=await res.json();
      if(rd.success) setDriveLog('✓ JSON sincronizado no Drive às '+new Date().toLocaleTimeString('pt-PT'),'success');
    }
  }catch(e){console.error(e);}
}

async function testarDrive(){
  const sUrl=localStorage.getItem('ce_script_url');
  const fId=localStorage.getItem('ce_drive_folder_id');
  if(!sUrl||!fId){showToast('Configura o URL e o ID da pasta');return;}
  setDriveLog('A testar ligação...','success');
  try{
    const res=await fetch(sUrl,{method:'POST',mode:'cors',body:JSON.stringify({action:"testDrive",folderId:fId})});
    if(res.ok){
      const rd=await res.json();
      if(rd.success){setDriveLog('✓ Ligação OK! Acedeu à pasta: '+rd.folderName,'success');showToast('Ligação com o Drive validada!');}
      else{setDriveLog('Erro no Script: '+rd.error,'danger');}
    }else{setDriveLog('Erro HTTP: '+res.status,'danger');}
  }catch(e){setDriveLog('Erro rede: '+e.message,'danger');}
}

function showToast(msg){
  clearTimeout(toastTimer);
  const t=document.getElementById('toast');t.className='toast show';t.textContent=msg;
  toastTimer=setTimeout(()=>t.className='toast',2800);
}

document.querySelectorAll('.modal-overlay,.add-modal').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));
