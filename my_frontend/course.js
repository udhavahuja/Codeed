/*************************************************
 * GLOBAL APP STATE
 * Central variables shared across UI features
 *************************************************/
let isDarkMode = true;      // Tracks current theme state
let isSidebarOpen = false;  // Tracks sidebar visibility
let pomoInterval = null;    // Stores the Pomodoro timer reference
const BACKEND = "https://codeed-axuk.onrender.com/";  // Backend API URL
const API = "https://codeed-axuk.onrender.com/"; // Backend API URL
let currentTopic = null;

/*************************************************
 * TOPIC CONTENT
 * Data for each course topic
 *************************************************/
const topicContent = {

  "topic-intro": {
    title: "Introduction & Setup",
    video: "https://www.youtube.com/embed/_uQrJ0TkZlc",
    visualization: `
      <p>Simple flow of a Python program:</p>
      <img src="intro-diagram.png" class="rounded-lg" />
    `,
    notes: `
      ### Introduction
      - Install Python
      - Install VS Code
      - Run your first program
    `
  },

  "topic-variables": {
    title: "Variables & Data Types",
    video: "https://www.youtube.com/embed/kqtD5dpn9C8",
    visualization: `
      <img src="variables-diagram.png" class="rounded-lg" />
    `,
    notes: `
      ### Variables

      \`name = "John"\`  
      \`age = 20\`
    `
  },

  "topic-conditions": {
    title: "Conditions",
    video: "https://www.youtube.com/embed/f4KOjWS_KZs",
    visualization: `
      <img src="conditions.png" class="rounded-lg" />
    `,
    notes: `
      ### If / Else
      \`\`\`python
      if age >= 18:
          print("Adult")
      else:
          print("Minor")
      \`\`\`
    `
  },

  "topic-loops": {
    title: "Loops",
    video: "https://www.youtube.com/embed/6iF8Xb7Z3wQ",
    visualization: `
      <img src="loops.png" class="rounded-lg" />
    `,
    notes: `
      ### For Loop
      \`\`\`python
      for i in range(5):
          print(i)
      \`\`\`
    `
  },

  "topic-lists": {
    title: "Lists",
    video: "https://www.youtube.com/embed/W8KRzm-HUcc",
    visualization: `
      <img src="lists.png" class="rounded-lg" />
    `,
    notes: `
      ### Example
      \`\`\`python
      fruits = ["apple", "banana", "mango"]
      \`\`\`
    `
  },

  "topic-dicts": {
    title: "Dictionaries",
    video: "https://www.youtube.com/embed/daefaLgNkw0",
    visualization: `
      <img src="dicts.png" class="rounded-lg" />
    `,
    notes: `
      ### Dictionary
      \`\`\`python
      student = {"name": "Alex", "age": 21}
      \`\`\`
    `
  },

  "topic-functions": {
    title: "Functions",
    video: "https://www.youtube.com/embed/9Os0o3wzS_I",
    visualization: `
      <img src="functions.png" class="rounded-lg" />
    `,
    notes: `
      ### Example
      \`\`\`python
      def greet():
          print("Hello!")
      \`\`\`
    `
  },

  "topic-oop": {
    title: "Object-Oriented Programming",
    video: "https://www.youtube.com/embed/JeznW_7DlB0",
    visualization: `
      <img src="oop.png" class="rounded-lg" />
    `,
    notes: `
      ### Class
      \`\`\`python
      class Dog:
          def bark(self):
              print("Woof")
      \`\`\`
    `
  }

};




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

    // Hide ONLY main tab pages (video / visual / notes / timetable / help...)
    document.querySelectorAll('[id^="page-"]').forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active-page');
    });

    // Do NOT hide topic sections (id starts with topic-)

    const target = document.getElementById('page-' + pageId);

    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active-page');
        window.scrollTo(0, 0);
    }
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

showPage('landing'); // Show landing page by default

/*****************************************
 * LOAD TOPIC TABS
 * Populate video, visualization, and notes
 *************************************************/
function loadTopicTabs() {
  if (!currentTopic || !topicContent[currentTopic]) return;

  const data = topicContent[currentTopic];

  // Update page heading if you want
  const heading = document.querySelector("#page-landing h2");
  if (heading) heading.textContent = data.title;

  // VIDEO
  document.getElementById("YTvid").src = data.video;

  // VISUALIZATION
  document.getElementById("page-visual").innerHTML = `
    <div class="glass-panel p-8 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">${data.title} - Visualization</h2>
      ${data.visualization}
    </div>
  `;

  // NOTES
  document.getElementById("page-notes").innerHTML = `
    <div class="glass-panel p-8 max-w-4xl mx-auto prose prose-invert">
      <h2 class="text-2xl font-bold mb-4">${data.title} - Notes</h2>
      ${marked.parse(data.notes)}
    </div>
  `;

  //Projects
  document.getElementById("page-projects").innerHTML=`
    <div class="glass-panel p-8 max-w-4xl mx-auto prose prose-invert">
      <h2 class="text-2xl font-bold mb-4">${data.title} - Projects</h2>
      ${marked.parse(data.projects)}
    </div>`;
}


function switchTopicTab(tab) {
  // 1. Get current active topic section (the one not hidden)
  const activeSection = document.querySelector('main > section:not(.hidden)');
  if (!activeSection) return;

  const topicId = activeSection.id.replace('topic-', '');

  // 2. Update the URL hash
  location.hash = `${topicId}-${tab}`;
}


function showTopicFromHash() {
  let hash = window.location.hash.replace("#", "");

  // If NO hash → always go to intro video
  if (!hash || hash.startsWith("topic-")) {
    hash = "intro-video";
    location.hash = hash;
  }

  const topic = hash.split("-")[0];   // intro / loops / lists etc.

  // Hide all topics first
  document.querySelectorAll('[id^="topic-"]').forEach(sec =>
    sec.classList.add("hidden")
  );

  // Show the topic container
  const topicSection = document.getElementById("topic-" + topic);
  if (topicSection) topicSection.classList.remove("hidden");

  // Hide all tabs inside that topic
  document.querySelectorAll(`#topic-${topic} .topic-page`).forEach(div =>
    div.classList.add("hidden")
  );

  // Show ONLY the current tab
  const active = document.getElementById(hash);
  if (active) active.classList.remove("hidden");
}


window.addEventListener("load", showTopicFromHash);
window.addEventListener("hashchange", showTopicFromHash);

