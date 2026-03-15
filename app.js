// [1] 전역 변수 선언 (딱 한 번씩만!)
let studyStartTime = null;
let testWords = [];
let currentQuestion = 0;
let correctCount = 0;
let wrongWords = [];
let timerInterval;
let timeLeft = 10;
let currentSetIndex = null;
let displayedWords = [];
let testPassages = [];
let currentPassageIndex = 0;
let passageCorrect = 0;
let blankAnswers = [];
let currentWrongType = 'all';

// [2] 공통/내비게이션 함수
function goHome() {
    location.href = "../index.html";
}

function goBack() {
    history.back();
}

// [3] 통계 및 데이터 관리 함수
function getStats() {
    return JSON.parse(localStorage.getItem("stats")) || {
        totalQuestions: 0, totalCorrect: 0,
        wordQuestions: 0, wordCorrect: 0,
        passageQuestions: 0, passageCorrect: 0,
        wrongWords: {}, passageStudy: {}, studyDates: [], studyMinutes: 0
    };
}

function saveStats(stats) {
    localStorage.setItem("stats", JSON.stringify(stats));
}

function recordStudy() {
    let stats = getStats();
    const today = new Date().toISOString().slice(0, 10);
    if (!stats.studyDates.includes(today)) {
        stats.studyDates.push(today);
    }
    saveStats(stats);
}

function recordQuestion(type, correct, question) {
    let stats = getStats();
    stats.totalQuestions++;
    if (correct) stats.totalCorrect++;
    if (type === "word") {
        stats.wordQuestions++;
        if (correct) stats.wordCorrect++;
        if (!correct) stats.wrongWords[question] = (stats.wrongWords[question] || 0) + 1;
    }
    if (type === "passage") {
        stats.passageQuestions++;
        if (correct) stats.passageCorrect++;
        stats.passageStudy[question] = (stats.passageStudy[question] || 0) + 1;
    }
    recordStudy();
    saveStats(stats);
}

function loadStats() {
    let stats = getStats();
    if (!document.getElementById("totalQuestions")) return;

    document.getElementById("totalQuestions").textContent = stats.totalQuestions;
    document.getElementById("totalCorrect").textContent = stats.totalCorrect;
    let rate = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
    document.getElementById("totalRate").textContent = rate + "%";

    let wordRate = stats.wordQuestions > 0 ? Math.round((stats.wordCorrect / stats.wordQuestions) * 100) : 0;
    document.getElementById("wordRate").textContent = wordRate + "%";

    let passageRate = stats.passageQuestions > 0 ? Math.round((stats.passageCorrect / stats.passageQuestions) * 100) : 0;
    document.getElementById("passageRate").textContent = passageRate + "%";

    let mostWrong = "없음", max = 0;
    for (let w in stats.wrongWords) {
        if (stats.wrongWords[w] > max) { max = stats.wrongWords[w]; mostWrong = w; }
    }
    document.getElementById("mostWrongWord").textContent = mostWrong;

    let mostPassage = "없음", pMax = 0;
    for (let p in stats.passageStudy) {
        if (stats.passageStudy[p] > pMax) { pMax = stats.passageStudy[p]; mostPassage = p; }
    }
    document.getElementById("mostPassage").textContent = mostPassage;
    document.getElementById("studyDays").textContent = stats.studyDates.length;
    document.getElementById("studyTime").textContent = stats.studyMinutes || 0;
}

// [4] 단어장 관리 함수
function loadSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const list = document.getElementById("setList");
    if (!list) return;
    list.innerHTML = "";

    // 즐겨찾기 세트
    const favDiv = document.createElement("div");
    favDiv.className = "wordCard";
    favDiv.innerHTML = `<b>★ 즐겨찾기 단어 모음</b><div class="wordActions"><button class="smallBtn" onclick="openFavoriteSet()">열기</button></div>`;
    list.appendChild(favDiv);

    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `<b>${set.name}</b><div class="wordActions"><button class="smallBtn" onclick="openSet(${i})">열기</button><button class="smallBtn" onclick="deleteSet(${i})">삭제</button></div>`;
        list.appendChild(div);
    });
}

function openFavoriteSet() {
    currentSetIndex = "fav";
    document.getElementById("currentSetTitle").innerText = "★ 즐겨찾기 단어 모음";
    document.getElementById("wordSection").style.display = "block";
    loadWords();
}

function openSet(i) {
    currentSetIndex = i;
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    document.getElementById("currentSetTitle").innerText = sets[i].name;
    document.getElementById("wordSection").style.display = "block";
    loadWords();
}

function addSet() {
    const name = document.getElementById("setName").value;
    if (!name) return;
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    sets.push({ name: name, words: [] });
    localStorage.setItem("wordSets", JSON.stringify(sets));
    document.getElementById("setName").value = "";
    loadSets();
}

