const RECORDS_KEY = "pixelArcadeRecords";
const SOUND_PREFERENCE_KEY = "pixelArcadeSoundEnabled";
const RECORDS_VERSION = 3;
const DIFFICULTIES = {
  easy: { label: "Easy", maxNumber: 20, maxTries: 4, pointValue: 1 },
  normal: { label: "Normal", maxNumber: 30, maxTries: 3, pointValue: 2 },
  hard: { label: "Hard", maxNumber: 60, maxTries: 3, pointValue: 5 },
};

function createEmptyRecords() {
  return Object.fromEntries(
    Object.keys(DIFFICULTIES).map((difficulty) => [
      difficulty,
      { bestScore: null, winStreak: 0 },
    ]),
  );
}

const ui = {
  cabinet: document.querySelector(".cabinet"),
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  start: document.querySelector(".start"),
  difficultyTrigger: document.getElementById("difficulty-trigger"),
  difficultyValue: document.getElementById("difficulty-value"),
  difficultyMenu: document.getElementById("difficulty-menu"),
  difficultyOptions: [...document.querySelectorAll("#difficulty-menu .difficulty-picker__option")],
  startIntro: document.getElementById("start-intro"),
  specRange: document.getElementById("spec-range"),
  specTries: document.getElementById("spec-tries"),
  gamePrompt: document.getElementById("game-prompt"),
  form: document.querySelector(".guess-form"),
  input: document.querySelector(".input"),
  submit: document.querySelector(".submit"),
  restart: document.querySelector(".restart"),
  value: document.querySelector(".value"),
  hearts: document.getElementById("lives-icons"),
  attemptsLabel: document.getElementById("attempts-label"),
  possibleRange: document.getElementById("possible-range"),
  rangeWindow: document.querySelector(".possible-range__window"),
  guessHistory: document.getElementById("guess-history"),
  result: document.getElementById("result-panel"),
  resultDifficultyTrigger: document.getElementById("result-difficulty-trigger"),
  resultDifficultyValue: document.getElementById("result-difficulty-value"),
  resultDifficultyMenu: document.getElementById("result-difficulty-menu"),
  resultDifficultyOptions: [...document.querySelectorAll("#result-difficulty-menu .difficulty-picker__option")],
  resultTitle: document.getElementById("result-title"),
  resultMode: document.getElementById("result-mode"),
  resultNumber: document.getElementById("result-number"),
  resultMessage: document.getElementById("result-message"),
  resultConfetti: document.getElementById("result-confetti"),
  bestScore: document.getElementById("best-score"),
  winStreak: document.getElementById("win-streak"),
  recordsStatus: document.getElementById("records-status"),
  soundToggle: document.getElementById("sound-toggle"),
  soundToggleLabel: document.getElementById("sound-toggle-label"),
  soundStatus: document.getElementById("sound-status"),
};

const state = {
  difficulty: "normal",
  nextDifficulty: "normal",
  select: 0,
  attemptsLeft: DIFFICULTIES.normal.maxTries,
  isGameOver: false,
  lowestPossible: 1,
  highestPossible: DIFFICULTIES.normal.maxNumber,
  guesses: [],
  records: createEmptyRecords(),
  soundEnabled: false,
  audioContext: null,
};

function getDifficulty() {
  return DIFFICULTIES[state.difficulty];
}

function getCurrentRecords() {
  return state.records[state.difficulty];
}

function maxModeScore(difficulty) {
  return difficulty.maxTries * difficulty.pointValue;
}

function scoreRound() {
  const difficulty = getDifficulty();
  const triesUsed = state.guesses.length;
  return (difficulty.maxTries + 1 - triesUsed) * difficulty.pointValue;
}

function getRandomNumber() {
  return Math.floor(Math.random() * getDifficulty().maxNumber) + 1;
}

function setStatus(message, status = "default", { direction = null, tone = null } = {}) {
  ui.value.textContent = message;
  ui.value.dataset.state = status;

  if (direction) {
    ui.value.dataset.direction = direction;
  } else {
    delete ui.value.dataset.direction;
  }

  if (tone) {
    ui.value.dataset.tone = tone;
  } else {
    delete ui.value.dataset.tone;
  }
}

