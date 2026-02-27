/* Mini Todo app in vanilla JS — avec Supabase */

// ============================================
// 1. ÉLÉMENTS DU DOM
// ============================================
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const listEl = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filters button');

// Auth elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// ============================================
// 2. VARIABLES GLOBALES
// ============================================
let todos = [];
let filter = 'all';
let expenses = [];

let projects = [];
let debts = [];
let contributions = [];
let sanctions = [];
let criteria = {};
let logs = [];
let pdfSettings = { title: 'Rapport mgs', subtitle: '', logoUrl: '', format: 'A4' };

// ============================================
// 3. FONCTIONS D'AUTHENTIFICATION
// ============================================
// Remplacer l'ancien code du bouton Google
loginBtn.addEventListener('click', async () => {
  // Pour l'authentification par email, on va plutôt afficher un formulaire
  showEmailLoginForm();
});

// Fonction pour afficher le formulaire
function showEmailLoginForm() {
  // Créer une popup simple
  const email = prompt("Entrez votre email pour vous connecter :");
  if (!email) return;
  
  const password = prompt("Entrez votre mot de passe :");
  if (!password) return;
  
  // Connexion avec email/mot de passe
  signInWithEmail(email, password);
}

// Fonction de connexion
async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) throw error;
    
    alert("Connexion réussie !");
    checkUser(); // Met à jour l'interface
    
  } catch (error) {
    console.error("Erreur de connexion:", error);
    
    // Si l'utilisateur n'existe pas, proposer de créer un compte
    if (error.message.includes("Invalid login credentials")) {
      const createAccount = confirm("Utilisateur non trouvé. Voulez-vous créer un compte ?");
      if (createAccount) {
        signUpWithEmail(email, password);
      }
    }
  }
}

// Fonction d'inscription
async function signUpWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (error) throw error;
    
    alert("Compte créé ! Vérifiez votre email pour confirmer (si confirm email est activé)");
    
  } catch (error) {
    alert("Erreur: " + error.message);
  }
}

logoutBtn.addEventListener('click', async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Vider les données locales après déconnexion
    todos = [];
    expenses = [];
    projects = [];
    debts = [];
    contributions = [];
    sanctions = [];
    criteria = {};
    logs = [];
    
    // Re-rendre toutes les vues
    render();
    renderExpenses();
    renderProjects();
    renderDebts();
    renderContributions();
    renderSanctions();
    renderLogs();
    
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
});

// ============================================
// 4. FONCTIONS SUPABASE - TODOS
// ============================================
async function loadTodos() {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      todos = [];
      render();
      return;
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    todos = data || [];
    render();
    
  } catch (error) {
    console.error('Erreur chargement todos:', error);
    todos = [];
    render();
  }
}

async function saveTodos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Pour chaque todo, on fait un upsert
    for (const todo of todos) {
      const { error } = await supabase
        .from('todos')
        .upsert({
          id: todo.id,
          text: todo.text,
          done: todo.done
        }, { onConflict: 'id' });
      
      if (error) throw error;
    }
    
  } catch (error) {
    console.error('Erreur sauvegarde todos:', error);
    // Fallback sur localStorage en cas d'erreur ?
    localStorage.setItem('mini-todos-backup', JSON.stringify(todos));
  }
}

// ============================================
// 5. FONCTIONS EXISTANTES ADAPTÉES
// ============================================
function save() { 
  saveTodos(); // Maintenant async !
}

function load(){ 
  // On ne charge plus du localStorage, on utilise Supabase
  loadTodos();
}

function saveExpenses(){ localStorage.setItem('mini-expenses', JSON.stringify(expenses)); }
function loadExpenses(){ try{ expenses = JSON.parse(localStorage.getItem('mini-expenses')) || []; }catch(e){ expenses = []; } }
function saveProjects(){ localStorage.setItem('mini-projects', JSON.stringify(projects)); }
function loadProjects(){ try{ projects = JSON.parse(localStorage.getItem('mini-projects')) || []; }catch(e){ projects = []; } }
function saveDebts(){ localStorage.setItem('mini-debts', JSON.stringify(debts)); }
function loadDebts(){ try{ debts = JSON.parse(localStorage.getItem('mini-debts')) || []; }catch(e){ debts = []; } }
function saveContributions(){ localStorage.setItem('mini-contributions', JSON.stringify(contributions)); }
function loadContributions(){ try{ contributions = JSON.parse(localStorage.getItem('mini-contributions')) || []; }catch(e){ contributions = []; } }
function saveSanctions(){ localStorage.setItem('mini-sanctions', JSON.stringify(sanctions)); }
function loadSanctions(){ try{ sanctions = JSON.parse(localStorage.getItem('mini-sanctions')) || []; }catch(e){ sanctions = []; } }
function saveCriteria(){ localStorage.setItem('mini-criteria', JSON.stringify(criteria)); }
function loadCriteria(){ try{ criteria = JSON.parse(localStorage.getItem('mini-criteria')) || {}; }catch(e){ criteria = {}; } }
function saveLogs(){ localStorage.setItem('mini-logs', JSON.stringify(logs)); }
function loadLogs(){ try{ logs = JSON.parse(localStorage.getItem('mini-logs')) || []; }catch(e){ logs = []; } }
function savePdfSettings(){ localStorage.setItem('mini-pdf-settings', JSON.stringify(pdfSettings)); }
function loadPdfSettings(){ try{ pdfSettings = JSON.parse(localStorage.getItem('mini-pdf-settings')) || { title: 'Rapport mgs', subtitle: '', logoUrl: '', format: 'A4' }; }catch(e){ pdfSettings = { title: 'Rapport mgs', subtitle: '', logoUrl: '', format: 'A4' }; } }

