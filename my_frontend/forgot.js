// 1️⃣ API URL
const API = "https://codeed-axuk.onrender.com/";

// 2️⃣ Get elements (MUST be at top)
const sendOtpBtn = document.getElementById("sendOtpBtn");
const resetBtn = document.getElementById("resetBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");

const emailStep = document.getElementById("emailStep");
const resetStep = document.getElementById("resetStep");

// 3️⃣ State
let currentEmail = "";

// ---------------- SEND OTP ----------------
sendOtpBtn.onclick = async () => {
  const email = document.getElementById("fpEmail").value.trim().toLowerCase();

  if (!email) {
    alert("Enter your email");
    return;
  }

  try {
    const res = await fetch(`${API}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to send OTP");
      return;
    }

    currentEmail = email;
    alert("OTP sent");

    emailStep.classList.add("hidden");
    resetStep.classList.remove("hidden");

  } catch (err) {
    alert("Network error");
  }
};

// ---------------- RESET PASSWORD ----------------
  const otp = document.getElementById("otpInput").value.trim();
  const newPassword = document.getElementById("newPassword").value;

  if (!otp || !newPassword) {
    alert("All fields required");
    return;
  }

  try {
    const res = await fetch(`${API}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentEmail,
        otp,
        new_password: newPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Reset failed");
      return;
    }

    alert("Password reset successful");
    window.location.href = "login.html";

  } catch (err) {
    alert("Network error");
  }
};

// ---------------- RESEND OTP ----------------
resendOtpBtn.onclick = async () => {
  if (!currentEmail) {
    alert("Email not found. Please go back and try again.");
    return;
  }

  resendOtpBtn.disabled = true;

  try {
    const res = await fetch(`${API}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentEmail })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to resend OTP");
      return;
    }

    alert("OTP resent to your email");

  } catch (err) {
    alert("Network error. Try again.");
  } finally {
    resendOtpBtn.disabled = false;
  }
};
