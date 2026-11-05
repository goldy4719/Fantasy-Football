# backend/app/routes/teams.py
from flask import Blueprint, jsonify, request
from app.auth import require_auth
from app.extensions import db
from app.models import Team, Stadium

teams_bp = Blueprint("teams", __name__, url_prefix="/api/v1/teams")


@teams_bp.route("/<team_id>/stadium", methods=["GET"])
@require_auth
def get_team_stadium(team_id):
    """Returns stadium condition, attrition rate, and available upgrade points."""
    team = Team.query.filter_by(id=team_id).first()
    if not team:
        return jsonify({"error": f"Team {team_id} not found"}), 404

    stadium = Stadium.query.filter_by(team_id=team.id).first()
    if not stadium:
        return jsonify({"error": f"Stadium record not found for {team_id}"}), 404

    return jsonify({
        "team_id": team.id,
        "team_name": team.name,
        "upgrade_points": team.upgrade_points,
        "stadium_name": stadium.stadium_name,
        "stadium_quality": stadium.stadium_quality,
        "player_attrition": stadium.player_attrition
    }), 200


@teams_bp.route("/<team_id>/stadium/upgrade", methods=["POST"])
@require_auth
def upgrade_stadium(team_id):
    """
    Applies upgrades to stadium facilities and deducts team upgrade points.
    Expected JSON payload:
      {
        "upgrade_type": "TURF" | "MEDICAL" | "FACILITIES",
        "points_to_spend": 25
      }
    """
    team = Team.query.filter_by(id=team_id).first()
    if not team:
        return jsonify({"error": f"Team {team_id} not found"}), 404

    stadium = Stadium.query.filter_by(team_id=team.id).first()
    if not stadium:
        return jsonify({"error": f"Stadium record not found for {team_id}"}), 404

    data = request.get_json() or {}
    upgrade_type = data.get("upgrade_type", "TURF").upper()
    cost = int(data.get("points_to_spend", 25))

    if team.upgrade_points < cost:
        return jsonify({
            "error": "Insufficient points",
            "current_points": team.upgrade_points,
            "required_points": cost
        }), 400

    # Apply upgrade multipliers
    if upgrade_type == "TURF":
        # Boosts stadium quality
        stadium.stadium_quality = min(100, stadium.stadium_quality + 5)
    elif upgrade_type in ("MEDICAL", "FACILITIES"):
        # Decreases injury/attrition risk down to a 5% baseline
        stadium.player_attrition = max(0.05, round(stadium.player_attrition - 0.02, 3))
    else:
        return jsonify({"error": f"Unknown upgrade_type '{upgrade_type}'"}), 400

    team.upgrade_points -= cost
    db.session.commit()

    return jsonify({
        "message": f"Successfully applied {upgrade_type} upgrade",
        "remaining_points": team.upgrade_points,
        "stadium": stadium.to_dict()
    }), 200