function addLog(message){ const entry = { id: Date.now(), message }; logs.unshift(entry); saveLogs(); renderLogs && renderLogs(); }

function renderLogs(filterText=''){
  const el = document.getElementById('log-list'); if(!el) return;
  el.innerHTML = '';
  const filtered = filterText.trim() === '' ? logs : logs.filter(l => l.message.toLowerCase().includes(filterText.toLowerCase()));
  filtered.forEach(l=>{ const li = document.createElement('li'); li.className = 'log-item'; li.innerHTML = `${l.message} <span class="ts">— ${new Date(l.id).toLocaleString()}</span>`; el.appendChild(li); });
}

function render(){
  listEl.innerHTML = '';
  const visible = todos.filter(t => filter === 'all' ? true : (filter === 'active' ? !t.done : t.done));
  visible.forEach(todo => {
    const li = document.createElement('li'); li.className = 'todo-item';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!todo.done;
    cb.addEventListener('change', ()=>{ todo.done = cb.checked; save(); render(); });
    const span = document.createElement('div'); span.className = 'text' + (todo.done ? ' completed' : ''); span.textContent = todo.text;
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    del.addEventListener('click', ()=>{ todos = todos.filter(t=>t.id!==todo.id); save(); render(); });
    li.appendChild(cb); li.appendChild(span); li.appendChild(del);
    listEl.appendChild(li);
  });
  const left = todos.filter(t=>!t.done).length; itemsLeft.textContent = left + (left>1? ' tâches':' tâche');
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const v = input.value.trim(); if(!v) return;
  todos.unshift({ id: Date.now(), text: v, done: false });
  input.value = '';
  save(); render();
  addLog(`Tâche ajoutée: ${v}`);
});

clearBtn.addEventListener('click', ()=>{
  todos = todos.filter(t=>!t.done); save(); render();
  addLog('Tâches terminées supprimées');
});

filterBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    filterBtns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); filter = b.dataset.filter; render();
  });
});

// init
load(); render();

// Expenses logic
const expenseForm = document.getElementById('expense-form');
const expenseDesc = document.getElementById('expense-desc');
const expenseAmount = document.getElementById('expense-amount');
const expenseType = document.getElementById('expense-type');
const expenseList = document.getElementById('expense-list');
const sumInEl = document.getElementById('sum-in');
const sumOutEl = document.getElementById('sum-out');
const balanceEl = document.getElementById('balance');

