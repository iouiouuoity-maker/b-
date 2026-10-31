import {askAI} from './ai.js';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const key='erketai-v1';
let state={};
try {state=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{state={};}
if(typeof state!=='object'||Array.isArray(state)) state={};
function save(){try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{alert('Браузер сақтау мүмкіндігін шектеді. Деректер сақталмады.');return false;}}
const params=new URLSearchParams(location.search);
const plays=['Қызыл телпек','Қасқыр мен тиін'];
const characters=[['Қызыл телпек','Әже','Қасқыр'],['Тиін','Қасқыр']];
function selected(){return {play:$('#play')?.value,character:$('#character')?.value,difficulty:$('#difficulty')?.value,level:$('#level')?.value};}
function syncCharacter(preferred){const i=plays.indexOf($('#play').value);$('#character').replaceChildren(...characters[i].map(t=>new Option(t,t)));if(characters[i].includes(preferred))$('#character').value=preferred;}
if($('#play')){
 const context=state.context||{};
 $('#play').value=(params.has('play')?plays[Number(params.get('play'))]:null)||context.play||plays[0];
 if(!plays.includes($('#play').value))$('#play').selectedIndex=0;
 syncCharacter(context.character);
 for(const id of ['difficulty','level'])if(context[id]&&[...$('#'+id).options].some(o=>o.value===context[id]))$('#'+id).value=context[id];
 $('#play').addEventListener('change',()=>{syncCharacter();updateContext();});
 for(const id of ['character','difficulty','level'])$('#'+id).addEventListener('change',updateContext);
 function updateContext(){state.context=selected();save();renderExercise();}
}
const tasks={
 'Сөздік қор':['Кейіпкерді сипаттайтын 4 сөз таңда.','Сол сөздермен 2 сөйлем айт.','Екі кейіпкерді өз сөзіңмен салыстыр.'],
 'Сөйлем құрау':['«Менің кейіпкерім…» сөйлемін аяқта.','«Ол… себебі…» үлгісімен сөйлем құра.','Оқиғаны үш байланысқан сөйлеммен айт.'],
 'Диалог жүргізу':['Кейіпкерге бір сұрақ қой.','Сұрақ қойып, жауабына нақтылау сұрағын қос.','Екі кейіпкердің 4 репликасын құрастыр.'],
 'Пікірді дәлелдеу':['«Менің ойымша…» деп баста.','«Менің ойымша… себебі…» деп дәлелде.','Екі шешімді салыстырып, тиімдісін дәлелде.'],
 'Сенімді сөйлеу':['Алдымен бір сөйлемді баяу айтып көр.','Жұбыңа екі сөйлемді анық айт.','30 секунд ішінде ойыңды түсіндір.']
};
let replicaIndex=0;
function renderExercise(){if(!$('#exercise'))return;const s=selected();$('#exercise').textContent=tasks[s.difficulty][Number(s.level[0])-1];replicaIndex=0;renderReplica();}
function renderReplica(){if(!$('#replica'))return;const lines=$('#play').selectedIndex===0?['Жолда кездескен кейіпкерге қандай сұрақ қояр едің?','Неліктен осы жолды таңдадың?','Әжеңе қандай кеңес айтар едің?']:['Тиін, сенің көңіл күйің қандай?','Қасқырдың әрекетін қалай түсіндірер едің?','Кейіпкерлер бір-біріне не айта алады?'];$('#replica').textContent=lines[replicaIndex%lines.length];}
renderExercise();
if($('#draft')){
 $('#draft').value=state.draft||'';$('#reflection').value=state.reflection||'';
 $('#save-draft').onclick=()=>{state.draft=$('#draft').value;state.context=selected();if(save())$('#save-status').textContent='Жауабың осы браузерде сақталды.';};
 $('#help-ai').onclick=()=>{state.draft=$('#draft').value;state.context=selected();if(save())location.href='ai.html?mode=feedback';};
 $('#next-replica').onclick=()=>{replicaIndex++;renderReplica();};
 $$('[data-mood]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mood===state.mood));b.onclick=()=>{state.mood=b.dataset.mood;if(save()){$$('[data-mood]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#mood-status').textContent='Сезімің сақталды. Өз қарқыныңмен жүр.';}};});
 $('#save-reflection').onclick=()=>{state.reflection=$('#reflection').value;if(save())$('#mood-status').textContent='Рефлексия сақталды.';};
}
if($('#search'))$('#search').oninput=()=>{const q=$('#search').value.toLocaleLowerCase();let n=0;$$('[data-search]').forEach(c=>{c.hidden=!c.dataset.search.toLocaleLowerCase().includes(q);if(!c.hidden)n++;});$('#no-results').hidden=n>0;};
if($('#chat-form')){
 const history=[];let busy=false;
 if(params.get('mode')&&[...$('#mode').options].some(o=>o.value===params.get('mode')))$('#mode').value=params.get('mode');
 if(params.get('mode')==='feedback')$('#prompt').value=state.draft||'';
 function bubble(text,role){const el=document.createElement('div');el.className='message '+role;el.textContent=text;$('#messages').append(el);el.scrollIntoView({block:'nearest'});return el;}
 $('#clear-chat').onclick=()=>{if(busy)return;history.length=0;$('#messages').replaceChildren();$('#ai-status').textContent='';};
 $('#chat-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const message=$('#prompt').value.trim();if(!message)return;
 if(/(?:https?:\/\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s()-]*){10,})/i.test(message)){$('#ai-status').textContent='Сілтемені, телефонды не жеке деректі алып тастаңыз.';return;}
 busy=true;$('#send').disabled=true;$('#clear-chat').disabled=true;$('#ai-status').textContent='Жаңа жауап құрастырылуда…';bubble(message,'user');
 try{const answer=await askAI({message,...selected(),mode:$('#mode').value,history:history.slice(-6)});bubble(answer,'assistant');history.push({role:'user',content:message},{role:'assistant',content:answer.slice(0,3500)});$('#prompt').value='';$('#ai-status').textContent='Жауап дайын.';}catch(err){bubble(err.message,'error');$('#ai-status').textContent='Жауап алынбады. Сұрағыңызды қайта жіберуге болады.';}finally{busy=false;$('#send').disabled=false;$('#clear-chat').disabled=false;}
 };
}
const criteria=['Сөздік қор','Байланыстырып сөйлеу','Диалог жүргізу','Кейіпкер әрекетін дәлелдеу','Сенімді сөйлеу'];
function records(){return Array.isArray(state.assessments)?state.assessments.filter(r=>r&&/^[A-Za-z0-9_-]{1,24}$/.test(r.code)&&['before','after'].includes(r.phase)&&Array.isArray(r.scores)&&r.scores.length===5&&r.scores.every(s=>Number.isInteger(s)&&s>=0&&s<=3)):[];}
if($('#assessment'))$('#assessment').onsubmit=e=>{e.preventDefault();const record={code:$('#student-code').value.trim(),phase:$('#phase').value,scores:$$('.score').map(x=>Number(x.value)),at:new Date().toISOString()};state.assessments=[...records(),record];if(save())$('#assessment-status').textContent='Сақталды: '+record.scores.reduce((a,b)=>a+b,0)+' / 15 балл. Нәтижелер бөлімінен қараңыз.';};
if($('#print'))$('#print').onclick=()=>window.print();
$$('[data-home]').forEach(x=>{x.checked=!!state.home?.[x.dataset.home];x.onchange=()=>{state.home={...state.home,[x.dataset.home]:x.checked};save();};});
if($('#result-panel')){
 const total=r=>r?.scores.reduce((a,b)=>a+b,0);
 function populate(){const codes=[...new Set(records().map(r=>r.code))];$('#result-code').replaceChildren(...codes.map(c=>new Option(c,c)));render();}
 function render(){const code=$('#result-code').value,rs=records().filter(r=>r.code===code),before=rs.filter(r=>r.phase==='before').at(-1),after=rs.filter(r=>r.phase==='after').at(-1);$('#delete-results').disabled=!code;$('#export').disabled=!rs.length;
 if(!rs.length){$('#result-panel').innerHTML='<section class="card"><h2>Алғашқы қадамды тіркейік</h2><p>Әзірге бағалау жоқ. Мұғалім кабинетінде бастапқы көрсеткіштерді енгізіңіз.</p></section>';return;}
 const gain=before&&after?total(after)-total(before):null;
 $('#result-panel').innerHTML='<div class="grid three">'+[['Бастапқы',before?total(before)+' / 15':'Әлі жоқ'],['Қорытынды',after?total(after)+' / 15':'Әлі жоқ'],['Өзгеріс',gain===null?'Салыстыру күтілуде':(gain>0?'+':'')+gain+' балл']].map(([t,v])=>'<section class="card"><span class="eyebrow">'+t+'</span><div class="stat" style="font-size:28px">'+v+'</div></section>').join('')+'</div><section class="card"><h2>Сөйлеу көрсеткіштері</h2><p>Сол жақ — бастапқы, оң жақ — қорытынды. Әр өлшем: 0–3 балл.</p>'+criteria.map((t,i)=>'<div class="score-row"><strong>'+t+'</strong><div class="scorebar">'+[before,after].map((r,j)=>'<div><small>'+(r?r.scores[i]+' / 3':'Өлшенбеген')+'</small><div class="bar '+(j?'after':'')+'"><span style="width:'+(r?r.scores[i]/3*100:0)+'%"></span></div></div>').join('')+'</div></div>').join('')+'</section>';}
 $('#result-code').onchange=render;populate();
 $('#delete-results').onclick=()=>{const code=$('#result-code').value;if(!code||!confirm(code+' кодының барлық бағалауын өшіресіз бе?'))return;state.assessments=records().filter(r=>r.code!==code);if(save())populate();};
 $('#export').onclick=()=>{const csv='\uFEFF'+[['code','phase',...criteria,'date'],...records().filter(r=>r.code===$('#result-code').value).map(r=>[r.code,r.phase,...r.scores,r.at])].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='erketai-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
if($('#media-files')){let urls=[];$('#media-files').onchange=()=>{urls.forEach(URL.revokeObjectURL);urls=[];$('#media-grid').replaceChildren();[...$('#media-files').files].slice(0,12).forEach(file=>{if(!/^(image|video)\//.test(file.type))return;if(file.size>50*1024*1024){alert('50 МБ-тан үлкен файл ашылмайды.');return;}const url=URL.createObjectURL(file);urls.push(url);const el=document.createElement(file.type.startsWith('video')?'video':'img');el.src=url;el.className='media-item';if(el.tagName==='VIDEO')el.controls=true;else el.alt='Жергілікті таңдалған қойылым фотосы';$('#media-grid').append(el);});};addEventListener('pagehide',()=>urls.forEach(URL.revokeObjectURL));}
