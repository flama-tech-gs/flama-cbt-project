// api.js

//const API = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api"));
const API = (window.FLAMA_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost") ? `${window.location.protocol}//${window.location.hostname}:5000/api` : "https://flama.onrender.com/api")); // Production backend


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