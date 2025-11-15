// Theme management
const themeSelect = document.getElementById('themeSelect');
const root = document.documentElement;

function applyTheme(name){
  // reset
  document.body.classList.remove('theme-light','theme-amoled');
  if(name === 'light') document.body.classList.add('theme-light');
  if(name === 'amoled') document.body.classList.add('theme-amoled');
  localStorage.setItem('adv_calc_theme', name);
}
themeSelect.addEventListener('change', ()=> applyTheme(themeSelect.value));
const saved = localStorage.getItem('adv_calc_theme') || 'neon';
themeSelect.value = saved;
applyTheme(saved);
