const API_URL = "";

async function register() {
  const emailInput = document.getElementById("regEmail");
  const passInput = document.getElementById("regPass");

  const email = emailInput.value;
  const password = passInput.value;

  const res = await fetch(API_URL + "/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const msg = await res.text();
  alert(msg);

  // ✅ очищаем поля
  emailInput.value = "";
  passInput.value = "";

  // ✅ можно оставить на форме логина, чтобы пользователь потом залогинился,
  // или автоматически логинить (по желанию)
  toggleForms(); // переключаем на форму логина после регистрации
}


async function login() {
  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPass");

  const email = emailInput.value;
  const password = passInput.value;

  const res = await fetch(API_URL + "/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const data = await res.json();
    alert("Успешный вход: " + data.role);

    // редирект на players.html
    window.location.href = "/players_page";
  } else {
    alert("Ошибка входа");
  }
}



async function updateData() {
  const res = await fetch(API_URL + "/admin/update", {
    method: "POST",
    credentials: "include"   // <- обязательно
  });
  const msg = await res.json();
  alert(msg.message);
}

async function logout() {
  try {
    const res = await fetch(API_URL + "/logout", {
      method: "POST",
      credentials: "include"
    });

    if (res.ok) {
      alert("Вы вышли из аккаунта");
      window.location.href = "index.html"; // 🔄 редирект на страницу входа
    } else {
      console.error("Ошибка выхода:", res.status);
      alert("Ошибка выхода");
    }
  } catch (err) {
    console.error("Ошибка при logout:", err);
    alert("Ошибка выхода");
  }
}

let playersData = []; // все игроки
let currentPage = 1;
let currentSortColumn = "goals";
let currentSortOrder = "asc";
const rowsPerPage = 15; // сколько игроков на странице

async function loadPlayers() {
  try {
    // Сбрасываем фильтры
    document.getElementById("teamFilter").value = "";       // команда → All
    document.getElementById("positionFilter").value ="";
    document.getElementById("goalsFilter").value = "";      // минимальные голы
    document.getElementById("goalsFilterMax").value = "";    
    document.getElementById("xgFilter").value = "";         // минимальный xG
    document.getElementById("xgFilterMax").value = ""; 
    document.getElementById("xaFilter").value = "";         // минимальный xG
    document.getElementById("xaFilterMax").value = ""; 
    document.getElementById("minFilter").value = ""; 
    document.getElementById("minFilterMax").value = ""; 


    // Получаем данные с сервера
    const res = await fetch(API_URL + "/players", { credentials: "include" });
    playersData = await res.json();

    currentPage = 1;
    renderTablePage();
  } catch (err) {
    console.error("Ошибка загрузки игроков:", err);
  }
}

let currentView = "overall";
let sortConfig = { column: null, order: "asc" }; // текущая сортировка

// Конфигурация видов таблицы
const tableViews = {
  overall: [
    { key: "name", label: "Name", width: "13%" , tooltip: "Имя игрока" },
    { key: "country", label: "", width: "3%" , tooltip: "Страна" },
    { key: "team", label: "Team", width: "10%" , tooltip: "Команда" },
    { key: "age", label: "Age", width: "5%" , tooltip: "Имя игрока" },
    { key: "position", label: "Position", width: "5%" },
    { key: "matches", label: "Matches", width: "5%" },
    { key: "starts", label: "Starts", width: "5%" },
    { key: "minutes", label: "min", width: "5%" , tooltip: "minutes played"   },
    { key: "min_per_match", label: "mpm", width: "5%", tooltip: "minutes per match played" },
    { key: "yellow_cards", label: "yk", width: "5%", tooltip: "yellow cards"   },
    { key: "goals", label: "Goals", width: "5%" },
    { key: "assists", label: "Assists", width: "5%" }

  ],
  shooting: [
    { key: "name", label: "Name", width: "13%" },
    { key: "country", label: "", width: "3%" },
    { key: "team", label: "Team", width: "15%" },
    { key: "goals", label: "Goals", width: "5%" },
    { key: "xg", label: "xG", width: "5%" , tooltip: "excepted goals"  },
    { key: "non_pen_xg", label: "npxG", width: "5%", tooltip: "non penalty xg"  },
    { key: "goals_xg_diff", label: "gxG d", width: "5%", tooltip: "difference between goals and xg" },
    { key: "shoots_ot_prc", label: "sot %", width: "5%" , tooltip: "shoots on targer, %"  },
    { key: "per_90_sh", label: "s per 90", width: "5%" , tooltip: "shoots per 90"  }

  ],
    passing: [
    { key: "name", label: "Name", width: "13%" },
    { key: "country", label: "", width: "3%" },
    { key: "team", label: "Team", width: "15%" },
    { key: "assists", label: "Assists", width: "5%" },
    { key: "xa", label: "xA", width: "5%" },
    { key: "ast_xag_diff", label: "xAg d", width: "5%" , tooltip: "difference between xA and assists"  },
    { key: "key_passes", label: "keyP", width: "5%"   },
    { key: "pass_prog", label: "progP", width: "5%" , tooltip: "progressive passes"  },
    { key: "cross_opp_box", label: "cross", width: "5%" },
    { key: "gca_per90", label: "gcaP90", width: "5%" , tooltip: "goal creation actions per 90"  },
 

  ],
    defending: [
    { key: "name", label: "Name", width: "13%" },
    { key: "country", label: "", width: "3%" },
    { key: "team", label: "Team", width: "15%" },
    { key: "yellow_cards", label: "yk", width: "5%", tooltip: "yellow cards"   },
    { key: "red_cards", label: "rk", width: "5%" , tooltip: "red cards"  },
    { key: "tackles", label: "tackles", width: "5%" },
    { key: "tackles_won", label: "tackles_w", width: "5%" },
    { key: "fouls", label: "fouls", width: "5%" },
    { key: "team_conc_wh_onpitch", label: "gAg", width: "5%" , tooltip: "team conceded with player on a pitch"  },
    { key: "penalty_conceded", label: "foul on pen", width: "7%" }

  ], 
  custom:
    [
    ]
};


const mandatoryColumns = ["name","country", "team"];
let customSelectedColumns = tableViews["overall"].map(c => c.key);

// все возможные колонки (ключи соответствуют объектам playersData)
const allColumns = [
    { key: "name", label: "Name", width: "13%" },
    { key: "country", label: "", width: "3%" },
    { key: "team", label: "Team", width: "10%" },
    { key: "age", label: "Age", width: "5%" },
    { key: "position", label: "Position", width: "5%" },
    { key: "matches", label: "Matches", width: "5%" },
    { key: "minutes", label: "Minutes", width: "5%" },
    { key: "goals", label: "Goals", width: "5%" },
    { key: "xg", label: "xG", width: "5%" },
    { key: "non_pen_xg", label: "npxG", width: "5%" },
    { key: "goals_xg_diff", label: "gxG d", width: "5%" },
    { key: "shoots_ot_prc", label: "sot %", width: "5%" },
    { key: "per_90_sh", label: "s per 90", width: "5%" },
    { key: "assists", label: "Assists", width: "5%" },
    { key: "xa", label: "xA", width: "5%" },
    { key: "ast_xag_diff", label: "xAg d", width: "5%" },
    { key: "key_passes", label: "keyP", width: "5%" },
    { key: "pass_prog", label: "progP", width: "5%" },
    { key: "cross_opp_box", label: "cross", width: "5%" },
    { key: "gca_per90", label: "gcaP90", width: "5%" },
    { key: "yellow_cards", label: "yk", width: "5%" },
    { key: "red_cards", label: "rk", width: "5%" },
    { key: "tackles", label: "tackles", width: "5%" },
    { key: "tackles_won", label: "tackles_w", width: "5%" },
    { key: "fouls", label: "fouls", width: "5%" },
    { key: "team_conc_wh_onpitch", label: "gAg", width: "5%" },
    { key: "penalty_conceded", label: "foul on pen", width: "7%" }


];


const customMenu = document.getElementById("customColumnsMenu");
customMenu.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    const col = e.target.value;

    if (e.target.checked) {
      // добавить в конец
      if (!customSelectedColumns.includes(col)) {
        customSelectedColumns.push(col);
      }
    } else {
      // убрать
      customSelectedColumns = customSelectedColumns.filter(c => c !== col);
    }

    renderTablePage();
  }
});
let previousViewColumns = tableViews["overall"].map(c => c.key);