function renderExpenses(){
  expenseList.innerHTML = '';
  let sumIn = 0, sumOut = 0;
  expenses.forEach(exp => {
    const li = document.createElement('li'); li.className = 'expense-item';
    const left = document.createElement('div'); left.innerHTML = `<div>${exp.text}</div><div class="meta">${new Date(exp.id).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const amt = document.createElement('span'); amt.className = 'amount ' + (exp.type === 'in' ? 'in' : 'out'); amt.textContent = (exp.type === 'in' ? '+' : '-') + Number(exp.amount).toFixed(2) + ' €';
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    del.addEventListener('click', ()=>{ expenses = expenses.filter(e=>e.id!==exp.id); saveExpenses(); renderExpenses(); });
    right.appendChild(amt); right.appendChild(del);
    li.appendChild(left); li.appendChild(right);
    expenseList.appendChild(li);
    if(exp.type === 'in') sumIn += Number(exp.amount); else sumOut += Number(exp.amount);
  });
  sumInEl.textContent = sumIn.toFixed(2);
  sumOutEl.textContent = sumOut.toFixed(2);
  balanceEl.textContent = (sumIn - sumOut).toFixed(2);
}

expenseForm && expenseForm.addEventListener('submit', e=>{
  e.preventDefault();
  const text = expenseDesc.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const type = expenseType.value;
  if(!text || isNaN(amount)) return;
  expenses.unshift({ id: Date.now(), text, amount: Math.abs(amount), type });
  expenseDesc.value = '';
  expenseAmount.value = '';
  saveExpenses(); renderExpenses();
  addLog(`Dépense ajoutée: ${text} (${type} ${amount.toFixed(2)} €)`);
});

// init expenses
loadExpenses(); renderExpenses();

// Projects logic
const projectForm = document.getElementById('project-form');
const projectName = document.getElementById('project-name');
const projectCaisse = document.getElementById('project-caisse');
const projectAmount = document.getElementById('project-amount');
const projectList = document.getElementById('project-list');

function renderProjects(){
  projectList.innerHTML = '';
  projects.forEach(p => {
    const li = document.createElement('li'); li.className = 'project-item';
    const left = document.createElement('div'); left.innerHTML = `<div>${p.name}</div><div class="meta">${p.caisse || ''}</div>`;
    const right = document.createElement('div');
    const amt = document.createElement('span'); amt.className = 'project-amount'; amt.textContent = Number(p.amount).toFixed(2) + ' €';
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    del.addEventListener('click', ()=>{ projects = projects.filter(x=>x.id!==p.id); saveProjects(); renderProjects(); });
    del.addEventListener('click', ()=>{ addLog(`Projet supprimé: ${p.name}`); });
    right.appendChild(amt); right.appendChild(del);
    li.appendChild(left); li.appendChild(right);
    projectList.appendChild(li);
  });
}

projectForm && projectForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = projectName.value.trim();
  const caisse = projectCaisse.value.trim();
  const amount = parseFloat(projectAmount.value);
  if(!name || isNaN(amount)) return;
  projects.unshift({ id: Date.now(), name, caisse, amount: Math.abs(amount) });
  projectName.value = ''; projectCaisse.value = ''; projectAmount.value = '';
  saveProjects(); renderProjects();
  addLog(`Projet ajouté: ${name} (${amount.toFixed(2)} €)`);
});

loadProjects(); renderProjects();

// Debts logic
const debtForm = document.getElementById('debt-form');
const memberNameEl = document.getElementById('member-name');
const memberRankEl = document.getElementById('member-rank');
const debtAmountEl = document.getElementById('debt-amount');
const debtList = document.getElementById('debt-list');
const memberTotalsEl = document.getElementById('member-totals');

function renderDebts(){
  debtList.innerHTML = '';
  // list debts
  debts.forEach(d => {
    const li = document.createElement('li'); li.className = 'debt-item';
    const left = document.createElement('div'); left.innerHTML = `<div>${d.name} ${d.rank?('— '+d.rank):''}</div><div class="meta">${new Date(d.id).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const amt = document.createElement('span'); amt.className = 'debt-amount'; amt.textContent = '-' + Number(d.amount).toFixed(2) + ' €';
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    del.addEventListener('click', ()=>{ debts = debts.filter(x=>x.id!==d.id); saveDebts(); renderDebts(); renderMemberTotals(); });
    del.addEventListener('click', ()=>{ addLog(`Dette supprimée: ${d.name} — ${Number(d.amount).toFixed(2)} €`); });
    right.appendChild(amt); right.appendChild(del);
    li.appendChild(left); li.appendChild(right);
    debtList.appendChild(li);
  });
  // show combined totals (debts + sanctions)
  renderMemberTotals();
}

function renderMemberTotals(){
  const totals = computeMemberTotals();
  memberTotalsEl.innerHTML = '';
  for(const k in totals){
    const [name, rank] = k.split('|');
    const row = document.createElement('div'); row.textContent = `${name}${rank?(' — '+rank):''} : ${totals[k].toFixed(2)} €`;
    memberTotalsEl.appendChild(row);
  }
}

debtForm && debtForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = memberNameEl.value.trim();
  const rank = memberRankEl.value.trim();
  const amount = parseFloat(debtAmountEl.value);
  if(!name || isNaN(amount)) return;
  debts.unshift({ id: Date.now(), name, rank, amount: Math.abs(amount) });
  memberNameEl.value = ''; memberRankEl.value = ''; debtAmountEl.value = '';
  saveDebts(); renderDebts();
  addLog(`Dette ajoutée: ${name} — ${Math.abs(amount).toFixed(2)} €`);
});

loadDebts(); renderDebts();

// Contributions logic
const contributionForm = document.getElementById('contribution-form');
const contributionMemberEl = document.getElementById('contribution-member');
const contributionRankEl = document.getElementById('contribution-rank');
const contributionAmountEl = document.getElementById('contribution-amount');
const contributionPeriodEl = document.getElementById('contribution-period');
const contributionList = document.getElementById('contribution-list');
const contributionSummaryEl = document.getElementById('contribution-summary');

