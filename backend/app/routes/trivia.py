from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g
from app.auth import require_auth
from app.extensions import db
from app.models import TriviaQuestion, TriviaLog, Team

trivia_bp = Blueprint("trivia", __name__, url_prefix="/api/v1/trivia")


@trivia_bp.route("/question", methods=["GET"])
@require_auth
def get_daily_question():
    """Matches contract: GET /api/v1/trivia/question"""
    today = datetime.now(timezone.utc).date()
    question = (
        TriviaQuestion.query.filter_by(active_date=today).first() 
        or TriviaQuestion.query.order_by(TriviaQuestion.id.asc()).first()
    )

    if not question:
        return jsonify({"error": "No trivia question available"}), 404

    # Do not leak the correct option index to the frontend client
    return jsonify({
        "id": question.id,
        "question": question.question,
        "options": question.options,
        "points_reward": question.points_reward
    }), 200


@trivia_bp.route("/submit", methods=["POST"])
@require_auth
def submit_trivia_answer():
    """Matches contract: POST /api/v1/trivia/submit"""
    data = request.get_json() or {}
    question_id = data.get("question_id")
    selected_index = data.get("selected_option_index")

    question = TriviaQuestion.query.filter_by(id=question_id).first()
    if not question:
        return jsonify({"error": "Invalid question_id"}), 404

    # Check for duplicate attempt today
    existing_log = TriviaLog.query.filter_by(user_id=g.user_id, question_id=question.id).first()
    if existing_log:
        return jsonify({"error": "Trivia already attempted today", "is_correct": existing_log.is_correct}), 400

    is_correct = (selected_index == question.correct_option_index)
    points_awarded = question.points_reward if is_correct else 0

    log = TriviaLog(user_id=g.user_id, question_id=question.id, is_correct=is_correct)
    db.session.add(log)

    if is_correct:
        team = Team.query.filter_by(user_id=g.user_id).first()
        if team:
            team.upgrade_points += points_awarded

    db.session.commit()

    return jsonify({
        "is_correct": is_correct,
        "points_awarded": points_awarded,
        "correct_option_index": question.correct_option_index
    }), 200