const RECORDS_KEY = "pixelArcadeRecords";
const SOUND_PREFERENCE_KEY = "pixelArcadeSoundEnabled";
const DIFFICULTIES = {
  easy: { label: "Easy", maxNumber: 10, maxTries: 5 },
  normal: { label: "Normal", maxNumber: 20, maxTries: 3 },
  hard: { label: "Hard", maxNumber: 50, maxTries: 3 },
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
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  start: document.querySelector(".start"),
  difficulty: document.getElementById("difficulty-select"),
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
  guessHistory: document.getElementById("guess-history"),
  result: document.getElementById("result-panel"),
  resultDifficultyTrigger: document.getElementById("result-difficulty-trigger"),
  resultDifficultyValue: document.getElementById("result-difficulty-value"),
  resultDifficultyMenu: document.getElementById("result-difficulty-menu"),
  resultDifficultyOptions: [...document.querySelectorAll(".result-difficulty__option")],
  resultTitle: document.getElementById("result-title"),
  resultMode: document.getElementById("result-mode"),
  resultNumber: document.getElementById("result-number"),
  resultMessage: document.getElementById("result-message"),
  resultConfetti: document.getElementById("result-confetti"),
  bestScore: document.getElementById("best-score"),
  winStreak: document.getElementById("win-streak"),
  recordsStatus: document.getElementById("records-status"),
  soundToggle: document.getElementById("sound-toggle"),
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

function getRandomNumber() {
  return Math.floor(Math.random() * getDifficulty().maxNumber) + 1;
}

function setStatus(message, status = "default") {
  ui.value.textContent = message;
  ui.value.dataset.state = status;
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
  ui.possibleRange.textContent = `${state.lowestPossible}—${state.highestPossible}`;
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

function updateResultDifficulty() {
  ui.resultDifficultyValue.textContent = DIFFICULTIES[state.nextDifficulty].label;
  ui.resultDifficultyOptions.forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.difficulty === state.nextDifficulty));
  });
}

function closeResultDifficultyMenu(returnFocus = false) {
  ui.resultDifficultyMenu.hidden = true;
  ui.resultDifficultyTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) {
    ui.resultDifficultyTrigger.focus();
  }
}

function openResultDifficultyMenu() {
  ui.resultDifficultyMenu.hidden = false;
  ui.resultDifficultyTrigger.setAttribute("aria-expanded", "true");
  const selectedOption = ui.resultDifficultyOptions.find(
    (option) => option.dataset.difficulty === state.nextDifficulty,
  );
  selectedOption?.focus();
}

function focusResultDifficultyOption(index) {
  const wrappedIndex = (index + ui.resultDifficultyOptions.length) % ui.resultDifficultyOptions.length;
  ui.resultDifficultyOptions[wrappedIndex].focus();
}

function chooseResultDifficulty(option) {
  const difficulty = option.dataset.difficulty;
  if (!Object.hasOwn(DIFFICULTIES, difficulty)) {
    throw new Error(`Unknown difficulty option: ${difficulty}`);
  }
  state.nextDifficulty = difficulty;
  updateResultDifficulty();
  closeResultDifficultyMenu(true);
}

function updateSoundToggle() {
  ui.soundToggle.textContent = state.soundEnabled ? "Sound on" : "Sound off";
  ui.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
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

function isValidRecord(record, maxTries) {
  return record !== null
    && typeof record === "object"
    && (record.bestScore === null
      || (Number.isInteger(record.bestScore) && record.bestScore >= 1 && record.bestScore <= maxTries))
    && Number.isInteger(record.winStreak)
    && record.winStreak >= 0;
}

function loadRecords() {
  try {
    const savedRecords = window.localStorage.getItem(RECORDS_KEY);
    if (savedRecords === null) {
      return;
    }

    const records = JSON.parse(savedRecords);
    if (
      records?.version === 2
      && records.modes !== null
      && typeof records.modes === "object"
      && Object.keys(DIFFICULTIES).every((difficulty) =>
        isValidRecord(records.modes[difficulty], DIFFICULTIES[difficulty].maxTries))
    ) {
      state.records = records.modes;
      return;
    }

    if (isValidRecord(records, DIFFICULTIES.normal.maxTries)) {
      state.records.normal = {
        bestScore: records.bestScore,
        winStreak: records.winStreak,
      };
      saveRecords();
      return;
    }

    throw new Error("Saved records have an invalid format.");
  } catch {
    showRecordsWarning();
  }
}

function saveRecords() {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({
      version: 2,
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
  const score = difficulty.maxTries + 1 - triesUsed;
  const outcome = won ? "win" : "loss";
  const colors = ["#19a968", "#a9e8c7", "#f7c96d"];

  ui.result.dataset.outcome = outcome;
  ui.gameScreen.dataset.outcome = outcome;
  state.nextDifficulty = state.difficulty;
  updateResultDifficulty();
  ui.resultTitle.textContent = won ? "Round Complete" : "Round over";
  ui.resultMode.textContent = `${difficulty.label} mode`;
  ui.resultNumber.textContent = `The number was ${state.select}`;
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
  const difficulty = getDifficulty();
  const records = getCurrentRecords();
  if (won) {
    const score = difficulty.maxTries + 1 - state.guesses.length;
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
  state.difficulty = ui.difficulty.value;
  updateDifficultyPreview();
  resetGame();
  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  focusGame();
}

ui.start.addEventListener("click", startGame);
ui.difficulty.addEventListener("change", () => {
  state.difficulty = ui.difficulty.value;
  updateDifficultyPreview();
  renderRecords();
});
ui.soundToggle.addEventListener("click", toggleSound);
loadSoundPreference();
updateSoundToggle();

ui.resultDifficultyTrigger.addEventListener("click", () => {
  if (ui.resultDifficultyMenu.hidden) {
    openResultDifficultyMenu();
  } else {
    closeResultDifficultyMenu();
  }
});

ui.resultDifficultyTrigger.addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    openResultDifficultyMenu();
  }
});

ui.resultDifficultyMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".result-difficulty__option");
  if (option) {
    chooseResultDifficulty(option);
  }
});

ui.resultDifficultyMenu.addEventListener("keydown", (event) => {
  const focusedIndex = ui.resultDifficultyOptions.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeResultDifficultyMenu(true);
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    focusResultDifficultyOption(focusedIndex + (event.key === "ArrowDown" ? 1 : -1));
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    focusResultDifficultyOption(event.key === "Home" ? 0 : ui.resultDifficultyOptions.length - 1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const option = ui.resultDifficultyOptions[focusedIndex];
    if (option) {
      chooseResultDifficulty(option);
    }
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!ui.resultDifficultyMenu.hidden && !event.target.closest(".result-difficulty")) {
    closeResultDifficultyMenu();
  }
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
    state.lowestPossible = guess + 1;
  } else {
    state.highestPossible = guess - 1;
  }

  state.attemptsLeft -= 1;
  renderLives();
  renderRoundInfo();

  if (state.attemptsLeft === 0) {
    endGame(false);
    return;
  }

  playSoundCue(result);
  const clue = guess < state.select
    ? "Too low. Try a higher number."
    : "Too high. Try a lower number.";
  setStatus(clue, "clue");
});

ui.restart.addEventListener("click", () => {
  closeResultDifficultyMenu();
  ui.difficulty.value = state.nextDifficulty;
  startGame();
});