function renderContributions(){
  if(!contributionList) return;
  contributionList.innerHTML = '';
  let totalContributions = 0;
  const memberTotals = {};
  
  contributions.forEach(c => {
    const li = document.createElement('li'); li.className = 'contribution-item';
    const left = document.createElement('div'); left.innerHTML = `<div>${c.member} ${c.rank?('— '+c.rank):''}</div><div class="meta">${c.period || ''} — ${new Date(c.id).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const amt = document.createElement('span'); amt.className = 'contribution-amount'; amt.textContent = '+' + Number(c.amount).toFixed(2) + ' €';
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    del.addEventListener('click', ()=>{ contributions = contributions.filter(x=>x.id!==c.id); saveContributions(); renderContributions(); });
    del.addEventListener('click', ()=>{ addLog(`Cotisation supprimée: ${c.member} — ${Number(c.amount).toFixed(2)} €`); });
    right.appendChild(amt); right.appendChild(del);
    li.appendChild(left); li.appendChild(right);
    contributionList.appendChild(li);
    
    const key = c.member + '|' + (c.rank || '');
    memberTotals[key] = (memberTotals[key] || 0) + Number(c.amount);
    totalContributions += Number(c.amount);
  });
  
  // Show summary
  if(contributionSummaryEl) {
    contributionSummaryEl.innerHTML = `<div style="padding:.8rem;background:rgba(34,197,94,0.1);border-radius:8px;margin-bottom:1rem;">`
      + `<div><strong>Total cotisations:</strong> ${totalContributions.toFixed(2)} €</div>`;
    for(const k in memberTotals){
      const [member, rank] = k.split('|');
      contributionSummaryEl.innerHTML += `<div>${member}${rank?(' — '+rank):''}: ${memberTotals[k].toFixed(2)} €</div>`;
    }
    contributionSummaryEl.innerHTML += '</div>';
  }
}

contributionForm && contributionForm.addEventListener('submit', e=>{
  e.preventDefault();
  const member = contributionMemberEl.value.trim();
  const rank = contributionRankEl.value.trim();
  const amount = parseFloat(contributionAmountEl.value);
  const period = contributionPeriodEl.value.trim();
  if(!member || isNaN(amount)) return;
  contributions.unshift({ id: Date.now(), member, rank, amount: Math.abs(amount), period });
  contributionMemberEl.value = ''; contributionRankEl.value = ''; contributionAmountEl.value = ''; contributionPeriodEl.value = '';
  saveContributions(); renderContributions();
  addLog(`Cotisation ajoutée: ${member} — ${Math.abs(amount).toFixed(2)} €`);
});

loadContributions(); renderContributions();

// Sanctions logic
const sanctionForm = document.getElementById('sanction-form');
const sanctionMemberEl = document.getElementById('sanction-member');
const sanctionRankEl = document.getElementById('sanction-rank');
const sanctionAmountEl = document.getElementById('sanction-amount');
const sanctionReasonEl = document.getElementById('sanction-reason');
const sanctionList = document.getElementById('sanction-list');
const sanctionTotalsEl = document.getElementById('sanction-totals');

function renderSanctions(){
  if(!sanctionList) return;
  sanctionList.innerHTML = '';
  sanctions.forEach(s=>{
    const li = document.createElement('li'); li.className = 'sanction-item';
    const left = document.createElement('div'); left.innerHTML = `<div>${s.name} ${s.rank?('— '+s.rank):''}</div><div class="meta">${s.reason || ''} — ${new Date(s.id).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const amt = document.createElement('span'); amt.className = 'sanction-amount'; amt.textContent = '-' + Number(s.amount).toFixed(2) + ' €';
    const exportBtn = document.createElement('button'); exportBtn.textContent = 'PDF'; exportBtn.className = 'btn-export'; exportBtn.title = 'Exporter en PDF';
    const del = document.createElement('button'); del.textContent = '✕'; del.title = 'Supprimer';
    exportBtn.addEventListener('click', ()=>{ exportSanctionToPDF(s); });
    del.addEventListener('click', ()=>{ 
      // remove sanction and any linked debt
      sanctions = sanctions.filter(x=>x.id!==s.id); 
      debts = debts.filter(d => !(d.source === 'sanction' && d.sourceId === s.id));
      saveSanctions(); saveDebts(); renderSanctions(); renderDebts();
    });
    del.addEventListener('click', ()=>{ addLog(`Sanction supprimée: ${s.name} — ${Number(s.amount).toFixed(2)} €`); });
    right.appendChild(amt); right.appendChild(exportBtn); right.appendChild(del);
    li.appendChild(left); li.appendChild(right);
    sanctionList.appendChild(li);
  });
  // show sanctions totals separately
  const totals = {};
  sanctions.forEach(s=>{ const key = s.name + '|' + (s.rank||''); totals[key] = (totals[key]||0) + Number(s.amount); });
  sanctionTotalsEl.innerHTML = '';
  for(const k in totals){ const [name, rank] = k.split('|'); const row = document.createElement('div'); row.textContent = `${name}${rank?(' — '+rank):''} : ${totals[k].toFixed(2)} €`; sanctionTotalsEl.appendChild(row); }
}

function exportSanctionToPDF(s){
  const win = window.open('', '_blank');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sanction - ${s.name}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111} h1{font-size:18px} .meta{color:#555;font-size:12px} .amount{font-weight:700;color:#b22323;margin-top:10px;font-size:18px}</style></head><body><h1>Sanction financière</h1><div><strong>Membre:</strong> ${s.name}${s.rank?(' — '+s.rank):''}</div><div class="meta"><strong>Motif:</strong> ${s.reason||'—'} — <strong>Date:</strong> ${new Date(s.id).toLocaleString()}</div><div class="amount">Montant: -${Number(s.amount).toFixed(2)} €</div><hr><div style="margin-top:20px;color:#666;font-size:12px">Généré depuis mgs</div></body></html>`;
  win.document.write(html);
  win.document.close();
  setTimeout(()=>{ win.focus(); win.print(); }, 300);
}

function exportAllSanctionsToPDF(){
  if(sanctions.length===0){ alert('Aucune sanction à exporter.'); return; }
  const win = window.open('', '_blank');
  let rows = sanctions.map(s=>`<tr><td>${s.name}${s.rank?(' — '+s.rank):''}</td><td>${s.reason||'—'}</td><td>${new Date(s.id).toLocaleString()}</td><td>-${Number(s.amount).toFixed(2)} €</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sanctions</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f4f4f4}</style></head><body><h1>Liste des sanctions</h1><table><thead><tr><th>Membre</th><th>Motif</th><th>Date</th><th>Montant</th></tr></thead><tbody>${rows}</tbody></table><hr><div style="margin-top:20px;color:#666;font-size:12px">Exporté depuis mgs</div></body></html>`;
  win.document.write(html); win.document.close(); setTimeout(()=>{ win.focus(); win.print(); }, 300);
}

sanctionForm && sanctionForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = sanctionMemberEl.value.trim();
  const rank = sanctionRankEl.value.trim();
  const amount = parseFloat(sanctionAmountEl.value);
  const reason = sanctionReasonEl.value.trim();
  if(!name || isNaN(amount)) return;
  const sid = Date.now();
  const sanctionObj = { id: sid, name, rank, amount: Math.abs(amount), reason };
  sanctions.unshift(sanctionObj);
  // create corresponding debt entry linked to this sanction
  const debtObj = { id: sid + 1, name, rank, amount: Math.abs(amount), source: 'sanction', sourceId: sid };
  debts.unshift(debtObj);
  sanctionMemberEl.value = ''; sanctionRankEl.value = ''; sanctionAmountEl.value = ''; sanctionReasonEl.value = '';
  saveSanctions(); saveDebts(); renderSanctions(); renderDebts();
  addLog(`Sanction ajoutée: ${name} — ${Math.abs(amount).toFixed(2)} € (motif: ${reason || '—'})`);
  addLog(`Dette liée créée pour sanction: ${name} — ${Math.abs(amount).toFixed(2)} €`);
});

