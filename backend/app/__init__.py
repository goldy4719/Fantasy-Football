# backend/app/__init__.py
import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.extensions import db

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app)

    # 1. Database Configuration
    db_url = os.getenv("DATABASE_URL", "")


    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # 2. Initialize Extensions
    db.init_app(app)

    # 3. Import and Register Blueprints
    from app.routes.matchup import matchups_bp
    from app.routes.teams import teams_bp
    from app.routes.trivia import trivia_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(matchups_bp)
    app.register_blueprint(teams_bp)
    app.register_blueprint(trivia_bp)
    app.register_blueprint(admin_bp)

    return app