  'use strict';

  const $ = id => document.getElementById(id);
  const pages = { start: $('pageStart'), menu: $('pageMenu'), bonfire: $('pageBonfire'), battle: $('pageBattle') };
  const fade = $('fade'), toast = $('toast');
  let menuUnlockHandler = null;

  /* ========== 全局状态 ========== */
  const S = {
    weapon: 'longsword', charm: 'none',
    difficulty: 1.0, autoSpeed: 1, rageHint: true,
    ink: 0, hpMax: 100, atkBonus: 0, inkBonus: 0, hasSave: true,
    maxInk: 100,
    mode: 'manual',
    hp: 100,
    rage: false, rageTimer: 0, weak: false, weakTimer: 0,
    dead: false, kills: 0, lostInk: 0,
    enemy: { hp: 100, maxHp: 100, state: 'idle', timer: 0,
      windupDur: 0.85, parryable: false, attackCd: 0 },
    ai: { state: '待机', thinkTimer: 0 },
  };

  /* ========== 页面切换 ========== */
  function goto(name, withFade){
    if(!pages[name]) return;
    if(withFade){
      fade.classList.add('on');
      setTimeout(()=>{
        Object.values(pages).forEach(p=>p.classList.remove('active'));
        pages[name].classList.add('active');
        if(name === 'menu') resetMenuSelection();
        setTimeout(()=>fade.classList.remove('on'), 60);
        if(name === 'battle') startBattle();
      }, 450);
    } else {
      Object.values(pages).forEach(p=>p.classList.remove('active'));
      pages[name].classList.add('active');
      if(name === 'menu') resetMenuSelection();
      if(name === 'battle') startBattle();
    }
  }

  function resetMenuSelection(){
    const items = pages.menu.querySelectorAll('.menu-item');
    items.forEach(item=>item.classList.toggle('selected', item.dataset.menu === 'continue'));
    pages.menu.classList.add('menu-entering');
    if(menuUnlockHandler) window.removeEventListener('pointermove', menuUnlockHandler);
    menuUnlockHandler = ()=>{
      pages.menu.classList.remove('menu-entering');
      window.removeEventListener('pointermove', menuUnlockHandler);
      menuUnlockHandler = null;
    };
    window.addEventListener('pointermove', menuUnlockHandler);
  }

  let toastTimer = null;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove('on'), 1600);
  }

  /* ========== 子面板 ========== */
  function openPanel(id){ $(id).classList.add('on'); }
  function closeAllPanels(){ document.querySelectorAll('.sub-panel').forEach(p=>p.classList.remove('on')); }
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', closeAllPanels));
  document.querySelectorAll('.sub-panel').forEach(p=>{
    p.addEventListener('click', e=>{ if(e.target === p) closeAllPanels(); });
  });

  /* ========== 角色图片 ==========
     默认用一个内置 SVG 剪影作为占位 —— 你上传的图会自动替换它。
     用 __MOE__.setPlayerImage('URL 或 base64') 来替换。 */
  const FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
      <defs>
        <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a1a22"/>
          <stop offset="1" stop-color="#050508"/>
        </linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0a0a10"/>
          <stop offset="1" stop-color="#2a2a35"/>
        </linearGradient>
        <radialGradient id="eye" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#ff3030"/>
          <stop offset="1" stop-color="#a01010" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- 飘散长发 -->
      <path d="M100 30 C60 20 30 50 25 90 C20 130 40 150 60 145 C50 120 55 90 80 75 C90 70 100 68 100 68 Z"
            fill="url(#hair)" opacity="0.9"/>
      <path d="M100 30 C140 15 170 45 175 85 C180 125 160 150 140 148 C150 120 145 90 120 75 Z"
            fill="url(#hair)" opacity="0.85"/>
      <!-- 飘带 -->
      <path d="M110 140 C140 150 170 170 165 210 C160 200 140 190 120 185 Z"
            fill="#8a1018" opacity="0.85"/>
      <path d="M100 145 C130 165 150 190 140 230 C130 210 110 195 95 190 Z"
            fill="#6a0a12" opacity="0.75"/>
      <!-- 身体 -->
      <path d="M100 70 C80 70 65 85 60 110 L55 200 L70 220 L100 235 L130 220 L145 200 L140 110 C135 85 120 70 100 70 Z"
            fill="url(#coat)"/>
      <!-- 腰带 -->
      <path d="M70 155 L130 155 L135 175 L65 175 Z" fill="#8a1018" opacity="0.9"/>
      <!-- 下摆 -->
      <path d="M65 175 L55 240 L80 260 L100 250 L120 260 L145 240 L135 175 Z"
            fill="#0a0a10"/>
      <!-- 红眼 -->
      <ellipse cx="105" cy="86" rx="6" ry="3" fill="url(#eye)"/>
      <ellipse cx="105" cy="86" rx="2.5" ry="1.5" fill="#ff5050"/>
    </svg>
  `);

  const playerSprite = $('playerSprite');
  playerSprite.src = FALLBACK_SVG;
  function setPlayerImage(url){ if(url) playerSprite.src = url; }
