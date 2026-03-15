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

function goHome() { location.href = "../index.html"; }
function goBack() { history.back(); }

function getStats() {
    return JSON.parse(localStorage.getItem("stats")) || {
        totalQuestions: 0, totalCorrect: 0,
        wordQuestions: 0, wordCorrect: 0,
        passageQuestions: 0, passageCorrect: 0,
        wrongWords: {}, passageStudy: {}, studyDates: [], studyMinutes: 0
    };
}

function saveStats(stats) { localStorage.setItem("stats", JSON.stringify(stats)); }

function recordStudy() {
    let stats = getStats();
    const today = new Date().toISOString().slice(0, 10);
    if (!stats.studyDates.includes(today)) { stats.studyDates.push(today); }
    saveStats(stats);
}

function recordQuestion(type, correct, question, userAns = "") {
    let stats = getStats();
    stats.totalQuestions++;
    if (correct) stats.totalCorrect++;

    if (!correct && type === "word") {
        let notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
        const typeEl = document.querySelector("input[name='wordTestType']:checked");
        const testType = typeEl ? typeEl.value : "meaning";
        let category = (testType === "meaning") ? "wordMeaning" : "wordSpelling";
        const wordObj = testWords[currentQuestion];
        const correctAnswer = (testType === "meaning") ? wordObj.mean.join(", ") : wordObj.eng;

        notes.push({
            type: category,
            question: question,
            correct: correctAnswer,
            user: userAns || "무응답"
        });
        localStorage.setItem("wrongNotes", JSON.stringify(notes));
    }
    saveStats(stats);
}

function savePassageWrongNote(entireText, fullWord, cleanAnswer, userAnswer) {
    let notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
    const sentences = entireText.split(/[.!?]\s/);
    let targetSentence = sentences.find(s => s.includes(fullWord)) || "문장을 찾을 수 없음";
    const reviewQuestion = targetSentence.replace(fullWord, " ( ___ ) ");

    notes.push({
        type: "passageBlank",
        question: reviewQuestion.trim(),
        fullText: entireText,
        targetWord: fullWord,
        correct: cleanAnswer,
        user: userAnswer || "(무응답)"
    });
    localStorage.setItem("wrongNotes", JSON.stringify(notes));
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
    if(document.getElementById("wordSection")) document.getElementById("wordSection").style.display = "block";
    loadWords();
}

function openSet(i) {
    currentSetIndex = i;
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    document.getElementById("currentSetTitle").innerText = sets[i].name;
    if(document.getElementById("wordSection")) document.getElementById("wordSection").style.display = "block";
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

function speakWord(word) {
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(word);
    msg.lang = 'en-US';
    msg.rate = 0.85;
    speechSynthesis.speak(msg);
}

function endTest() {
    endStudySession();
    document.getElementById("testArea").style.display = "none";
    document.getElementById("resultArea").innerHTML = `<h2>테스트 종료</h2><p>정답률: ${correctCount}/${testWords.length}</p><button class="mainBtn" onclick="location.reload()">돌아가기</button>`;
}

function loadPassages() {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const list = document.getElementById("passageList");
    if (!list) return;
    list.innerHTML = "";
    passages.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `<div><b>${p.title}</b></div><div class="wordActions"><button class="smallBtn" onclick="openPassage(${i})">열기</button><button class="smallBtn" onclick="deletePassage(${i})">삭제</button></div>`;
        list.appendChild(div);
    });
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

let currentWrongTestIndex = 0;
let wrongTestWords = [];