function deleteSet(i) {
    if (!confirm("세트를 삭제하시겠습니까?")) return;
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    sets.splice(i, 1);
    localStorage.setItem("wordSets", JSON.stringify(sets));
    loadSets();
}

function loadWords() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    displayedWords = [];
    if (currentSetIndex === "fav") {
        sets.forEach(s => { s.words.forEach(w => { if (w.favorite) displayedWords.push(w); }); });
    } else {
        if (currentSetIndex === null || !sets[currentSetIndex]) return;
        displayedWords = [...sets[currentSetIndex].words];
    }
    const list = document.getElementById("wordList");
    if (!list) return;
    list.innerHTML = "";
    displayedWords.sort((a, b) => a.eng.toLowerCase().localeCompare(b.eng.toLowerCase()));
    displayedWords.forEach((w, i) => {
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `<b>${w.eng}</b> : ${w.mean.join(", ")}<div class="wordActions"><button class="smallBtn" onclick="speakWord('${w.eng}')">🔊</button><button class="smallBtn" id="favBtn-${i}" onclick="toggleFavorite(${i})">${w.favorite ? "★" : "☆"}</button><button class="smallBtn" onclick="deleteWord(${i})">삭제</button></div>`;
        list.appendChild(div);
    });
}

function toggleFavorite(i) {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const targetWord = displayedWords[i];
    sets.forEach(s => {
        s.words.forEach(w => {
            if (w.eng === targetWord.eng && JSON.stringify(w.mean) === JSON.stringify(targetWord.mean)) { w.favorite = !w.favorite; }
        });
    });
    localStorage.setItem("wordSets", JSON.stringify(sets));
    if (currentSetIndex === "fav") { loadWords(); } 
    else {
        const starBtn = document.getElementById("favBtn-" + i);
        if (starBtn) {
            targetWord.favorite = !targetWord.favorite;
            starBtn.innerText = targetWord.favorite ? "★" : "☆";
        }
    }
}

function addWord() {
    const eng = document.getElementById("englishWord").value;
    const meanings = document.getElementById("meanings").value;
    if (!eng || !meanings) return;
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    sets[currentSetIndex].words.push({ eng: eng, mean: meanings.split(","), favorite: false });
    localStorage.setItem("wordSets", JSON.stringify(sets));
    document.getElementById("englishWord").value = "";
    document.getElementById("meanings").value = "";
    loadWords();
    document.getElementById("englishWord").focus();
}

function deleteWord(i) {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    sets[currentSetIndex].words.splice(i, 1);
    localStorage.setItem("wordSets", JSON.stringify(sets));
    loadWords();
}

function searchWords() {
    const keyword = document.getElementById("wordSearch").value.toLowerCase();
    const list = document.getElementById("wordList");
    if (!list) return;
    list.innerHTML = "";
    displayedWords.forEach((w, i) => {
        if (!w.eng.toLowerCase().includes(keyword) && !w.mean.join(" ").toLowerCase().includes(keyword)) return;
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `<b>${w.eng}</b> : ${w.mean.join(", ")}<div class="wordActions"><button class="smallBtn" onclick="speakWord('${w.eng}')">🔊</button><button class="smallBtn" id="favBtn-${i}" onclick="toggleFavorite(${i})">${w.favorite ? "★" : "☆"}</button><button class="smallBtn" onclick="deleteWord(${i})">삭제</button></div>`;
        list.appendChild(div);
    });
}

function speakWord(word) {
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(word);
    msg.lang = 'en-US';
    msg.rate = 0.85;
    speechSynthesis.speak(msg);
}

// [5] 단어 테스트 함수
function loadTestSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const container = document.getElementById("setSelection");
    if (!container) return;
    container.innerHTML = "";
    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.className = "setItem";
        div.setAttribute("data-name", set.name.toLowerCase());
        div.innerHTML = `<label><input type="checkbox" value="${i}"> ${set.name}</label>`;
        container.appendChild(div);
    });
}

function filterTestSets() {
    const query = document.getElementById("setSearchInput").value.toLowerCase();
    document.querySelectorAll(".setItem").forEach(item => {
        item.style.display = item.getAttribute("data-name").includes(query) ? "block" : "none";
    });
}

function startWordTest() {
    const checkboxes = document.querySelectorAll("#setSelection input:checked");
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    testWords = [];
    checkboxes.forEach(cb => { testWords = testWords.concat(sets[cb.value].words); });
    if (testWords.length === 0) { alert("세트를 선택하세요."); return; }
    startStudySession();
    shuffleArray(testWords);
    currentQuestion = 0; correctCount = 0; wrongWords = [];
    document.getElementById("testArea").style.display = "block";
    showQuestion();
}

function showQuestion() {
    if (currentQuestion >= testWords.length) { endTest(); return; }
    const type = document.getElementById("testType").value;
    const word = testWords[currentQuestion];
    const progress = `(${currentQuestion + 1}/${testWords.length}) `;
    document.getElementById("question").innerText = progress + (type === "meaning" ? word.eng : word.mean.join(", "));
    document.getElementById("answerInput").value = "";
    document.getElementById("answerInput").focus();
    startTimer();
}

