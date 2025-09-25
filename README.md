
**Описание:** REST API для анализа спортивной статистики. Позволяет пользователям регистрироваться, входить в систему, просматривать и фильтровать статистику игроков.

**База данных:** SQLite  
**Фреймворк:** Flask  
**Аутентификация:** Сессии (cookie `session`)

---
## Базовый URL

`https://fantasista.onrender.com`

---

## 1. Health Check

**GET** `/health`
Проверка доступности сервера.

**Пример запроса:**
`GET https://fantasista.onrender.com/health`

**Ответ 200 OK:**

`{   "status": "ok" }`

---

## 2. Регистрация пользователя

**POST** `/register`

Создание нового пользователя.

**Тело запроса:**

`{   "email": "user@example.com",   "password": "password123" }`

**Пример запроса с `curl`:**

`curl -X POST https://fantasista.onrender.com/register \ -H "Content-Type: application/json" \ -d '{"email":"user@example.com","password":"password123"}'`

**Ответ 201 Created:**

`{   "email": "user@example.com", "message": "User created" }`

**Ошибки:**

- 400: отсутствуют email или пароль
    
- 400: пользователь уже существует
    

---

## 3. Логин пользователя

**POST** `/login`

Аутентификация пользователя и создание сессии.

**Тело запроса:**

`{   "email": "user@example.com",   "password": "password123" }`

**Ответ 200 OK:**

`{   "message": "Logged in",   "role": "user" }`

**Ошибки:**

- 400: отсутствуют email или пароль
    `{   "error": "email and password required" }`
- 401: неверные учетные данные
    `{   "error": "Invalid credentials" }`

---

## 4. Логаут

**POST** `/logout`

Завершение сессии пользователя.  **Для запроса требуется авторизация.**

**Ответ 200 OK:**

`{   "message": "Logged out" }`

**Ошибки:**

- 401: пользователь не авторизован
	`{   "error": "Authentication required"}`
    

---

## 5. Получение списка игроков

**GET** `/players`

Возвращает список игроков с возможностью фильтрации и сортировки.

**Параметры запроса (query params):**

| Параметр      | Тип    | Описание                                                                                                                            |
| ------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `team`        | string | Фильтр по команде                                                                                                                   |
| `position`    | string | Фильтр по позиции                                                                                                                   |
| `min_goals`   | int    | Минимальное количество голов                                                                                                        |
| `max_goals`   | int    | Максимальное количество голов                                                                                                       |
| `min_xg`      | float  | Минимальный xG                                                                                                                      |
| `max_xg`      | float  | Максимальный xG                                                                                                                     |
| `min_xa`      | float  | Минимальный xA                                                                                                                      |
| `max_xa`      | float  | Максимальный xA                                                                                                                     |
| `min_minutes` | int    | Минимальное количество минут                                                                                                        |
| `max_minutes` | int    | Максимальное количество минут                                                                                                       |
| `sort_column` | string | Колонка для сортировки (`player_name`, `player_team`, `player_country`, `goals`, `assists`, `xg`, `matches`, `minutes`, `position`) |
| `sort_order`  | string | Порядок сортировки: `asc` или `desc`                                                                                                |

**Пример запроса:**

`GET https://fantasista.onrender.com/players?team=Man%20City&min_goals=10&sort_column=goals&sort_order=desc`

**Ответ 200 OK:**

`[   {"age": 23,

	        "assists": 0,
        "ast_xag_diff": 0,
        "country": "SCO",
        "cross_opp_box": 0,
        "fouls": 1,
        "gca_per90": 0,
        "goals": 0,
        "goals_xg_diff": 0,
        "id": "1780bb4a",
        "key_passes": 0,
        "matches": 3,
        "min_per_match": 8,
        "minutes": 23,
        "name": "Aaron Hickey",
        "non_pen_gls_xg_diff": 0,
        "non_pen_xg": 0,
        "pass_dead_gca": 0,
        "pass_prog": 0,
        "penalty_conceded": 0,
        "per_90_sh": 0,
        "position": "DF,FW",
        "red_cards": 0,
        "shoots_ot_prc": 0.0,
        "starts": 0,
        "tackles": 3,
        "tackles_won": 1,
        "team": "Brentford",
        "team_conc_wh_onpitch": 1,
        "xa": 0,
        "xg": 0,
        "yellow_cards": 1 } ]`

**Ошибки:**

- 400: недопустимая колонка для сортировки
    

---

## 6. Получение игрока по ID

**GET** `/players?player_id=<player_id>`

Возвращает данные конкретного игрока по его уникальному идентификатору.  
**Требуется авторизация.**

**Параметры запроса:**

- `player_id` — уникальный идентификатор игрока (например: `9e525177`)
    

**Пример запроса:**

`GET https://fantasista.onrender.com/players?player_id=9e525177`

**Ответ 200 OK:**

`{   "id": "9e525177",   "name": "Erling Haaland",   "team": "Man City",   "position": "Forward",   "goals": 36,   "assists": 7,   "xg": 32.5,   "minutes": 2700,   "matches": 30,   "age": 23,   "country": "Norway" }`

**Ошибки:**

- 401: пользователь не авторизован
    
- 404: игрок не найден
    

---

## 7. Поиск игроков

**GET** `/search?q=<name>`

Возвращает список игроков, имя которых совпадает или частично совпадает с `q`.  
**Требуется авторизация.**

**Параметры запроса:**

- `q` — часть имени игрока для поиска
    

**Пример запроса:**

`GET https://fantasista.onrender.com/search?q=Salah`

**Ответ 200 OK:**

[
    {
        "name": "Mohamed Salah"
    }
]

**Ошибки:**

- 401: пользователь не авторизован
	`{   "error": "Authentication required"}`
    

---

## 8. Данные силы команды

**GET** `/team_strength/<team_name>`

Возвращает метрики команды: силу, рейтинг атаки, защиты, контроль и стиль игры.

**Пример запроса:**

`GET https://fantasista.onrender.com/team_strength/Liverpool

**Ответ 200 OK:**

{

    "Attack_Rating": 95.0,
    "Control_Rating": 87.2,
    "Defense_Rating": 80.1,
    "Team_Strength": 83.8,
    "Team_Style": "Possession",
    "next_opponent": "Crystal Palace",
    "result_1": "W",
    "result_2": "W",
    "result_3": "W",
    "result_4": "W",
    "result_5": "W",
    "team_id": "822bd0ba",
    "team_name": "Liverpool"
}

**Ошибки:**

- 404: данные команды не найдены
    

---
## 9. Дополнительно

- Все числа с плавающей точкой округлены до 2 знаков.
    
- Параметры фильтра и сортировки можно комбинировать.
    
- Все эндпоинты, требующие авторизацию, используют сессии через cookie `session`.
  
- [Коллекция в Postman](https://arseniykalistratov11-1078280.postman.co/workspace/fantasista-API~50260fab-5b71-43ad-adf0-51b74a1ad400/collection/48453097-223e1965-1468-492c-9c8d-ffb109716cbf?action=share&creator=48453097)
    

