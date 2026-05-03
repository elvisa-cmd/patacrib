# fresh_start.py - RUN THIS ONCE
from app import app, db

print("🚀 Creating fresh database...")

with app.app_context():
    # Create all tables
    db.create_all()
    
    # Add default matatu routes
    from app import MatatuRoute
    routes = [
        MatatuRoute(route_number='44', sacco='KBS', from_area='Kilimani', to_area='CBD', via='Valley Rd'),
        MatatuRoute(route_number='105', sacco='Eastlands', from_area='Kilimani', to_area='CBD', via='Ngong Rd'),
        MatatuRoute(route_number='33C', sacco='Ngong Rd', from_area='Kilimani', to_area='Ngong', via='Ngong Rd'),
        MatatuRoute(route_number='23', sacco='KBS', from_area='Westlands', to_area='CBD', via='Westlands Rd'),
        MatatuRoute(route_number='48', sacco='City Hoppa', from_area='Westlands', to_area='CBD', via='Waiyaki Way'),
        MatatuRoute(route_number='11', sacco='Kenya Bus', from_area='Westlands', to_area='CBD', via='University Way'),
        MatatuRoute(route_number='33', sacco='Ngong Rd', from_area='South B', to_area='CBD', via='Mombasa Rd'),
        MatatuRoute(route_number='125', sacco='Eastlands', from_area='South B', to_area='CBD', via='Mombasa Rd'),
    ]
    for route in routes:
        db.session.add(route)
    
    # Add default water schedules
    from app import WaterSchedule
    schedules = [
        WaterSchedule(city='Nairobi', estate='Kilimani', supplier='Nairobi Water', schedule_today='8am - 12pm', schedule_tomorrow='2pm - 6pm'),
        WaterSchedule(city='Nairobi', estate='Westlands', supplier='Nairobi Water', schedule_today='6am - 10am', schedule_tomorrow='4pm - 8pm'),
        WaterSchedule(city='Nairobi', estate='South B', supplier='Nairobi Water', schedule_today='10am - 2pm', schedule_tomorrow='6am - 10am'),
        WaterSchedule(city='Nairobi', estate='South C', supplier='Nairobi Water', schedule_today='2pm - 6pm', schedule_tomorrow='8am - 12pm'),
        WaterSchedule(city='Nairobi', estate='Eastlands', supplier='Nairobi Water', schedule_today='Alternate days', schedule_tomorrow='6am - 10am'),
        WaterSchedule(city='Nairobi', estate='Karen', supplier='Nairobi Water', schedule_today='6am - 10am', schedule_tomorrow='6am - 10am'),
    ]
    for ws in schedules:
        db.session.add(ws)
    
    # Add default safety data
    from app import NeighborhoodSafety
    safety_data = [
        NeighborhoodSafety(city='Nairobi', estate='Kilimani', safety_score=82, police_distance=1.2, street_lights=True, night_safety='Moderate', total_reviews=23, safe_percentage=82),
        NeighborhoodSafety(city='Nairobi', estate='Westlands', safety_score=85, police_distance=0.8, street_lights=True, night_safety='High', total_reviews=31, safe_percentage=85),
        NeighborhoodSafety(city='Nairobi', estate='South B', safety_score=75, police_distance=1.5, street_lights=True, night_safety='Moderate', total_reviews=18, safe_percentage=75),
        NeighborhoodSafety(city='Nairobi', estate='South C', safety_score=78, police_distance=1.3, street_lights=True, night_safety='Moderate', total_reviews=15, safe_percentage=78),
        NeighborhoodSafety(city='Nairobi', estate='Eastlands', safety_score=70, police_distance=1.8, street_lights=True, night_safety='Moderate', total_reviews=22, safe_percentage=70),
        NeighborhoodSafety(city='Nairobi', estate='Karen', safety_score=90, police_distance=2.0, street_lights=True, night_safety='High', total_reviews=27, safe_percentage=90),
    ]
    for safety in safety_data:
        db.session.add(safety)
    
    db.session.commit()
    print("✅ Database created successfully with ALL columns!")
    print("✅ Default matatu routes added!")
    print("✅ Default water schedules added!")
    print("✅ Default safety data added!")
    print("\n🚀 You can now run: python app.py")