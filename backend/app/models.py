# backend/app/models.py
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.extensions import db

class LeagueState(db.Model):
    __tablename__ = "league_state"

    id = db.Column(db.Integer, primary_key=True)
    current_week = db.Column(db.Integer, nullable=False, default=8)
    season = db.Column(db.Integer, nullable=False, default=2026)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    updated_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "current_week": self.current_week,
            "season": self.season,
            "is_active": self.is_active
        }


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.String(32), primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), nullable=True)  # Plain UUID for Increment 2
    name = db.Column(db.String(100), nullable=False)
    coach_style_id = db.Column(db.Integer, nullable=False, default=0)
    upgrade_points = db.Column(db.Integer, nullable=False, default=100)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    stadium = db.relationship("Stadium", backref="team", uselist=False, cascade="all, delete-orphan")
    performances = db.relationship("WeeklyPerformance", backref="team", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "coach_style_id": self.coach_style_id,
            "upgrade_points": self.upgrade_points
        }


class Stadium(db.Model):
    __tablename__ = "stadiums"

    team_id = db.Column(db.String(32), db.ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    stadium_name = db.Column(db.String(100), nullable=False)
    stadium_quality = db.Column(db.Integer, nullable=False, default=50)
    player_attrition = db.Column(db.Float, nullable=False, default=0.20)
    updated_at = db.Column(
        db.DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "team_id": self.team_id,
            "stadium_name": self.stadium_name,
            "stadium_quality": self.stadium_quality,
            "player_attrition": self.player_attrition
        }


class Player(db.Model):
    __tablename__ = "players"

    id = db.Column(db.String(32), primary_key=True)  # Tank01 ID (e.g., 'p_15')
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(10), nullable=False)
    nfl_team = db.Column(db.String(10), nullable=True)
    college = db.Column(db.String(100), nullable=True)

    performances = db.relationship("WeeklyPerformance", backref="player", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "position": self.position,
            "nfl_team": self.nfl_team,
            "college": self.college
        }


class Matchup(db.Model):
    __tablename__ = "matchups"

    id = db.Column(db.String(32), primary_key=True)
    week = db.Column(db.Integer, nullable=False)
    season = db.Column(db.Integer, nullable=False, default=2026)
    home_team_id = db.Column(db.String(32), db.ForeignKey("teams.id", ondelete="CASCADE"))
    away_team_id = db.Column(db.String(32), db.ForeignKey("teams.id", ondelete="CASCADE"))
    status = db.Column(db.String(20), nullable=False, default="SCHEDULED")
    home_total_score = db.Column(db.Float, default=0.0)
    away_total_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Explicit relationships for home and away
    home_team = db.relationship("Team", foreign_keys=[home_team_id])
    away_team = db.relationship("Team", foreign_keys=[away_team_id])
    performances = db.relationship("WeeklyPerformance", backref="matchup", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "week": self.week,
            "season": self.season,
            "home_team_id": self.home_team_id,
            "away_team_id": self.away_team_id,
            "status": self.status,
            "home_total_score": self.home_total_score,
            "away_total_score": self.away_total_score
        }


class WeeklyPerformance(db.Model):
    __tablename__ = "weekly_performances"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.String(32), db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    matchup_id = db.Column(db.String(32), db.ForeignKey("matchups.id", ondelete="CASCADE"), nullable=False)
    player_id = db.Column(db.String(32), db.ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    week = db.Column(db.Integer, nullable=False)
    starter = db.Column(db.Boolean, nullable=False, default=True)
    base_score = db.Column(db.Float, nullable=False, default=0.0)
    multiplier = db.Column(db.Float, nullable=False, default=1.0)
    final_score = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), nullable=False, default="FINAL")

    def to_dict(self):
        return {
            "id": self.id,
            "player_id": self.player_id,
            "player_name": self.player.name if self.player else None,
            "position": self.player.position if self.player else None,
            "college": self.player.college if self.player else None,
            "starter": self.starter,
            "base_score": self.base_score,
            "multiplier": self.multiplier,
            "final_score": self.final_score
        }


class TriviaQuestion(db.Model):
    __tablename__ = "trivia_questions"

    id = db.Column(db.Integer, primary_key=True)
    active_date = db.Column(db.Date, unique=True, nullable=False, default=datetime.now(timezone.utc).date)
    question = db.Column(db.Text, nullable=False)
    options = db.Column(JSONB, nullable=False)
    correct_option_index = db.Column(db.Integer, nullable=False)
    points_reward = db.Column(db.Integer, nullable=False, default=25)


class TriviaLog(db.Model):
    __tablename__ = "trivia_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), nullable=True)
    question_id = db.Column(db.Integer, db.ForeignKey("trivia_questions.id", ondelete="CASCADE"), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    answered_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("user_id", "question_id", name="unique_daily_attempt"),
    )