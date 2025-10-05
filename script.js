// script.js

// Display current date & time
function updateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);

// DOM references
const fileInput = document.getElementById('pdfFiles');
const toggleBtn = document.getElementById('toggleBtn');
const resultsDiv = document.getElementById('results');
const columns = [document.getElementById('col1'), document.getElementById('col2'), document.getElementById('col3')];
const newNumbersDiv = document.getElementById('newNumbers');
const randomContainer = document.getElementById('randomContainer');
const randomToggle = document.getElementById('randomToggle');

// Manual generator references
const manualStart = document.getElementById('manualStart');
const manualEnd = document.getElementById('manualEnd');
const manualCount = document.getElementById('manualCount');
const manualGenerateBtn = document.getElementById('manualGenerateBtn');
const manualResults = document.getElementById('manualResults');

let preparedHTML = ["","",""];
let latestNumbers = [new Set(), new Set(), new Set()];

// Toggle extracted numbers
toggleBtn.addEventListener('click', ()=>{
    if(resultsDiv.style.display === "none"){
        resultsDiv.style.display = "flex";
        toggleBtn.textContent = "Hide Extracted Numbers";
        columns.forEach((col, idx)=>{ col.innerHTML = preparedHTML[idx]; });
    } else {
        resultsDiv.style.display = "none";
        toggleBtn.textContent = "Show Extracted Numbers";
    }
});

// Toggle 50 random numbers
randomToggle.addEventListener('click', ()=>{
    if(newNumbersDiv.style.display==='none') newNumbersDiv.style.display='grid';
    else newNumbersDiv.style.display='none';
});

// Random number generator helper
function generateRandomNumbers(existingNumbers, count = 50){
    const existingLast3 = new Set(existingNumbers.map(n=>n%1000));
    const existingAll = new Set(existingNumbers);
    const newNumbers = [];
    while(newNumbers.length < count){
        let num = Math.floor(Math.random()*10000);
        let last3 = num % 1000;
        if(!existingLast3.has(last3) && !existingAll.has(num)){
            newNumbers.push(num.toString().padStart(4,'0'));
            existingLast3.add(last3);
            existingAll.add(num);
        }
    }
    return newNumbers.sort((a,b)=>a-b);
}

// Manual generator
manualGenerateBtn.addEventListener('click', ()=>{
    let start = parseInt(manualStart.value);
    let end = parseInt(manualEnd.value);
    let count = parseInt(manualCount.value);
    if(isNaN(start) || isNaN(end) || isNaN(count) || start>=end || count<1) {
        alert("Enter valid numbers");
        return;
    }
    const rand = [];
    while(rand.length<count){
        let n = Math.floor(Math.random()*(end-start+1))+start;
        rand.push(n.toString().padStart(4,'0'));
    }
    manualResults.innerHTML="";
    rand.forEach(n=>{
        const d = document.createElement("div");
        d.textContent=n;
        manualResults.appendChild(d);
    });
});

// PDF upload logic (simplified version)
fileInput.addEventListener('change', async ()=>{
    const files = Array.from(fileInput.files).slice(0,9);
    if(files.length===0) return;

    // Reset columns
    columns.forEach(col=>col.innerHTML=col.querySelector('h3').outerHTML);
    resultsDiv.style.display="none";
    toggleBtn.textContent="Show Extracted Numbers";

    const columnData=[{},{},{}];
    const extractedNumbers=[[],[],[]];

    for(const file of files){
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const fname = file.name.toLowerCase();
        let colIndex = null;
        if(fname.includes('mn')||fname.includes('me')) colIndex=0;
        else if(fname.includes('dn')||fname.includes('de')) colIndex=1;
        else if(fname.includes('ed')||fname.includes('en')) colIndex=2;
        else continue;

        for(let i=1;i<=pdf.numPages;i++){
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item=>item.str).join(" ");

            const numRegex = /\b\d{4}\b/g;
            const numbers = pageText.match(numRegex)||[];
            const numInts = numbers.map(n=>parseInt(n));
            extractedNumbers[colIndex].push(...numInts);

            const dateRegex = /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g;
            const datesFound = pageText.match(dateRegex)||[];
            const date = datesFound[0]||"Unknown Date";

            if(!columnData[colIndex][date]) columnData[colIndex][date]=[];
            if(numbers.length>0) columnData[colIndex][date].push(numInts.sort((a,b)=>a-b));
        }
    }

    // Prepare column HTML
    columns.forEach((col, idx)=>{
        let html=col.querySelector('h3').outerHTML;
        const sortedDates=Object.keys(columnData[idx]).sort((a,b)=>new Date(a)-new Date(b));
        sortedDates.forEach(date=>{
            html+=`<div class="date-block"><b>${date}</b>`;
            columnData[idx][date].forEach(numArray=>{
                html+=numArray.join("<br>")+'<div class="hr-gap"></div>';
            });
            html+='</div>';
        });
        preparedHTML[idx]=html;
        latestNumbers[idx]=new Set(extractedNumbers[idx]);
    });

    // Generate 50 new random numbers
    const allExtracted = extractedNumbers.flat();
    const newRand = generateRandomNumbers(allExtracted.length?allExtracted:[],50);
    newNumbersDiv.innerHTML="";
    newRand.forEach(num=>{
        const div = document.createElement("div");
        div.textContent=num;
        newNumbersDiv.appendChild(div);
    });

    randomContainer.style.display="flex";
    newNumbersDiv.style.display="grid";
});