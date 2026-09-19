'use strict';

  /* ========== 场景粒子 ========== */
  function buildScene(){
    // 墨林
    const trees = $('sceneTrees');
    trees.innerHTML = '';
    const treePositions = [3, 8, 13, 20, 27, 84, 90, 95];
    treePositions.forEach((p, i)=>{
      const t = document.createElement('div');
      t.className = 'tree';
      t.style.left = p + '%';
      t.style.height = (60 + Math.random()*70) + 'px';
      t.style.opacity = 0.5 + Math.random()*0.4;
      trees.appendChild(t);
    });
    // 飘落墨点
    for(let i=0;i<18;i++){
      const a = document.createElement('div');
      a.className = 'ash';
      const size = 1 + Math.random()*2;
      a.style.width = size + 'px';
      a.style.height = size + 'px';
      a.style.left = Math.random()*100 + '%';
      a.style.top = '-10px';
      a.style.setProperty('--ax', (Math.random()*80-40) + 'px');
      a.style.animationDuration = (8 + Math.random()*10) + 's';
      a.style.animationDelay = (-Math.random()*12) + 's';
      a.style.opacity = 0.3 + Math.random()*0.4;
      $('battleStage').appendChild(a);
    }
  }

  /* ========== 键盘调试 ========== */
  window.addEventListener('keydown', e=>{
    if(e.key === 'Escape') closeAllPanels();
    if(e.key === '1') goto('start', true);
    if(e.key === '2') goto('menu', true);
    if(e.key === '3') goto('bonfire', true);
    if(e.key === '4') goto('battle', true);
  });

  /* ========== 初始化 ========== */
  refreshBonfireUI();
  updateTendency();
  buildScene();
  const bonfireSprite = $('bonfireSprite');
  const showBonfireSprite = ()=>bonfireSprite.parentElement.classList.add('sprite-ready');
  const bonfireImage = new Image();
  bonfireImage.addEventListener('load', ()=>{
    bonfireSprite.style.backgroundImage = `url("${bonfireImage.src}")`;
    showBonfireSprite();
  });
  bonfireImage.src = bonfireSprite.dataset.src;

  window.__MOE__ = {
    S, goto, showToast,
    setPlayerImage,
    usePlayerBase64(b64){ setPlayerImage(b64); }
  };
