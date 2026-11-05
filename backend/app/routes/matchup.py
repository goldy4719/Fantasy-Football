# backend/app/routes/matchups.py
from flask import Blueprint, jsonify, request, g
from app.auth import require_auth
from app.extensions import db
from app.models import LeagueState, Team, Matchup, WeeklyPerformance, Player

matchups_bp = Blueprint("matchups", __name__, url_prefix="/api/v1/matchups")


@matchups_bp.route("/current", methods=["GET"])
@require_auth
def get_current_matchup():
    """
    Retrieves the current week's matchup and player performances 
    for the authenticated user's team.
    """
    # 1. Determine active week from league state
    state = LeagueState.query.order_by(LeagueState.id.desc()).first()
    current_week = state.current_week if state else 8

    # 2. Identify the user's team
    user_team = Team.query.filter_by(user_id=g.user_id).first()
    if not user_team:
        # Fallback to team_001 if testing without bound UUID
        user_team = Team.query.filter_by(id="team_001").first()
        if not user_team:
            return jsonify({"error": "Team not found for current user"}), 404

    # 3. Locate the matchup involving this team for the active week
    matchup = Matchup.query.filter(
        Matchup.week == current_week,
        (Matchup.home_team_id == user_team.id) | (Matchup.away_team_id == user_team.id)
    ).first()

    if not matchup:
        return jsonify({
            "message": f"No matchup scheduled for {user_team.name} in Week {current_week}",
            "current_week": current_week
        }), 404

    # 4. Fetch all player performances for this matchup
    performances = (
        WeeklyPerformance.query
        .filter_by(matchup_id=matchup.id)
        .join(Player, WeeklyPerformance.player_id == Player.id)
        .all()
    )

    home_roster = []
    away_roster = []

    for p in performances:
        item = p.to_dict()
        if p.team_id == matchup.home_team_id:
            home_roster.append(item)
        else:
            away_roster.append(item)

    return jsonify({
        "matchup_id": matchup.id,
        "week": matchup.week,
        "season": matchup.season,
        "status": matchup.status,
        "home_team": {
            "id": matchup.home_team.id if matchup.home_team else matchup.home_team_id,
            "name": matchup.home_team.name if matchup.home_team else "Home Team",
            "score": matchup.home_total_score,
            "roster": home_roster
        },
        "away_team": {
            "id": matchup.away_team.id if matchup.away_team else matchup.away_team_id,
            "name": matchup.away_team.name if matchup.away_team else "Away Team",
            "score": matchup.away_total_score,
            "roster": away_roster
        }
    }), 200


@matchups_bp.route("/<matchup_id>", methods=["GET"])
@require_auth
def get_matchup_by_id(matchup_id):
    """Retrieves full details and roster breakdown for any specific matchup ID."""
    matchup = Matchup.query.filter_by(id=matchup_id).first()
    if not matchup:
        return jsonify({"error": f"Matchup {matchup_id} not found"}), 404

    performances = WeeklyPerformance.query.filter_by(matchup_id=matchup.id).all()

    return jsonify({
        "matchup": matchup.to_dict(),
        "performances": [p.to_dict() for p in performances]
    }), 200