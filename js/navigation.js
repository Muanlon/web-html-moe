'use strict';

  /* ========== 开始页 ========== */
  $('btnStart').addEventListener('click', ()=>goto('menu', true));

  /* ========== 主菜单 ========== */
  document.querySelectorAll('.menu-item').forEach(item=>{
    item.addEventListener('pointerenter', ()=>{
      if(pages.menu.classList.contains('menu-entering')) return;
      document.querySelectorAll('.menu-item').forEach(menuItem=>menuItem.classList.remove('selected'));
      item.classList.add('selected');
    });
    item.addEventListener('click', ()=>{
      const key = item.dataset.menu;
      switch(key){
        case 'continue':
          if(!S.hasSave){ showToast('暂无存档'); return; }
          goto('bonfire', true); break;
        case 'newgame':
          S.hasSave = true; S.ink = 0;
          showToast('新的旅程开始');
          setTimeout(()=>goto('bonfire', true), 500); break;
        case 'equip': openPanel('panelEquip'); break;
        case 'memory': openPanel('panelMemory'); break;
        case 'settings': openPanel('panelSettings'); break;
        case 'quit': closeAllPanels(); goto('start', true); break;
      }
    });
  });

  /* ========== 篝火 ========== */
  function refreshBonfireUI(){ $('bonfireInk').textContent = Math.floor(S.ink); }
  document.querySelectorAll('[data-bonfire]').forEach(row=>{
    row.addEventListener('click', ()=>{
      const key = row.dataset.bonfire;
      switch(key){
        case 'heal': showToast('气血已回满 · 敌人已重置'); break;
        case 'equip': openPanel('panelEquip'); break;
        case 'charm': openPanel('panelEquip'); break;
        case 'levelup': refreshLevelupUI(); openPanel('panelLevelup'); break;
        case 'memory': openPanel('panelMemory'); break;
      }
    });
  });
  $('btnBonfireBack').addEventListener('click', ()=>goto('menu', true));
  $('btnLeaveBonfire').addEventListener('click', ()=>goto('battle', true));

  /* ========== 装备 ========== */
  document.querySelectorAll('[data-weapon]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-weapon]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel'); S.weapon = btn.dataset.weapon; updateTendency();
    });
  });
  document.querySelectorAll('[data-charm]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-charm]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel'); S.charm = btn.dataset.charm; updateTendency();
    });
  });
  function updateTendency(){
    let t = '均衡';
    if(S.weapon === 'greatsword') t = '谨慎 · 等硬直';
    if(S.weapon === 'dagger') t = '高频闪避 · 拉扯';
    if(S.charm === 'aggressive') t = '激进强攻';
    if(S.charm === 'defensive') t = '优先保命';
    $('aiTendency').textContent = t;
  }

  /* ========== 设置 ========== */
  $('difficulty').addEventListener('input', e=>{
    S.difficulty = e.target.value / 100;
    $('diffVal').textContent = e.target.value + '%';
  });
  document.querySelectorAll('[data-speed]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-speed]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel'); S.autoSpeed = parseFloat(btn.dataset.speed);
    });
  });
  document.querySelectorAll('[data-hint]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-hint]').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel'); S.rageHint = btn.dataset.hint === 'on';
    });
  });

  /* ========== 强化 ========== */
  function refreshLevelupUI(){ $('levelupInk').textContent = Math.floor(S.ink); }
  document.querySelectorAll('[data-upgrade]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.dataset.upgrade;
      const cost = key === 'hp' ? 30 : key === 'atk' ? 40 : 35;
      if(S.ink < cost){ showToast('墨气不足'); return; }
      S.ink -= cost;
      if(key === 'hp') S.hpMax += 10;
      if(key === 'atk') S.atkBonus += 5;
      if(key === 'ink') S.inkBonus += 10;
      showToast('强化成功');
      refreshLevelupUI(); refreshBonfireUI();
    });
  });