function loadWrongNotes() {
    const notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
    const typeFilter = document.getElementById("wrongTypeFilter").value;
    const listContainer = document.getElementById("wrongNoteList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const filtered = notes.filter(n => typeFilter === "all" || n.type === typeFilter);

    if (filtered.length === 0) {
        listContainer.innerHTML = "<p style='padding:20px;'>해당 카테고리에 오답이 없습니다.</p>";
        return;
    }

    filtered.forEach((n) => {
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `
            <div>
                <span class="badge">${n.type}</span>
                <p><b>문제:</b> ${n.question}</p>
                <p style="color: #dc3545;"><b>내가 쓴 답:</b> ${n.user}</p>
                <p style="color: #28a745;"><b>정답:</b> ${n.correct}</p>
            </div>
        `;
        listContainer.appendChild(div);
    });

    const resetBtn = document.createElement("button");
    resetBtn.innerText = "오답노트 전체 초기화";
    resetBtn.className = "smallBtn";
    resetBtn.style = "margin: 20px auto; display: block; background: #dc3545; color: white; opacity: 0.7;";
    resetBtn.onclick = resetWrongNotes;
    listContainer.appendChild(resetBtn);
}

function resetWrongNotes() {
    if (confirm("정말로 모든 오답노트를 삭제하시겠습니까?")) {
        localStorage.removeItem("wrongNotes");
        loadWrongNotes();
    }
}

function startWrongNoteTest() {
    const typeFilter = document.getElementById("wrongTypeFilter").value;
    const notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
    wrongTestWords = notes.filter(n => typeFilter === "all" || n.type === typeFilter);

    if (wrongTestWords.length === 0) { alert("문제가 없습니다."); return; }

    shuffleArray(wrongTestWords);
    currentWrongTestIndex = 0;
    document.getElementById("wrongNoteListSection").style.display = "none";
    document.getElementById("wrongTestArea").style.display = "block";
    showNextWrongQuestion();
}

function showNextWrongQuestion() {
    if (currentWrongTestIndex >= wrongTestWords.length) {
        alert("재시험 완료!");
        location.reload();
        return;
    }

    const q = wrongTestWords[currentWrongTestIndex];
    const qTextEl = document.getElementById("wrongQuestionText");
    const inputEl = document.getElementById("wrongAnswerInput");

    if (q.type === "passageBlank") {
        const displayHTML = q.fullText.replace(q.targetWord, 
            `<input type="text" id="innerWrongInput" class="passage-input" 
                    style="width:${q.correct.length * 15}px; border-bottom:2px solid #007bff; outline:none;">`
        );
        qTextEl.innerHTML = `<div style="text-align:left; line-height:2;">${displayHTML}</div>`;
        inputEl.style.display = "none"; 
        
        setTimeout(() => {
            const inner = document.getElementById("innerWrongInput");
            if(inner) {
                inner.focus();
                inner.addEventListener("keydown", (e) => { if(e.key === "Enter") submitWrongTestAnswer(); });
            }
        }, 50);
    } else {
        qTextEl.innerText = `(${currentWrongTestIndex + 1}/${wrongTestWords.length}) ${q.question}`;
        inputEl.style.display = "inline-block";
        inputEl.value = "";
        inputEl.focus();
    }
}

function submitWrongTestAnswer() {
    const inner = document.getElementById("innerWrongInput");
    const userInput = (inner ? inner.value : document.getElementById("wrongAnswerInput").value).trim().toLowerCase();
    const currentQ = wrongTestWords[currentWrongTestIndex];
    let isCorrect = false;

    if (currentQ.type === "wordMeaning") {
        const userMeans = userInput.split(",").map(m => m.trim()).filter(m => m !== "");
        const correctMeans = currentQ.correct.split(",").map(m => m.trim().toLowerCase());
        isCorrect = (userMeans.length === correctMeans.length && correctMeans.every(m => userMeans.includes(m)));
    } else {
        const cleanUser = userInput.replace(/[^a-zA-Z0-9]/g, "");
        const cleanCorrect = currentQ.correct.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
        isCorrect = (cleanUser === cleanCorrect);
    }

    if (isCorrect) {
        showFeedback(true);
        let allNotes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
        const updatedNotes = allNotes.filter(n => !(n.question === currentQ.question && n.type === currentQ.type));
        localStorage.setItem("wrongNotes", JSON.stringify(updatedNotes));
    } else {
        showFeedback(false, currentQ.correct);
    }

    setTimeout(() => {
        currentWrongTestIndex++;
        showNextWrongQuestion();
    }, 1200);
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("setList")) loadSets();
    if (document.getElementById("setSelection")) loadTestSets();
    if (document.getElementById("passageList")) loadPassages();
    if (document.getElementById("passageSelection")) loadPassageSelection();
    if (document.getElementById("wrongNoteList")) loadWrongNotes();

    const bindEnter = (id, action) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("keydown", (e) => { 
                if (e.key === "Enter") { e.preventDefault(); action(); }
            });
        }
    };

    bindEnter("answerInput", submitAnswer);
    bindEnter("wrongAnswerInput", submitWrongTestAnswer);
    bindEnter("englishWord", addWord);
    bindEnter("meanings", addWord);
});

function loadPassageSelection() {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const container = document.getElementById("passageSelection");
    
    if (!container) return; 

    container.innerHTML = `
        <input type="text" id="passageSearchInput" onkeyup="filterPassageSelection()" 
               placeholder="지문 제목 검색..." 
               style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <div id="passageRealList"></div>
    `;
    
    const listDiv = document.getElementById("passageRealList");

    if (passages.length === 0) {
        listDiv.innerHTML = "<p style='padding:10px;'>등록된 지문이 없습니다.</p>";
        return;
    }

    passages.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "setItem passage-item";
        div.setAttribute("data-name", p.title.toLowerCase());
        div.innerHTML = `
            <label style="display: block; padding: 5px 0; cursor: pointer;">
                <input type="checkbox" value="${i}"> ${p.title}
            </label>
        `;
        listDiv.appendChild(div);
    });
}