function renderLives() {
  const { maxTries } = getDifficulty();
  if (ui.hearts.childElementCount !== maxTries) {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < maxTries; index += 1) {
      const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      heart.classList.add("life-icon");
      heart.setAttribute("viewBox", "0 0 24 24");
      heart.setAttribute("focusable", "false");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z");
      heart.append(path);
      fragment.append(heart);
    }
    ui.hearts.replaceChildren(fragment);
  }

  ui.hearts.querySelectorAll(".life-icon").forEach((heart, index) => {
    const isActive = index < state.attemptsLeft;
    heart.classList.toggle("is-active", isActive);
    heart.classList.toggle("is-lost", !isActive);
  });
  ui.attemptsLabel.textContent = `${state.attemptsLeft} ${state.attemptsLeft === 1 ? "try" : "tries"} remaining`;
}

function renderRoundInfo() {
  const maxNumber = getDifficulty().maxNumber;
  const windowStart = ((state.lowestPossible - 1) / maxNumber) * 100;
  const windowSize = ((state.highestPossible - state.lowestPossible + 1) / maxNumber) * 100;

  ui.possibleRange.textContent = `${state.lowestPossible}-${state.highestPossible}`;
  ui.rangeWindow.style.left = `${windowStart}%`;
  ui.rangeWindow.style.width = `${windowSize}%`;
  ui.guessHistory.replaceChildren();

  if (state.guesses.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "guess-history__empty";
    emptyMessage.textContent = "No guesses yet";
    ui.guessHistory.append(emptyMessage);
    return;
  }

  state.guesses.forEach(({ number, result }) => {
    const item = document.createElement("li");
    item.className = `guess-history__item guess-history__item--${result}`;
    item.textContent = `${number} · ${result}`;
    ui.guessHistory.append(item);
  });
}

function renderRecords() {
  const records = getCurrentRecords();
  ui.bestScore.textContent = records.bestScore === null ? "—" : String(records.bestScore);
  ui.winStreak.textContent = String(records.winStreak);
}

function updateDifficultyPreview() {
  const difficulty = getDifficulty();
  const upperBound = String(difficulty.maxNumber).padStart(2, "0");
  ui.startIntro.textContent = "Find the hidden number.";
  ui.specRange.textContent = `01–${upperBound}`;
  ui.specTries.textContent = String(difficulty.maxTries).padStart(2, "0");
  ui.gamePrompt.textContent = `${difficulty.label} mode · Pick a number from 1 to ${difficulty.maxNumber}.`;
  ui.input.min = "1";
  ui.input.max = String(difficulty.maxNumber);
  setStatus(`Enter a whole number from 1 to ${difficulty.maxNumber}.`);
}

function updateDifficultyPicker(valueElement, options, difficulty) {
  valueElement.textContent = DIFFICULTIES[difficulty].label;
  options.forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.difficulty === difficulty));
  });
}

function bindDifficultyPicker({ trigger, menu, options, valueElement, getValue, onSelect }) {
  const close = (returnFocus = false) => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) {
      trigger.focus();
    }
  };
  const focusOption = (index) => {
    const wrappedIndex = (index + options.length) % options.length;
    options[wrappedIndex].focus();
  };
  const open = () => {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    menu.dataset.placement = "bottom";
    if (trigger.closest(".difficulty-picker--home")) {
      const bounds = menu.getBoundingClientRect();
      if (bounds.bottom > window.innerHeight - 8) {
        menu.dataset.placement = "top";
      }
    }
    options.find((option) => option.dataset.difficulty === getValue())?.focus();
  };
  const choose = (option) => {
    const difficulty = option.dataset.difficulty;
    if (!Object.hasOwn(DIFFICULTIES, difficulty)) {
      throw new Error(`Unknown difficulty option: ${difficulty}`);
    }
    onSelect(difficulty);
    updateDifficultyPicker(valueElement, options, difficulty);
    close(true);
  };

  trigger.addEventListener("click", () => {
    if (menu.hidden) {
      open();
    } else {
      close();
    }
  });

  trigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".difficulty-picker__option");
    if (option) {
      choose(option);
    }
  });

  menu.addEventListener("keydown", (event) => {
    const focusedIndex = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(focusedIndex + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusOption(event.key === "Home" ? 0 : options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[focusedIndex];
      if (option) {
        choose(option);
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !trigger.closest(".difficulty-picker").contains(event.target)) {
      close();
    }
  });

  return close;
}

function updateSoundToggle() {
  ui.soundToggleLabel.textContent = state.soundEnabled ? "Sound on" : "Sound off";
  ui.soundToggle.setAttribute("aria-checked", String(state.soundEnabled));
}

function loadSoundPreference() {
  try {
    const preference = window.localStorage.getItem(SOUND_PREFERENCE_KEY);
    state.soundEnabled = preference === "true";
  } catch {
    showRecordsWarning();
  }
}

function saveSoundPreference() {
  try {
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(state.soundEnabled));
  } catch {
    showRecordsWarning();
  }
}

