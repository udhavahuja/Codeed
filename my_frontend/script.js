/*************************************************
 * GLOBAL APP STATE
 * Central variables shared across UI features
 *************************************************/
let isDarkMode = true;      // Tracks current theme state
let isSidebarOpen = false;  // Tracks sidebar visibility
let pomoInterval = null;    // Stores the Pomodoro timer reference
let currentQuestion = null; // Stores the current practice question
let currentType = null;    // Stores the current question type
let currentQuestionId = null; // Stores the current question ID
let correctAnswer = null;  // Stores the correct answer for MCQs
const BACKEND = "https://codeed-axuk.onrender.com/";  // Backend API URL
const API = "https://codeed-axuk.onrender.com/"; // Backend API URL
const box = document.getElementById("question-box");



/*************************************************
 * APP INITIALIZATION
 * Runs when the window finishes loading
 *************************************************/
window.onload = () => {
    updateHeaderDate();     // Set current date in header
    //initCharts();           // Initialize analytics charts
    pingStreak();   // 🔥 mark today's streak
    loadStreak();   // refresh streak display if needed

    // Restore user's saved theme preference
    if (localStorage.getItem('theme') === 'light') {
        toggleTheme();
    }
};


/*************************************************
 * HEADER DATE
 * Show formatted date in top navigation
 *************************************************/
function updateHeaderDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('header-date');

    if (dateEl) {
        dateEl.innerText = now.toLocaleDateString('en-US', options);
    }
}


/*************************************************
 * SIDEBAR TOGGLE
 * Opens and closes the side navigation drawer
 *************************************************/
function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', isSidebarOpen);
}


/*************************************************
 * THEME SWITCH (Dark / Light)
 * Saves preference to localStorage
 *************************************************/
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-theme', !isDarkMode);
    
    // Change icon depending on mode
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Persist preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}


/*************************************************
 * PAGE NAVIGATION
 * SPA-style page switching
 *************************************************/
function showPage(pageId) {
    // Hide everything
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active-page');
        page.classList.add('hidden');
    });
    
    // Show selected page
    const target = document.getElementById('page-' + pageId);

    if (target) {
        target.classList.add('active-page');
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
    // Load streak data when navigating to streaks page
    if (pageId === "streaks") loadStreak();
    //Loads community feed when navigating to home  
    if (pageId === "home") loadCommunityFeed();
    //Load profile data when navigating to profile
    if (pageId === "edit-profile") setTimeout(loadProfile, 50);
    // Load AI chat history when navigating to AI page
    if (pageId === "ai") loadAIHistory();
}


/*************************************************
 * POMODORO TIMER
 * Handles start/stop & timer countdown
 *************************************************/
function togglePomo(start) {
    const status = document.getElementById('pomo-status');
    const timeDisplay = document.getElementById('pomo-time');
    
    if (start) {
        status.style.display = 'flex';
        let timeLeft = 25 * 60;

        // Prevent duplicate timers
        if (pomoInterval) clearInterval(pomoInterval);
        
        pomoInterval = setInterval(() => {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;

            timeDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            
            if (timeLeft <= 0) {
                clearInterval(pomoInterval);
                status.style.display = 'none';
            }

            timeLeft--;
        }, 1000);

    } else {
        clearInterval(pomoInterval);
        status.style.display = 'none';
    }
}


/*************************************************
 * FOCUS MODE
 * Dark overlay + reduced distractions
 *************************************************/
function setFocus(on) {
    if (on) {
        document.body.style.filter = "contrast(1.1) brightness(0.9)";
        document.body.style.transition = "filter 0.5s";
        
        const message = document.createElement('div');
        message.id = 'focus-msg';

        message.innerHTML = `
            <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] text-center p-10">
                <div>
                    <h1 class="text-4xl font-bold text-accent-blue mb-4">Focus Mode Active</h1>
                    <p class="mb-8 text-white">Distractions are hidden. Study hard.</p>
                    <button onclick="setFocus(false)" class="px-8 py-2 border border-accent-blue text-white rounded hover:bg-accent-blue transition">
                        Exit Focus
                    </button>
                </div>
            </div>`;

        document.body.appendChild(message);

    } else {
        document.body.style.filter = "none";
        const msg = document.getElementById('focus-msg');
        if (msg) msg.remove();
    }
}