// ensure sanctions are loaded and rendered
loadSanctions(); renderSanctions();

// Data export/import
const exportBtn = document.getElementById('export-data');
const importFile = document.getElementById('import-file');
const clearAllBtn = document.getElementById('clear-all');

function exportData(){
  const payload = { todos, expenses, projects, debts, contributions, sanctions, criteria, logs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'mgs-data.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function importDataFromObject(obj){
  // simple replacement after confirmation
  if(!confirm('Importer les données va remplacer les données actuelles. Continuer ?')) return;
  todos = obj.todos || [];
  expenses = obj.expenses || [];
  projects = obj.projects || [];
  debts = obj.debts || [];
  contributions = obj.contributions || [];
  sanctions = obj.sanctions || [];
  criteria = obj.criteria || {};
  logs = obj.logs || [];
  save(); saveExpenses(); saveProjects(); saveDebts(); saveContributions(); saveSanctions(); saveCriteria();
  render(); renderExpenses(); renderProjects(); renderDebts(); renderContributions(); renderSanctions(); populateProjectSelect();
  renderLogs();
  addLog('Import JSON effectué');
}

exportBtn && exportBtn.addEventListener('click', exportData);
importFile && importFile.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try{ const obj = JSON.parse(ev.target.result); importDataFromObject(obj); }catch(err){ alert('Fichier JSON invalide'); }
  };
  reader.readAsText(f);
});

clearAllBtn && clearAllBtn.addEventListener('click', ()=>{
  if(!confirm('Supprimer toutes les données locales (todos, projets, dettes, sanctions, etc.) ?')) return;
  todos = []; expenses = []; projects = []; debts = []; contributions = []; sanctions = []; criteria = {};
  save(); saveExpenses(); saveProjects(); saveDebts(); saveContributions(); saveSanctions(); saveCriteria();
  render(); renderExpenses(); renderProjects(); renderDebts(); renderContributions(); renderSanctions(); populateProjectSelect();
  addLog('Toutes les données supprimées');
});
// init sanctions
loadSanctions(); renderSanctions && renderSanctions();
// Load logs and PDF settings on init
loadLogs(); renderLogs();
loadPdfSettings();

