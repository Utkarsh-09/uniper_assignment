from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import jwt
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Secret key for JWT encoding/decoding (for demo only)
JWT_SECRET = "supersecretkey"
JWT_ALGORITHM = "HS256"

# Hardcoded user for demo
USER = {
    "username": "testuser",
    "password": "testpass"
}

weather_options = [
    {"temp": 25, "condition": "Sunny"},
    {"temp": 18, "condition": "Cloudy"},
    {"temp": 30, "condition": "Hot"},
    {"temp": 15, "condition": "Rainy"},
    {"temp": 22, "condition": "Windy"},
]

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except Exception as e:
            return jsonify({"error": "Token is invalid!"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if username == USER["username"] and password == USER["password"]:
        payload = {
            "username": username,
            "exp": datetime.utcnow() + timedelta(hours=2)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return jsonify({"token": token})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City is required"}), 400
    weather = random.choice(weather_options)
    result = {
        "city": city,
        "temperature": weather["temp"],
        "condition": weather["condition"],
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }
    return jsonify(result)

@app.route('/history', methods=['GET'])
@token_required
def get_history():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City is required"}), 400
    # Generate mock history for last 7 days
    today = datetime.utcnow()
    history = []
    for i in range(7):
        day = today - timedelta(days=i)
        weather = random.choice(weather_options)
        history.append({
            "date": day.strftime("%Y-%m-%d"),
            "temperature": weather["temp"],
            "condition": weather["condition"]
        })
    return jsonify({
        "city": city,
        "history": list(reversed(history))  # oldest to newest
    })

@app.route('/recommendation', methods=['GET'])
@token_required
def get_recommendation():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City is required"}), 400
    # Generate mock history for next 7 days
    today = datetime.utcnow()
    days = []
    for i in range(7):
        day = today + timedelta(days=i)
        weather = random.choice(weather_options)
        days.append({
            "date": day.strftime("%Y-%m-%d"),
            "temperature": weather["temp"],
            "condition": weather["condition"]
        })
    # Recommend the sunniest, mildest day
    best_day = min(
        days,
        key=lambda d: (
            0 if d["condition"] == "Sunny" else 1,  # Prefer sunny
            abs(d["temperature"] - 22)  # Prefer temp close to 22°C
        )
    )
    return jsonify({
        "city": city,
        "recommendation": {
            "date": best_day["date"],
            "temperature": best_day["temperature"],
            "condition": best_day["condition"]
        }
    })

if __name__ == '__main__':
    app.run(port=5000)