/*************************************************
 * PROFILE IMAGE UPLOAD PREVIEW
 *************************************************/
function handleImageUpload(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            document.getElementById('profile-img-preview').src = e.target.result;

            const uploadPreview = document.getElementById('profile-upload-preview');
            if (uploadPreview) uploadPreview.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
}


/*************************************************
 * LOGOUT
 *************************************************/
function logout() {
  localStorage.removeItem("email");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("remember");

  window.location.href = "login.html";
}



/*************************************************
 * CHARTS (Chart.js)
 *************************************************/
async function loadStreakChart() {
  const res = await fetch(`${API}/user/streak/history`, {
    headers: {
      "X-User-Email": localStorage.getItem("email")
    }
  });

  const data = await res.json();

  const labels = data.days.map(d =>
    new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
  );

  const values = data.days.map(d => d.studied ? 1 : 0);

  const ctx = document.getElementById("streakChart").getContext("2d");

  if (window.streakChart) window.streakChart.destroy();

  window.streakChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Streak",
          data: values,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#60a5fa"
        }
      ]
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: { display: false },
          grid: { display: false }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}



/*************************************************
 * PROFILE DROPDOWN MENU
 *************************************************/
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");

if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("hidden");
    });

    // Close menu when clicking outside
    document.addEventListener("click", () => {
        profileMenu.classList.add("hidden");
    });
}

/*************************************************
 * NAVIGATION DROPDOWN TOGGLE
 *************************************************/
function toggleDropdown(id) {
  const menu = document.getElementById(id);

  // Close all other dropdowns first
  document.querySelectorAll("[id$='-menu']").forEach(m => {
    if (m !== menu) m.classList.add("hidden");
  });

  menu.classList.toggle("hidden");

  // close when clicking outside
  document.addEventListener("click", function handler(e) {
    if (!menu.contains(e.target)) {
      menu.classList.add("hidden");
      document.removeEventListener("click", handler);
    }
  });
}

// ---------------- NAV DROPDOWNS ---------------- //
const focusBtn = document.getElementById("focus-btn");
const focusMenu = document.getElementById("focus-menu");

const pomoBtn = document.getElementById("pomo-btn");
const pomoMenu = document.getElementById("pomo-menu");

function closeAllMenus() {
    if (focusMenu) focusMenu.classList.add("hidden");
    if (pomoMenu) pomoMenu.classList.add("hidden");
}

if (focusBtn && focusMenu) {
    focusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMenus();
        focusMenu.classList.toggle("hidden");
    });
}

if (pomoBtn && pomoMenu) {
    pomoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMenus();
        pomoMenu.classList.toggle("hidden");
    });
}

/*************************************************
 *  Timetable Add Schedule Button
 *************************************************/
document.addEventListener("click", closeAllMenus);

const addScheduleBtn = document.getElementById("addScheduleBtn");

if (addScheduleBtn) {
    addScheduleBtn.addEventListener("click", () => {
        alert("This feature is under development");
    });
}

/*************************************************
 * COURSE ENROLLMENT
 *************************************************/

const PYTHON_COURSE_ID = "694975b8d7493abe94926057";

function getUserEmail() {
  return (
    localStorage.getItem("userEmail") ||
    sessionStorage.getItem("userEmail")
  );
}