function filterPassageSelection() {
    const query = document.getElementById("passageSearchInput").value.toLowerCase();
    const items = document.querySelectorAll(".passage-item");
    
    items.forEach(item => {
        const title = item.getAttribute("data-name");
        item.style.display = title.includes(query) ? "block" : "none";
    });
}


function startPassageTest() {
    const checks = document.querySelectorAll("#passageSelection input[type='checkbox']:checked");
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const type = document.querySelector("input[name='passageType']:checked").value;
    
    testPassages = [];
    checks.forEach(c => {
        testPassages.push(passages[c.value]);
    });

    if (testPassages.length === 0) {
        alert("테스트할 지문을 하나 이상 선택하세요.");
        return;
    }

    currentPassageMode = type; 

    startStudySession();
    shuffleArray(testPassages);
    currentPassageIndex = 0;
    passageCorrect = 0;

    document.getElementById("setupArea").style.display = "none"; 
    const testArea = document.getElementById("passageTestArea");
    if (testArea) testArea.style.display = "block";
    
    showPassageQuestion();
}

let currentPassageMode = "blank";

function submitPassageAnswer() {
    if (currentPassageMode === "blank") {
        submitBlankAnswer();
    } else {
        submitRewriteAnswer();
    }
}

function submitBlankAnswer() {
    const inputs = document.querySelectorAll(".passage-input");
    const p = testPassages[currentPassageIndex];
    let correctInThisPassage = 0;

    inputs.forEach(input => {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = input.getAttribute("data-answer").toLowerCase();
        const fullWord = input.getAttribute("data-fullword");

        if (userAnswer === correctAnswer) {
            input.style.borderBottom = "2px solid #28a745";
            input.style.color = "#28a745";
            correctInThisPassage++;
        } else {
            input.style.borderBottom = "2px solid #dc3545";
            input.style.color = "#dc3545";
            input.value = fullWord;
            savePassageWrongNote(p.text, fullWord, correctAnswer, userAnswer);
        }
        input.disabled = true;
    });

    passageCorrect += correctInThisPassage;
    const resultDiv = document.getElementById("passageResult");
    if (resultDiv) resultDiv.innerHTML = `결과: <span style="color:#28a745">${correctInThisPassage}</span> 맞힘`;
}

function submitRewriteAnswer() {
    const p = testPassages[currentPassageIndex];
    const userText = document.getElementById("rewriteInput").value.trim();
    const originalText = p.text.trim();
    
    if (userText.toLowerCase() === originalText.toLowerCase()) {
        alert("완벽합니다! 지문을 모두 맞히셨습니다.");
        passageCorrect++;
    } else {
        alert("원본과 차이가 있습니다. 원본 지문을 확인해 보세요.");
    }
}
function closePassage() {
    const viewSection = document.getElementById("passageViewSection");
    if (viewSection) {
        viewSection.style.display = "none";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function startWordTest() {
    const checkboxes = document.querySelectorAll("#setSelection input:checked");
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    
    const typeEl = document.querySelector("input[name='wordTestType']:checked");
    const type = typeEl ? typeEl.value : "meaning";

    testWords = [];
    checkboxes.forEach(cb => { testWords = testWords.concat(sets[cb.value].words); });
    
    if (testWords.length === 0) { alert("세트를 선택하세요."); return; }
    
    startStudySession();
    shuffleArray(testWords);
    currentQuestion = 0; correctCount = 0; wrongWords = [];
    document.getElementById("testArea").style.display = "block";
    showQuestion();
}

function loadTestSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const container = document.getElementById("setSelection");
    
    if (!container) return;
    container.innerHTML = "";

    if (sets.length === 0) {
        container.innerHTML = "<p style='padding:10px; color:#999;'>등록된 단어 세트가 없습니다.</p>";
        return;
    }

    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.className = "setItem word-set-item";
        div.setAttribute("data-name", set.name.toLowerCase());
        div.innerHTML = `
            <label style="display: block; padding: 8px 5px; cursor: pointer; border-bottom: 1px solid #f0f0f0;">
                <input type="checkbox" value="${i}"> ${set.name} 
                <span style="font-size: 0.85rem; color: #888;">(${set.words.length}단어)</span>
            </label>
        `;
        container.appendChild(div);
    });
}

