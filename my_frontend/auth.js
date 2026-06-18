const API = "https://codeed-axuk.onrender.com/";

/* ---------------- ELEMENTS ---------------- */
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const otpForm = document.getElementById("otpForm");

const registerBtn = document.getElementById("registerBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");

let currentEmail = "";

/* ---------------- TAB SWITCHING ---------------- */
loginTab.onclick = () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  otpForm.classList.add("hidden");
};

registerTab.onclick = () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  otpForm.classList.add("hidden");
};

/* ---------------- LOGIN ---------------- */
loginBtn.onclick = async () => {
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;
  const remember = rememberMe.checked;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  loginBtn.disabled = true;

// Connecting to backend login API
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    // 🔐 Remember Me logic
    if (remember) {
      localStorage.setItem("userEmail", email);
      sessionStorage.removeItem("userEmail");
    } else {
      sessionStorage.setItem("userEmail", email);
      localStorage.removeItem("userEmail");
    }

    window.location.href = "index.html";   // 🔥 redirect to home


  } catch (err) {
    alert("Network error. Try again.");
  } finally {
    loginBtn.disabled = false;
  }
};



/* ---------------- REGISTER ---------------- */
registerBtn.onclick = async () => {
  const name = regName.value.trim();
  const email = regEmail.value.trim().toLowerCase();
  const password = regPassword.value;
  const confirmPassword = regConPassword.value; // <-- your ID

  // Frontend validations
  if (!name || !email || !password || !confirmPassword) {
    alert("All fields are required");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }

  registerBtn.disabled = true;

  // Connecting to backend register API
  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Registration failed");
      return;
    }

    window.location.href = "index.html";   // 🔥 go to home after verification

  } catch (error) {
    alert("Network error. Please try again.");
  } finally {
    registerBtn.disabled = false;
  }
};

function goToForgot() {
  window.location.href = "forgot.html";
}

/* ---------------- OTP VERIFY ---------------- */
verifyOtpBtn.onclick = async () => {
  const otp = otpInput.value;

  const res = await fetch(`${API}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentEmail, otp })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  loginTab.click();
};
