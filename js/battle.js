'use strict';

  /* ============================================================
     战斗系统
     ============================================================ */
  const playerEl = $('player'), enemyEl = $('enemy');
  const hpBar = $('hpBar'), inkBar = $('inkBar');
  const hpText = $('hpText'), inkText = $('inkText');
  const modeTag = $('modeTag'), modeBtn = $('modeBtn');
  const aiStatus = $('aiStatus'), rageBtn = $('rageBtn');
  const parryFlash = $('parryFlash'), parryText = $('parryText');
  const rageTip = $('rageTip'), inkFullHint = $('inkFullHint');
  const deathOverlay = $('deathOverlay');

  let playerX = 30, enemyX = 70;
  const MOVE_SPEED = 22;
  let moveDir = 0;
  let battleLoopRunning = false;
  let lastTime = 0;

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function rand(a,b){ return a + Math.random()*(b-a); }

  function spawnDmg(x, y, text, color){
    const d = document.createElement('div');
    d.className = 'dmg'; d.textContent = text;
    d.style.color = color || '#ff6060';
    d.style.left = x + '%'; d.style.bottom = y + '%';
    d.style.textShadow = '0 0 10px ' + (color||'#ff6060') + ', 0 2px 4px rgba(0,0,0,.9)';
    $('battleStage').appendChild(d);
    setTimeout(()=>d.remove(), 800);
  }

  function spawnSlash(x, y){
    const s = document.createElement('div');
    s.className = 'slash-fx';
    s.style.left = x + '%'; s.style.top = y + '%';
    s.style.setProperty('--rot', rand(-40,40) + 'deg');
    $('battleStage').appendChild(s);
    setTimeout(()=>s.remove(), 300);
  }

  function updateBattleUI(){
    hpBar.style.width = (S.hp/S.hpMax*100) + '%';
    inkBar.style.width = (S.ink/S.maxInk*100) + '%';
    hpText.textContent = Math.round(S.hp) + '/' + S.hpMax;
    inkText.textContent = Math.round(S.ink) + '/' + S.maxInk;
    playerEl.style.left = playerX + '%';
    enemyEl.style.left = enemyX + '%';

    if(S.ink >= S.maxInk && !S.rage && !S.weak){
      rageBtn.classList.add('ready');
      if(S.rageHint) inkFullHint.classList.add('on');
    } else {
      rageBtn.classList.remove('ready');
      inkFullHint.classList.remove('on');
    }
    rageBtn.classList.toggle('disabled', S.rage || S.weak || S.dead);

    playerEl.classList.toggle('rage', S.rage);
    playerEl.classList.toggle('dead', S.dead);

    enemyEl.classList.toggle('windup', S.enemy.state === 'windup');
    enemyEl.classList.toggle('parryable', S.enemy.parryable && S.enemy.state === 'windup');

    modeTag.className = S.mode;
    modeTag.textContent = S.mode === 'manual' ? '手 动 模 式' : '墨 卫 自 动';
    modeBtn.textContent = S.mode === 'manual' ? '切换 · 墨卫自动' : '切换 · 手动接管';
    modeBtn.classList.toggle('auto', S.mode === 'auto');

    document.querySelectorAll('#actionPad .act-btn, #movePad .move-btn').forEach(b=>{
      if(b.dataset.act === 'rage') return;
      b.classList.toggle('disabled', S.mode === 'auto' || S.dead);
    });

    if(S.mode === 'auto' && !S.dead){
      aiStatus.classList.add('on');
      aiStatus.textContent = '墨卫：' + S.ai.state;
    } else {
      aiStatus.classList.remove('on');
    }
  }

  function playerAttack(type){
    if(S.dead || S.mode === 'auto' || S.enemy.state === 'dead') return;
    playerEl.classList.add('attacking');
    setTimeout(()=>playerEl.classList.remove('attacking'), 180);
    const dist = Math.abs(playerX - enemyX);
    if(dist > 18) return;
    spawnSlash(enemyX, 55);
    let base = type === 'heavy' ? 22 : 12;
    if(S.weapon === 'greatsword') base *= 1.6;
    if(S.weapon === 'dagger') base *= 0.8;
    if(S.rage) base *= 2;
    const dmg = Math.round(base * (1 + S.atkBonus/100) * rand(0.9,1.1));
    damageEnemy(dmg);
  }

  function damageEnemy(dmg){
    S.enemy.hp = clamp(S.enemy.hp - dmg, 0, S.enemy.maxHp);
    spawnDmg(enemyX + rand(-4,4), 45, '-' + dmg, S.rage ? '#ff4040' : '#ffaa60');
    if(S.enemy.hp <= 0){
      S.enemy.state = 'dead'; S.kills++;
      gainInk(25);
      enemyEl.style.transition = 'opacity .5s, transform .5s';
      enemyEl.style.opacity = '0';
      enemyEl.style.transform = 'translateX(-50%) scale(.8) translateY(-20px)';
      setTimeout(()=>{
        respawnEnemy();
        enemyEl.style.opacity = '';
        enemyEl.style.transform = '';
      }, 1600);
    }
  }

  function gainInk(v){
    if(S.rage) return;
    S.ink = clamp(S.ink + v * (1 + S.inkBonus/100), 0, S.maxInk);
    refreshBonfireUI(); updateBattleUI();
  }

  function playerDodge(){
    if(S.dead || S.mode === 'auto') return;
    playerX = clamp(playerX + (playerX < enemyX ? -12 : 12), 8, 92);
    updateBattleUI();
  }

  function playerParry(){
    if(S.dead || S.mode === 'auto') return;
    if(S.enemy.parryable && S.enemy.state === 'windup'){
      S.enemy.state = 'recover'; S.enemy.timer = 1.0; S.enemy.parryable = false;
      triggerParryFX(); damageEnemy(35); gainInk(15);
    } else {
      playerEl.classList.add('hurt');
      setTimeout(()=>playerEl.classList.remove('hurt'), 220);
    }
  }

  function triggerParryFX(){
    parryFlash.classList.add('on'); parryText.classList.add('on');
    setTimeout(()=>{ parryFlash.classList.remove('on'); parryText.classList.remove('on'); }, 360);
  }

  function playerSkill(){
    if(S.dead || S.mode === 'auto') return;
    const dist = Math.abs(playerX - enemyX);
    if(dist > 30) return;
    spawnSlash(enemyX, 50);
    damageEnemy(30 * (1 + S.atkBonus/100)); gainInk(10);
  }

  function toggleRage(){
    if(S.dead || S.rage || S.weak) return;
    if(S.ink < S.maxInk) return;
    S.rage = true; S.ink = 0; S.rageTimer = 6;
    rageTip.classList.add('on');
    setTimeout(()=>rageTip.classList.remove('on'), 900);
    updateBattleUI();
  }
  function endRage(){ S.rage = false; S.weak = true; S.weakTimer = 3; updateBattleUI(); }

  function respawnEnemy(){
    S.enemy.hp = S.enemy.maxHp; S.enemy.state = 'idle'; S.enemy.timer = 0;
    enemyX = 70; updateBattleUI();
  }

  function updateEnemy(dt){
    if(S.enemy.state === 'dead') return;
    const dist = Math.abs(playerX - enemyX);
    S.enemy.timer -= dt;
    S.enemy.attackCd -= dt;
    switch(S.enemy.state){
      case 'idle':
        if(dist < 50) S.enemy.state = 'chase'; break;
      case 'chase':
        if(S.enemy.attackCd > 0) break;
        if(playerX < enemyX) enemyX -= 15 * dt; else enemyX += 15 * dt;
        if(dist < 17){
          S.enemy.state = 'windup';
          S.enemy.timer = S.enemy.windupDur;
          S.enemy.parryable = Math.random() < 0.55;
        }
        if(dist > 60) S.enemy.state = 'idle';
        break;
      case 'windup':
        if(S.enemy.timer <= 0){
          S.enemy.state = 'attack'; S.enemy.timer = 0.25;
          if(dist < 20){
            const dmg = Math.round(12 * S.difficulty * rand(0.9,1.1));
            if(S.mode === 'manual'){
              S.hp = clamp(S.hp - dmg, 0, S.hpMax);
              playerEl.classList.add('hurt');
              setTimeout(()=>playerEl.classList.remove('hurt'), 220);
              spawnDmg(playerX, 45, '-' + dmg, '#ff6060');
              if(S.hp <= 0) playerDie();
            }
          }
        }
        break;
      case 'attack':
        if(S.enemy.timer <= 0){ S.enemy.state = 'recover'; S.enemy.timer = 0.6; S.enemy.parryable = false; }
        break;
      case 'recover':
        if(S.enemy.timer <= 0){
          S.enemy.state = 'chase';
          S.enemy.attackCd = 0.6;
        }
        break;
    }
    updateBattleUI();
  }

  function updateAutoAI(dt){
    if(S.dead || S.enemy.state === 'dead') return;
    S.ai.thinkTimer -= dt;
    const dist = Math.abs(playerX - enemyX);
    const hpRatio = S.hp / S.hpMax;

    if(hpRatio < 0.3){
      S.ai.state = '后撤保命';
      playerX = clamp(playerX + (playerX < enemyX ? -18 : 18) * dt * 2, 8, 92);
      return;
    }
    if(S.enemy.state === 'windup'){
      if(S.enemy.parryable && Math.random() < 0.6){
        S.ai.state = '尝试弹反'; playerParryAuto();
      } else {
        S.ai.state = '闪避重击';
        playerX = clamp(playerX + (playerX < enemyX ? -10 : 10), 8, 92);
      }
      return;
    }

    const aggressive = S.charm === 'aggressive';
    const defensive = S.charm === 'defensive';
    const attackRange = S.weapon === 'greatsword' ? 14 : (S.weapon === 'dagger' ? 10 : 12);

    if(dist > attackRange + 6){
      S.ai.state = aggressive ? '激进追击' : '追击';
      if(playerX < enemyX) playerX += 16 * dt; else playerX -= 16 * dt;
    } else {
      if(defensive && Math.random() < 0.4){
        S.ai.state = '拉扯';
        playerX += (playerX < enemyX ? -8 : 8) * dt;
      } else {
        S.ai.state = aggressive ? '强攻' : '攻击';
        if(S.ai.thinkTimer <= 0){
          const t = S.weapon === 'greatsword' ? 'heavy' : (S.weapon === 'dagger' ? 'light' : (Math.random()<0.3?'heavy':'light'));
          playerAttackAuto(t);
          S.ai.thinkTimer = S.weapon === 'greatsword' ? 1.2 : (S.weapon === 'dagger' ? 0.5 : 0.8);
        }
      }
    }
  }
  function playerAttackAuto(type){
    if(S.enemy.state === 'dead') return;
    const dist = Math.abs(playerX - enemyX);
    const attackRange = S.weapon === 'greatsword' ? 16 : (S.weapon === 'dagger' ? 12 : 14);
    if(dist > attackRange) return;
    spawnSlash(enemyX, 55);
    let base = type === 'heavy' ? 22 : 12;
    if(S.weapon === 'greatsword') base *= 1.6;
    if(S.weapon === 'dagger') base *= 0.8;
    if(S.rage) base *= 2;
    const dmg = Math.round(base * (1 + S.atkBonus/100) * rand(0.9,1.1));
    damageEnemy(dmg); gainInk(5);
  }
  function playerParryAuto(){
    if(S.enemy.parryable && S.enemy.state === 'windup'){
      S.enemy.state = 'recover'; S.enemy.timer = 1.0; S.enemy.parryable = false;
      triggerParryFX(); damageEnemy(30); gainInk(10);
    }
  }

  function playerDie(){
    S.dead = true; S.hp = 0;
    S.lostInk = Math.floor(S.ink * 0.4);
    S.ink = Math.floor(S.ink * 0.6);
    playerEl.classList.add('dead');
    updateBattleUI();
    $('lostInkVal').textContent = S.lostInk;
    $('remainInkVal').textContent = S.ink;
    deathOverlay.classList.add('on');
  }
  $('btnRevive').addEventListener('click', ()=>{
    deathOverlay.classList.remove('on');
    goto('bonfire', true);
    S.dead = false; S.hp = S.hpMax; S.rage = false; S.weak = false;
    playerX = 30; enemyX = 70;
    S.enemy.hp = S.enemy.maxHp; S.enemy.state = 'idle';
    playerEl.classList.remove('dead');
    refreshBonfireUI();
  });

  function startBattle(){
    S.dead = false; S.hp = S.hpMax; S.rage = false; S.weak = false;
    S.mode = 'manual';
    S.enemy.hp = S.enemy.maxHp; S.enemy.state = 'idle'; S.enemy.timer = 0; S.enemy.attackCd = 0;
    playerX = 30; enemyX = 70;
    playerEl.classList.remove('dead');
    updateBattleUI();
    if(!battleLoopRunning){
      battleLoopRunning = true;
      lastTime = performance.now();
      requestAnimationFrame(battleLoop);
    }
  }

  function battleLoop(now){
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if(pages.battle.classList.contains('active') && !S.dead){
      if(S.rage){
        S.rageTimer -= dt;
        S.hp = clamp(S.hp - 3 * dt, 0, S.hpMax);
        if(S.rageTimer <= 0) endRage();
        if(S.hp <= 0) playerDie();
      }
      if(S.weak){ S.weakTimer -= dt; if(S.weakTimer <= 0) S.weak = false; }
      updateEnemy(dt);
      if(S.mode === 'auto') updateAutoAI(dt);
      if(S.mode === 'manual' && moveDir !== 0){
        playerX = clamp(playerX + moveDir * MOVE_SPEED * dt, 8, 92);
      }
      updateBattleUI();
    }
    requestAnimationFrame(battleLoop);
  }

  /* -------- 输入 -------- */
  document.querySelectorAll('[data-move]').forEach(btn=>{
    const dir = btn.dataset.move === 'left' ? -1 : 1;
    const start = e=>{ e.preventDefault(); moveDir = dir; };
    const end = e=>{ e.preventDefault(); if(moveDir === dir) moveDir = 0; };
    btn.addEventListener('touchstart', start, {passive:false});
    btn.addEventListener('touchend', end, {passive:false});
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  });
  document.querySelectorAll('[data-act]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      if(S.mode === 'auto' && btn.dataset.act !== 'rage') return;
      switch(btn.dataset.act){
        case 'light': playerAttack('light'); break;
        case 'heavy': playerAttack('heavy'); break;
        case 'dodge': playerDodge(); break;
        case 'parry': playerParry(); break;
        case 'skill': playerSkill(); break;
        case 'rage': toggleRage(); break;
      }
    });
  });
  modeBtn.addEventListener('click', ()=>{
    if(S.dead) return;
    S.mode = S.mode === 'manual' ? 'auto' : 'manual';
    S.ai.state = '待机';
    updateBattleUI();
  });

  $('btnBattleEquip').addEventListener('click', ()=>openPanel('panelEquip'));
  $('btnBattleBonfire').addEventListener('click', ()=>goto('bonfire', true));
  $('btnBattleMemory').addEventListener('click', ()=>openPanel('panelMemory'));