allColumns.forEach(col => {
  if (!mandatoryColumns.includes(col.key)) { // не добавляем обязательные колонки
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = col.key;
    checkbox.checked = true; // по умолчанию все включены
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(col.label));
    customMenu.appendChild(label);

    // сразу добавляем обработчик для мгновенного изменения таблицы
    checkbox.addEventListener("change", () => {
      renderTablePage();
    });
  }
});

// показать/скрыть меню по клику на кнопку Custom
const customBtn = document.getElementById("customViewBtn");
customBtn.addEventListener("click", () => {
  if (customMenu.style.display === "none") {
    // позиционируем меню прямо под кнопкой
    const rect = customBtn.getBoundingClientRect();
    customMenu.style.top = rect.bottom + "px";
    customMenu.style.left = rect.left + "px";
    customMenu.style.display = "block";
  } else {
    customMenu.style.display = "none";
  }
});

// скрыть меню при клике вне его
document.addEventListener("click", (e) => {
  if (!customMenu.contains(e.target) && e.target !== customBtn) {
    customMenu.style.display = "none";
  }
});





// функция, которая возвращает колонки для кастомного вида
function getCustomColumns() {
  const checked = Array.from(customMenu.querySelectorAll("input[type='checkbox']:checked"))
                       .map(cb => cb.value);

  // всегда включаем обязательные колонки
  const mandatoryColsObjects = allColumns.filter(c => mandatoryColumns.includes(c.key));
  const selectedColsObjects = allColumns.filter(c => checked.includes(c.key));
  return mandatoryColsObjects.concat(selectedColsObjects);
}