// Log search/filter
const logSearchEl = document.getElementById('log-search');
logSearchEl && logSearchEl.addEventListener('input', e=>{ renderLogs(e.target.value); });

// PDF settings handlers
const pdfTitleEl = document.getElementById('pdf-title');
const pdfLogoUrlEl = document.getElementById('pdf-logo-url');
const pdfSubtitleEl = document.getElementById('pdf-subtitle');
const pdfFormatEl = document.getElementById('pdf-format');
const savePdfSettingsBtn = document.getElementById('save-pdf-settings');

// Load current settings into form
if(pdfTitleEl) pdfTitleEl.value = pdfSettings.title;
if(pdfLogoUrlEl) pdfLogoUrlEl.value = pdfSettings.logoUrl;
if(pdfSubtitleEl) pdfSubtitleEl.value = pdfSettings.subtitle;
if(pdfFormatEl) pdfFormatEl.value = pdfSettings.format;

savePdfSettingsBtn && savePdfSettingsBtn.addEventListener('click', ()=>{
  pdfSettings.title = pdfTitleEl?.value || 'Rapport mgs';
  pdfSettings.logoUrl = pdfLogoUrlEl?.value || '';
  pdfSettings.subtitle = pdfSubtitleEl?.value || '';
  pdfSettings.format = pdfFormatEl?.value || 'A4';
  savePdfSettings();
  addLog('Paramètres PDF enregistrés');
});

// hookup export-all sanctions button
const exportSanctionsPdfBtn = document.getElementById('export-sanctions-pdf');
exportSanctionsPdfBtn && exportSanctionsPdfBtn.addEventListener('click', exportAllSanctionsToPDF);

// Export full report to PDF
const exportAllPdfBtn = document.getElementById('export-all-pdf');
function exportAllToPDF(){
  const win = window.open('', '_blank');
  function rowsFromArray(arr, cols){
    return arr.map(item => '<tr>' + cols.map(c=>`<td>${(typeof c === 'function'? c(item) : (item[c]!==undefined? item[c]: ''))}</td>`).join('') + '</tr>').join('');
  }
  const todosRows = rowsFromArray(todos, [t=>t.text, t=>t.done? '✓':'']);
  const expensesRows = rowsFromArray(expenses, [e=>e.text, e=>e.type, e=>Number(e.amount).toFixed(2)+' €', e=>new Date(e.id).toLocaleString()]);
  const projectsRows = rowsFromArray(projects, [p=>p.name, p=>p.caisse||'', p=>Number(p.amount).toFixed(2)+' €']);
  const debtsRows = rowsFromArray(debts, [d=>d.name, d=>d.rank||'', d=>Number(d.amount).toFixed(2)+' €', d=>d.source||'', d=>new Date(d.id).toLocaleString()]);
  const sanctionsRows = rowsFromArray(sanctions, [s=>s.name, s=>s.rank||'', s=>s.reason||'', s=>Number(s.amount).toFixed(2)+' €', s=>new Date(s.id).toLocaleString()]);
  const logsRows = rowsFromArray(logs, [l=>l.message, l=>new Date(l.id).toLocaleString()]);
  const totals = computeMemberTotals();
  const totalsRows = Object.keys(totals).map(k=>{ const [name, rank]=k.split('|'); return `<tr><td>${name}${rank?(' — '+rank):''}</td><td>${totals[k].toFixed(2)} €</td></tr>`; }).join('');
  const criteriaHtml = `<ul>${Object.keys(criteria).map(k=>`<li>${k}: ${criteria[k]}</li>`).join('')}</ul>`;
  const pageSize = pdfSettings.format === 'Letter' ? 'Letter' : 'A4';
  const logoHtml = pdfSettings.logoUrl ? `<img src="${pdfSettings.logoUrl}" style="max-height:60px;margin-bottom:15px" />` : '';
  const subtitleHtml = pdfSettings.subtitle ? `<p style="color:#666;font-size:14px;margin:5px 0">${pdfSettings.subtitle}</p>` : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${pdfSettings.title}</title><style>@page{size:${pageSize};margin:20mm}body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}h1{font-size:22px;margin:0;padding:0}h2{font-size:14px;margin-top:20px;border-bottom:1px solid #ccc;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f4}</style></head><body>${logoHtml}<h1>${pdfSettings.title}</h1>${subtitleHtml}<h2>Todos</h2><table><thead><tr><th>Tâche</th><th>Statut</th></tr></thead><tbody>${todosRows}</tbody></table><h2>Dépenses</h2><table><thead><tr><th>Desc</th><th>Type</th><th>Montant</th><th>Date</th></tr></thead><tbody>${expensesRows}</tbody></table><h2>Projets</h2><table><thead><tr><th>Nom</th><th>Caisse</th><th>Montant</th></tr></thead><tbody>${projectsRows}</tbody></table><h2>Dettes</h2><table><thead><tr><th>Membre</th><th>Rang</th><th>Montant</th><th>Source</th><th>Date</th></tr></thead><tbody>${debtsRows}</tbody></table><h2>Sanctions</h2><table><thead><tr><th>Membre</th><th>Rang</th><th>Motif</th><th>Montant</th><th>Date</th></tr></thead><tbody>${sanctionsRows}</tbody></table><h2>Flux (journal)</h2><table><thead><tr><th>Événement</th><th>Date</th></tr></thead><tbody>${logsRows}</tbody></table><h2>Totaux par membre (dettes + sanctions)</h2><table><thead><tr><th>Membre</th><th>Montant total</th></tr></thead><tbody>${totalsRows}</tbody></table><h2>Critères enregistrés</h2>${criteriaHtml}<div style="margin-top:30px;color:#999;font-size:11px;border-top:1px solid #ddd;padding-top:10px">Généré depuis mgs — ${new Date().toLocaleString()}</div></body></html>`;
  win.document.write(html); win.document.close(); setTimeout(()=>{ win.focus(); win.print(); }, 300);
}
exportAllPdfBtn && exportAllPdfBtn.addEventListener('click', exportAllToPDF);
addLog && addLog('Fonctionnalité PDF export complet prête');