function submitAnswer() {
    clearInterval(timerInterval);
    const type = document.getElementById("testType").value;
    const word = testWords[currentQuestion];
    const userAnswer = document.getElementById("answerInput").value.trim();
    let isCorrect = (type === "meaning") ? 
        (word.mean.every(m => userAnswer.split(",").map(u=>u.trim()).includes(m)) && word.mean.length === userAnswer.split(",").length) : 
        (userAnswer.toLowerCase() === word.eng.toLowerCase());

    if (isCorrect) { correctCount++; recordQuestion("word", true, word.eng); } 
    else {
        recordQuestion("word", false, word.eng);
        wrongWords.push({ question: word.eng, correct: word.mean.join(", "), user: userAnswer || "(무응답)" });
        alert(`오답! 정답: ${type === 'meaning' ? word.mean.join(", ") : word.eng}`);
    }
    currentQuestion++; showQuestion();
}

function endTest() {
    endStudySession();
    document.getElementById("testArea").style.display = "none";
    document.getElementById("resultArea").innerHTML = `<h2>테스트 종료</h2><p>정답률: ${correctCount}/${testWords.length}</p>`;
    saveWrongNotes();
}

// [6] 지문 관리 함수
function loadPassages() {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const list = document.getElementById("passageList");
    if (!list) return;
    list.innerHTML = "";
    passages.forEach((p, i) => renderPassageCard(p, i, list));
}

function renderPassageCard(p, i, container) {
    const div = document.createElement("div");
    div.className = "wordCard";
    div.innerHTML = `<div><b>${p.title}</b></div><div class="wordActions"><button class="smallBtn" onclick="openPassage(${i})">열기</button><button class="smallBtn" onclick="deletePassage(${i})">삭제</button></div>`;
    container.appendChild(div);
}

function openPassage(i) {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const p = passages[i];
    document.getElementById("viewTitle").innerText = p.title;
    document.getElementById("viewTopic").innerText = p.topic || "없음";
    document.getElementById("viewText").innerText = p.text;
    document.getElementById("viewTranslation").innerText = p.translation || "해석 없음";
    document.getElementById("passageViewSection").style.display = "block";
    document.getElementById("passageViewSection").scrollIntoView({ behavior: 'smooth' });
}

function closePassage() {
    document.getElementById("passageViewSection").style.display = "none";
}

function searchPassages() {
    const keyword = document.getElementById("passageSearch").value.toLowerCase();
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const list = document.getElementById("passageList");
    if (!list) return;
    list.innerHTML = "";
    passages.forEach((p, i) => {
        if (p.title.toLowerCase().includes(keyword)) renderPassageCard(p, i, list);
    });
}

function addPassage() {
    const title = document.getElementById("title").value;
    const text = document.getElementById("text").value;
    if (!title || !text) return;
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    passages.push({ title: title, text: text, translation: document.getElementById("translation").value, topic: document.getElementById("topic").value });
    localStorage.setItem("passages", JSON.stringify(passages));
    loadPassages();
    ["title", "text", "translation", "topic"].forEach(id => document.getElementById(id).value = "");
}

function deletePassage(i) {
    if (!confirm("지문을 삭제하시겠습니까?")) return;
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    passages.splice(i, 1);
    localStorage.setItem("passages", JSON.stringify(passages));
    loadPassages();
}

// [7] 타이머 및 유틸리티
function startTimer() {
    timeLeft = 10;
    const timer = document.getElementById("timer");
    if (!timer) return;
    clearInterval(timerInterval);
    timer.innerText = "남은 시간: " + timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        timer.innerText = "남은 시간: " + timeLeft;
        if (timeLeft <= 0) { clearInterval(timerInterval); submitAnswer(); }
    }, 1000);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startStudySession() { studyStartTime = Date.now(); }
function endStudySession() {
    if (!studyStartTime) return;
    let stats = getStats();
    stats.studyMinutes += Math.floor((Date.now() - studyStartTime) / 60000);
    saveStats(stats);
    studyStartTime = null;
}

function saveWrongNotes() {
    let notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
    wrongWords.forEach(w => notes.push({ type: "wordMeaning", question: w.question, correct: w.correct, user: w.user }));
    localStorage.setItem("wrongNotes", JSON.stringify(notes));
}

// [8] 초기화 및 이벤트 바인딩
document.addEventListener("DOMContentLoaded", () => {
    loadSets();
    loadPassages();
    loadStats();
    loadTestSets();
    
    // 엔터키 바인딩
    const bindEnter = (id, action) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") action(); });
    };
    bindEnter("englishWord", addWord);
    bindEnter("meanings", addWord);
    bindEnter("answerInput", submitAnswer);
});