// Функция сортировки массива игроков
function sortPlayers(data) {
  if (!sortConfig.column) return data;
  return [...data].sort((a, b) => {
    const col = sortConfig.column;
    let valA = a[col] ?? "";
    let valB = b[col] ?? "";

    // числовая сортировка
    if (!isNaN(valA) && !isNaN(valB)) {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
    return 0;
  });
}

reloadBtn.addEventListener("click", () => {
    window.location.reload(); // полностью перезагружает страницу
});

// Рендер таблицы
function renderTablePage() {

  if (!playersData || playersData.length === 0) {
    thead.innerHTML = "";
    
    colgroup.innerHTML = "";
    tbody.innerHTML = `
      <tr>
        <td colspan="100%" style="padding:20px; text-align:center; font-size:18px; color:#666;">
          🔄 Сервер прогружает данные, пожалуйста подождите...
        </td>
      </tr>
    `;
    document.getElementById("currentPage").textContent = "–";
    reloadBtn.classList.remove("hidden");
    return;


  }


  
  else {
  reloadBtn.classList.add("hidden");

  let cols;
  if (currentView === "custom") {
    const uniqueKeys = [...new Set(mandatoryColumns.concat(customSelectedColumns))];
    cols = uniqueKeys.map(key => allColumns.find(c => c.key === key));
  } else {
    cols = tableViews[currentView];
  }

  // --- colgroup ---
  const colgroup = document.getElementById("playersColgroup");
  colgroup.innerHTML = "";
  cols.forEach(col => {
    const colEl = document.createElement("col");
    if (col.width) colEl.style.width = col.width;
    colgroup.appendChild(colEl);
  });

  // --- thead ---
  const thead = document.querySelector("#playersTable thead");
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");

  cols.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.style.cursor = "pointer";
    if (col.tooltip) th.title = col.tooltip;

    th.addEventListener("click", () => {
      if (sortConfig.column === col.key) {
        sortConfig.order = sortConfig.order === "asc" ? "desc" : "asc";
      } else {
        sortConfig.column = col.key;
        sortConfig.order = "desc";
      }
      renderTablePage();
    });

    if (sortConfig.column === col.key) {
      const arrow = sortConfig.order === "asc" ? " ↑" : " ↓";
      th.textContent += arrow;
    }

    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // --- tbody ---
  const tbody = document.querySelector("#playersTable tbody");
  tbody.innerHTML = "";

  const sorted = sortPlayers(playersData);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = sorted.slice(start, end);

  pageData.forEach((player, rowIndex) => {
    const tr = document.createElement("tr");

    // --- добавляем ячейки ---
    cols.forEach(col => {
      const td = document.createElement("td");
      let val = player[col.key];

      if (col.key === "country" && val) {
        const img = document.createElement("img");
        img.src = `graphics/flags/${val}.png`;
        img.alt = val;
        img.style.height = "20px";
        img.style.marginRight = "5px";
        img.onerror = () => { td.textContent = val; };
        td.appendChild(img);
      } else if (col.key === "xg" && val !== undefined && val !== null) {
        td.textContent = Number(val).toFixed(2);
      } else {
        td.textContent = val ?? "";
      }

      tr.appendChild(td);
    });

    // --- клик на строку ---
    tr.addEventListener("click", async () => {
      // если под этой строкой уже есть профиль — удалить его
      const nextRow = tr.nextElementSibling;
      if (nextRow && nextRow.classList.contains("profile-row")) {
        nextRow.remove();
        return;
      }

      // закрыть все другие профили
      tbody.querySelectorAll(".profile-row").forEach(r => r.remove());

      // создаем строку профиля
      const profileRow = document.createElement("tr");
      profileRow.classList.add("profile-row");

      const profileCell = document.createElement("td");
      profileCell.colSpan = tr.children.length;

// --- Таблицы профиля игрока и силы команды ---
let profileHTML = `
  <table class="profile-table" style="width:100%; border-collapse:collapse;">
    <tr>
      <th style="text-align:left; padding:5px;">Info</th>
      <td style="padding:5px; display:flex; align-items:center; gap:10px;">
        <span>${player.name}</span>
        
        ${player.country ? `<img src="graphics/flags/${player.country}.png" alt="${player.country}" style="height:20px;">` : ""}
      </td>
    </tr>
    <tr><th style="text-align:left; padding:5px;">Age</th><td style="padding:5px;">${player.age}</td></tr>
    <tr><th style="text-align:left; padding:5px;">Matches / Minutes / Min per match</th><td style="padding:5px;">${player.matches} / ${player.minutes} / ${player.min_per_match}</td></tr>
    <tr><th style="text-align:left; padding:5px;">Goals+Assists</th><td style="padding:5px;">${player.goals}+${player.assists}</td></tr>
    <tr><th style="text-align:left; padding:5px;">xG / diff / non pen xG</th><td style="padding:5px;">${player.xg} / ${player.goals_xg_diff} / ${player.non_pen_xg}</td></tr>
    <tr><th style="text-align:left; padding:5px;">xA / diff / gca per 90</th><td style="padding:5px;">${player.xa} / ${player.ast_xag_diff} / ${player.gca_per90}</td></tr>
    <tr><th style="text-align:left; padding:5px;">key passes / prog passes / crosses</th><td style="padding:5px;">${player.key_passes} / ${player.pass_prog} / ${player.cross_opp_box}</td></tr>
    <tr><th style="text-align:left; padding:5px;">Fouls / Yellow / Red / Fouls on pen</th><td style="padding:5px;">${player.fouls} / ${player.yellow_cards} / ${player.red_cards} / ${player.penalty_conceded}</td></tr>
  </table>
`;

let teamHTML = `<p>Loading team strength...</p>`;
// --- Таблица силы команды с цветами ---
if (player.team) {
  try {
    const res = await fetch(`${API_URL}/team_strength/${player.team}`, { credentials: "include" });
    if (res.ok) {
      const teamData = await res.json();
      const res_next_opp = await fetch(`${API_URL}/team_strength/${teamData.next_opponent}`, { credentials: "include" });
      const nextOppData=await res_next_opp.json();
      // Предположим, что у тебя есть глобальные минимумы и максимумы по лиге
      // Можно заранее получить их с сервера или вычислить на клиенте
      const minValues = { Team_Strength: 50, Attack_Rating: 40, Defense_Rating: 40, Control_Rating: 30 };
      const maxValues = { Team_Strength: 90, Attack_Rating: 90, Defense_Rating: 85, Control_Rating: 80 };
      let lastMatchesHTML = [
        teamData.result_1,
        teamData.result_2,
        teamData.result_3,
        teamData.result_4,
        teamData.result_5
      ].map(colorResult).join("");
      let oppLastMatchesHTML = [
        nextOppData.result_1,
        nextOppData.result_2,
        nextOppData.result_3,
        nextOppData.result_4,
        nextOppData.result_5
      ].map(colorResult).join("");
      let oppRatingsHTML = [
        "  ",
        oppColorRating(nextOppData.Team_Strength),
        "/ ",
        oppColorRating(nextOppData.Attack_Rating),
        "/ ",
        oppColorRating(nextOppData.Defense_Rating)
      ].join("");

      teamHTML = `
        <table class="team-strength-table" style="width:100%; border-collapse:collapse;">
          <tr><th style="text-align:left; padding:5px;">Team</th><td style="padding:5px;">${player.team ? `<img src="graphics/logos/${player.team}.svg" alt="${player.team}" style="height:20px;">` : ""}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Last 5 matches</th><td style="padding:5px;">${lastMatchesHTML}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Overall Strength</th>
              <td style="padding:5px; color:${getRatingColorDark(teamData.Team_Strength, minValues.Team_Strength, maxValues.Team_Strength)}">${teamData.Team_Strength}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Attack</th>
              <td style="padding:5px; color:${getRatingColorDark(teamData.Attack_Rating, minValues.Attack_Rating, maxValues.Attack_Rating)}">${teamData.Attack_Rating}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Defense</th>
              <td style="padding:5px; color:${getRatingColorDark(teamData.Defense_Rating, minValues.Defense_Rating, maxValues.Defense_Rating)}">${teamData.Defense_Rating}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Control</th>
              <td style="padding:5px; color:${getRatingColorDark(teamData.Control_Rating, minValues.Control_Rating, maxValues.Control_Rating)}">${teamData.Control_Rating}</td></tr>
          <tr><th style="text-align:left; padding:5px;">Style</th><td style="padding:5px;">${teamData.Team_Style}</td></tr>
          <tr>
            <th style="text-align:left; padding:5px;">Next Opp / Ov / At / Def</th>
            <td style="padding:5px;">
              ${teamData.next_opponent ? `<img src="graphics/logos/${teamData.next_opponent}.svg" alt="${teamData.next_opponent}" style="height:20px;">` : ""}
              ${oppRatingsHTML}
            </td>
          </tr>

          <tr><th style="text-align:left; padding:5px;">Opp last 5 matches / Style</th><td style="padding:5px;">${oppLastMatchesHTML} / ${nextOppData.Team_Style}</td></tr>
        </table>
      `;
    } else {
      teamHTML = `<p>Team data not found</p>`;
    }
  } catch (err) {
    teamHTML = `<p>Error loading team data</p>`;
  }
}

// --- Обёртка с flex, чтобы таблицы были рядом ---
profileCell.innerHTML = `
  <div style="display:flex; gap:20px; align-items:flex-start;">
    <div style="flex:1;">${profileHTML}</div>
    <div style="flex:1;">${teamHTML}</div>
  </div>
`;

profileRow.appendChild(profileCell);
tr.after(profileRow);
    });


    tbody.appendChild(tr);
  });

  document.getElementById("currentPage").textContent = currentPage;
}
}

function oppColorRating(value, min = 60, max = 100) {
  if (value === null || value === undefined) return "";
  
  // нормируем значение в [0..1]
  let ratio = (value - min) / (max - min);
  ratio = Math.max(0, Math.min(1, ratio));

  // считаем цвет от темно-красного к темно-зеленому
  let r = Math.round(139 * (1 - ratio)); // темно-красный -> 139
  let g = Math.round(69 + (139 - 69) * ratio); // плавный переход
  let b = Math.round(19 + (19 - 19) * ratio); // почти фиксированный

  return `<span style="color:rgb(${r},${g},${b});  margin-right:8px;">${value}</span>`;
}


// Функция для окрашивания результата
function colorResult(res) {
  if (!res) return ""; // если None / null / undefined
  let color = "";
  if (res === "W") color = "green";
  else if (res === "D") color = "orange";
  else if (res === "L") color = "red";
  return `<span style="color:${color}; font-weight:bold; margin-right:5px;">${res}</span>`;
}


// Функция для преобразования значения в цвет от красного к зелёному
function getRatingColorDark(value, min, max) {
  const ratio = (value - min) / (max - min); // нормализуем 0-1

  const r = Math.round(120 * (1 - ratio));  // красный уменьшается от 120 до 0
  const g = Math.round(120 * ratio);        // зелёный увеличивается от 0 до 120
  const b = 0;                              // синий всегда 0

  return `rgb(${r},${g},${b})`;
}

// Переключение вида таблицы
function setView(view) {
  currentView = view;
  renderTablePage();
}



function setView(view) {
  currentView = view;
  renderTablePage(); // просто перерисовываем таблицу
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTablePage();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < Math.ceil(playersData.length / rowsPerPage)) {
    currentPage++;
    renderTablePage();
  }
});

