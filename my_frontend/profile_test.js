const API = "http://127.0.0.1:5000";

function saveEmail() {
  const email = document.getElementById("email").value.trim();
  localStorage.setItem("email", email);
  alert("Saved!");
}

/*************************************************
 * GET /me
 *************************************************/
async function loadProfile() {
  document.getElementById("profile-output").innerText = "Loading...";

  try {
    const res = await fetch(`${API}/me`, {
      method: "GET",
      headers: {
        "X-User-Email": localStorage.getItem("email")
      }
    });

    const data = await res.json();
    document.getElementById("profile-output").innerText =
      JSON.stringify(data, null, 2);

  } catch (err) {
    document.getElementById("profile-output").innerText =
      "Error: " + err.message;
  }
}

/*************************************************
 * PUT /me
 *************************************************/
async function updateProfile() {
  const name = document.getElementById("newName").value.trim();

  if (!name) return alert("Enter a name first");

  try {
    const res = await fetch(`${API}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": localStorage.getItem("email")
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    document.getElementById("update-output").innerText =
      JSON.stringify(data, null, 2);

  } catch (err) {
    document.getElementById("update-output").innerText =
      "Error: " + err.message;
  }
}
