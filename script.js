// CampusVote - Online Voting System (Demo)
// data is saved in localStorage so it stays only in this browser

let ADMIN_PASSWORD = "admin123";
let VVPAT_SECONDS = 5;
let colors = ["#3b82f6", "#f97316", "#ef4444", "#14b8a6", "#22c55e", "#eab308", "#a855f7", "#ec4899"];

// default data (used first time or after reset)
function defaultData() {
    return {
        votingOpen: true,
        candidates: [
            { id: 1, name: "Riya Kapoor", symbol: "🌻", slogan: "Clean and green campus", votes: 0 },
            { id: 2, name: "Arjun Negi", symbol: "🏀", slogan: "Inter-college sports meet", votes: 0 },
            { id: 3, name: "Meera Iyer", symbol: "🎭", slogan: "More clubs, more fests", votes: 0 },
            { id: 4, name: "Dev Malhotra", symbol: "🚌", slogan: "Extra college bus routes", votes: 0 },
            { id: 99, name: "NOTA", symbol: "✖️", slogan: "None of the above", votes: 0 }
        ],
        voters: []    // only name, roll, dept, year, time. NOT the candidate (secret ballot)
    };
}

let data = JSON.parse(localStorage.getItem("electionData")) || defaultData();
let currentVoter = null;   // voter who passed step 1
let busy = false;          // true while VVPAT slip is showing

function saveData() {
    localStorage.setItem("electionData", JSON.stringify(data));
}

function votedOnThisBrowser() {
    return localStorage.getItem("votedHere") != null;
}

function findCandidate(id) {
    for (let i = 0; i < data.candidates.length; i++) {
        if (data.candidates[i].id == id) {
            return data.candidates[i];
        }
    }
    return null;
}

function totalVotes() {
    let total = 0;
    for (let i = 0; i < data.candidates.length; i++) {
        total += data.candidates[i].votes;
    }
    return total;
}


/* ================= tabs ================= */

function openTab(id) {
    let tabs = document.querySelectorAll(".tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.add("hidden");
    }
    document.getElementById(id).classList.remove("hidden");

    let btns = document.querySelectorAll(".nav-btn");
    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.remove("active");
    }
    document.getElementById("nav-" + id).classList.add("active");

    if (id == "voteTab") showVoteScreen();
    if (id == "resultTab") showResults();
    if (id == "adminTab") showAdmin();
}

function updateBadge() {
    let badge = document.getElementById("statusBadge");
    if (data.votingOpen) {
        badge.innerHTML = "Voting Open";
        badge.classList.remove("closed");
    } else {
        badge.innerHTML = "Voting Closed";
        badge.classList.add("closed");
    }
}


/* ================= voting ================= */

function setStep(n) {
    for (let i = 1; i <= 3; i++) {
        let s = document.getElementById("step" + i);
        s.classList.remove("active");
        s.classList.remove("done");
        if (i < n) s.classList.add("done");
        if (i == n) s.classList.add("active");
    }
}

function hideVoteBoxes() {
    document.getElementById("verifyBox").classList.add("hidden");
    document.getElementById("evmBox").classList.add("hidden");
    document.getElementById("doneBox").classList.add("hidden");
    document.getElementById("closedBox").classList.add("hidden");
}

// decides which box to show in vote tab
function showVoteScreen() {
    hideVoteBoxes();

    if (votedOnThisBrowser()) {
        document.getElementById("doneTime").innerHTML = "Voted on " + localStorage.getItem("votedHere");
        document.getElementById("doneBox").classList.remove("hidden");
        setStep(3);
    } else if (!data.votingOpen) {
        document.getElementById("closedBox").classList.remove("hidden");
        setStep(0);
    } else if (currentVoter != null) {
        document.getElementById("evmBox").classList.remove("hidden");
        setStep(2);
    } else {
        document.getElementById("verifyBox").classList.remove("hidden");
        setStep(1);
    }
}