async function toggleSound() {
  if (!state.soundEnabled) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      ui.soundStatus.textContent = "Sound effects are not supported in this browser.";
      return;
    }

    try {
      state.audioContext ??= new AudioContextConstructor();
      await state.audioContext.resume();
      if (state.audioContext.state !== "running") {
        throw new Error("The audio context did not start.");
      }

      state.soundEnabled = true;
      ui.soundStatus.textContent = "Sound effects enabled. You should hear a test tone.";
    } catch (error) {
      state.soundEnabled = false;
      ui.soundStatus.textContent = "Could not enable sound effects. Try again or keep playing without sound.";
      console.error("Could not enable sound effects.", error);
    }
  } else {
    state.soundEnabled = false;
    ui.soundStatus.textContent = "Sound effects muted.";
  }

  updateSoundToggle();
  saveSoundPreference();

  if (state.soundEnabled) {
    playSoundCue("toggle");
  }
}

function playTone(frequency, startTime, duration, volume = 0.12) {
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function scheduleSoundCue(cue) {
  const now = state.audioContext.currentTime;
  const cues = {
    low: [[330, 0, 0.18]],
    high: [[220, 0, 0.18]],
    win: [[523, 0, 0.16], [659, 0.16, 0.16], [784, 0.32, 0.26]],
    loss: [[330, 0, 0.2], [247, 0.2, 0.28]],
    toggle: [[659, 0, 0.14], [880, 0.15, 0.2]],
  };

  cues[cue].forEach(([frequency, offset, duration]) => {
    playTone(frequency, now + offset, duration);
  });
}

function playSoundCue(cue) {
  if (!state.soundEnabled) {
    return;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    state.soundEnabled = false;
    updateSoundToggle();
    saveSoundPreference();
    ui.soundStatus.textContent = "Sound effects are not supported in this browser.";
    return;
  }

  try {
    state.audioContext ??= new AudioContextConstructor();
    if (state.audioContext.state === "running") {
      scheduleSoundCue(cue);
      return;
    }

    state.audioContext.resume().then(() => {
      if (state.soundEnabled && state.audioContext?.state === "running") {
        scheduleSoundCue(cue);
      }
    }).catch((error) => {
      state.soundEnabled = false;
      updateSoundToggle();
      saveSoundPreference();
      ui.soundStatus.textContent = "Sound stopped. Turn sound on again to retry.";
      console.error("Could not resume sound effects.", error);
    });
  } catch (error) {
    state.soundEnabled = false;
    updateSoundToggle();
    saveSoundPreference();
    ui.soundStatus.textContent = "Sound stopped. Turn sound on again to retry.";
    console.error("Could not start sound effects.", error);
  }
}

function showRecordsWarning() {
  ui.recordsStatus.textContent = "Personal records and sound preference may not be saved in this browser.";
  ui.recordsStatus.hidden = false;
  ui.soundStatus.textContent = "Browser storage is unavailable. Personal records and sound preference may not be saved.";
}

function sanitizeModeRecord(saved, difficulty) {
  const bestScore = Number.isInteger(saved?.bestScore) && saved.bestScore >= 1
    ? Math.min(saved.bestScore, maxModeScore(difficulty))
    : null;
  const winStreak = Number.isInteger(saved?.winStreak) && saved.winStreak > 0
    ? saved.winStreak
    : 0;

  return { bestScore, winStreak };
}

function loadRecords() {
  try {
    const savedRecords = window.localStorage.getItem(RECORDS_KEY);
    if (savedRecords === null) {
      return;
    }

    const parsed = JSON.parse(savedRecords);
    const savedModes = parsed !== null && typeof parsed === "object"
      ? parsed.modes !== null && typeof parsed.modes === "object"
        ? parsed.modes
        : "winStreak" in parsed
          ? { normal: parsed }
          : null
      : null;

    if (savedModes === null) {
      throw new Error("Saved records have an invalid format.");
    }

    let changed = parsed.version !== RECORDS_VERSION;
    const migrated = createEmptyRecords();

    Object.keys(DIFFICULTIES).forEach((difficulty) => {
      const sanitized = sanitizeModeRecord(savedModes[difficulty], DIFFICULTIES[difficulty]);
      const previous = savedModes[difficulty];
      if (previous?.bestScore !== sanitized.bestScore || previous?.winStreak !== sanitized.winStreak) {
        changed = true;
      }
      migrated[difficulty] = sanitized;
    });

    state.records = migrated;
    if (changed) {
      saveRecords();
    }
  } catch {
    showRecordsWarning();
  }
}

function saveRecords() {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({
      version: RECORDS_VERSION,
      modes: state.records,
    }));
    ui.recordsStatus.hidden = true;
  } catch {
    showRecordsWarning();
  }
}

