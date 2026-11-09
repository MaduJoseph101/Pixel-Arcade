const MAX_NUMBER = 20;
const MAX_TRIES = 3;

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
};

const state = {
  select: 0,
  attemptsLeft: MAX_TRIES,
  isGameOver: false,
  lowestPossible: 1,
  highestPossible: MAX_NUMBER,
  guesses: [],
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
  ui.restart.hidden = true;
  setStatus("Enter a whole number from 1 to 20.");
  renderLives();
  renderRoundInfo();
}

function endGame(won) {
  state.isGameOver = true;
  ui.input.disabled = true;
  ui.submit.disabled = true;
  ui.submit.hidden = true;
  ui.restart.hidden = false;

  if (won) {
    setStatus("YOU GOT IT! Nice shot.", "success");
    return;
  }

  ui.attemptsLabel.textContent = "No tries remaining";
  setStatus(`OUT OF TRIES. The number was ${state.select}.`, "error");
}

function startGame() {
  resetGame();
  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  ui.input.focus();
}

ui.start.addEventListener("click", startGame);

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
  ui.input.focus();
});
