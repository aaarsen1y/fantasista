from flask import Flask, request, jsonify, session, render_template
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os



# ==== Конфигурация приложения ====
app = Flask(
    __name__,
    static_folder="frontend",      # CSS, JS, картинки
    template_folder="frontend"     # HTML
)
app.config["SECRET_KEY"] = "dev-secret-key-change-me"
from flask_cors import CORS

# путь к instance
os.makedirs(app.instance_path, exist_ok=True)
db_path = os.path.join(app.instance_path, "fantasista.db")

CORS(app, origins=["http://127.0.0.1:8080"], supports_credentials=True)
app.config["SECRET_KEY"] = os.getenv("FANTASISTA_SECRET", "dev-secret-key-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ==== Модели ====
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(300), nullable=False)
    role = db.Column(db.String(20), default="user")  # user или admin

class Player(db.Model):
    __tablename__ = "player"
    player_id = db.Column(db.String, primary_key=True)  # должно совпадать с колонкой в SQLite
    player_name = db.Column(db.String)
    player_team = db.Column(db.String)
    player_country = db.Column(db.String)
    age = db.Column(db.Integer)
    matches = db.Column(db.Integer)
    minutes = db.Column(db.Integer)
    goals = db.Column(db.Integer)
    assists = db.Column(db.Integer)
    xg = db.Column(db.Float)
    xa = db.Column(db.Float)
    position = db.Column(db.Float)
    non_pen_xg = db.Column(db.Float)
    goals_xg_diff = db.Column(db.Float)
    non_pen_gls_xg_diff = db.Column(db.Float)
    shoots_ot_prc = db.Column(db.Float)
    per_90_sh = db.Column(db.Float)
    xa = db.Column(db.Float)
    ast_xag_diff = db.Column(db.Integer)
    key_passes = db.Column(db.Integer)
    pass_prog = db.Column(db.Integer)
    cross_opp_box = db.Column(db.Integer)
    gca_per90 = db.Column(db.Float)
    pass_dead_gca = db.Column(db.Integer)
    tackles = db.Column(db.Integer)
    tackles_won = db.Column(db.Integer)
    min_per_match = db.Column(db.Integer)
    starts = db.Column(db.Integer)
    team_conc_wh_onpitch = db.Column(db.Integer)
    fouls = db.Column(db.Integer)
    penalty_conceded = db.Column(db.Integer)
    red_cards = db.Column(db.Integer)
    yellow_cards = db.Column(db.Integer)


class TeamStrength(db.Model):
    __tablename__ = "team_strength"
    team_id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String, nullable=False)
    Team_Strength = db.Column(db.Float)
    Attack_Rating = db.Column(db.Float)
    Defense_Rating = db.Column(db.Float)
    Control_Rating = db.Column(db.Float)
    Team_Style = db.Column(db.String)
    next_opponent=db.Column(db.String)
    result_1=db.Column(db.Integer)
    result_2=db.Column(db.Integer)
    result_3=db.Column(db.Integer)
    result_4=db.Column(db.Integer)
    result_5=db.Column(db.Integer)


# ==== Создание таблиц при запуске ====
with app.app_context():
    db.create_all()

# ==== Декораторы ====
def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if session.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return fn(*args, **kwargs)
    return wrapper



# ==== Эндпоинты ====
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/players_page")
def players_page():
    return render_template("players.html")

@app.route("/")
def login_page():
    return render_template("index.html")


# Регистрация
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400
    hashed = generate_password_hash(password)
    user = User(email=email, password=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "email": user.email}), 201

# Логин
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401
    session["user_id"] = user.id
    session["email"] = user.email
    session["role"] = user.role
    return jsonify({"message": "Logged in", "role": user.role}), 200

# Логаут
@app.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.route("/admin/update", methods=["POST"])
@login_required
@admin_required
def update_data():
    # Заглушка: добавляем несколько игроков
    sample_players = [
        {"name": "Erling Haaland", "team": "Man City", "position": "Forward", "goals": 36},
        {"name": "Mohamed Salah", "team": "Liverpool", "position": "Forward", "goals": 22},
        {"name": "Kevin De Bruyne", "team": "Man City", "position": "Midfielder", "goals": 10},
    ]

    for sp in sample_players:
        if not Player.query.filter_by(name=sp["name"]).first():
            player = Player(**sp)
            db.session.add(player)

    db.session.commit()
    return jsonify({"message": "Данные игроков обновлены!"}), 200

