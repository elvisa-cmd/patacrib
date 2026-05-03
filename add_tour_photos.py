from app import app, db
from sqlalchemy import inspect, text

def add_tour_photos_column():
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('property')]
        
        if 'tour_photos' not in columns:
            try:
                db.session.execute(text('ALTER TABLE property ADD COLUMN tour_photos TEXT DEFAULT "[]"'))
                db.session.commit()
                print("✅ Added tour_photos column successfully!")
            except Exception as e:
                print(f"❌ Error adding column: {e}")
                db.session.rollback()
        else:
            print("✅ tour_photos column already exists")

if __name__ == '__main__':
    add_tour_photos_column()