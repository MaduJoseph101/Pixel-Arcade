const MAX_NUMBER = 20;
const MAX_TRIES = 3;
const RECORDS_KEY = "pixelArcadeRecords";

const ui = {
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  start: document.querySelector(".start"),
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
  resultTitle: document.getElementById("result-title"),
  resultNumber: document.getElementById("result-number"),
  resultMessage: document.getElementById("result-message"),
  resultConfetti: document.getElementById("result-confetti"),
  bestScore: document.getElementById("best-score"),
  winStreak: document.getElementById("win-streak"),
  recordsStatus: document.getElementById("records-status"),
};

const state = {
  select: 0,
  attemptsLeft: MAX_TRIES,
  isGameOver: false,
  lowestPossible: 1,
  highestPossible: MAX_NUMBER,
  guesses: [],
  bestScore: null,
  winStreak: 0,
};

function getRandomNumber() {
  return Math.floor(Math.random() * MAX_NUMBER) + 1;
}

function setStatus(message, status = "default") {
  ui.value.textContent = message;
  ui.value.dataset.state = status;
}

function renderLives() {
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
  ui.bestScore.textContent = state.bestScore === null ? "—" : String(state.bestScore);
  ui.winStreak.textContent = String(state.winStreak);
}

function showRecordsWarning() {
  ui.recordsStatus.textContent = "Personal records may not be saved in this browser.";
  ui.recordsStatus.hidden = false;
}

function loadRecords() {
  try {
    const savedRecords = window.localStorage.getItem(RECORDS_KEY);
    if (savedRecords === null) {
      return;
    }

    const records = JSON.parse(savedRecords);
    const validBestScore = records?.bestScore === null
      || (Number.isInteger(records?.bestScore) && records.bestScore >= 1 && records.bestScore <= MAX_TRIES);
    const validWinStreak = Number.isInteger(records?.winStreak) && records.winStreak >= 0;

    if (!validBestScore || !validWinStreak) {
      throw new Error("Saved records have an invalid format.");
    }

    state.bestScore = records.bestScore;
    state.winStreak = records.winStreak;
  } catch {
    showRecordsWarning();
  }
}

function saveRecords() {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({
      bestScore: state.bestScore,
      winStreak: state.winStreak,
    }));
    ui.recordsStatus.hidden = true;
  } catch {
    showRecordsWarning();
  }
}

function showResult(won) {
  const triesUsed = state.guesses.length;
  const score = MAX_TRIES + 1 - triesUsed;
  const outcome = won ? "win" : "loss";
  const colors = ["#c9ff59", "#ffcb68", "#e8f2d6"];

  ui.result.dataset.outcome = outcome;
  ui.gameScreen.dataset.outcome = outcome;
  ui.resultTitle.textContent = won ? "ROUND WON!" : "ROUND OVER";
  ui.resultNumber.textContent = `THE NUMBER WAS ${state.select}`;
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

  ui.result.hidden = false;
}

function resetGame() {
  state.select = getRandomNumber();
  state.attemptsLeft = MAX_TRIES;
  state.isGameOver = false;
  state.lowestPossible = 1;
  state.highestPossible = MAX_NUMBER;
  state.guesses = [];

  ui.input.value = "";
  ui.input.disabled = false;
  ui.input.removeAttribute("aria-invalid");
  ui.submit.disabled = false;
  ui.submit.hidden = false;
  ui.form.hidden = false;
  ui.result.hidden = true;
  ui.result.removeAttribute("data-outcome");
  ui.gameScreen.removeAttribute("data-outcome");
  ui.resultConfetti.replaceChildren();
  ui.restart.hidden = true;
  setStatus("Enter a whole number from 1 to 20.");
  renderLives();
  renderRoundInfo();
}

function endGame(won) {
  state.isGameOver = true;
  if (won) {
    const score = MAX_TRIES + 1 - state.guesses.length;
    state.winStreak += 1;
    if (state.bestScore === null || score > state.bestScore) {
      state.bestScore = score;
    }
  } else {
    state.winStreak = 0;
  }
  renderRecords();
  saveRecords();

  ui.input.disabled = true;
  ui.submit.disabled = true;
  ui.submit.hidden = true;
  ui.form.hidden = true;
  ui.restart.hidden = false;
  showResult(won);
  ui.resultTitle.focus();

  if (won) {
    setStatus("YOU GOT IT! Nice shot.", "success");
    return;
  }

  ui.attemptsLabel.textContent = "No tries remaining";
  setStatus(`OUT OF TRIES. The number was ${state.select}.`, "error");
}

function focusGame() {
  if (window.matchMedia("(max-height: 600px)").matches) {
    ui.gameScreen.focus({ preventScroll: true });
    ui.gameScreen.scrollTop = 0;
    return;
  }

  ui.input.focus();
}

function startGame() {
  resetGame();
  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  focusGame();
}

ui.start.addEventListener("click", startGame);

loadRecords();
renderRecords();

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.isGameOver) {
    return;
  }

  const rawGuess = ui.input.value.trim();
  const guess = Number(rawGuess);

  if (rawGuess === "" || !Number.isInteger(guess) || guess < 1 || guess > MAX_NUMBER) {
    ui.input.setAttribute("aria-invalid", "true");
    setStatus("Enter a whole number from 1 to 20.", "error");
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

  const clue = guess < state.select
    ? "Too low. Try a higher number."
    : "Too high. Try a lower number.";
  setStatus(clue, "clue");
});

ui.restart.addEventListener("click", () => {
  resetGame();
  focusGame();
});