function filterWordSets() {
    const query = document.getElementById("wordSetSearchInput").value.toLowerCase();
    const items = document.querySelectorAll(".word-set-item");
    
    items.forEach(item => {
        const setName = item.getAttribute("data-name");
        if (setName.includes(query)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

function submitAnswer() {
    clearInterval(timerInterval);

    const typeEl = document.querySelector("input[name='wordTestType']:checked");
    const type = typeEl ? typeEl.value : "meaning";
    
    const word = testWords[currentQuestion];
    const answerInput = document.getElementById("answerInput");
    const userAnswer = answerInput.value.trim();

    let isCorrect = false;
    if (type === "meaning") {
        const userMeans = userAnswer.split(",").map(m => m.trim().toLowerCase()).filter(m => m !== "");
        const correctMeans = word.mean.map(m => m.trim().toLowerCase());
        isCorrect = (userMeans.length === correctMeans.length && correctMeans.every(m => userMeans.includes(m)));
    } else {
        isCorrect = (userAnswer.toLowerCase() === word.eng.toLowerCase());
    }

    if (isCorrect) {
        correctCount++;
        recordQuestion("word", true, word.eng);
        showFeedback(true);
    } else {
        recordQuestion("word", false, word.eng, userAnswer);
        const correctMsg = type === 'meaning' ? word.mean.join(", ") : word.eng;
        showFeedback(false, correctMsg); 
    }

    answerInput.disabled = true;

    setTimeout(() => {
        answerInput.disabled = false;
        currentQuestion++;
        showQuestion();
    }, 1200);
}

function showFeedback(isCorrect, msg = "") {
    let feedbackEl = document.getElementById("testFeedback");
    
    if (!feedbackEl) {
        feedbackEl = document.createElement("div");
        feedbackEl.id = "testFeedback";
        feedbackEl.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:20px 40px; border-radius:15px; color:white; font-size:1.5rem; font-weight:bold; z-index:10000; display:none; text-align:center; min-width:200px;";
        document.body.appendChild(feedbackEl);
    }

    feedbackEl.innerText = isCorrect ? "정답" : `오답: ${msg}`;
    feedbackEl.style.backgroundColor = isCorrect ? "rgba(40, 167, 69, 0.95)" : "rgba(220, 53, 69, 0.95)";
    feedbackEl.style.display = "block";

    setTimeout(() => {
        feedbackEl.style.display = "none";
    }, 1000);
}

function showQuestion() {
    if (currentQuestion >= testWords.length) { 
        endTest(); 
        return; 
    }
    
    const typeEl = document.querySelector("input[name='wordTestType']:checked");
    const type = typeEl ? typeEl.value : "meaning";
    
    const word = testWords[currentQuestion];
    const progress = `(${currentQuestion + 1}/${testWords.length}) `;
    
    document.getElementById("question").innerText = progress + (type === "meaning" ? word.eng : word.mean.join(", "));
    
    const answerInput = document.getElementById("answerInput");
    answerInput.value = "";
    answerInput.disabled = false;
    answerInput.focus();
    
    startTimer();
}

function toggleTranslation() {
    const tContainer = document.getElementById("passageTranslationView");
    const opt = document.getElementById("showTranslationOpt");
    
    if (tContainer && opt) {
        tContainer.style.display = opt.checked ? "block" : "none";
    }
}

function showPassageQuestion() {
    if (currentPassageIndex >= testPassages.length) {
        endPassageTest();
        return;
    }

    const p = testPassages[currentPassageIndex];
    const qContainer = document.getElementById("passageQuestion");
    const tContainer = document.getElementById("passageTranslationView");
    const opt = document.getElementById("showTranslationOpt");

    if (!qContainer) return;

    qContainer.innerHTML = ""; 
    
    if (tContainer) {
        tContainer.innerText = `[해석] ${p.translation || '해석 정보가 없습니다.'}`;
        tContainer.style.display = (opt && opt.checked) ? "block" : "none";
    }

    if (currentPassageMode === "blank") {
        const allWords = p.text.trim().split(/\s+/); 
        const removeCount = Math.max(1, Math.floor(allWords.length * 0.15));
        let indexes = [];
        while (indexes.length < removeCount) {
            let r = Math.floor(Math.random() * allWords.length);
            if (!indexes.includes(r)) indexes.push(r);
        }

        blankAnswers = [];
        const htmlContent = allWords.map((word, i) => {
            if (indexes.includes(i)) {
                const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
                const punctuation = word.replace(cleanWord, ""); 
                blankAnswers.push(cleanWord);
                return `<input type="text" class="passage-input" data-answer="${cleanWord}" data-fullword="${word}" style="width:${Math.max(cleanWord.length * 15, 50)}px;">${punctuation}`;
            }
            return `<span>${word}</span>`;
        }).join(" ");
        qContainer.innerHTML = htmlContent;
    } else {
        qContainer.innerHTML = `
            <p style="margin-bottom:10px; color:#666;">지문 전체를 아래에 타이핑하세요.</p>
            <textarea id="rewriteInput" style="width:100%; height:200px; padding:15px; font-size:1.1rem; border:2px solid #ddd; border-radius:10px;"></textarea>
        `;
    }
}
