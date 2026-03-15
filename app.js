let studyStartTime=null
// app.js 상단에 있어야 할 변수들
let testWords = [];
let currentQuestion = 0;
let correctCount = 0;
let wrongWords = [];
let timerInterval;
let timeLeft = 10;
let studyStartTime = null; // 이것도 추가!

function goHome(){
location.href="../index.html"
}



function getStats(){
return JSON.parse(localStorage.getItem("stats")) || {

totalQuestions:0,
totalCorrect:0,

wordQuestions:0,
wordCorrect:0,

passageQuestions:0,
passageCorrect:0,

wrongWords:{},
passageStudy:{},
studyDates:[]
}
}

function saveStats(stats){
localStorage.setItem("stats",JSON.stringify(stats))
}

function recordStudy(){
let stats=getStats()
const today=new Date().toISOString().slice(0,10)
if(!stats.studyDates.includes(today)){
stats.studyDates.push(today)
}
saveStats(stats)
}

function recordQuestion(type,correct,question){
let stats=getStats()
stats.totalQuestions++
if(correct) stats.totalCorrect++
if(type==="word"){
stats.wordQuestions++
if(correct) stats.wordCorrect++
}
if(type==="passage"){
stats.passageQuestions++
if(correct) stats.passageCorrect++
}
if(!correct && type==="word"){
stats.wrongWords[question]=(stats.wrongWords[question]||0)+1
}
if(type==="passage"){
stats.passageStudy[question]=(stats.passageStudy[question]||0)+1
}
recordStudy()
saveStats(stats)
}

function loadStats(){
let stats=getStats()
if(!document.getElementById("totalQuestions")) return

document.getElementById("totalQuestions").textContent=stats.totalQuestions
document.getElementById("totalCorrect").textContent=stats.totalCorrect

let rate=0
if(stats.totalQuestions>0){
rate=Math.round((stats.totalCorrect/stats.totalQuestions)*100)
}
document.getElementById("totalRate").textContent=rate+"%"
let wordRate=0
if(stats.wordQuestions>0){
wordRate=Math.round((stats.wordCorrect/stats.wordQuestions)*100)
}

document.getElementById("wordRate").textContent=wordRate+"%"
let passageRate=0
if(stats.passageQuestions>0){
passageRate=Math.round((stats.passageCorrect/stats.passageQuestions)*100)
}

document.getElementById("passageRate").textContent=passageRate+"%"
let mostWrong="없음"
let max=0
for(let w in stats.wrongWords){
if(stats.wrongWords[w]>max){
max=stats.wrongWords[w]
mostWrong=w
}
}
document.getElementById("mostWrongWord").textContent=mostWrong
let mostPassage="없음"
max=0
for(let p in stats.passageStudy){
if(stats.passageStudy[p]>max){
max=stats.passageStudy[p]
mostPassage=p
}
}
document.getElementById("mostPassage").textContent=mostPassage
document.getElementById("studyDays").textContent=stats.studyDates.length
const minutes=stats.studyMinutes||0
document.getElementById("studyTime").textContent=minutes
}

