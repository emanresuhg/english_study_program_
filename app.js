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

function goHome() {
    location.href = "../index.html";
}

function goBack() {
    history.back();
}

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

function loadSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const list = document.getElementById("setList");
    if (!list) return;
    list.innerHTML = "";

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

    let isCorrect = false;

    if (type === "meaning") {
        const userMeans = userAnswer.split(",")
                                    .map(m => m.trim().toLowerCase())
                                    .filter(m => m !== "");
        
        const correctMeans = word.mean.map(m => m.trim().toLowerCase());

        isCorrect = (userMeans.length === correctMeans.length && 
                     correctMeans.every(m => userMeans.includes(m)));
    } else {
        isCorrect = (userAnswer.toLowerCase() === word.eng.toLowerCase());
    }

    if (isCorrect) {
        correctCount++;
        recordQuestion("word", true, word.eng);
        showFeedback(true); // "정답!" 표시
    } else {
        recordQuestion("word", false, word.eng);
        wrongWords.push({
            question: word.eng,
            correct: word.mean.join(", "),
            user: userAnswer || "(무응답)"
        });
        const correctMsg = type === 'meaning' ? word.mean.join(", ") : word.eng;
        showFeedback(false, correctMsg); 
    }

    setTimeout(() => {
        currentQuestion++;
        showQuestion();
    }, 1200);
}

function showFeedback(isCorrect, msg = "") {
    let feedbackEl = document.getElementById("testFeedback");
    
    if (!feedbackEl) {
        feedbackEl = document.createElement("div");
        feedbackEl.id = "testFeedback";
        document.body.appendChild(feedbackEl);
    }

    if (isCorrect) {
        feedbackEl.innerText = "정답입니다!";
        feedbackEl.style.backgroundColor = "rgba(40, 167, 69, 0.9)"; // 초록색
    } else {
        feedbackEl.innerText = `오답: ${msg}`;
        feedbackEl.style.backgroundColor = "rgba(220, 53, 69, 0.9)"; // 빨간색
    }

    feedbackEl.style.display = "block";

    setTimeout(() => {
        feedbackEl.style.display = "none";
    }, 1000);
}

function endTest() {
    endStudySession();
    document.getElementById("testArea").style.display = "none";
    document.getElementById("resultArea").innerHTML = `<h2>테스트 종료</h2><p>정답률: ${correctCount}/${testWords.length}</p>`;
    saveWrongNotes();
}

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

document.addEventListener("DOMContentLoaded", () => {
    if (typeof loadSets === 'function') loadSets();
    if (typeof loadPassages === 'function') loadPassages();
    if (typeof loadStats === 'function') loadStats();
    if (typeof loadTestSets === 'function') loadTestSets();
    
    if (typeof loadPassageSelection === 'function') loadPassageSelection();
    
    const bindEnter = (id, action) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("keydown", (e) => { if (e.key === "Enter") action(); });
    };
    bindEnter("englishWord", addWord);
    bindEnter("meanings", addWord);
    bindEnter("answerInput", submitAnswer);
});

