// Main calculator logic
// Elements
const display = document.getElementById('display');
const subdisplay = document.getElementById('subdisplay');
const buttonsDiv = document.getElementById('buttons');
const toggleSci = document.getElementById('toggleSci');
const equalsBtn = document.getElementById('equals');
const backspace = document.getElementById('backspace');
const clearAll = document.getElementById('clearAll');
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');
const copyAll = document.getElementById('copyAll');

const voiceBtn = document.getElementById('voiceBtn');
const unitsBtn = document.getElementById('unitsBtn');
const unitsModal = document.getElementById('unitsModal');
const convClose = document.getElementById('convClose');
const convRun = document.getElementById('convRun');
const unitFrom = document.getElementById('unitFrom');
const unitTo = document.getElementById('unitTo');
const unitValue = document.getElementById('unitValue');
const convResult = document.getElementById('convResult');

const aiInput = document.getElementById('aiInput');
const aiAsk = document.getElementById('aiAsk');
const aiOutput = document.getElementById('aiOutput');
const aiOpenAI = document.getElementById('aiOpenAI');

let isScientific = false;
let history = loadHistory();

// Base buttons (compact)
const baseKeys = [
  "7","8","9","/",
  "4","5","6","*",
  "1","2","3","-",
  "0",".","%","+"
];

// Scientific extra
const sciKeys = [
  "(",")","π","e","^",
  "sin","cos","tan","log","ln",
  "√","x²","x³","!","ANS"
];

// render buttons
function renderButtons(){
  buttonsDiv.innerHTML = '';
  const keys = isScientific ? [...sciKeys, ...baseKeys] : baseKeys;
  keys.forEach(k=>{
    const btn = document.createElement('button');
    btn.className = 'btn';
    if(['/','*','-','+','%','^'].includes(k)) btn.classList.add('op');
    if(k === '=') btn.classList.add('equal');
    btn.textContent = k;
    btn.addEventListener('click', ()=>handleKey(k));
    buttonsDiv.appendChild(btn);
  });
}
renderButtons();

// Keyboard support
document.addEventListener('keydown',(e)=>{
  if(e.key === 'Enter'){ evaluate(); return; }
  if(e.key === 'Backspace'){ backspaceFn(); return; }
  if(e.key === 'Escape'){ clearFn(); return; }
  const allowed = '0123456789+-*/().%';
  if(allowed.includes(e.key)){ appendToDisplay(e.key); }
});

// button handlers
function handleKey(k){
  if(k === 'C' || k === 'C'){ clearFn(); return; }
  if(k === 'ANS'){ appendToDisplay(getLastAnswer() ?? ''); return; }
  if(k === 'x²'){ appendToDisplay('**2'); return; }
  if(k === 'x³'){ appendToDisplay('**3'); return; }
  if(k === 'π'){ appendToDisplay('Math.PI'); return; }
  if(k === 'e'){ appendToDisplay('Math.E'); return; }
  if(k === '√'){ appendToDisplay('Math.sqrt('); return; }
  if(['sin','cos','tan','log','ln'].includes(k)){ appendToDisplay('Math.' + (k === 'ln' ? 'log' : k) + '('); return; }
  if(k === '!'){ appendToDisplay('!'); return; }
  if(k === '^'){ appendToDisplay('**'); return; }
  // percent char
  appendToDisplay(k);
}

function appendToDisplay(s){
  display.value += s;
}

equalsBtn.addEventListener('click', evaluate);
backspace.addEventListener('click', backspaceFn);
clearAll.addEventListener('click', clearFn);

function backspaceFn(){ display.value = display.value.slice(0,-1); }
function clearFn(){ display.value = ''; subdisplay.textContent = ''; }

function evaluate(){
  const expr = display.value.trim();
  if(!expr) return;
  try{
    const sanitized = sanitizeExpression(expr);
    // handle factorial (!) manually
    const withFactorial = sanitized.replace(/([0-9\.]+)!/g, 'factorial($1)');
    const fn = new Function('factorial', 'return (' + withFactorial + ')');
    const result = fn(factorial);
    if(result === undefined || Number.isNaN(result) || !isFinite(result)){
      subdisplay.textContent = 'ERROR';
      return;
    }
    const rounded = roundSmart(result);
    subdisplay.textContent = expr + ' =';
    display.value = String(rounded);
    addHistory(expr, rounded);
    renderHistory();
  } catch(err){
    console.error(err);
    subdisplay.textContent = 'ERROR';
  }
}

// small helpers
function sanitizeExpression(s){
  // transform friendly tokens into JS math
  let out = s.replaceAll('π','Math.PI').replaceAll('^','**');
  // if user used percent like 50% -> (50/100)
  out = out.replace(/([0-9\.]+)%/g, '($1/100)');
  // allow 'ANS' handling handled earlier
  return out;
}
function factorial(n){
  n = Number(n);
  if(!Number.isInteger(n) || n < 0) return NaN;
  let r = 1;
  for(let i=2;i<=n;i++) r*=i;
  return r;
}
function roundSmart(num){
  if(Number.isInteger(num)) return num;
  return parseFloat(num.toFixed(10));
}

// Scientific toggle
toggleSci.addEventListener('click', ()=>{
  isScientific = !isScientific;
  toggleSci.classList.toggle('active', isScientific);
  renderButtons();
});