let currentSetIndex=null
function loadSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const list = document.getElementById("setList");
    if (!list) return;
    list.innerHTML = "";
    const favDiv = document.createElement("div");
    favDiv.className = "wordCard";
    favDiv.innerHTML = `
        <b>★ 즐겨찾기 단어 모음</b>
        <div class="wordActions">
            <button class="smallBtn" onclick="openFavoriteSet()">열기</button>
        </div>
    `;
    list.appendChild(favDiv);
    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.className = "wordCard";
        div.innerHTML = `
            <b>${set.name}</b>
            <div class="wordActions">
                <button class="smallBtn" onclick="openSet(${i})">열기</button>
                <button class="smallBtn" onclick="deleteSet(${i})">삭제</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function openFavoriteSet() {
    currentSetIndex = "fav";
    document.getElementById("currentSetTitle").innerText = "★ 즐겨찾기 단어 모음";
    document.getElementById("wordSection").style.display = "block";
    
    loadWords();
}

function addSet(){

const name=document.getElementById("setName").value

if(!name) return

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

sets.push({name:name,words:[]})

localStorage.setItem("wordSets",JSON.stringify(sets))

document.getElementById("setName").value=""

loadSets()

}

function deleteSet(i){

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

sets.splice(i,1)

localStorage.setItem("wordSets",JSON.stringify(sets))

loadSets()

}

function openSet(i){

currentSetIndex=i

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

document.getElementById("currentSetTitle").innerText=sets[i].name

document.getElementById("wordSection").style.display="block"

loadWords()

}

function backToSets(){

document.getElementById("wordSection").style.display="none"

}

let displayedWords = [];

function loadWords() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    displayedWords = [];
    if (currentSetIndex === "fav") {
        sets.forEach(s => {
            s.words.forEach(w => { if(w.favorite) displayedWords.push(w); });
        });
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
        div.innerHTML = `
            <b>${w.eng}</b> : ${w.mean.join(", ")}
            <div class="wordActions">
                <button class="smallBtn" onclick="speakWord('${w.eng}')">🔊</button>
                <button class="smallBtn" id="favBtn-${i}" onclick="toggleFavorite(${i})">
                    ${w.favorite ? "★" : "☆"}
                </button>
                <button class="smallBtn" onclick="deleteWord(${i})">삭제</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function addWord(){

const eng=document.getElementById("englishWord").value

const meanings=document.getElementById("meanings").value

if(!eng || !meanings) return

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

const meanList=meanings.split(",")

sets[currentSetIndex].words.push({

eng:eng,

mean:meanList,

favorite:false

})

localStorage.setItem("wordSets",JSON.stringify(sets))

document.getElementById("englishWord").value=""
document.getElementById("meanings").value=""

loadWords()

setTimeout(()=>{
window.scrollTo(0,document.body.scrollHeight)
},50)

document.getElementById("englishWord").focus()

}

function deleteWord(i){

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

sets[currentSetIndex].words.splice(i,1)

localStorage.setItem("wordSets",JSON.stringify(sets))

loadWords()

}

function toggleFavorite(i) {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const targetWord = displayedWords[i]; 

    sets.forEach(s => {
        s.words.forEach(w => {
            if (w.eng === targetWord.eng && JSON.stringify(w.mean) === JSON.stringify(targetWord.mean)) {
                w.favorite = !w.favorite;
            }
        });
    });

    localStorage.setItem("wordSets", JSON.stringify(sets));

    if (currentSetIndex === "fav") {
        loadWords();
    } else {
        const starBtn = document.getElementById("favBtn-" + i);
        if (starBtn) {
            const isNowFavorite = !targetWord.favorite; 
            targetWord.favorite = isNowFavorite; // displayedWords 데이터도 업데이트
            starBtn.innerText = isNowFavorite ? "★" : "☆";
        }
    }
}

function speakWord(word){

speechSynthesis.cancel()

const msg=new SpeechSynthesisUtterance(word)

const voices=speechSynthesis.getVoices()

let englishVoice=null

for(let v of voices){
if(v.lang.startsWith("en")){
englishVoice=v
break
}
}

if(englishVoice){
msg.voice=englishVoice
}

msg.rate=0.85
msg.pitch=1

speechSynthesis.speak(msg)

}


let testWords=[]
let currentQuestion=0
let correctCount=0
let wrongWords=[]
let timerInterval
let timeLeft=10

