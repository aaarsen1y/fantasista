const API_URL = "http://127.0.0.1:5000"; // замени на свой backend

function toggleForms() {
  document.getElementById("loginForm").style.display =
    document.getElementById("loginForm").style.display === "none" ? "block" : "none";
  document.getElementById("registerForm").style.display =
    document.getElementById("registerForm").style.display === "none" ? "block" : "none";
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPass").value;

  const res = await fetch(API_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    // редиректим на index.html
    window.location.href = "index.html";
  } else {
    alert("Ошибка входа");
  }
}

async function register() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPass").value;

  const res = await fetch(API_URL + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    alert("Регистрация успешна! Теперь войдите.");
    toggleForms(); // переключаем на форму входа
  } else {
    alert("Ошибка регистрации");
  }
}