async function enrollPython() {

  const email = getUserEmail();
  if (!email) {
    alert("Login first");
    return;
  }

  try {
    const res = await fetch(`${API}/courses/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email
      },
      body: JSON.stringify({
        course_id: PYTHON_COURSE_ID
      })
    });

    const data = await res.json();
    alert(data.message || data.error);
    
  } catch (err) {
    alert("Network error");
  }
}

/* attach AFTER page loads */
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("enrollBtn");

  if (btn) {
    btn.addEventListener("click", enrollPython);
  }

});

/*************************************************
 * HOME — LOAD CURRENT COURSE + PROGRESS
 *************************************************/

async function loadHomeCourse() {
  const box = document.getElementById("home-course-box");
  const status = document.getElementById("course-status");
  if (!box || !status) return;

  status.innerText = "Checking...";

  const email = getUserEmail();
  if (!email) {
    status.innerText = "Login first";
    box.innerHTML = `Login required`;
    return;
  }

  const PYTHON_ID = "694975b8d7493abe94926057";

  try {

    // Try fetching course topics (only available if enrolled or public)
    const res = await fetch(`${API}/courses/${PYTHON_ID}/topics`, {
      headers: { "X-User-Email": email }
    });

    const data = await res.json();

    // if backend returns empty topics → treat as NOT enrolled
    if (!data.topics || data.topics.length === 0) {
      status.innerText = "NOT ENROLLED";

      box.innerHTML = `
        <div class="p-4 border border-blue-500/20 rounded-lg text-center">
          <p class="text-sm mb-3 text-secondary">You're not enrolled yet.</p>
          <button onclick="showPage('courses')"
            class="px-4 py-2 bg-accent-blue rounded">
            Browse Courses
          </button>
        </div>
      `;
      return;
    }

    // otherwise → enrolled
    status.innerText = "ENROLLED";

    box.innerHTML = `
      <div class="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20 flex justify-between">
        <div>
          <h4 class="font-bold">Python: Lists</h4>
          <p class="text-xs text-secondary">Data Structures Module</p>
        </div>

        <div class="progress-circle">
          <span class="progress-text">0%</span>
        </div>
      </div>
    `;

  } catch (err) {
    status.innerText = "Error";
    box.innerHTML = "Could not load";
  }
}

document.addEventListener("DOMContentLoaded", loadHomeCourse);

// run after load
loadHomeCourse();

/*************************************************
 * COURSE — TOGGLE COURSE DETAILS
 *************************************************/
  function openCourseDetails() {
    const panel = document.getElementById("courseDetailsPanel");
    const arrow = document.getElementById("course-arrow");

    panel.innerHTML = `
      <div class="flex items-start justify-between mb-3">
      <h3 class="text-xl font-bold mb-3">Python Fundamentals</h3>
      <button
        class="text-sm px-3 py-1 border rounded-lg hover:bg-gray-700"
        onclick="showPage('ALLcourses')">
        View All
      </button>
      </div>

      <p class="text-sm mb-4">
        Learn Python from scratch with practical examples and mini-projects.
      </p>

      <ul class="list-disc ml-5 space-y-1 text-sm mb-4">
        <li>Introduction & Setup</li>
        <li>Variables and Data Types</li>
        <li>Conditions</li>
        <li>Loops</li>
        <li>Lists</list>
        <li>Dictionaries</li>
        <li>Functions</li>
        <li>Object-Oriented Programming</li>
      </ul>

      <button class="px-4 py-2 bg-accent-blue rounded-lg text-white"
              onclick="closeCourseDetails()">
        Close
      </button>
    `;

    panel.classList.remove("hidden");
    setTimeout(() => {
      panel.classList.remove("opacity-0", "translate-x-5");
    }, 10);

    arrow.classList.add("rotate-90");
  }

  function closeCourseDetails() {
    const panel = document.getElementById("courseDetailsPanel");
    const arrow = document.getElementById("course-arrow");

    panel.classList.add("opacity-0", "translate-x-5");
    setTimeout(() => panel.classList.add("hidden"), 180);

    arrow.classList.remove("rotate-90");
  }



/*************************************************
 * COMMUNITY — LOAD FEED
 *************************************************/
async function loadCommunityFeed() {
  const email = getUserEmail();
  const box = document.getElementById("community-feed");

  if (!box) return;

  box.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API}/community/${PYTHON_COURSE_ID}/feed`);

    const data = await res.json();

    if (!data.feed || data.feed.length === 0) {
      box.innerHTML = `
        <p class="text-secondary text-sm">
          No questions yet. Start the discussion!
        </p>
      `;
      return;
    }

    box.innerHTML = data.feed.map(q => `
      <div class="p-4 border-b border-blue-900/20">
        <div class="font-bold mb-1">${q.question}</div>

        <div class="ml-4 mt-2 space-y-2">
          ${q.answers.map(a => `
            <p class="text-sm text-secondary">• ${a.answer}</p>
          `).join("")}
        </div>

        <button
          class="mt-3 text-xs px-3 py-1 border rounded"
          onclick="showAnswerBox('${q.id}')">
          Answer
        </button>

        <div id="answer-box-${q.id}" class="hidden mt-2">
          <input class="login" id="answer-input-${q.id}" placeholder="Write answer...">
          <button
            class="px-3 py-1 bg-blue-600 rounded mt-1"
            onclick="submitAnswer('${q.id}')">
            Submit
          </button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    box.innerHTML = "Error loading feed.";
  }
}

/*************************************************
 * COMMUNITY — ASK QUESTION
 *************************************************/
async function submitQuestion() {
  const email = getUserEmail();
  const text = document.getElementById("question-input").value;

  if (!email) return alert("Login first");
  if (!text.trim()) return alert("Enter a question");

  try {
    const res = await fetch(`${API}/community/question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email
      },
      body: JSON.stringify({
        course_id: PYTHON_COURSE_ID,
        question: text
      })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error);

    document.getElementById("question-input").value = "";
    loadCommunityFeed();
  } catch {
    alert("Network error");
  }
}

