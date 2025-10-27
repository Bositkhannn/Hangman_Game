class HangmanGame {
    constructor() {
        this.initializeElements();
        this.initializeData();
        this.loadStats();
        this.generateKeyboard();
        this.initializeEventListeners();
        this.initializeSounds();
        this.startNewGame();
    }

    initializeElements() {
        this.wordEl = document.getElementById('word');
        this.wrongLettersEl = document.getElementById('wrong-letters');
        this.playAgainBtn = document.getElementById('play-button');
        this.popup = document.getElementById('popup-container');
        this.notification = document.getElementById('notification-container');
        this.finalMessage = document.getElementById('final-message');
        this.finalMessageRevealWord = document.getElementById('final-message-reveal-word');
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

    initializeData() {
        this.words = {
            all: [
                'apple','brain','chair','dance','earth','flower','garden','happy','island','jigsaw',
                'kitten','lemon','mountain','notebook','ocean','puzzle','quiet','river','sunset','travel',
                'umbrella','victory','window','xylophone','yellow','zebra','butterfly','chocolate','diamond','elephant',
                'fantasy','guitar','harmony','illusion','journey','kingdom','library','melody','nostalgia','orchestra',
                'paradise','quantum','rainbow','symphony','twilight','universe','volcano','wonder','xenon','yesterday'
            ],
            animals: [
                'cat','dog','elephant','giraffe','kangaroo','lion','monkey','penguin','tiger','zebra',
                'dolphin','eagle','butterfly','rhinoceros','hippopotamus','crocodile','octopus','panda','koala','flamingo',
                'cheetah','gorilla','leopard','raccoon','squirrel','tortoise','woodpecker','buffalo','chameleon'
            ],
            countries: [
                'france','germany','italy','spain','canada','brazil','india','japan','australia','egypt',
                'mexico','china','russia','argentina','sweden','norway','turkey','greece','thailand','vietnam',
                'belgium','finland','hungary','ireland','jamaica','kenya','morocco','nigeria','portugal','singapore'
            ],
            programming: [
                'javascript','python','html','css','react','angular','vue','node','express','database',
                'algorithm','function','variable','constant','loop','array','object','class','method','interface',
                'framework','library','compiler','debugger','syntax','parameter','argument','callback','promise','async'
            ],
            science: [
                'physics','chemistry','biology','astronomy','geology','mathematics','experiment','microscope',
                'telescope','molecule','atom','electron','gravity','evolution','theory','research','discovery','laboratory',
                'quantum','relativity','genetics','ecosystem','biodiversity','photosynthesis','respiration','magnetism','velocity'
            ],
            food: [
                'pizza','burger','pasta','sushi','taco','salad','sandwich','soup','steak','chicken',
                'chocolate','icecream','cookie','cake','bread','cheese','coffee','juice','smoothie','pancake',
                'spaghetti','lasagna','burrito','omelette','waffle','croissant','baguette','cupcake','doughnut','brownie'
            ]
        };

        this.difficultySettings = {
            easy: { minLength: 4, maxLength: 5 },
            medium: { minLength: 6, maxLength: 7 },
            hard: { minLength: 8, maxLength: 9 },
            expert: { minLength: 10, maxLength: 30 }
        };

        this.stats = {
            wins: 0,
            hintsUsed: 0,
            gamesPlayed: 0
        };

        this.hintsRemaining = 3;
    }

    initializeEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.hintBtn.addEventListener('click', () => this.useHint());
        this.difficultySelect.addEventListener('change', () => this.startNewGame());
        this.categorySelect.addEventListener('change', () => this.startNewGame());

        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                document.body.setAttribute('data-theme', theme);
                this.themeButtons.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
                this.saveStats();
            });
        });
    }

    initializeSounds() {
        this.sounds = {
            correct: this.createSound(900, 0.12),
            wrong: this.createSound(300, 0.12),
            win: this.createSound(1000, 0.25),
            lose: this.createSound(220, 0.25),
            hint: this.createSound(600, 0.14)
        };
    }

    createSound(frequency, duration) {
        return () => {
            try {
                if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const ctx = this._audioCtx;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch (e) {
                // audio not supported
            }
        };
    }

    generateKeyboard() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        this.keyboardEl.innerHTML = '';
        letters.split('').forEach(letter => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.dataset.letter = letter;
            key.addEventListener('click', () => this.handleLetterClick(letter));
            this.keyboardEl.appendChild(key);
        });
    }

    handleLetterClick(letter) {
        if (!this.playable) return;
        this.processLetter(letter);
    }

    handleKeyPress(e) {
        if (!this.playable) return;
        const k = e.key;
        if (k && /^[a-zA-Z]$/.test(k)) {
            this.processLetter(k.toLowerCase());
        }
    }

    startNewGame() {
        this.playable = true;
        this.correctLetters = [];
        this.wrongLetters = [];
        this.previousCorrectLetters = [];
        document.body.classList.remove('winning');
        document.querySelector('.celebration-bg')?.remove();
        document.querySelectorAll('.confetti, .firework').forEach(el => el.remove());

        const difficulty = this.difficultySelect.value;
        const category = this.categorySelect.value;
        this.currentDifficulty = difficulty;

        this.selectedWord = this.getRandomWord(category, difficulty);
        this.hintsRemaining = this.hintsRemaining ?? 3;

        this.figureParts.forEach(part => {
            part.style.display = 'none';
            part.classList.remove('animate');
            part.style.animation = '';
        });
        const figureContainer = document.querySelector('.figure-container');
        figureContainer.classList.remove('swing');
        figureContainer.style.animation = '';

        this.updateWrongLettersEl();
        this.resetKeyboard();
        this.hidePopup();

        this.stats.gamesPlayed++;
        this.saveStats();
        this.updateUIStatus();
    }

    getRandomWord(category, difficulty) {
        let wordPool = this.words[category] || this.words.all;
        const settings = this.difficultySettings[difficulty];
        const filtered = wordPool.filter(w => w.length >= settings.minLength && w.length <= settings.maxLength);
        const pool = (filtered.length ? filtered : wordPool);
        return pool[Math.floor(Math.random() * pool.length)];
    }

    displayWord() {
        this.wordEl.innerHTML = this.selectedWord
            .split('')
            .map(letter => {
                const revealed = this.correctLetters.includes(letter);
                const isNew = revealed && !this.previousCorrectLetters?.includes(letter);
                return `<span class="letter ${revealed ? 'revealed' : ''} ${isNew ? 'pulse-glow' : ''}">${revealed ? letter : ''}</span>`;
            })
            .join('');
        this.previousCorrectLetters = [...this.correctLetters];

        setTimeout(() => {
            document.querySelectorAll('.pulse-glow').forEach(el => el.classList.remove('pulse-glow'));
        }, 900);

        const innerWord = this.wordEl.textContent.replace(/\s+/g, '').toLowerCase();
        if (innerWord === this.selectedWord && this.playable) this.winGame();
    }

    updateWrongLettersEl() {
        this.wrongLettersEl.innerHTML = this.wrongLetters.map(l => `<span>${l}</span>`).join('');
        const errors = this.wrongLetters.length;
        this.figureParts.forEach((part, index) => {
            if (index < errors) {
                if (part.style.display !== 'block') {
                    part.style.display = 'block';
                    part.classList.add('animate');
                    const hangman = document.querySelector('.hangman-container');
                    hangman.classList.add('shake');
                    setTimeout(() => hangman.classList.remove('shake'), 450);
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

    processLetter(letter) {
        if (this.correctLetters.includes(letter) || this.wrongLetters.includes(letter)) {
            this.showNotification('You already tried this letter!', '⚠️');
            return;
        }

        if (this.selectedWord.includes(letter)) {
            this.correctLetters.push(letter);
            this.updateKeyState(letter, 'correct');
            this.sounds.correct();
            this.displayWord(); // <<< здесь — обновление DOM сразу после правильной буквы
            this.updateUIStatus();
        } else {
            this.wrongLetters.push(letter);
            this.updateKeyState(letter, 'wrong');
            this.sounds.wrong();
            this.updateWrongLettersEl();
            this.updateUIStatus();
        }
    }

    updateKeyState(letter, state) {
        const key = document.querySelector(`.key[data-letter="${letter}"]`);
        if (key) key.classList.add('used', state);
    }

    useHint() {
        if (this.hintsRemaining <= 0) {
            this.showNotification('No hints left!', '❌');
            return;
        }

        const unrevealed = this.selectedWord.split('').filter(l => !this.correctLetters.includes(l));
        if (!unrevealed.length) return;
        const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        this.correctLetters.push(pick);
        this.hintsRemaining--;
        this.stats.hintsUsed++;
        this.sounds.hint();
        this.updateKeyState(pick, 'correct');
        this.displayWord();
        this.showNotification(`Hint: ${pick.toUpperCase()}`, '💡');
        this.saveStats();
        this.updateUIStatus();
    }

    winGame() {
        this.playable = false;
        this.stats.wins++;
        this.triggerWinningAnimations();
        this.finalMessage.textContent = 'Congratulations! You Won! 🎉';
        this.finalMessageRevealWord.textContent = `The word was: ${this.selectedWord}`;
        this.popupIcon.textContent = '🏆';
        this.popupWins.textContent = this.stats.wins;
        this.sounds.win();
        setTimeout(() => this.showPopup(), 800);
        this.saveStats();
        this.updateUIStatus();
    }

    loseGame() {
        this.playable = false;
        const lastPart = this.figureParts[this.figureParts.length - 1];
        if (lastPart) lastPart.style.animation = 'hang 1s ease-in-out forwards';
        const figureContainer = document.querySelector('.figure-container');
        figureContainer.classList.add('swing');
        this.finalMessage.textContent = 'Game Over! Better luck next time! 💀';
        this.finalMessageRevealWord.textContent = `The word was: ${this.selectedWord}`;
        this.popupIcon.textContent = '💀';
        this.popupWins.textContent = this.stats.wins;
        this.sounds.lose();
        setTimeout(() => this.showPopup(), 900);
        this.saveStats();
        this.updateUIStatus();
    }

    triggerWinningAnimations() {
        document.body.classList.add('winning');
        this.createCelebrationBackground();
        this.createConfetti();
        this.animateHangmanCelebration();
        setTimeout(() => {
            document.body.classList.remove('winning');
            document.querySelector('.celebration-bg')?.remove();
        }, 4200);
    }

    createCelebrationBackground() {
        const bg = document.createElement('div');
        bg.className = 'celebration-bg';
        document.body.appendChild(bg);
        setTimeout(() => bg.classList.add('active'), 80);
    }

    createConfetti() {
        const confettiCount = 60;
        for (let i = 0; i < confettiCount; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = `${Math.random() * 100}vw`;
            c.style.background = ['#ff6b6b','#4ecdc4','#ffd700','#9b59b6','#2ecc71'][i % 5];
            c.style.top = `${-20 - Math.random()*200}px`;
            c.style.transform = `rotate(${Math.random()*360}deg)`;
            c.style.animationDelay = `${Math.random()*0.8}s`;
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 3000);
        }
    }

    animateHangmanCelebration() {
        const figureContainer = document.querySelector('.figure-container');
        figureContainer.style.animation = 'dance 0.6s ease-in-out infinite';
        this.figureParts.forEach((part, idx) => {
            if (part.style.display === 'block') {
                setTimeout(() => {
                    part.style.animation = `rainbow 1s linear infinite, float 1.2s ease-in-out infinite`;
                }, idx * 80);
            }
        });
    }

    showNotification(message, icon = 'ℹ️') {
        const notificationIcon = this.notification.querySelector('.notification-icon');
        const notificationMessage = this.notification.querySelector('p');
        notificationIcon.textContent = icon;
        notificationMessage.textContent = message;
        this.notification.classList.add('show');
        setTimeout(() => this.notification.classList.remove('show'), 1800);
    }

    showPopup() { this.popup.style.display = 'flex'; }
    hidePopup() { this.popup.style.display = 'none'; }

    resetKeyboard() {
        document.querySelectorAll('.key').forEach(k => k.classList.remove('used', 'correct', 'wrong'));
    }

    updateUIStatus() {
        this.winsCount.textContent = this.stats.wins;
        this.hintsRemainingEl.textContent = `Hints: ${this.hintsRemaining}`;
        this.wrongCountEl.textContent = this.wrongLetters.length;
        this.maxWrongEl.textContent = this.figureParts.length;
    }

    saveStats() {
        const statsToSave = {
            ...this.stats,
            hintsRemaining: this.hintsRemaining,
            theme: document.body.getAttribute('data-theme'),
            difficulty: this.difficultySelect.value,
            category: this.categorySelect.value
        };
        localStorage.setItem('hangmanStats', JSON.stringify(statsToSave));
    }

    loadStats() {
        const saved = localStorage.getItem('hangmanStats');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.stats = { ...this.stats, ...parsed };
                if (typeof parsed.hintsRemaining !== 'undefined') this.hintsRemaining = parsed.hintsRemaining;
                if (parsed.theme) {
                    document.body.setAttribute('data-theme', parsed.theme);
                    this.themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === parsed.theme));
                }
                if (parsed.difficulty) this.difficultySelect.value = parsed.difficulty;
                if (parsed.category) this.categorySelect.value = parsed.category;
            } catch (e) {
                // ignore parse errors
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new HangmanGame());
