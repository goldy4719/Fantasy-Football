# backend/run.py
import os
from app import create_app

# Instantiate the Flask app via the factory
app = create_app()

if __name__ == "__main__":
    # Pull settings from .env, falling back to development defaults
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    
    # 0.0.0.0 makes the server accessible across local network/containers,
    # or you can use "127.0.0.1" for strictly local host access
    app.run(host="0.0.0.0", port=port, debug=debug)