// PDF settings handlers
const pdfTitleEl = document.getElementById('pdf-title');
const pdfLogoUrlEl = document.getElementById('pdf-logo-url');
const pdfSubtitleEl = document.getElementById('pdf-subtitle');
const pdfFormatEl = document.getElementById('pdf-format');
const savePdfSettingsBtn = document.getElementById('save-pdf-settings');

// Load current settings into form
if(pdfTitleEl) pdfTitleEl.value = pdfSettings.title;
if(pdfLogoUrlEl) pdfLogoUrlEl.value = pdfSettings.logoUrl;
if(pdfSubtitleEl) pdfSubtitleEl.value = pdfSettings.subtitle;
if(pdfFormatEl) pdfFormatEl.value = pdfSettings.format;

savePdfSettingsBtn && savePdfSettingsBtn.addEventListener('click', ()=>{
  pdfSettings.title = pdfTitleEl?.value || 'Rapport mgs';
  pdfSettings.logoUrl = pdfLogoUrlEl?.value || '';
  pdfSettings.subtitle = pdfSubtitleEl?.value || '';
  pdfSettings.format = pdfFormatEl?.value || 'A4';
  savePdfSettings();
  addLog('Paramètres PDF enregistrés');
});

// Clear logs button
const clearLogsBtn = document.getElementById('clear-logs');
clearLogsBtn && clearLogsBtn.addEventListener('click', ()=>{
  if(!confirm('Vider le journal des flux ?')) return;
  logs = [];
  saveLogs(); renderLogs();
  addLog('Journal vidé');
});

// helper: compute member totals including debts and sanctions
function computeMemberTotals(){
  const totals = {};
  debts.forEach(d=>{ const key = d.name + '|' + (d.rank||''); totals[key] = (totals[key]||0) + Number(d.amount); });
  // add sanctions only if there's no corresponding debt linked to that sanction
  sanctions.forEach(s=>{
    const linked = debts.some(d => d.source === 'sanction' && d.sourceId === s.id);
    if(!linked){ const key = s.name + '|' + (s.rank||''); totals[key] = (totals[key]||0) + Number(s.amount); }
  });
  return totals;
}

// Simulation & criteria logic
const simProjectSel = document.getElementById('sim-project');
const simForm = document.getElementById('sim-form');
const simIncome = document.getElementById('sim-income');
const simExpenses = document.getElementById('sim-expenses');
const simDuration = document.getElementById('sim-duration');
const simResult = document.getElementById('sim-result');
const criteriaForm = document.getElementById('criteria-form');
const critMinFunding = document.getElementById('crit-minFunding');
const critMinBalance = document.getElementById('crit-minBalance');
const critMinROI = document.getElementById('crit-minROI');
const critMaxMemberDebt = document.getElementById('crit-maxMemberDebt');
const critRequiredCaisse = document.getElementById('crit-requiredCaisse');
const saveCriteriaBtn = document.getElementById('save-criteria');
const evalCriteriaBtn = document.getElementById('eval-criteria');
const criteriaResult = document.getElementById('criteria-result');

