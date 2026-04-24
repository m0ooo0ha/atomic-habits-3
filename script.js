const defaultQuestions = [
  {
    text: "ما هو الكوكب المعروف بالكوكب الأحمر؟",
    answers: ["المريخ", "الزهرة", "المشتري", "عطارد"],
    correct: 0,
  },
  {
    text: "كم عدد قارات العالم؟",
    answers: ["5", "6", "7", "8"],
    correct: 2,
  },
  {
    text: "ما هي عاصمة المملكة العربية السعودية؟",
    answers: ["الرياض", "جدة", "الدمام", "مكة"],
    correct: 0,
  },
  {
    text: "أي لغة تُستخدم في صفحات الويب للهيكل الأساسي؟",
    answers: ["CSS", "HTML", "Java", "Python"],
    correct: 1,
  },
  {
    text: "كم يساوي 9 × 9؟",
    answers: ["72", "81", "99", "89"],
    correct: 1,
  },
  {
    text: "من هو مؤلف رواية (البؤساء)؟",
    answers: ["فيكتور هوجو", "تولستوي", "شكسبير", "نجيب محفوظ"],
    correct: 0,
  },
];

const els = {
  playerName: document.getElementById("player-name"),
  addPlayer: document.getElementById("add-player"),
  playersList: document.getElementById("players-list"),
  startGame: document.getElementById("start-game"),
  setupCard: document.getElementById("setup-card"),
  gameCard: document.getElementById("game-card"),
  scoreCard: document.getElementById("score-card"),
  turnLabel: document.getElementById("turn-label"),
  questionText: document.getElementById("question-text"),
  answers: document.getElementById("answers"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("next-btn"),
  scoreList: document.getElementById("score-list"),
  restart: document.getElementById("restart"),
};

const state = {
  players: [],
  turnIndex: 0,
  questionIndex: 0,
  questions: [],
};

function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function renderPlayers() {
  els.playersList.innerHTML = "";
  state.players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = `${player.name} (0)`;
    els.playersList.appendChild(li);
  });
  els.startGame.disabled = state.players.length < 2;
}

function addPlayer() {
  const name = els.playerName.value.trim();
  if (!name) return;
  if (state.players.some((p) => p.name === name)) {
    alert("اسم اللاعب مكرر، اختر اسمًا مختلفًا.");
    return;
  }
  state.players.push({ name, score: 0 });
  els.playerName.value = "";
  renderPlayers();
}

function currentPlayer() {
  return state.players[state.turnIndex % state.players.length];
}

function showQuestion() {
  const q = state.questions[state.questionIndex];
  const player = currentPlayer();
  els.turnLabel.textContent = `دور اللاعب: ${player.name}`;
  els.questionText.textContent = q.text;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.nextBtn.classList.add("hidden");

  els.answers.innerHTML = "";
  q.answers.forEach((answer, idx) => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.addEventListener("click", () => answerQuestion(idx));
    els.answers.appendChild(btn);
  });
}

function answerQuestion(answerIndex) {
  const q = state.questions[state.questionIndex];
  const buttons = [...els.answers.querySelectorAll("button")];
  buttons.forEach((b) => (b.disabled = true));

  if (answerIndex === q.correct) {
    currentPlayer().score += 1;
    els.feedback.textContent = "إجابة صحيحة! +1 نقطة";
    els.feedback.classList.add("ok");
  } else {
    els.feedback.textContent = `إجابة خاطئة. الصحيحة: ${q.answers[q.correct]}`;
    els.feedback.classList.add("bad");
  }
  els.nextBtn.classList.remove("hidden");
}

function nextStep() {
  state.questionIndex += 1;
  state.turnIndex += 1;

  if (state.questionIndex >= state.questions.length) {
    endGame();
    return;
  }
  showQuestion();
}

function endGame() {
  els.gameCard.classList.add("hidden");
  els.scoreCard.classList.remove("hidden");

  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  els.scoreList.innerHTML = "";

  sorted.forEach((player, i) => {
    const li = document.createElement("li");
    const medal = i === 0 ? " 🏆" : "";
    li.textContent = `${player.name}: ${player.score} نقطة${medal}`;
    els.scoreList.appendChild(li);
  });
}

function startGame() {
  state.questions = shuffle(defaultQuestions);
  state.turnIndex = 0;
  state.questionIndex = 0;
  state.players.forEach((p) => (p.score = 0));

  els.setupCard.classList.add("hidden");
  els.scoreCard.classList.add("hidden");
  els.gameCard.classList.remove("hidden");

  showQuestion();
}

function resetGame() {
  state.players = [];
  renderPlayers();
  els.setupCard.classList.remove("hidden");
  els.scoreCard.classList.add("hidden");
  els.gameCard.classList.add("hidden");
}

els.addPlayer.addEventListener("click", addPlayer);
els.startGame.addEventListener("click", startGame);
els.nextBtn.addEventListener("click", nextStep);
els.restart.addEventListener("click", resetGame);
els.playerName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addPlayer();
});