/*************************************************
 * COMMUNITY — ANSWER QUESTION
 *************************************************/
function showAnswerBox(id) {
  document.getElementById(`answer-box-${id}`).classList.toggle("hidden");
}

async function submitAnswer(questionId) {
  const email = getUserEmail();
  const input = document.getElementById(`answer-input-${questionId}`);
  const text = input.value;

  if (!email) return alert("Login first");
  if (!text.trim()) return alert("Enter an answer");

  try {
    const res = await fetch(`${API}/community/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email
      },
      body: JSON.stringify({
        question_id: questionId,
        answer: text
      })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error);

    input.value = "";
    loadCommunityFeed();
  } catch {
    alert("Network error");
  }
}

/*************************************************
 * QUESTIONS — LOAD PRACTICE QUESTION
 *************************************************/

const TOPIC_ID = "694976e4d7493abe9492605c";   // example: lists topic

async function loadQuestion() {

  document.querySelectorAll(".ans-div").forEach(div => {
    div.style.display = "none";
    div.innerHTML = "";
  });

  const difficulty = document.getElementById("question-difficulty").value;
  const type = document.getElementById("typeSelect").value;
    const box = document.getElementById("questionBox");

  box.innerHTML = "Loading...";

  try {
    let res;

    // ------------------ MCQ ------------------
    if (type === "mcq") {
      
      res = await fetch(`${API}/mcq/${TOPIC_ID}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    difficulty: document.getElementById("question-difficulty").value
  })
});

      const data = await res.json();

      if (!data.mcqs?.length) {
        box.innerHTML = "No MCQs found.";
        return;
      }

      const q = data.mcqs[Math.floor(Math.random() * data.mcqs.length)];

      currentQuestion = q;
      currentType = "mcq";
      currentQuestionId = q._id;

      correctAnswer = q.content.answer;   // 👈 store answer
      console.log("Correct answer:", correctAnswer);


      box.innerHTML = `
  <p class="mb-4 font-bold">${q.content.question}</p>

  ${q.content.options.map((opt, i) =>
  `<label class="block mb-2">
    <input
      type="radio"
      name="mcqOption"
      value="${String.fromCharCode(65 + i)}">  
    ${opt}
  </label>`
).join("")}



  <button type="button" onclick="attemptMCQ()"
    class="mt-4 px-6 py-2 bg-green-600 rounded-lg font-bold">
    Submit
  </button>
`;

    }

    // ------------------ FLASHCARD ------------------
    else if (type === "flashcard") {
      res = await fetch(`${API}/flashcard/${TOPIC_ID}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    difficulty: document.getElementById("question-difficulty").value
  })
});

      const data = await res.json();

      if (!data.flashcards?.length) {
        box.innerHTML = "No flashcards found.";
        return;
      }

      const f = data.flashcards[Math.floor(Math.random() * data.flashcards.length)];

      currentQuestion = f;
      currentType = "flashcard";

      box.innerHTML = `
        <p class="font-bold mb-2">${f.content.front}</p>
        <p class="italic opacity-70 mb-4">${f.content.back}</p>

        <button onclick="attemptFlashcard()"
          class="px-6 py-2 bg-green-600 rounded-lg font-bold">
          Mark Studied
        </button>
      `;
    }

    // ------------------ CODING ------------------
  else if (type === "coding") {
  res = await fetch(`${API}/coding/${TOPIC_ID}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    difficulty: document.getElementById("question-difficulty").value   // <-- from dropdown
  })
});

  const data = await res.json();

  if (!data.coding_questions?.length) {
    box.innerHTML = "No coding questions found.";
    return;
  }

  const q = data.coding_questions[
    Math.floor(Math.random() * data.coding_questions.length)
  ];

  currentQuestion = q;
  currentType = "coding";

  const prompt =
  currentQuestion?.content?.problem ||
  currentQuestion?.content?.prompt ||
  currentQuestion?.content?.title ||
  currentQuestion?.content?.question ||
  currentQuestion?.content?.description ||
  currentQuestion?.prompt ||
  currentQuestion?.question ||
  "Solve this coding problem:";



  box.innerHTML = `
    <p class="mb-4 font-bold">${prompt}</p>

    <div
      id="editor"
      class="w-full border border-blue-900/40 rounded"
      style="height: 320px;">
    </div>

    <button onclick="attemptCoding()"
      class="mt-4 px-6 py-2 bg-green-600 rounded-lg font-bold">
      Submit Solution
    </button>

    <div id="coding-result" class="mt-4 font-semibold"></div>
  `;

  // 👇 IMPORTANT: initialize AFTER html is injected
  initEditor();
}


  } catch (err) {
    console.log("Question load error:", err);
    box.innerHTML = "Something went wrong.";
  }
}