// History (localStorage)
function addHistory(expr,result){
  const entry = {expr, result, ts: Date.now()};
  history.unshift(entry);
  if(history.length>200) history = history.slice(0,200);
  saveHistory();
}
function saveHistory(){ try{ localStorage.setItem('adv_calc_history', JSON.stringify(history)); }catch(e){} }
function loadHistory(){ try{ const raw = localStorage.getItem('adv_calc_history'); return raw? JSON.parse(raw): []; }catch(e){ return []; } }
function renderHistory(){
  historyList.innerHTML = '';
  if(!history || history.length===0) { historyList.innerHTML = '<div class="empty">No history yet — calculate something.</div>'; return; }
  history.forEach((h, idx)=>{
    const el = document.createElement('div');
    el.className = 'hist-item';
    el.innerHTML = `<div class="expr">${escapeHtml(h.expr)}</div><div class="res">${escapeHtml(String(h.result))}</div>`;
    el.addEventListener('click', ()=>{ display.value = h.expr; subdisplay.textContent = 'Reused from history'; });
    historyList.appendChild(el);
  });
}
clearHistory.addEventListener('click', ()=>{
  if(confirm('Clear all history?')){
    history = []; saveHistory(); renderHistory();
  }
});
copyAll.addEventListener('click', async ()=>{
  if(!history || history.length===0){ alert('No history'); return; }
  const text = history.map(h=>`${h.expr} = ${h.result}`).join('\n');
  try{ await navigator.clipboard.writeText(text); alert('Copied'); }catch(e){ alert('Cannot copy'); }
});

renderHistory();

// last answer helper
function getLastAnswer(){ return history.length? history[0].result : null; }

/* -------------------
   Voice input (Web Speech API)
--------------------*/
let recognition = null;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e)=>{
    const txt = e.results[0][0].transcript;
    subdisplay.textContent = 'Heard: ' + txt;
    // pass to AI parser for natural language math
    const answer = AIParser.handleNaturalQuery(txt);
    if(answer !== null){
      display.value = String(answer);
      addHistory(txt, answer);
      renderHistory();
    } else {
      // fallback: append text as keys (not recommended)
      subdisplay.textContent += ' (not recognized as calc)';
    }
  };
  recognition.onerror = (ev)=>{ subdisplay.textContent = 'Voice error: ' + ev.error; };
}
voiceBtn.addEventListener('click', ()=>{
  if(!recognition){ alert('Voice not supported in this browser'); return; }
  recognition.start();
});

/* --------------------
   Unit converter modal (basic)
---------------------*/
const units = [
  {group:'weight', key:'kg', name:'Kilogram', toBase:v=>v, fromBase:v=>v},
  {group:'weight', key:'lb', name:'Pound', toBase:v=>v*0.45359237, fromBase:v=>v/0.45359237},
  {group:'length', key:'cm', name:'Centimeter', toBase:v=>v/100, fromBase:v=>v*100},
  {group:'length', key:'m', name:'Meter', toBase:v=>v, fromBase:v=>v},
  {group:'length', key:'in', name:'Inch', toBase:v=>v*0.0254, fromBase:v=>v/0.0254},
  {group:'temp', key:'c', name:'Celsius', toBase:v=>v, fromBase:v=>v},
  {group:'temp', key:'f', name:'Fahrenheit', toBase:v=> (v-32)*(5/9), fromBase:v=> v*(9/5)+32}
];
function populateUnits(){
  unitFrom.innerHTML=''; unitTo.innerHTML='';
  units.forEach(u=>{
    const o1 = document.createElement('option'); o1.value = u.key; o1.textContent = u.name + ' ('+u.key+')';
    const o2 = o1.cloneNode(true);
    unitFrom.appendChild(o1); unitTo.appendChild(o2);
  });
}
unitsBtn.addEventListener('click', ()=>{
  populateUnits();
  unitsModal.classList.remove('hidden');
});
convClose.addEventListener('click', ()=> unitsModal.classList.add('hidden'));
convRun.addEventListener('click', ()=>{
  const val = parseFloat(unitValue.value);
  const fromKey = unitFrom.value; const toKey = unitTo.value;
  if(isNaN(val)){ convResult.textContent = 'Enter valid value'; return; }
  const from = units.find(u=>u.key===fromKey);
  const to = units.find(u=>u.key===toKey);
  if(!from || !to){ convResult.textContent = 'Choose units'; return; }
  // convert via base (meter or kg) or special for temp
  let base = from.toBase(val);
  let out = to.fromBase(base);
  convResult.textContent = `${val} ${from.key} = ${roundSmart(out)} ${to.key}`;
});

/* ------------------
   AI quick query (uses AIParser in ai.js)
-------------------*/
aiAsk.addEventListener('click', ()=>{
  const q = aiInput.value.trim();
  if(!q) return;
  aiOutput.textContent = 'Thinking...';
  const result = AIParser.handleNaturalQuery(q);
  if(result !== null){ aiOutput.textContent = String(result); addHistory(q, result); renderHistory(); }
  else { aiOutput.textContent = 'Could not parse. You can enable OpenAI integration (optional) — click Use OpenAI.'; }
});

// Optional OpenAI call — this will attempt to call ai.js OpenAI helper (needs key)
aiOpenAI.addEventListener('click', async ()=>{
  aiOutput.textContent = 'Calling OpenAI...';
  try{
    const res = await AIParser.queryOpenAI(aiInput.value);
    aiOutput.textContent = res;
    addHistory(aiInput.value, res);
    renderHistory();
  }catch(e){
    aiOutput.textContent = 'OpenAI call failed. See console.';
    console.error(e);
  }
});

/* PWA install prompt handled in pwa.js */

/* Utility functions */
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function loadHistory(){ try{ const r = localStorage.getItem('adv_calc_history'); return r? JSON.parse(r): []; }catch(e){ return []; } }
function saveHistory(){ try{ localStorage.setItem('adv_calc_history', JSON.stringify(history)); }catch(e){} }
function addHistory(expr,res){ const e = {expr,res,ts:Date.now()}; history.unshift(e); if(history.length>200) history = history.slice(0,200); saveHistory(); }
renderHistory();

/* small polyfills / final */
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveHistory(); });