function showResult(won) {
  const difficulty = getDifficulty();
  const triesUsed = state.guesses.length;
  const score = scoreRound();
  const outcome = won ? "win" : "loss";
  const colors = ["#19a968", "#a9e8c7", "#f7c96d"];

  ui.result.dataset.outcome = outcome;
  ui.gameScreen.dataset.outcome = outcome;
  state.nextDifficulty = state.difficulty;
  updateDifficultyPicker(ui.resultDifficultyValue, ui.resultDifficultyOptions, state.nextDifficulty);
  ui.resultTitle.textContent = won ? "Round Complete" : "Round over";
  ui.resultMode.textContent = `${difficulty.label} mode`;

  const numberLabel = document.createElement("span");
  numberLabel.className = "result-panel__number-label";
  numberLabel.textContent = "The number was ";
  const numberValue = document.createElement("strong");
  numberValue.className = "result-panel__number-value";
  numberValue.textContent = String(state.select);
  ui.resultNumber.replaceChildren(numberLabel, numberValue);
  ui.resultMessage.textContent = won
    ? `You found it in ${triesUsed} ${triesUsed === 1 ? "try" : "tries"} and scored ${score} ${score === 1 ? "point" : "points"}.`
    : "Better luck next round.";
  ui.resultConfetti.replaceChildren();
  ui.resultConfetti.hidden = !won;

  if (won) {
    for (let index = 0; index < 32; index += 1) {
      const piece = document.createElement("span");
      piece.className = "result-confetti__piece";
      piece.style.setProperty("--piece-x", `${Math.random() * 100}%`);
      piece.style.setProperty("--piece-drift", `${Math.round(Math.random() * 180 - 90)}px`);
      piece.style.setProperty("--piece-delay", `${Math.random() * 0.55}s`);
      piece.style.setProperty("--piece-rotation", `${Math.round(Math.random() * 720 - 360)}deg`);
      piece.style.setProperty("--piece-color", colors[index % colors.length]);
      ui.resultConfetti.append(piece);
    }
  }
}

function resetGame() {
  const difficulty = getDifficulty();
  if (ui.result.open) {
    ui.result.close();
  }

  state.select = getRandomNumber();
  state.attemptsLeft = difficulty.maxTries;
  state.isGameOver = false;
  state.lowestPossible = 1;
  state.highestPossible = difficulty.maxNumber;
  state.guesses = [];

  ui.input.value = "";
  ui.input.disabled = false;
  ui.input.removeAttribute("aria-invalid");
  ui.submit.disabled = false;
  ui.submit.hidden = false;
  ui.form.hidden = false;
  ui.result.removeAttribute("data-outcome");
  ui.gameScreen.removeAttribute("data-outcome");
  ui.resultConfetti.replaceChildren();
  setStatus(`Enter a whole number from 1 to ${difficulty.maxNumber}.`);
  renderLives();
  renderRoundInfo();
}

