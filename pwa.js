// PWA logic: install prompt + service worker registration
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').then(reg=>{
    console.log('SW registered', reg);
  }).catch(err=> console.warn('SW fail', err));
}