function populateProjectSelect(){
  if(!simProjectSel) return;
  simProjectSel.innerHTML = '';
  const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '-- choisir un projet --';
  simProjectSel.appendChild(opt0);
  projects.forEach(p=>{
    const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} (${Number(p.amount).toFixed(2)} €)`; simProjectSel.appendChild(o);
  });
}

function formatEuro(v){ return Number(v).toFixed(2) + ' €'; }

simForm && simForm.addEventListener('submit', e=>{
  e.preventDefault();
  const pid = simProjectSel?.value;
  if(!pid){ simResult.textContent = 'Veuillez sélectionner un projet.'; return; }
  const proj = projects.find(x=>String(x.id)===String(pid));
  if(!proj){ simResult.textContent = 'Projet introuvable.'; return; }
  const income = parseFloat(simIncome.value) || 0;
  const expensesProj = parseFloat(simExpenses.value) || 0;
  const duration = parseInt(simDuration.value) || 0;
  const projectedBalance = Number(proj.amount) + income - expensesProj;
  const roi = proj.amount !== 0 ? ((income - expensesProj) / proj.amount) * 100 : 0;
  simResult.innerHTML = `Projet: <strong>${proj.name}</strong><br>Solde projeté: <strong>${formatEuro(projectedBalance)}</strong><br>ROI estimé: <strong>${roi.toFixed(2)}%</strong><br>Durée: ${duration} mois`;
});

saveCriteriaBtn && saveCriteriaBtn.addEventListener('click', ()=>{
  criteria.minFunding = parseFloat(critMinFunding.value) || null;
  criteria.minBalance = parseFloat(critMinBalance.value) || null;
  criteria.minROI = parseFloat(critMinROI.value) || null;
  criteria.maxMemberDebt = parseFloat(critMaxMemberDebt.value) || null;
  criteria.requiredCaisse = critRequiredCaisse.value.trim() || null;
  saveCriteria();
  criteriaResult.textContent = 'Critères enregistrés.';
});

function evaluateProjectAgainstCriteria(proj, simulated){
  const failures = [];
  if(criteria.minFunding != null && proj.amount < criteria.minFunding) failures.push(`Financement (${formatEuro(proj.amount)}) < exigence (${formatEuro(criteria.minFunding)})`);
  if(criteria.minBalance != null && simulated.projectedBalance < criteria.minBalance) failures.push(`Solde projeté (${formatEuro(simulated.projectedBalance)}) < exigence (${formatEuro(criteria.minBalance)})`);
  if(criteria.minROI != null && simulated.roi < criteria.minROI) failures.push(`ROI estimé (${simulated.roi.toFixed(2)}%) < exigence (${criteria.minROI}%)`);
  if(criteria.requiredCaisse && proj.caisse !== criteria.requiredCaisse) failures.push(`Caisse (${proj.caisse||'—'}) ≠ exigence (${criteria.requiredCaisse})`);
  if(criteria.maxMemberDebt != null){
    // compute max debt among members including sanctions
    const memberTotals = computeMemberTotals();
    const maxDebt = Object.values(memberTotals).reduce((a,b)=>Math.max(a,b||0),0);
    if(maxDebt > criteria.maxMemberDebt) failures.push(`Dette max par membre (${formatEuro(maxDebt)}) > exigence (${formatEuro(criteria.maxMemberDebt)})`);
  }
  return failures;
}

evalCriteriaBtn && evalCriteriaBtn.addEventListener('click', ()=>{
  const pid = simProjectSel?.value;
  if(!pid){ criteriaResult.textContent = 'Sélectionnez un projet pour évaluer.'; return; }
  const proj = projects.find(x=>String(x.id)===String(pid));
  if(!proj){ criteriaResult.textContent = 'Projet introuvable.'; return; }
  // use last simulation values if present
  const income = parseFloat(simIncome.value) || 0;
  const expensesProj = parseFloat(simExpenses.value) || 0;
  const projectedBalance = Number(proj.amount) + income - expensesProj;
  const roi = proj.amount !== 0 ? ((income - expensesProj) / proj.amount) * 100 : 0;
  const simulated = { projectedBalance, roi };
  const failures = evaluateProjectAgainstCriteria(proj, simulated);
  if(failures.length===0) criteriaResult.innerHTML = '<strong style="color:#7ee787">Accepté — le projet satisfait tous les critères</strong>';
  else criteriaResult.innerHTML = `<strong style="color:#ffb4a2">Refusé — ${failures.length} condition(s) non satisfaite(s)</strong><ul>${failures.map(f=>`<li>${f}</li>`).join('')}</ul>`;
});

// load criteria and populate fields
loadCriteria();
if(criteria){
  if(critMinFunding) critMinFunding.value = criteria.minFunding || '';
  if(critMinBalance) critMinBalance.value = criteria.minBalance || '';
  if(critMinROI) critMinROI.value = criteria.minROI || '';
  if(critMaxMemberDebt) critMaxMemberDebt.value = criteria.maxMemberDebt || '';
  if(critRequiredCaisse) critRequiredCaisse.value = criteria.requiredCaisse || '';
}

// keep project select in sync
populateProjectSelect();
// when projects change (after adding/removing), call populateProjectSelect() where appropriate
// update existing save/delete handlers above already call renderProjects(); add call here to ensure select updates after render
const originalRenderProjects = renderProjects;
renderProjects = function(){ originalRenderProjects(); populateProjectSelect(); };
