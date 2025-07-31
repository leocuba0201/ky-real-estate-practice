// script.js - functionality for KY Real Estate exam practice app

// Grab references to DOM elements
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const summaryScreen = document.getElementById('summary-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const restartBtn = document.getElementById('restart-btn');
const qText = document.getElementById('question-text');
const answersForm = document.getElementById('answers-form');
const currentNumberEl = document.getElementById('current-number');
const totalQuestionsEl = document.getElementById('total-questions');
const summaryText = document.getElementById('summary-text');

let questions = [];
let answersKey = {};
let currentIndex = 0;
let userAnswers = [];

// Fetch questions JSON on load
async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    questions = await response.json();
    totalQuestionsEl.textContent = questions.length;
    // After loading questions, load answer key
    try {
      const ansRes = await fetch('answers.json');
      answersKey = await ansRes.json();
    } catch (err) {
      console.warn('Could not load answer key:', err);
    }
  } catch (error) {
    console.error('Failed to load questions:', error);
  }
}

// Initialize app
loadQuestions();

// Show a question at the given index
function displayQuestion(index) {
  const q = questions[index];
  if (!q) return;
  currentNumberEl.textContent = index + 1;
  qText.textContent = q.question;
  answersForm.innerHTML = '';
  // If there are no answer options, show a placeholder
  if (!q.answers || q.answers.length === 0) {
    const para = document.createElement('p');
    para.textContent = '(No multiple-choice options available)';
    answersForm.appendChild(para);
    return;
  }
  q.answers.forEach((ans) => {
    const label = document.createElement('label');
    label.htmlFor = `q${index}_${ans.label}`;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.id = `q${index}_${ans.label}`;
    input.value = ans.label;
    // restore previous selection if present
    if (userAnswers[index] && userAnswers[index] === ans.label) {
      input.checked = true;
    }
    const span = document.createElement('span');
    span.textContent = `${ans.label}) ${ans.text}`;
    label.appendChild(input);
    label.appendChild(span);
    answersForm.appendChild(label);
  });
}

// Save currently selected answer for the current question
function saveSelectedAnswer() {
  const selected = document.querySelector('input[name="answer"]:checked');
  if (selected) {
    userAnswers[currentIndex] = selected.value;
  } else {
    // no selection means undefined
    userAnswers[currentIndex] = null;
  }
}

// Start or restart the practice session
function startPractice() {
  currentIndex = 0;
  userAnswers = [];
  startScreen.classList.remove('active');
  summaryScreen.classList.remove('active');
  questionScreen.classList.add('active');
  displayQuestion(currentIndex);
  prevBtn.disabled = true;
  nextBtn.textContent = 'Next';
}

// Finish practice: show summary
function finishPractice() {
  questionScreen.classList.remove('active');
  summaryScreen.classList.add('active');
  // compute number answered
  let answeredCount = userAnswers.filter((a) => a !== null && a !== undefined).length;
  // compute correct answers if answer key available
  let correctCount = 0;
  if (answersKey && Object.keys(answersKey).length > 0) {
    questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const correct = answersKey[q.id];
      if (userAns && correct && userAns.toLowerCase() === correct.toLowerCase()) {
        correctCount++;
      }
    });
  }
  // build summary message
  let msg = `You reviewed ${questions.length} questions and answered ${answeredCount} of them.`;
  if (Object.keys(answersKey).length > 0) {
    msg += `\nYou answered ${correctCount} correctly.`;
    if (answeredCount > 0) {
      const percent = ((correctCount / questions.length) * 100).toFixed(1);
      msg += ` Your score: ${percent}%`;
    }
  } else {
    msg += `\n\nNo answer key loaded; scoring unavailable.`;
  }
  summaryText.textContent = msg;

  // Optionally build a list of incorrectly answered questions
  if (Object.keys(answersKey).length > 0) {
    const wrongList = document.createElement('ul');
    wrongList.className = 'incorrect-list';
    let hasWrong = false;
    questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const correct = answersKey[q.id];
      if (correct && userAns && userAns.toLowerCase() !== correct.toLowerCase()) {
        hasWrong = true;
        const li = document.createElement('li');
        li.textContent = `${q.id}: Your answer ${userAns || 'none'}, correct answer ${correct}`;
        wrongList.appendChild(li);
      }
    });
    // Remove any existing list and append new if there are wrong answers
    const existing = summaryText.nextSibling;
    if (existing && existing.classList && existing.classList.contains('incorrect-list')) {
      existing.remove();
    }
    if (hasWrong) {
      summaryScreen.appendChild(wrongList);
    }
  }
}

// Navigation handlers
startBtn.addEventListener('click', () => {
  startPractice();
});

restartBtn.addEventListener('click', () => {
  // return to start screen
  summaryScreen.classList.remove('active');
  startScreen.classList.add('active');
});

nextBtn.addEventListener('click', () => {
  saveSelectedAnswer();
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    displayQuestion(currentIndex);
    // enable prev button when moving forward from first
    if (currentIndex > 0) {
      prevBtn.disabled = false;
    }
    // update next button text if last question reached
    if (currentIndex === questions.length - 1) {
      nextBtn.textContent = 'Finish';
    }
  } else {
    // If on last question, finishing
    finishPractice();
  }
});

prevBtn.addEventListener('click', () => {
  saveSelectedAnswer();
  if (currentIndex > 0) {
    currentIndex--;
    displayQuestion(currentIndex);
    // update next button text when leaving last question
    nextBtn.textContent = (currentIndex === questions.length - 1 ? 'Finish' : 'Next');
    // disable prev if back to first
    if (currentIndex === 0) {
      prevBtn.disabled = true;
    }
  }
});