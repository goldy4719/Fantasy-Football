# backend/app/auth.py
from __future__ import annotations
import os
import uuid
from functools import wraps
from flask import request, jsonify, g

DEFAULT_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def get_current_user_id() -> str | None:
    """
    Retrieves the authenticated user ID.
    
    Increment 2:
      - If ALLOW_AUTH_BYPASS is 'true', checks for 'X-Test-User-Id' header.
      - Falls back to DEFAULT_TEST_USER_ID if no header is supplied.
    
    Increment 3:
      - Validates the Supabase Bearer JWT token from Authorization header.
    """
    allow_bypass = os.getenv("ALLOW_AUTH_BYPASS", "false").lower() == "true"

    if allow_bypass:
        test_user_id = request.headers.get("X-Test-User-Id")
        if test_user_id:
            return test_user_id
        # Fall back to configured TEST_USER_ID or default mock UUID
        return os.getenv("TEST_USER_ID", DEFAULT_TEST_USER_ID)

    # Placeholder for Increment 3 real Supabase JWT decoding
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    # TODO: In Increment 3, decode auth_header.split(" ")[1] using SUPABASE_JWT_SECRET
    return None


def require_auth(f):
    """
    Route decorator ensuring a valid user_id exists before executing the handler.
    Injects user_id into Flask's application context (g.user_id).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({
                "error": "Unauthorized", 
                "message": "Missing or invalid authentication credentials."
            }), 401

        try:
            # Validate that user_id is a valid UUID string
            g.user_id = str(uuid.UUID(str(user_id)))
        except ValueError:
            return jsonify({
                "error": "Bad Request", 
                "message": f"Malformed user UUID: {user_id}"
            }), 400

        return f(*args, **kwargs)

    return decorated
