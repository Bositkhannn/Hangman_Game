class HangmanGame {
  constructor() {
    this.initElements();
    this.initData();
    this.loadStats();
    this.generateKeyboard();
    this.initEvents();
    this.initSounds();
    this.startNewGame();
  }

  initElements() {
    this.wordEl = document.getElementById('word');
    this.wrongLettersEl = document.getElementById('wrong-letters');
    this.playAgainBtn = document.getElementById('play-button');
    this.popup = document.getElementById('popup-container');
    this.notification = document.getElementById('notification-container');
    this.finalMessage = document.getElementById('final-message');
    this.finalMessageReveal = document.getElementById('final-message-reveal-word');
    this.popupIcon = document.getElementById('popup-icon');
    this.popupWins = document.getElementById('popup-wins');

    this.difficultySelect = document.getElementById('difficulty');
    this.categorySelect = document.getElementById('category');
    this.hintBtn = document.getElementById('hint-btn');
    this.keyboardEl = document.getElementById('keyboard');

    this.winsCount = document.getElementById('wins-count');
    this.hintsRemainingEl = document.getElementById('hints-remaining');
    this.wrongCountEl = document.getElementById('wrong-count');
    this.maxWrongEl = document.getElementById('max-wrong');

    this.figureParts = document.querySelectorAll('.figure-parts .figure-part');
    this.themeButtons = document.querySelectorAll('.theme-btn');
  }

  initData() {
    this.words = {
      all: ['apple','brain','chair','dance','earth','flower','garden','happy','island','jigsaw','kitten','lemon','mountain','notebook','ocean','puzzle','quiet','river','sunset','travel','umbrella','victory','window','xylophone','yellow','zebra','butterfly','chocolate','diamond','elephant','fantasy','guitar','harmony','illusion','journey','kingdom','library','melody','nostalgia','orchestra','paradise','quantum','rainbow','symphony','twilight','universe','volcano','wonder','xenon','yesterday'],
      animals: ['cat','dog','elephant','giraffe','kangaroo','lion','monkey','penguin','tiger','zebra','dolphin','eagle','butterfly','rhinoceros','hippopotamus','crocodile','octopus','panda','koala','flamingo','cheetah','gorilla','leopard','raccoon','squirrel','tortoise','woodpecker','buffalo','chameleon'],
      countries: ['france','germany','italy','spain','canada','brazil','india','japan','australia','egypt','mexico','china','russia','argentina','sweden','norway','turkey','greece','thailand','vietnam','belgium','finland','hungary','ireland','jamaica','kenya','morocco','nigeria','portugal','singapore'],
      programming: ['javascript','python','html','css','react','angular','vue','node','express','database','algorithm','function','variable','constant','loop','array','object','class','method','interface','framework','library','compiler','debugger','syntax','parameter','argument','callback','promise','async'],
      science: ['physics','chemistry','biology','astronomy','geology','mathematics','experiment','microscope','telescope','molecule','atom','electron','gravity','evolution','theory','research','discovery','laboratory','quantum','relativity','genetics','ecosystem','biodiversity','photosynthesis','respiration','magnetism','velocity'],
      food: ['pizza','burger','pasta','sushi','taco','salad','sandwich','soup','steak','chicken','chocolate','icecream','cookie','cake','bread','cheese','coffee','juice','smoothie','pancake','spaghetti','lasagna','burrito','omelette','waffle','croissant','baguette','cupcake','doughnut','brownie']
    };

    this.difficultySettings = {
      easy: {minLength:4, maxLength:5},
      medium: {minLength:6, maxLength:7},
      hard: {minLength:8, maxLength:9},
      expert: {minLength:10, maxLength:30}
    };

    this.stats = {wins:0, hintsUsed:0, gamesPlayed:0};
    this.hintsRemaining = 3;
    this.playable = false;
  }

  initEvents() {
    window.addEventListener('keydown', e => this.handleKeyPress(e));
    this.playAgainBtn.addEventListener('click', () => this.startNewGame());
    this.hintBtn.addEventListener('click', () => this.useHint());
    this.difficultySelect.addEventListener('change', () => this.startNewGame());
    this.categorySelect.addEventListener('change', () => this.startNewGame());

    this.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.body.setAttribute('data-theme', theme);
        this.themeButtons.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
        this.saveStats();
      });
    });

    // prevent accidental gesture zoom on double-tap mobile (soft)
    document.addEventListener('touchstart', ()=>{}, {passive:true});
  }

  initSounds() {
    this.sounds = {
      correct: this.makeSound(850, 0.09),
      wrong: this.makeSound(320, 0.10),
      win: this.makeSound(1100, 0.25),
      lose: this.makeSound(220, 0.25),
      hint: this.makeSound(600, 0.12)
    };
  }

  makeSound(freq, dur) {
    return () => {
      try {
        if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
      } catch(e){}
    }
  }

  generateKeyboard() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    this.keyboardEl.innerHTML = '';
    letters.split('').forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'key';
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.addEventListener('click', () => this.handleLetterClick(letter), {passive:true});
      btn.addEventListener('touchstart', (ev) => { ev.preventDefault(); this.handleLetterClick(letter); }, {passive:false});
      this.keyboardEl.appendChild(btn);
    });
  }

  handleLetterClick(letter){
    if (!this.playable) return;
    this.processLetter(letter);
  }

  handleKeyPress(e){
    if (!this.playable) return;
    const k = e.key;
    if (k && /^[a-zA-Z]$/.test(k)) this.processLetter(k.toLowerCase());
  }

  startNewGame(){
    this.playable = true;
    this.correctLetters = [];
    this.wrongLetters = [];
    this.previousCorrect = [];
    document.body.classList.remove('winning');
    document.querySelector('.celebration-bg')?.remove();
    document.querySelectorAll('.confetti, .firework').forEach(x=>x.remove());

    const diff = this.difficultySelect.value;
    const cat = this.categorySelect.value;
    this.selectedWord = this.getRandomWord(cat, diff);
    if (!this.selectedWord) this.selectedWord = 'puzzle';
    this.hintsRemaining = (this.hintsRemaining ?? 3);

    this.figureParts.forEach(p => {
      p.style.display = 'none';
      p.classList.remove('animate');
      p.style.animation = '';
    });

    const fc = document.querySelector('.figure-container');
    fc.classList.remove('swing');
    fc.style.animation = '';

    this.updateWrongLettersEl();
    this.resetKeyboard();
    this.hidePopup();

    this.stats.gamesPlayed++;
    this.saveStats();
    this.updateUI();
  }

  getRandomWord(cat, diff){
    const pool = (this.words[cat] || this.words.all);
    const s = this.difficultySettings[diff];
    const filtered = pool.filter(w => w.length >= s.minLength && w.length <= s.maxLength);
    const use = filtered.length ? filtered : pool;
    return use[Math.floor(Math.random()*use.length)];
  }

  displayWord(){
    this.wordEl.innerHTML = this.selectedWord.split('').map(l=>{
      const revealed = this.correctLetters.includes(l);
      const isNew = revealed && !this.previousCorrect?.includes(l);
      return `<span class="letter ${revealed? 'revealed':''} ${isNew? 'pulse-glow':''}">${revealed? l : ''}</span>`;
    }).join('');
    this.previousCorrect = [...this.correctLetters];

    setTimeout(()=> document.querySelectorAll('.pulse-glow').forEach(el=>el.classList.remove('pulse-glow')), 700);

    const inner = this.wordEl.textContent.replace(/\s+/g,'').toLowerCase();
    if (inner === this.selectedWord && this.playable) this.winGame();
  }

  updateWrongLettersEl(){
    this.wrongLettersEl.innerHTML = this.wrongLetters.map(l=>`<span>${l}</span>`).join('');
    const errors = this.wrongLetters.length;
    this.figureParts.forEach((part, idx)=>{
      if (idx < errors){
        if (part.style.display !== 'block'){
          part.style.display = 'block';
          part.classList.add('animate');
          const hang = document.querySelector('.visual');
          hang.classList.add('shake');
          setTimeout(()=> hang.classList.remove('shake'), 420);
        }
      } else {
        part.style.display = 'none';
        part.classList.remove('animate');
      }
    });
    this.wrongCountEl.textContent = errors;
    this.maxWrongEl.textContent = this.figureParts.length;
    if (errors >= this.figureParts.length) this.loseGame();
    this.displayWord();
  }

  processLetter(letter){
    if (this.correctLetters.includes(letter) || this.wrongLetters.includes(letter)){
      this.showNotification('Already tried that letter','⚠️');
      return;
    }

    if (this.selectedWord.includes(letter)){
      this.correctLetters.push(letter);
      this.updateKey(letter, 'correct');
      this.sounds.correct();
      this.displayWord();
      this.updateUI();
    } else {
      this.wrongLetters.push(letter);
      this.updateKey(letter, 'wrong');
      this.sounds.wrong();
      this.updateWrongLettersEl();
      this.updateUI();
    }
  }

  updateKey(letter, state){
    const k = document.querySelector(`.key[data-letter="${letter}"]`);
    if (k) k.classList.add('used', state);
  }

  useHint(){
    if (this.hintsRemaining <= 0){ this.showNotification('No hints left','❌'); return; }
    const unrevealed = this.selectedWord.split('').filter(l => !this.correctLetters.includes(l));
    if (!unrevealed.length) return;
    const pick = unrevealed[Math.floor(Math.random()*unrevealed.length)];
    this.correctLetters.push(pick);
    this.hintsRemaining--;
    this.stats.hintsUsed++;
    this.sounds.hint();
    this.updateKey(pick, 'correct');
    this.displayWord();
    this.showNotification(`Hint: ${pick.toUpperCase()}`, '💡');
    this.saveStats();
    this.updateUI();
  }

  winGame(){
    this.playable = false;
    this.stats.wins++;
    this.triggerWin();
    this.finalMessage.textContent = 'You Won! 🎉';
    this.finalMessageReveal.textContent = `The word was: ${this.selectedWord}`;
    this.popupIcon.textContent = '🏆';
    this.popupWins.textContent = this.stats.wins;
    this.sounds.win();
    setTimeout(()=> this.showPopup(), 700);
    this.saveStats();
    this.updateUI();
  }

  loseGame(){
    this.playable = false;
    const last = this.figureParts[this.figureParts.length-1];
    if (last) last.style.animation = 'hang 1s ease-in-out forwards';
    const fc = document.querySelector('.figure-container');
    fc.classList.add('swing');
    this.finalMessage.textContent = 'Game Over 💀';
    this.finalMessageReveal.textContent = `The word was: ${this.selectedWord}`;
    this.popupIcon.textContent = '💀';
    this.popupWins.textContent = this.stats.wins;
    this.sounds.lose();
    setTimeout(()=> this.showPopup(), 900);
    this.saveStats();
    this.updateUI();
  }

  triggerWin(){
    document.body.classList.add('winning');
    this.createBg();
    this.createConfetti(40);
    this.animateFigureCelebration();
    setTimeout(()=>{ document.body.classList.remove('winning'); document.querySelector('.celebration-bg')?.remove(); }, 3800);
  }

  createBg(){
    const bg = document.createElement('div'); bg.className = 'celebration-bg'; document.body.appendChild(bg); setTimeout(()=>bg.classList.add('active'),80);
  }

  createConfetti(count=40){
    const colors = ['#ff6b6b','#4ecdc4','#ffd700','#9b59b6','#2ecc71'];
    for (let i=0;i<count;i++){
      const c = document.createElement('div'); c.className='confetti';
      c.style.left = `${Math.random()*100}vw`;
      c.style.top = `${-20 - Math.random()*200}px`;
      c.style.background = colors[i % colors.length];
      c.style.transform = `rotate(${Math.random()*360}deg)`;
      c.style.animationDelay = `${Math.random()*0.8}s`;
      document.body.appendChild(c);
      setTimeout(()=>c.remove(), 3000);
    }
  }

  animateFigureCelebration(){
    const fc = document.querySelector('.figure-container');
    fc.style.animation = 'dance 0.6s ease-in-out infinite';
    this.figureParts.forEach((p, idx)=>{
      if (p.style.display === 'block'){
        setTimeout(()=> p.style.animation = `rainbow 1s linear infinite, float 1.2s ease-in-out infinite`, idx*60);
      }
    });
  }

  showNotification(msg, icon='ℹ️'){
    const iconEl = this.notification.querySelector('.notification-icon');
    const txt = this.notification.querySelector('p');
    iconEl.textContent = icon; txt.textContent = msg;
    this.notification.classList.add('show');
    clearTimeout(this._notTimeout);
    this._notTimeout = setTimeout(()=> this.notification.classList.remove('show'), 1500);
  }

  showPopup(){ this.popup.style.display = 'flex'; this.popup.setAttribute('aria-hidden','false'); }
  hidePopup(){ this.popup.style.display = 'none'; this.popup.setAttribute('aria-hidden','true'); }

  resetKeyboard(){ document.querySelectorAll('.key').forEach(k=>k.classList.remove('used','correct','wrong')) }

  updateUI(){
    this.winsCount.textContent = this.stats.wins;
    this.hintsRemainingEl.textContent = `Hints: ${this.hintsRemaining}`;
    this.wrongCountEl.textContent = this.wrongLetters.length;
    this.maxWrongEl.textContent = this.figureParts.length;
    this.displayWord();
  }

  saveStats(){
    const toSave = {...this.stats, hintsRemaining: this.hintsRemaining, theme: document.body.getAttribute('data-theme'), difficulty: this.difficultySelect.value, category: this.categorySelect.value};
    localStorage.setItem('hangmanStats', JSON.stringify(toSave));
  }

  loadStats(){
    const s = localStorage.getItem('hangmanStats');
    if (!s) return;
    try{
      const parsed = JSON.parse(s);
      this.stats = {...this.stats, ...parsed};
      if (typeof parsed.hintsRemaining !== 'undefined') this.hintsRemaining = parsed.hintsRemaining;
      if (parsed.theme){ document.body.setAttribute('data-theme', parsed.theme); this.themeButtons.forEach(b=> b.classList.toggle('active', b.dataset.theme === parsed.theme)); }
      if (parsed.difficulty) this.difficultySelect.value = parsed.difficulty;
      if (parsed.category) this.categorySelect.value = parsed.category;
    }catch(e){}
  }
}

document.addEventListener('DOMContentLoaded', ()=> new HangmanGame());
