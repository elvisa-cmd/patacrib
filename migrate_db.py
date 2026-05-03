# migrate_db.py
from app import app, db
from sqlalchemy import inspect, text

def add_columns_if_not_exists():
    """Add new columns to existing tables WITHOUT deleting data"""
    with app.app_context():
        inspector = inspect(db.engine)
        
        # Get existing columns in Property table
        existing_columns = [col['name'] for col in inspector.get_columns('property')]
        
        # Define new columns to add
        new_columns = {
            'water_supplier': 'VARCHAR(100) DEFAULT "Nairobi Water"',
            'water_schedule_today': 'VARCHAR(50)',
            'water_schedule_tomorrow': 'VARCHAR(50)',
            'has_borehole': 'BOOLEAN DEFAULT 0',
            'has_water_tank': 'BOOLEAN DEFAULT 0',
            'matatu_routes': 'TEXT DEFAULT "[]"',
            'nearest_stage': 'VARCHAR(100)',
            'stage_distance': 'INTEGER',
            'cbd_travel_time': 'INTEGER',
            'safety_score': 'INTEGER',
            'police_distance': 'FLOAT',
            'street_lights': 'BOOLEAN DEFAULT 1',
            'night_safety': 'VARCHAR(20)',
            'neighbor_reviews': 'INTEGER DEFAULT 0',
            'safety_percentage': 'INTEGER'
        }
        
        # Add each column if it doesn't exist
        for column, definition in new_columns.items():
            if column not in existing_columns:
                try:
                    db.session.execute(text(f'ALTER TABLE property ADD COLUMN {column} {definition}'))
                    print(f'✅ Added column: {column}')
                except Exception as e:
                    print(f'⚠️ Could not add {column}: {e}')
        
        # Check User table for new columns
        user_columns = [col['name'] for col in inspector.get_columns('user')]
        user_new_columns = {
            'is_verified': 'BOOLEAN DEFAULT 0',
            'verified_at': 'DATETIME',
            'response_rate': 'INTEGER DEFAULT 100',
            'response_time': 'VARCHAR(20) DEFAULT "< 1 hour"',
            'total_listings': 'INTEGER DEFAULT 0',
            'last_active': 'DATETIME'
        }
        
        for column, definition in user_new_columns.items():
            if column not in user_columns:
                try:
                    db.session.execute(text(f'ALTER TABLE user ADD COLUMN {column} {definition}'))
                    print(f'✅ Added column: {column}')
                except Exception as e:
                    print(f'⚠️ Could not add {column}: {e}')
        
        db.session.commit()
        print('\n🎉 Migration complete! Your data is SAFE.')
        print('🚀 You can now run your app normally: python app.py')

if __name__ == '__main__':
    add_columns_if_not_exists()