function endGame(won) {
  state.isGameOver = true;
  const records = getCurrentRecords();
  if (won) {
    const score = scoreRound();
    records.winStreak += 1;
    if (records.bestScore === null || score > records.bestScore) {
      records.bestScore = score;
    }
  } else {
    records.winStreak = 0;
  }
  renderRecords();
  saveRecords();

  ui.input.disabled = true;
  ui.submit.disabled = true;
  ui.submit.hidden = true;
  ui.form.hidden = true;
  showResult(won);
  ui.result.showModal();
  playSoundCue(won ? "win" : "loss");

  if (won) {
    setStatus("You got it! Nice work.", "success");
    return;
  }

  ui.attemptsLabel.textContent = "No tries remaining";
  setStatus(`Out of tries. The number was ${state.select}.`, "error");
}

function focusGame() {
  ui.input.focus();
}

function startGame() {
  ui.cabinet.dataset.screen = "game";
  updateDifficultyPreview();
  resetGame();
  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  focusGame();
}

ui.start.addEventListener("click", startGame);
ui.soundToggle.addEventListener("click", toggleSound);
loadSoundPreference();
updateSoundToggle();

bindDifficultyPicker({
  trigger: ui.difficultyTrigger,
  menu: ui.difficultyMenu,
  options: ui.difficultyOptions,
  valueElement: ui.difficultyValue,
  getValue: () => state.difficulty,
  onSelect: (difficulty) => {
    state.difficulty = difficulty;
    updateDifficultyPreview();
    renderRecords();
  },
});

const closeResultDifficultyMenu = bindDifficultyPicker({
  trigger: ui.resultDifficultyTrigger,
  menu: ui.resultDifficultyMenu,
  options: ui.resultDifficultyOptions,
  valueElement: ui.resultDifficultyValue,
  getValue: () => state.nextDifficulty,
  onSelect: (difficulty) => {
    state.nextDifficulty = difficulty;
  },
});

ui.result.addEventListener("cancel", (event) => {
  event.preventDefault();
});

loadRecords();
updateDifficultyPreview();
renderLives();
renderRecords();

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.isGameOver) {
    return;
  }

  const rawGuess = ui.input.value.trim();
  const guess = Number(rawGuess);

  if (rawGuess === "" || !Number.isInteger(guess) || guess < 1 || guess > getDifficulty().maxNumber) {
    ui.input.setAttribute("aria-invalid", "true");
    setStatus(`Enter a whole number from 1 to ${getDifficulty().maxNumber}.`, "error");
    ui.input.focus();
    return;
  }

  ui.input.removeAttribute("aria-invalid");

  if (state.guesses.some(({ number }) => number === guess)) {
    ui.input.setAttribute("aria-invalid", "true");
    setStatus(`You already guessed ${guess}. Try a new number; no try was used.`, "error");
    ui.input.focus();
    return;
  }

  if (guess === state.select) {
    state.guesses.push({ number: guess, result: "correct" });
    renderRoundInfo();
    endGame(true);
    return;
  }

  const result = guess < state.select ? "low" : "high";
  state.guesses.push({ number: guess, result });
  if (result === "low") {
    state.lowestPossible = Math.max(state.lowestPossible, guess + 1);
  } else {
    state.highestPossible = Math.min(state.highestPossible, guess - 1);
  }

  state.attemptsLeft -= 1;
  renderLives();
  renderRoundInfo();

  if (state.attemptsLeft === 0) {
    endGame(false);
    return;
  }

  playSoundCue(result);
  const clue = result === "low" ? `Higher than ${guess}` : `Lower than ${guess}`;
  setStatus(clue, "clue", {
    direction: result === "low" ? "up" : "down",
    tone: state.attemptsLeft === 1 ? "urgent" : null,
  });
});

ui.restart.addEventListener("click", () => {
  closeResultDifficultyMenu();
  state.difficulty = state.nextDifficulty;
  startGame();
});