function showPassageQuestion() {
    if (currentPassageIndex >= testPassages.length) {
        endPassageTest();
        return;
    }

    const p = testPassages[currentPassageIndex];
    const qContainer = document.getElementById("passageQuestion");
    const tContainer = document.getElementById("passageTranslationView");
    const opt = document.getElementById("showTranslationOpt");

    if (!qContainer) {
        console.error("지문을 표시할 영역(passageQuestion)을 찾을 수 없습니다.");
        return;
    }

    // 1. 초기화
    qContainer.innerHTML = ""; 
    if (tContainer) {
        tContainer.innerText = `[해석] ${p.translation || '해석 정보가 없습니다.'}`;
        tContainer.style.display = (opt && opt.checked) ? "block" : "none";
    }

    // 2. 단어 분리 및 빈칸 생성
    const allWords = p.text.trim().split(/\s+/); 
    const removeCount = Math.max(1, Math.floor(allWords.length * 0.15)); // 15% 빈칸
    
    let indexes = [];
    while (indexes.length < removeCount) {
        let r = Math.floor(Math.random() * allWords.length);
        // 이미 선택된 인덱스가 아니고, 너무 짧은 단어(a, I 등)가 아닐 때만 (선택사항)
        if (!indexes.includes(r)) indexes.push(r);
    }

    const htmlContent = allWords.map((word, i) => {
        if (indexes.includes(i)) {
            const cleanWord = word.replace(/[.,!?()"'“”]/g, "");
            const punctuation = word.replace(cleanWord, ""); // 문장부호 추출
            
            return `<input type="text" class="passage-input" 
                           data-answer="${cleanWord}" 
                           data-fullword="${word}"
                           style="width:${Math.max(cleanWord.length * 12, 40)}px;">${punctuation}`;
        }
        return `<span>${word}</span>`;
    }).join(" ");

    // 3. 화면에 삽입
    qContainer.innerHTML = htmlContent;
    
    const resultDiv = document.getElementById("passageResult");
    if (resultDiv) resultDiv.innerText = "";
}

// [교체] 채점 로직 (맞힌 개수/빈칸 개수 형식)
function submitPassageAnswer() {
    const inputs = document.querySelectorAll(".passage-input");
    if (inputs.length === 0) return;

    let correctInThisPassage = 0;
    const totalInThisPassage = inputs.length;

    inputs.forEach(input => {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = input.getAttribute("data-answer").toLowerCase();
        const fullWord = input.getAttribute("data-fullword");

        if (userAnswer === correctAnswer) {
            input.style.borderBottom = "2px solid #28a745";
            input.style.color = "#28a745";
            input.style.fontWeight = "bold";
            correctInThisPassage++;
        } else {
            input.style.borderBottom = "2px solid #dc3545";
            input.style.color = "#dc3545";
            input.value = fullWord; // 틀린 칸에 정답(풀네임) 표시
        }
        input.disabled = true; // 채점 후 수정 불가
    });

    // 전체 정답 개수 누적
    passageCorrect += correctInThisPassage;

    // 화면에 결과 표시: (맞힌 개수)/(빈칸 개수)
    const resultDiv = document.getElementById("passageResult");
    if (resultDiv) {
        resultDiv.innerHTML = `결과: <span style="color:#28a745">${correctInThisPassage}</span> / <span>${totalInThisPassage}</span> 맞힘`;
    }
}

function toggleTranslation() {
    const tContainer = document.getElementById("passageTranslationView");
    const opt = document.getElementById("showTranslationOpt");
    if (tContainer && opt) {
        tContainer.style.display = opt.checked ? "block" : "none";
    }
}

function endPassageTest() {
    endStudySession();

    document.getElementById("passageTestArea").style.display = "none";

    const result = document.getElementById("passageResult");
    if (result) {
        result.innerHTML = `
            <div style="text-align:center; padding:20px; border:2px solid #333; border-radius:15px; background:#fff;">
                <h2>테스트 종료</h2>
                <p style="font-size:1.5rem; margin:20px 0;">
                    총 맞힌 빈칸 개수: <span style="color:blue; font-weight:bold;">${passageCorrect}</span> 개
                </p>
                <button class="mainBtn" onclick="location.reload()">처음으로 돌아가기</button>
            </div>
        `;
    }
}

function nextPassage() {
    currentPassageIndex++;
    showPassageQuestion();
}

// [교체/추가] 지문 테스트용 지문 목록 불러오기
function loadPassageSelection() {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const container = document.getElementById("passageSelection");
    
    if (!container) return; 

    container.innerHTML = "";
    
    if (passages.length === 0) {
        container.innerHTML = "<p style='padding:10px;'>등록된 지문이 없습니다.</p>";
        return;
    }

    passages.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "setItem";
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${i}"> ${p.title}
            </label>
        `;
        container.appendChild(div);
    });
}

function startPassageTest() {
    const checks = document.querySelectorAll("#passageSelection input:checked");
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    
    testPassages = [];
    checks.forEach(c => {
        testPassages.push(passages[c.value]);
    });

    if (testPassages.length === 0) {
        alert("테스트할 지문을 하나 이상 선택하세요.");
        return;
    }

    startStudySession();
    shuffleArray(testPassages);
    currentPassageIndex = 0;
    passageCorrect = 0;

    document.getElementById("setupArea").style.display = "none"; 
    const testArea = document.getElementById("passageTestArea");
    if (testArea) testArea.style.display = "block";
    
    showPassageQuestion();
}