/*************************************************
 * QUESTIONS — ATTEMPT HANDLERS
 *************************************************/
async function attemptMCQ() {

  const selected = document.querySelector('input[name="mcqOption"]:checked');
  if (!selected) return;

  const resultBox = document.getElementById("mcq-result");
  if (!resultBox) return;

  resultBox.innerHTML = "Checking...";

  console.log("Correct answer:", currentQuestion.content.answer);
  console.log("User selected:", selected.value);

  const isCorrect =
    selected.value.trim().toLowerCase() ==
    currentQuestion.content.answer.trim().toLowerCase();

        


  if (isCorrect) {
    resultBox.innerHTML = `
      <span class="text-green-400 font-bold">
        Correct 🎯
      </span>
    `;
  } else {
    resultBox.innerHTML = `
      <span class="text-red-400 font-bold">
        Wrong ❌ — Correct answer: 
        <span class="text-white">${currentQuestion.content.answer}</span>
      </span>
    `;

  }


/*************************************************
 * MCQ ANSWER SHOWS
 *************************************************/
document.getElementById("mcq-result").style.display = "block";
}


async function attemptFlashcard() {

  const resultBox = document.getElementById("flashcard-result");

  try {
    await fetch(`${API}/flashcard/attempt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": localStorage.getItem("email")
      },
      body: JSON.stringify({
        question_id: currentQuestion._id,
        mode: "normal"
      })
    });

    resultBox.innerHTML = `
      <span class="text-green-400 font-bold">
        Marked as studied 👍
      </span>
    `;
    document.getElementById("flashcard-result").style.display = "block";


  } catch (err) {
    resultBox.innerHTML = `
      <span class="text-red-400">Network error ⚠️</span>
    `;
  }
}


async function attemptCoding() {
  try {
    const questionText =
  currentQuestion?.content?.problem ||
  currentQuestion?.content?.prompt ||
  currentQuestion?.content?.title ||
  currentQuestion?.content?.question ||
  currentQuestion?.content?.description ||
  currentQuestion?.prompt ||
  currentQuestion?.question ||
  "";

    console.log("coding question:", currentQuestion);

    const userCode = editor.getValue();

    if (!userCode.trim()) {
      document.getElementById("coding-result").innerText =
        "Please write some code first.";
      return;
    }

    const qna = `Question:\n${questionText}\n\nAnswer:\n${editor.getValue()}`;


    document.getElementById("coding-result").innerText = "Checking...";

    const res = await fetch("https://codeed-axuk.onrender.com/ai/check-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": localStorage.getItem("userEmail")
      },
      body: JSON.stringify({ qna })
    });

    const data = await res.json();

    if (data.error) {
      document.getElementById("coding-result").innerText =
        "Error: " + data.error;
      return;
    }

    document.getElementById("coding-result").innerText = data.answer;
    document.getElementById("coding-result").style.display = "block";


  } catch (err) {
    document.getElementById("coding-result").innerText =
      "Something went wrong. Try again.";
  }
}


/*************************************************
 * HOME — LOAD STUDY STREAK
 ************************************************/
async function pingStreak() {
  const email = localStorage.getItem("email");
  if (!email) return;

  try {
    await fetch(`${API}/user/ping`, {
      method: "POST",
      headers: {
        "X-User-Email": email
      }
    });
  } catch (err) {
    console.log("Ping failed", err);
  }
}

async function loadStreak() {
  try {
    const res = await fetch(`${API}/user/streak`, {
      method: "GET",
      headers: {
        "X-User-Email": localStorage.getItem("userEmail")
      }
    });

    const data = await res.json();

    const el = document.getElementById("streakValue");
    if (!el) return;

    if (res.ok) {
      el.innerText = `${data.current_streak} Day Streak`;
    } else {
      el.innerText = "0 Day Streak";
    }

  } catch (err) {
    console.log("Streak fetch failed", err);
  }
}


/*************************************************
 * PROFILE — LOAD USER DATA
 ************************************************/
async function loadProfile() {
  const email = localStorage.getItem("userEmail");

  if (!email) {
    console.log("No email found — cannot load profile");
    return;
  }

  console.log("LOADING PROFILE FOR:", email);

  try {
    const res = await fetch(`${API}/me`, {
      method: "GET",
      headers: {
        "X-User-Email": email
      }
    });

    const data = await res.json();
    console.log("PROFILE RESPONSE:", data);

    if (res.ok && data.user) {
      document.getElementById("edit-name").value = data.user.name || "";
      console.log("SET NAME FIELD TO:", data.user.name);
    }

  } catch (err) {
    console.log("Profile load failed", err);
  }
}


/*************************************************
 * PROFILE — SAVE UPDATED DATA
 ************************************************/
async function saveProfile() {
  const name = document.getElementById("edit-name").value.trim();

  if (!name) {
    alert("Name cannot be empty");
    return;
  }

  try {
    const res = await fetch(`${API}/updateme`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": localStorage.getItem("userEmail")
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Update failed");
      return;
    }

    alert("Profile updated 👍");

  } catch (err) {
    alert("Network error");
  }
}

/*************************************************
 * AI CHAT — RENDER MESSAGE
 ************************************************/
function renderMessage(role, text) {
  const box = document.getElementById("ai-chat");

  const wrap = document.createElement("div");
  wrap.className = role === "user" ? "text-right" : "text-left";

  let content =
    role === "ai"
      ? marked.parse(text)
      : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  wrap.innerHTML = `
    <div class="inline-block px-4 py-2 rounded-xl ${
      role === "user" ? "bg-blue-600" : "bg-gray-700"
    }">
      ${content}
    </div>
  `;

  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
}


/*************************************************
 * AI CHAT — LOAD CHAT HISTORY
 ************************************************/
async function loadAIHistory() {
  const email = localStorage.getItem("userEmail");
  if (!email) return;

  try {
    const res = await fetch(`${API}/ai/history`, {
      headers: { "X-User-Email": email }
    });

    const data = await res.json();

    document.getElementById("ai-chat").innerHTML = "";

    data.history.reverse().forEach(msg => {
      renderMessage("user", msg.question);
      renderMessage("ai", msg.answer);
    });

  } catch (err) {
    console.log("history load failed", err);
  }
}

/*************************************************
 * AI CHAT — ASK QUESTION
 ************************************************/
async function askAI() {
  const input = document.getElementById("ai-input");
  const question = input.value.trim();
  if (!question) return;

  const email = localStorage.getItem("userEmail");

  renderMessage("user", question);
  input.value = "";

  renderMessage("ai", "Thinking…");

  try {
    const res = await fetch(`${API}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    // remove "thinking" bubble
    document.querySelectorAll("#ai-chat div:last-child").forEach(x => x.remove());

    renderMessage("ai", data.answer);

  } catch (err) {
    renderMessage("ai", "⚠️ Network error");
  }
}