function verifyVoter() {
    let msg = document.getElementById("verifyMsg");
    let name = document.getElementById("vName").value.trim();
    let roll = document.getElementById("vRoll").value.trim().toUpperCase();
    let dept = document.getElementById("vDept").value;
    let year = document.getElementById("vYear").value;
    let agree = document.getElementById("vAgree").checked;

    if (name.length < 3 || !/^[A-Za-z ]+$/.test(name)) {
        msg.innerHTML = "Please enter your full name (letters only).";
        return;
    }
    if (roll.length < 4 || !/^[A-Z0-9]+$/.test(roll)) {
        msg.innerHTML = "Roll number should have only letters and numbers.";
        return;
    }
    if (dept == "" || year == "") {
        msg.innerHTML = "Please select your department and year.";
        return;
    }
    if (!agree) {
        msg.innerHTML = "Please tick the checkbox.";
        return;
    }

    // same roll number cannot vote again
    for (let i = 0; i < data.voters.length; i++) {
        if (data.voters[i].roll == roll) {
            msg.innerHTML = "Roll number " + roll + " has already voted!";
            return;
        }
    }

    msg.innerHTML = "";
    currentVoter = { name: name, roll: roll, dept: dept, year: year };
    document.getElementById("voterInfo").innerHTML =
        "Voter: <b>" + name + "</b> &nbsp;|&nbsp; " + roll + " &nbsp;|&nbsp; " + dept + ", " + year;
    showBallot();
    showVoteScreen();
}

function showBallot() {
    let html = "";
    for (let i = 0; i < data.candidates.length; i++) {
        let c = data.candidates[i];
        html += "<div class='evm-row'>" +
            "<span class='sno'>" + (i + 1) + "</span>" +
            "<span class='cname'>" + c.name + "<br><span class='slogan'>" + c.slogan + "</span></span>" +
            "<span class='sym'>" + c.symbol + "</span>" +
            "<i class='lamp' id='lamp" + c.id + "'></i>" +
            "<button class='evm-btn' onclick='castVote(" + c.id + ")' title='Vote'></button>" +
            "</div>";
    }
    document.getElementById("ballot").innerHTML = html;
}

// beep sound like the real machine (made with Web Audio, no mp3 needed)
function beep() {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        osc.frequency.value = 900;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(function () {
            osc.stop();
            ctx.close();
        }, 700);
    } catch (e) {
        // sound not supported, no problem
    }
}

function castVote(id) {
    if (busy || currentVoter == null || votedOnThisBrowser() || !data.votingOpen) {
        return;
    }
    busy = true;

    // lock all buttons and switch on the red lamp
    let btns = document.querySelectorAll(".evm-btn");
    for (let i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
    }
    document.getElementById("lamp" + id).classList.add("on");
    beep();

    // save the vote
    let c = findCandidate(id);
    c.votes++;
    let time = new Date().toLocaleString("en-IN");
    data.voters.push({
        name: currentVoter.name,
        roll: currentVoter.roll,
        dept: currentVoter.dept,
        year: currentVoter.year,
        time: time
    });
    saveData();
    localStorage.setItem("votedHere", time);

    showSlip(c);
}

// VVPAT slip shows for few seconds then goes
function showSlip(c) {
    let index = data.candidates.indexOf(c) + 1;
    document.getElementById("slipNo").innerHTML = "Sr. No. " + index;
    document.getElementById("slipSymbol").innerHTML = c.symbol;
    document.getElementById("slipName").innerHTML = c.name;
    document.getElementById("vvpat").classList.remove("hidden");

    let sec = VVPAT_SECONDS;
    document.getElementById("slipTimer").innerHTML = "Slip visible for " + sec + " seconds";

    let timer = setInterval(function () {
        sec--;
        if (sec <= 0) {
            clearInterval(timer);
            document.getElementById("vvpat").classList.add("hidden");
            currentVoter = null;
            busy = false;
            clearForm();
            showVoteScreen();
        } else {
            document.getElementById("slipTimer").innerHTML = "Slip visible for " + sec + " seconds";
        }
    }, 1000);
}

function clearForm() {
    document.getElementById("vName").value = "";
    document.getElementById("vRoll").value = "";
    document.getElementById("vDept").value = "";
    document.getElementById("vYear").value = "";
    document.getElementById("vAgree").checked = false;
}


/* ================= results ================= */

