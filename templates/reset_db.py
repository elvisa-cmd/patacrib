# reset_db.py
from app import app, db, init_database

with app.app_context():
    db.drop_all()        # Delete all tables
    db.create_all()      # Create fresh tables
    init_database()      # Add default data
    print("✅ Database reset complete! Fresh database created.")