/***************************************************
 * AI CHAT — ASK FAQ
 *************************************************/
async function askFAQ(question) {
  const email = localStorage.getItem("userEmail");

  // show user message
  renderMessage("user", question);

  // thinking bubble
  renderMessage("ai", "Thinking…");

  try {
    const res = await fetch(`${API}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    // remove last bubble (the "Thinking…")
    const chat = document.getElementById("ai-chat");
    chat.removeChild(chat.lastElementChild);

    renderMessage("ai", data.answer);

  } catch (err) {
    renderMessage("ai", "⚠️ Network error");
  }
}

/*************************************************
 * EXPLAIN CODE USING AI
 *************************************************/
async function explainCode() {
  const box = document.getElementById("explain-box");

  try {
    const code = explainEditor.getValue();

    if (!code.trim()) {
      box.innerHTML = `<p class="text-red-400">Please write some code first.</p>`;
      return;
    }

    box.innerHTML = `<p class="text-blue-400">Explaining your code… ⏳</p>`;

    const res = await fetch("https://codeed-axuk.onrender.com/ai/explain-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": localStorage.getItem("userEmail")
      },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.error) {
      box.innerHTML = `<p class="text-red-400">Error: ${data.error}</p>`;
      return;
    }

    box.innerHTML = `
      <div class="text-green-300 whitespace-pre-wrap">
        ${data.answer}
      </div>
    `;

  } catch (err) {
    box.innerHTML = `<p class="text-red-400">Something went wrong. Try again.</p>`;
  }
}

/*************************************************
 * TEXT TO SPEECH
 *************************************************/
document.querySelectorAll(".speakable").forEach((el, index) => {
  const btn = document.createElement("button");
  btn.innerText = "🔊 Listen";
  btn.onclick = () => {
    const msg = new SpeechSynthesisUtterance(el.innerText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };
  el.after(btn);
});