function showResults() {
    let total = totalVotes();

    document.getElementById("statVotes").innerHTML = total;
    document.getElementById("statCand").innerHTML = data.candidates.length - 1;   // without NOTA
    document.getElementById("statStatus").innerHTML = data.votingOpen ? "Open" : "Closed";

    // copy and sort, highest votes first
    let sorted = data.candidates.slice();
    sorted.sort(function (a, b) {
        return b.votes - a.votes;
    });

    // ----- ranking bars -----
    let bars = "";
    for (let i = 0; i < sorted.length; i++) {
        let c = sorted[i];
        let percent = total > 0 ? (c.votes / total) * 100 : 0;
        let color = getColor(c);
        bars += "<div class='bar-row'>" +
            "<div class='bar-top'><span>" + (i + 1) + ". " + c.symbol + " " + c.name + "</span>" +
            "<span>" + c.votes + (c.votes == 1 ? " vote" : " votes") + " (" + percent.toFixed(1) + "%)</span></div>" +
            "<div class='bar'><div class='fill' style='width:" + percent + "%; background-color:" + color + "'></div></div>" +
            "</div>";
    }
    document.getElementById("bars").innerHTML = bars;

    // ----- pie chart using conic-gradient -----
    let pie = document.getElementById("pie");
    let legend = "";
    if (total == 0) {
        pie.style.background = "#e5e7eb";
        legend = "<p class='small'>No votes yet</p>";
    } else {
        let parts = [];
        let start = 0;
        for (let i = 0; i < data.candidates.length; i++) {
            let c = data.candidates[i];
            if (c.votes == 0) continue;
            let end = start + (c.votes / total) * 100;
            parts.push(getColor(c) + " " + start + "% " + end + "%");
            legend += "<p><i style='background-color:" + getColor(c) + "'></i>" + c.name + " - " + ((c.votes / total) * 100).toFixed(1) + "%</p>";
            start = end;
        }
        pie.style.background = "conic-gradient(" + parts.join(", ") + ")";
    }
    document.getElementById("legend").innerHTML = legend;

    // ----- winner / leading -----
    let winnerBox = document.getElementById("winnerBox");
    if (total == 0) {
        winnerBox.innerHTML = "No votes yet. Be the first one to vote!";
    } else {
        let top = sorted[0].votes;
        let leaders = [];
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].votes == top) {
                leaders.push(sorted[i].symbol + " " + sorted[i].name);
            }
        }

        let word = data.votingOpen ? "Leading" : "Winner";
        if (leaders.length > 1) {
            winnerBox.innerHTML = (data.votingOpen ? "Tie right now: " : "Result is a tie: ") + leaders.join(" & ");
        } else if (sorted[0].id == 99) {
            winnerBox.innerHTML = "NOTA has the most votes!";
        } else {
            winnerBox.innerHTML = "&#127942; " + word + ": " + leaders[0] + " with " + top + (top == 1 ? " vote" : " votes");
        }
    }

    // ----- voters by department (does not show who they voted for) -----
    let deptCount = {};
    for (let i = 0; i < data.voters.length; i++) {
        let d = data.voters[i].dept;
        if (deptCount[d] == undefined) deptCount[d] = 0;
        deptCount[d]++;
    }
    let deptHtml = "";
    for (let d in deptCount) {
        deptHtml += "<div class='dept-row'><span>" + d + "</span><b>" + deptCount[d] + "</b></div>";
    }
    if (deptHtml == "") deptHtml = "<p class='small'>No voters yet.</p>";
    document.getElementById("deptList").innerHTML = deptHtml;
}

// NOTA always grey, others get colors in order
function getColor(c) {
    if (c.id == 99) return "#9ca3af";
    let index = data.candidates.indexOf(c);
    return colors[index % colors.length];
}


/* ================= admin ================= */

let adminLoggedIn = false;

function showAdmin() {
    if (adminLoggedIn) {
        document.getElementById("loginBox").classList.add("hidden");
        document.getElementById("adminPanel").classList.remove("hidden");
        renderAdmin();
    } else {
        document.getElementById("loginBox").classList.remove("hidden");
        document.getElementById("adminPanel").classList.add("hidden");
    }
}

function adminLogin() {
    if (document.getElementById("adminPass").value == ADMIN_PASSWORD) {
        adminLoggedIn = true;
        document.getElementById("adminPass").value = "";
        document.getElementById("loginMsg").innerHTML = "";
        showAdmin();
    } else {
        document.getElementById("loginMsg").innerHTML = "Wrong password!";
    }
}

function adminLogout() {
    adminLoggedIn = false;
    showAdmin();
}

function adminMessage(text) {
    document.getElementById("adminMsg").innerHTML = text;
}

