// api.js

//const API = "http://localhost:5000/api";
const API = "https://flama-cbt-backend.onrender.com/api"; // Production backend


// token helper (if using auth)
function getToken() {
  return localStorage.getItem("token");
}

// generic request helper
async function request(url, method = "GET", data = null, auth = false) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (auth) {
    options.headers["Authorization"] = `Bearer ${getToken()}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(API + url, options);
  const result = await res.json();

  if (!res.ok) throw result;

  return result;
}