# Получить список игроков с фильтрами
@app.route("/players")
def list_players():
    team = request.args.get("team", type=str)
    position = request.args.get("position")
    min_goals = request.args.get("min_goals", type=int)
    min_xg = request.args.get("min_xg", type=float)
    max_xg = request.args.get("max_xg", type=float)
    min_xa = request.args.get("min_xa", type=float)
    max_xa = request.args.get("max_xa", type=float)
    max_goals = request.args.get("max_goals", type=int)
    max_minutes = request.args.get("max_minutes", type=int)
    min_minutes = request.args.get("min_minutes", type=int)
    sort_column = request.args.get("sort_column", "player_name")
    sort_order = request.args.get("sort_order", "asc")

    valid_columns = ["player_name", "player_team", "player_country", "goals", "assists", "xg", "matches", "minutes", "position"]
    if sort_column not in valid_columns:
        return jsonify({"error": "Invalid column"}), 400
    print(team)
    q = Player.query
    # фильтры
    if team:
        q = q.filter(Player.player_team == team)
    if position:  # фильтр по позиции
        q = q.filter(Player.position == position)
    if min_goals is not None:
        q = q.filter(Player.goals >= min_goals)
    if max_goals is not None:
        q = q.filter(Player.goals <= max_goals)
    if min_minutes is not None:
        q = q.filter(Player.minutes >= min_minutes)
    if max_minutes is not None:
        q = q.filter(Player.minutes <= max_minutes)
    if max_goals is not None:
        q = q.filter(Player.goals <= max_goals)
    if min_xg is not None:
        q = q.filter(Player.xg >= min_xg)
    if max_xg is not None and max_xg>0:
        q = q.filter(Player.xg<= max_xg)
    if min_xa is not None:
        q = q.filter(Player.xa >= min_xa)
    if max_xa is not None and max_xa>0:
        q = q.filter(Player.xa<= max_xa)

    

    # сортировка
    sort_method = getattr(getattr(Player, sort_column), sort_order)()
    q = q.order_by(sort_method)

    players = q.all()

    result = [
        {
            "id": p.player_id,
            "name": p.player_name,
            "team": p.player_team,
            "country": p.player_country,
            "age": p.age,
            "matches": p.matches,
            "minutes": p.minutes,
            "goals": p.goals,
            "assists": p.assists,
            "xg": round(p.xg, 2) if p.xg is not None else 0.0,
            "position": p.position,
            "non_pen_xg": round(p.non_pen_xg, 2) if p.non_pen_xg is not None else 0.0,
            "goals_xg_diff": round(p.goals_xg_diff, 2) if p.goals_xg_diff is not None else 0.0,
            "non_pen_gls_xg_diff": round(p.non_pen_gls_xg_diff, 2) if p.non_pen_gls_xg_diff is not None else 0.0,
            "shoots_ot_prc": round(p.shoots_ot_prc, 2) if p.shoots_ot_prc is not None else 0.0,
            "per_90_sh": round(p.per_90_sh, 2) if p.per_90_sh is not None else 0.0,
            "xa": round(p.xa, 2) if p.xa is not None else 0.0,
            "ast_xag_diff": p.ast_xag_diff,
            "key_passes": p.key_passes,
            "pass_prog": p.pass_prog,
            "cross_opp_box": p.cross_opp_box,
            "gca_per90": round(p.gca_per90, 2) if p.gca_per90 is not None else 0.0,
            "pass_dead_gca": p.pass_dead_gca,
            "tackles": p.tackles,
            "tackles_won": p.tackles_won,
            "min_per_match": p.min_per_match,
            "starts": p.starts,
            "team_conc_wh_onpitch": p.team_conc_wh_onpitch,
            "fouls": p.fouls,
            "penalty_conceded": p.penalty_conceded,
            "red_cards": p.red_cards,
            "yellow_cards": p.yellow_cards
      
        }
        for p in players
    ]
    return jsonify(result)



@app.route("/sort_by")
def sort_by():
    column = request.args.get("column", "player_name")
    order = request.args.get("order", "asc")

    # проверяем, что колонка допустима
    valid_columns = ["player_name", "player_team", "player_country", "goals", "assists", "xg", "matches", "minutes", "position"]
    if column not in valid_columns:
        return jsonify({"error": "Invalid column"}), 400

    # сортировка по возрастанию или убыванию
    sort_method = getattr(getattr(Player, column), order)()  # Player.goals.asc() или Player.goals.desc()
    players = Player.query.order_by(sort_method).all()

    result = [
        {
            "id": p.player_id,
            "name": p.player_name,
            "team": p.player_team,
            "position": p.player_position,
            "country": p.player_country,
            "age": p.age,
            "matches": p.matches,
            "minutes": p.minutes,
            "goals": p.goals,
            "assists": p.assists,
            "xg": round(p.xg, 2) if p.xg is not None else 0.0
        }
        for p in players
    ]
    return jsonify(result)



# Админ: добавить игрока
@app.route("/admin/players", methods=["POST"])
@login_required
@admin_required
def add_player():
    data = request.get_json(force=True)
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    player = Player(
        name=name,
        team=data.get("team"),
        position=data.get("position"),
        goals=data.get("goals", 0)
    )
    db.session.add(player)
    db.session.commit()
    return jsonify({"message": "Player added", "id": player.id}), 201

# Получить игрока по ID
@app.route("/players/<int:player_id>", methods=["GET"])
@login_required
def get_player(player_id):
    p = Player.query.get_or_404(player_id)
    return jsonify({"id": p.id, "name": p.name, "team": p.team, "position": p.position, "goals": p.goals}, )

# Поиск игрока по имени
@app.route("/search", methods=["GET"])
@login_required
def search_players():
    q = request.args.get("q", "")
    players = Player.query.filter(Player.player_name.ilike(f"%{q}%")).all()
    return jsonify([{"name": p.player_name} for p in players])


@app.route("/team_strength/<team_name>", methods=["GET"])
def team_strength(team_name):
    team = TeamStrength.query.filter_by(team_name=team_name).first()
    if not team:
        return jsonify({"error": "Team data not found"}), 404

    result = {
        "team_id": team.team_id,
        "team_name": team.team_name,
        "Team_Strength": round(team.Team_Strength, 2) if team.Team_Strength is not None else 0.0,
        "Attack_Rating": round(team.Attack_Rating, 2) if team.Attack_Rating is not None else 0.0,
        "Defense_Rating": round(team.Defense_Rating, 2) if team.Defense_Rating is not None else 0.0,
        "Control_Rating": round(team.Control_Rating, 2) if team.Control_Rating is not None else 0.0,
        "Team_Style": team.Team_Style or "",
        "next_opponent": team.next_opponent,
        "result_1": team.result_1,
        "result_2": team.result_2,
        "result_3": team.result_3,
        "result_4": team.result_4,
        "result_5": team.result_5,


    }
    return jsonify(result)



# ==== Запуск ====
if __name__ == "__main__":
    app.run(debug=True)
