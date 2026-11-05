# backend/app/routes/admin.py
from flask import Blueprint, jsonify
from app.auth import require_auth
from app.extensions import db
from app.models import LeagueState, Matchup

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@admin_bp.route("/league-state", methods=["GET"])
@require_auth
def get_league_state():
    """Returns current active season and week."""
    state = LeagueState.query.order_by(LeagueState.id.desc()).first()
    if not state:
        return jsonify({"error": "League state not initialized"}), 500
    return jsonify(state.to_dict()), 200


@admin_bp.route("/advance-week", methods=["POST"])
@require_auth
def advance_week():
    """
    Steps the league current_week forward by 1 for testing purposes.
    Sets is_active=False if advancing past the last scheduled week.
    """
    state = LeagueState.query.order_by(LeagueState.id.desc()).first()
    if not state:
        return jsonify({"error": "No league state record found"}), 500

    max_week_row = db.session.query(db.func.max(Matchup.week)).scalar() or 18

    state.current_week += 1
    if state.current_week > max_week_row:
        state.is_active = False

    db.session.commit()

    return jsonify({
        "message": f"League advanced to Week {state.current_week}",
        "current_week": state.current_week,
        "season": state.season,
        "is_active": state.is_active
    }), 200