document.getElementById("applyFiltersBtn").addEventListener("click", async () => {
  // Фильтры
  const team = document.getElementById("teamFilter").value;
  const position = document.getElementById("positionFilter").value; 
  const minGoals = document.getElementById("goalsFilter").value;
  const maxGoals = document.getElementById("goalsFilterMax").value;
  const minXg = document.getElementById("xgFilter").value;
  const maxXg = document.getElementById("xgFilterMax").value;
  const minXa = document.getElementById("xaFilter").value;
  const maxXa = document.getElementById("xaFilterMax").value;
  const minMinutes=document.getElementById("minFilter").value;
  const maxMinutes=document.getElementById("minFilterMax").value;

  // Сортировка
const column = document.getElementById("sortColumn").value;
const order = document.getElementById("sortOrder").value;

  try {
    // Формируем query string с фильтрами и сортировкой
    const params = new URLSearchParams();
    if (team) params.append("team", team);
    if (position) params.append("position", position);
    if (minGoals) params.append("min_goals", minGoals);
    if (maxGoals) params.append("max_goals", maxGoals);
    if (minMinutes) params.append("min_minutes", minMinutes);
    if (maxMinutes) params.append("max_minutes", maxMinutes);
    if (maxGoals) params.append("max_goals", maxGoals);
    if (minXg) params.append("min_xg", minXg);
    if (maxXg) params.append("max_xg", maxXg);
    if (minXa) params.append("min_xa", minXa);
    if (maxXa) params.append("max_xa", maxXa);
    if (column) params.append("sort_column", column);
    if (order) params.append("sort_order", order);
    

    // Запрос к API
    const res = await fetch(`${API_URL}/players?${params.toString()}`, {
      credentials: "include"
    });

    if (res.ok) {
      playersData = await res.json();
      currentPage = 1;
      renderTablePage(); // обновляем таблицу
    } else {
      console.error("Ошибка фильтрации и сортировки:", res.status);
    }
  } catch (err) {
    console.error("Ошибка при применении фильтров и сортировки:", err);
  }
});

document.querySelectorAll(".view-option").forEach(option => {
  option.addEventListener("click", () => {
    const selectedView = option.dataset.view;

    // снимаем выделение со всех
    document.querySelectorAll(".view-option").forEach(o => o.classList.remove("active"));
    option.classList.add("active");

    if (selectedView === "custom") {
      currentView = "custom";

      // восстанавливаем чекбоксы по previousViewColumns
      customMenu.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.checked = previousViewColumns.includes(cb.value);
      });

      // 🔑 вот этого не хватает — обновляем customSelectedColumns
      customSelectedColumns = [...previousViewColumns];

    } else {
      // сохраняем колонки текущего вида перед переключением
      previousViewColumns = tableViews[selectedView].map(c => c.key);
      currentView = selectedView;
    }

    renderTablePage();
  });
});

function toggleForms() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Смена видимости
  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  // Очистка полей
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regPass").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Страница загружена, вызываем loadPlayers()");
  document.getElementById("players").style.display = "block"; // показать таблицу
  loadPlayers();
});