function renderAdmin() {
    document.getElementById("toggleBtn").innerHTML = data.votingOpen ? "Close Voting" : "Open Voting";

    // candidate list
    let started = data.voters.length > 0;
    let html = "";
    for (let i = 0; i < data.candidates.length; i++) {
        let c = data.candidates[i];
        let disable = (started || c.id == 99) ? "disabled" : "";
        html += "<div class='cand-row'>" +
            "<span>" + c.symbol + " <b>" + c.name + "</b> <span class='small'>" + c.slogan + "</span></span>" +
            "<button class='del-btn' " + disable + " onclick='deleteCandidate(" + c.id + ")'>Remove</button>" +
            "</div>";
    }
    document.getElementById("candList").innerHTML = html;

    // voter list
    let rows = "";
    for (let i = 0; i < data.voters.length; i++) {
        let v = data.voters[i];
        rows += "<tr><td>" + (i + 1) + "</td><td>" + v.name + "</td><td>" + v.roll + "</td><td>" + v.dept +
            "</td><td>" + v.year + "</td><td>" + v.time + "</td></tr>";
    }
    if (rows == "") rows = "<tr><td colspan='6'>No one has voted yet.</td></tr>";
    document.getElementById("voterTable").innerHTML = rows;
}

function toggleVoting() {
    data.votingOpen = !data.votingOpen;
    saveData();
    updateBadge();
    renderAdmin();
    adminMessage(data.votingOpen ? "Voting is open now." : "Voting closed. Final result is in Results tab.");
}

// lets another person vote on the same computer
function nextVoter() {
    if (!votedOnThisBrowser()) {
        adminMessage("Nobody has voted on this browser yet.");
        return;
    }
    localStorage.removeItem("votedHere");
    currentVoter = null;
    adminMessage("Ready for next voter. Go to the Vote tab.");
}

function resetElection() {
    if (!confirm("This will delete all votes, voters and added candidates. Continue?")) {
        return;
    }
    data = defaultData();
    saveData();
    localStorage.removeItem("votedHere");
    currentVoter = null;
    updateBadge();
    renderAdmin();
    adminMessage("Election reset done.");
}

function addCandidate() {
    let msg = document.getElementById("candMsg");
    let name = document.getElementById("cName").value.trim();
    let symbol = document.getElementById("cSymbol").value;
    let slogan = document.getElementById("cSlogan").value.trim();

    if (data.voters.length > 0) {
        msg.innerHTML = "Voting has already started, cannot add now.";
        return;
    }
    if (name.length < 3 || !/^[A-Za-z ]+$/.test(name)) {
        msg.innerHTML = "Enter a proper name (letters only).";
        return;
    }
    if (data.candidates.length >= 8) {
        msg.innerHTML = "Maximum 8 entries allowed.";
        return;
    }
    // two candidates cannot have the same symbol
    for (let i = 0; i < data.candidates.length; i++) {
        if (data.candidates[i].symbol == symbol) {
            msg.innerHTML = "This symbol is already taken by " + data.candidates[i].name + ".";
            return;
        }
    }
    if (slogan == "") slogan = "-";

    // new id = biggest id (except NOTA) + 1
    let newId = 1;
    for (let i = 0; i < data.candidates.length; i++) {
        if (data.candidates[i].id != 99 && data.candidates[i].id >= newId) {
            newId = data.candidates[i].id + 1;
        }
    }

    // NOTA should always stay last, so insert before it
    data.candidates.splice(data.candidates.length - 1, 0, {
        id: newId, name: name, symbol: symbol, slogan: slogan, votes: 0
    });
    saveData();
    renderAdmin();

    document.getElementById("cName").value = "";
    document.getElementById("cSlogan").value = "";
    msg.innerHTML = name + " added.";
}

function deleteCandidate(id) {
    if (data.voters.length > 0 || id == 99) return;
    let c = findCandidate(id);
    if (!confirm("Remove " + c.name + "?")) return;

    let newList = [];
    for (let i = 0; i < data.candidates.length; i++) {
        if (data.candidates[i].id != id) {
            newList.push(data.candidates[i]);
        }
    }
    data.candidates = newList;
    saveData();
    renderAdmin();
    document.getElementById("candMsg").innerHTML = c.name + " removed.";
}


// start
updateBadge();
openTab("voteTab");
