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

    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)

    # Register Blueprint routes
    from app.routes.matchups import matchups_bp
    from app.routes.teams import teams_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(matchups_bp)
    app.register_blueprint(teams_bp)
    app.register_blueprint(admin_bp)

    return app