function loadTestSets() {
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    const container = document.getElementById("setSelection");
    if (!container) return;

    container.innerHTML = "";
    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.className = "setItem";
        div.setAttribute("data-name", set.name.toLowerCase());
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${i}"> ${set.name}
            </label>
        `;
        container.appendChild(div);
    });
}

function filterTestSets() {
    const query = document.getElementById("setSearchInput").value.toLowerCase();
    const items = document.querySelectorAll(".setItem");
    
    items.forEach(item => {
        const name = item.getAttribute("data-name");
        item.style.display = name.includes(query) ? "block" : "none";
    });
}

function startWordTest() {
    const checkboxes = document.querySelectorAll("#setSelection input:checked");
    const sets = JSON.parse(localStorage.getItem("wordSets")) || [];
    testWords = [];

    checkboxes.forEach(cb => {
        const setIndex = cb.value;
        testWords = testWords.concat(sets[setIndex].words);
    });

    if (testWords.length === 0) {
        alert("테스트할 세트를 하나 이상 선택하세요.");
        return;
    }

    startStudySession();
    
    shuffleArray(testWords);

    currentQuestion = 0;
    correctCount = 0;
    wrongWords = [];

    document.getElementById("testArea").style.display = "block";
    document.getElementById("resultArea").innerHTML = "";
    
    showQuestion();
}
function showQuestion() {
    if (currentQuestion >= testWords.length) {
        endTest();
        return;
    }

    const type = document.getElementById("testType").value;
    const word = testWords[currentQuestion];
    const qElement = document.getElementById("question");
    
    const progress = `(${currentQuestion + 1}/${testWords.length}) `;

    if (type === "meaning") {
        qElement.innerText = progress + word.eng;
    } else {
        qElement.innerText = progress + word.mean.join(", ");
    }

    const input = document.getElementById("answerInput");
    input.value = "";
    input.focus();

    startTimer();
}

function submitAnswer() {
    clearInterval(timerInterval);

    const type = document.getElementById("testType").value;
    const word = testWords[currentQuestion];
    const userAnswer = document.getElementById("answerInput").value.trim();

    let isCorrect = false;

    if (type === "meaning") {
        const userMeans = userAnswer.split(",").map(m => m.trim()).filter(m => m !== "");
        isCorrect = (word.mean.length === userMeans.length && 
                     word.mean.every(m => userMeans.includes(m)));
    } else {
        isCorrect = (userAnswer.toLowerCase() === word.eng.toLowerCase());
    }

    if (isCorrect) {
        correctCount++;
        recordQuestion("word", true, word.eng);
    } else {
        recordQuestion("word", false, word.eng);
        wrongWords.push({
            question: word.eng,
            correct: word.mean.join(", "),
            user: userAnswer || "(무응답)"
        });
        alert(`오답입니다!\n정답: ${type === 'meaning' ? word.mean.join(", ") : word.eng}`);
    }

    currentQuestion++;
    showQuestion();
}

function endTest(){

endStudySession()

document.getElementById("testArea").style.display="none"

const result=document.getElementById("resultArea")

result.innerHTML=`

<h2>테스트 종료</h2>

<p>정답률: ${correctCount}/${testWords.length}</p>

`

saveWrongNotes()

}

function startTimer(){

timeLeft=10

const timer=document.getElementById("timer")

timer.innerText="남은 시간: "+timeLeft

timerInterval=setInterval(()=>{

timeLeft--

timer.innerText="남은 시간: "+timeLeft

if(timeLeft<=0){

clearInterval(timerInterval)

submitAnswer()

}

},1000)

}

function shuffleArray(array){

for(let i=array.length-1;i>0;i--){

const j=Math.floor(Math.random()*(i+1))

[array[i],array[j]]=[array[j],array[i]]

}

}

function saveWrongNotes(){

if(wrongWords.length===0) return

let notes=JSON.parse(localStorage.getItem("wrongNotes"))||[]

wrongWords.forEach(w=>{

notes.push({

type:"wordMeaning",

question:w.question,

correct:w.correct,

user:w.user

})

})

localStorage.setItem("wrongNotes",JSON.stringify(notes))

}

loadTestSets()



let testPassages=[]
let currentPassageIndex=0
let passageCorrect=0
let blankAnswers=[]

function loadPassageSelection(){

const passages=JSON.parse(localStorage.getItem("passages"))||[]

const container=document.getElementById("passageSelection")

if(!container) return

container.innerHTML=""

passages.forEach((p,i)=>{

const div=document.createElement("div")

div.className="setItem"

div.innerHTML=`
<label>
<input type="checkbox" value="${i}">
${p.title}
</label>
`

container.appendChild(div)

})

}

function startPassageTest(){

startStudySession()

const checks=document.querySelectorAll("#passageSelection input:checked")

const passages=JSON.parse(localStorage.getItem("passages"))||[]

testPassages=[]

checks.forEach(c=>{
testPassages.push(passages[c.value])
})

if(testPassages.length===0){
alert("지문을 선택하세요")
return
}

shuffleArray(testPassages)

currentPassageIndex=0
passageCorrect=0

document.getElementById("passageTestArea").style.display="block"

showPassageQuestion()

}

function showPassageQuestion(){

if(currentPassageIndex>=testPassages.length){

endPassageTest()
return

}

const type=document.getElementById("passageTestType").value

const p=testPassages[currentPassageIndex]

recordQuestion("passage",true,p.title)

const q=document.getElementById("passageQuestion")

if (type === "blank") {
    const words = p.text.split(" ");
    const removeCount = Math.floor(words.length / 8);
    let indexes = [];
    while (indexes.length < removeCount) {
        let r = Math.floor(Math.random() * words.length);
        if (!indexes.includes(r)) indexes.push(r);
    }

    blankAnswers = [];
    const htmlContent = words.map((word, i) => {
        if (indexes.includes(i)) {
            blankAnswers.push(word);
            return `<input type="text" class="inline-input" data-index="${blankAnswers.length - 1}" style="width:${word.length * 10 + 20}px">`;
        }
        return word;
    }).join(" ");

    q.innerHTML = htmlContent;
    document.getElementById("passageAnswer").style.display = "none";
}else{

q.innerHTML="해석:<br>"+p.translation

}

document.getElementById("passageAnswer").value=""

}

function submitPassageAnswer(){

const type=document.getElementById("passageTestType").value

const p=testPassages[currentPassageIndex]

const answer=document.getElementById("passageAnswer").value.trim()

let correct=false

if(type==="blank"){

let answers=answer.split(" ")

correct=JSON.stringify(answers)==JSON.stringify(blankAnswers)

}else{

let clean=(s)=>s.toLowerCase().replace(/[.,]/g,"").trim()

correct=clean(answer)===clean(p.text)

}

if(correct){

passageCorrect++

}else{

recordQuestion("passage",false,p.title)

savePassageWrong(p,answer)

alert("정답:\n"+p.text)

}

currentPassageIndex++

showPassageQuestion()

}

function endPassageTest(){

endStudySession()

document.getElementById("passageTestArea").style.display="none"

const result=document.getElementById("passageResult")

result.innerHTML=`

<h2>테스트 종료</h2>

<p>정답률: ${passageCorrect}/${testPassages.length}</p>

`

}

function savePassageWrong(p,user){

let notes=JSON.parse(localStorage.getItem("wrongNotes"))||[]

notes.push({

type:"passage",

title:p.title,

correct:p.text,

user:user

})

localStorage.setItem("wrongNotes",JSON.stringify(notes))

}

loadPassageSelection()



loadStats()

function searchWords(){

const input=document.getElementById("wordSearch")

if(!input) return

const keyword=input.value.toLowerCase()

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

if(currentSetIndex===null) return

const words=sets[currentSetIndex].words

words.sort((a, b) => a.eng.toLowerCase().localeCompare(b.eng.toLowerCase())); 

const list=document.getElementById("wordList")

list.innerHTML=""

words.forEach((w,i)=>{

const eng=w.eng.toLowerCase()

const mean=w.mean.join(" ").toLowerCase()

if(!eng.includes(keyword) && !mean.includes(keyword)) return

const div=document.createElement("div")

div.className="wordCard"

div.innerHTML=`

<b>${w.eng}</b> : ${w.mean.join(", ")}

<div class="wordActions">

<button class="smallBtn" onclick="speakWord('${w.eng}')">🔊</button>

<button class="smallBtn" id="fav-${i}" onclick="toggleFavorite(${i})">${w.favorite?"★":"☆"}</button>

<button class="smallBtn" onclick="deleteWord(${i})">삭제</button>

</div>

`

list.appendChild(div)

})

}

function searchPassages() {
    const input = document.getElementById("passageSearch");
    if (!input) return;
    const keyword = input.value.toLowerCase();
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const list = document.getElementById("passageList");
    if (!list) return;

    list.innerHTML = "";

    if (keyword === "") {
        loadPassages();
        return;
    }

    passages.forEach((p, i) => {
        if (!p.title.toLowerCase().includes(keyword)) return;
        renderPassageCard(p, i, list);
    });
}

function showFavorites(){

const sets=JSON.parse(localStorage.getItem("wordSets"))||[]

let favorites=[]

sets.forEach(set=>{

set.words.forEach(word=>{

if(word.favorite){

favorites.push(word)

}

})

})

if(favorites.length===0){

alert("즐겨찾기 단어가 없습니다")

return

}

let text="★ 즐겨찾기 단어\n\n"

favorites.forEach(w=>{

text+=w.eng+" : "+w.mean.join(", ")+"\n"

})

alert(text)

}

function startStudySession(){

studyStartTime=Date.now()

}

function endStudySession(){

if(!studyStartTime) return

let stats=getStats()

const now=Date.now()

const minutes=Math.floor((now-studyStartTime)/60000)

stats.studyMinutes=(stats.studyMinutes||0)+minutes

saveStats(stats)

studyStartTime=null

}

function exportData(){

const data={

wordSets:JSON.parse(localStorage.getItem("wordSets"))||[],

passages:JSON.parse(localStorage.getItem("passages"))||[],

wrongNotes:JSON.parse(localStorage.getItem("wrongNotes"))||[],

stats:JSON.parse(localStorage.getItem("stats"))||{}

}

const json=JSON.stringify(data,null,2)

const blob=new Blob([json],{type:"application/json"})

const url=URL.createObjectURL(blob)

const a=document.createElement("a")

a.href=url

a.download="study_backup.json"

a.click()

URL.revokeObjectURL(url)

alert("백업 파일이 다운로드되었습니다")

}



function importData(){

const fileInput=document.getElementById("importFile")

const file=fileInput.files[0]

if(!file){

alert("파일을 선택하세요")

return

}

const reader=new FileReader()

reader.onload=function(e){

try{

const data=JSON.parse(e.target.result)

if(data.wordSets){

localStorage.setItem("wordSets",JSON.stringify(data.wordSets))
}

if(data.passages){

localStorage.setItem("passages",JSON.stringify(data.passages))
}

if(data.wrongNotes){

localStorage.setItem("wrongNotes",JSON.stringify(data.wrongNotes))
}

if(data.stats){

localStorage.setItem("stats",JSON.stringify(data.stats))
}

alert("데이터 복원이 완료되었습니다. 페이지를 새로고침하세요.")

}catch(err){

alert("잘못된 파일입니다")

}

}

reader.readAsText(file)

}

window.onload=function(){
}

function goBack(){

history.back()

}

function enableEnterSystem(){

function bindEnter(inputId, action){

const el=document.getElementById(inputId)

if(!el) return

el.addEventListener("keydown",function(e){

if(e.key==="Enter"){
action()
}

})

}

bindEnter("englishWord",addWord)
bindEnter("meanings",addWord)

bindEnter("answerInput",submitAnswer)

bindEnter("passageAnswer",submitPassageAnswer)

}

document.addEventListener("DOMContentLoaded",enableEnterSystem)

function loadPassages() {
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    const list = document.getElementById("passageList");
    if(!list) return;
    list.innerHTML = "";

    passages.forEach((p, i) => {
        renderPassageCard(p, i, list);
    });
}

function renderPassageCard(p, i, container) {
    const div = document.createElement("div");
    div.className = "wordCard";
    div.innerHTML = `
        <div>
            <b>${p.title}</b>
        </div>
        <div class="wordActions">
            <button class="smallBtn" onclick="openPassage(${i})">열기</button>
            <button class="smallBtn" onclick="deletePassage(${i})">삭제</button>
        </div>
    `;
    container.appendChild(div);
}

function deletePassage(i) {
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const passages = JSON.parse(localStorage.getItem("passages")) || [];
    passages.splice(i, 1);
    localStorage.setItem("passages", JSON.stringify(passages));
    loadPassages();
}


function addPassage(){

const title=document.getElementById("title").value
const text=document.getElementById("text").value
const translation=document.getElementById("translation").value
const topic=document.getElementById("topic").value

if(!title || !text) return

const passages=JSON.parse(localStorage.getItem("passages"))||[]

passages.push({
title:title,
text:text,
translation:translation,
topic:topic
})

localStorage.setItem("passages",JSON.stringify(passages))

document.getElementById("title").value=""
document.getElementById("text").value=""
document.getElementById("translation").value=""
document.getElementById("topic").value=""

loadPassages()

}

let currentWrongType = 'all';

function showWrong(type) {
    currentWrongType = type;
    const notes = JSON.parse(localStorage.getItem("wrongNotes")) || [];
    const list = document.getElementById("wrongList");
    
    if (!list) return; 

    list.innerHTML = "";

    const filtered = type === 'all' ? notes : notes.filter(n => n.type === type);

    filtered.forEach((n, i) => {
        const div = document.createElement("div");
        div.className = "wrongItem";
        div.innerHTML = `
            <p><b>문제:</b> ${n.question || n.title}</p>
            <p style="color:red">내 답: ${n.user}</p>
            <p style="color:blue">정답: ${n.correct}</p>
        `;
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

function closePassage() {
    document.getElementById("passageViewSection").style.display = "none";
}
