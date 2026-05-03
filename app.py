import os
import re
import math
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import json
import uuid
import base64
from PIL import Image
import io
from functools import wraps

# Initialize app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'patacrib-kenya-premium-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patacrib.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'webm'}
app.config['MAPBOX_TOKEN'] = 'pk.your_mapbox_token_here'  # Add your Mapbox token

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'webcam'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)

# Database Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    user_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    properties = db.relationship('Property', backref='admin_user', lazy=True)
    saved_properties = db.relationship('SavedProperty', backref='user', lazy=True)

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    price_type = db.Column(db.String(20), default='month')
    bedrooms = db.Column(db.Integer, default=1)
    bathrooms = db.Column(db.Integer, default=1)
    property_type = db.Column(db.String(50), default='bedsitter')
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), default='Nairobi')
    estate = db.Column(db.String(100))
    latitude = db.Column(db.Float, default=-1.286389)
    longitude = db.Column(db.Float, default=36.817223)
    video_url = db.Column(db.String(500))
    images = db.Column(db.Text, default='[]')
    features = db.Column(db.Text, default='[]')
    amenities = db.Column(db.Text, default='[]')  # New field for nearby amenities
    status = db.Column(db.String(20), default='available')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship - FIXED: Use backref name
    admin = db.relationship('User', backref='admin_properties', foreign_keys=[admin_id])

class SavedProperty(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to property
    property = db.relationship('Property', backref='saves')

# New model for tracking property views
class PropertyView(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def save_base64_image(base64_str, folder='webcam'):
    """Save base64 image from webcam"""
    try:
        if 'base64,' in base64_str:
            base64_str = base64_str.split('base64,')[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_data))
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], folder, filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save image
        img.save(filepath, 'JPEG')
        return f'/static/uploads/{folder}/{filename}'
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers"""
    try:
        coord1 = (lat1, lon1)
        coord2 = (lat2, lon2)
        return geodesic(coord1, coord2).kilometers
    except:
        return None

def get_coordinates(address):
    try:
        geolocator = Nominatim(user_agent="patacrib_kenya")
        location = geolocator.geocode(f"{address}, Kenya")
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print(f"Geocoding error: {e}")
    return -1.286389, 36.817223  # Default Nairobi coordinates

def find_nearby_properties(latitude, longitude, max_distance_km=10):
    """Find properties within a certain distance"""
    nearby_properties = []
    properties = Property.query.filter_by(status='available').all()
    
    for prop in properties:
        distance = calculate_distance(latitude, longitude, prop.latitude, prop.longitude)
        if distance and distance <= max_distance_km:
            prop.distance = round(distance, 2)
            nearby_properties.append(prop)
    
    return sorted(nearby_properties, key=lambda x: x.distance)

def format_price(price):
    if price >= 1000000:
        return f"KSh {price/1000000:.1f}M"
    elif price >= 100000:
        return f"KSh {price/1000:.0f}K"
    else:
        return f"KSh {price:,.0f}"

# Custom decorator for admin only
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.user_type != 'admin':
            flash('Admin access required', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Routes - KEEPING YOUR ORIGINAL ROUTES
@app.route('/')
def index():
    properties = Property.query.filter_by(status='available').order_by(Property.created_at.desc()).limit(8).all()
    return render_template('index.html', properties=properties, format_price=format_price)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            flash('Welcome back!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        name = request.form.get('name')
        phone = request.form.get('phone')
        user_type = request.form.get('user_type', 'seeker')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('signup'))
        
        user = User(
            email=email,
            password=generate_password_hash(password, method='sha256'),
            name=name,
            phone=phone,
            user_type=user_type
        )
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        flash('Account created!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.user_type == 'admin':
        return redirect(url_for('admin_dashboard'))
    else:
        return redirect(url_for('seeker_dashboard'))

@app.route('/dashboard/seeker')
@login_required
def seeker_dashboard():
    if current_user.user_type != 'seeker':
        return redirect(url_for('index'))
    
    saved_props = SavedProperty.query.filter_by(user_id=current_user.id).all()
    saved_ids = [sp.property_id for sp in saved_props]
    saved_properties = Property.query.filter(Property.id.in_(saved_ids)).all() if saved_ids else []
    
    # Get recommendations based on saved properties
    recommendations = []
    if saved_properties:
        # Get location from first saved property
        first_prop = saved_properties[0]
        recommendations = find_nearby_properties(
            first_prop.latitude, 
            first_prop.longitude, 
            max_distance_km=5
        )[:4]
    else:
        recommendations = Property.query.filter_by(status='available').order_by(Property.created_at.desc()).limit(4).all()
    
    return render_template('dashboard_seeker.html',
                         saved_properties=saved_properties,
                         recommendations=recommendations,
                         format_price=format_price)

@app.route('/dashboard/admin')
@login_required
def admin_dashboard():
    if current_user.user_type != 'admin':
        return redirect(url_for('index'))
    
    properties = Property.query.filter_by(admin_id=current_user.id).all()
    stats = {
        'total': len(properties),
        'available': len([p for p in properties if p.status == 'available'])
    }
    
    return render_template('dashboard_admin.html',
                         properties=properties,
                         stats=stats,
                         format_price=format_price)

@app.route('/add-property', methods=['GET', 'POST'])
@login_required
@admin_required
def add_property():
    if current_user.user_type != 'admin':
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        price = float(request.form.get('price', 0))
        price_type = request.form.get('price_type')
        bedrooms = int(request.form.get('bedrooms', 1))
        bathrooms = int(request.form.get('bathrooms', 1))
        property_type = request.form.get('property_type')
        address = request.form.get('address')
        city = request.form.get('city')
        estate = request.form.get('estate')
        
        latitude, longitude = get_coordinates(f"{address}, {city}")
        
        images = []
        
        # Handle webcam images
        webcam_images = request.form.getlist('webcam_images[]')
        for img_data in webcam_images:
            if img_data:
                img_url = save_base64_image(img_data)
                if img_url:
                    images.append(img_url)
        
        # Handle file uploads
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    images.append(f'/static/uploads/{filename}')
        
        video_url = None
        if 'video' in request.files:
            video = request.files['video']
            if video and allowed_file(video.filename):
                filename = secure_filename(video.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                video.save(filepath)
                video_url = f'/static/uploads/{filename}'
        
        # Handle webcam video
        webcam_video = request.form.get('webcam_video')
        if webcam_video:
            video_url = save_base64_image(webcam_video, 'videos')
        
        features = request.form.getlist('features')
        amenities = request.form.getlist('amenities')  # New field
        
        property_obj = Property(
            title=title,
            description=description,
            price=price,
            price_type=price_type,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            property_type=property_type,
            address=address,
            city=city,
            estate=estate,
            latitude=latitude,
            longitude=longitude,
            video_url=video_url,
            images=json.dumps(images),
            features=json.dumps(features),
            amenities=json.dumps(amenities),  # New field
            admin_id=current_user.id
        )
        
        db.session.add(property_obj)
        db.session.commit()
        
        flash('Property added successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
    
    return render_template('add_property.html')

@app.route('/property/<int:property_id>')
def property_detail(property_id):
    property = Property.query.get_or_404(property_id)
    
    # Track view if user is logged in
    if current_user.is_authenticated:
        view = PropertyView(property_id=property_id, user_id=current_user.id)
        db.session.add(view)
        db.session.commit()
    
    # Get admin info
    admin = User.query.get(property.admin_id)
    
    images = json.loads(property.images) if property.images else []
    features = json.loads(property.features) if property.features else []
    amenities = json.loads(property.amenities) if property.amenities else []  # New field
    
    # Get nearby properties
    nearby_properties = find_nearby_properties(
        property.latitude, 
        property.longitude, 
        max_distance_km=5
    )[:4]
    
    # Check if property is saved by current user
    is_saved = False
    if current_user.is_authenticated:
        saved = SavedProperty.query.filter_by(
            user_id=current_user.id,
            property_id=property_id
        ).first()
        is_saved = saved is not None
    
    return render_template('property_detail.html',
                         property=property,
                         admin=admin,
                         images=images,
                         features=features,
                         amenities=amenities,  # New field
                         nearby_properties=nearby_properties,
                         is_saved=is_saved,
                         format_price=format_price,
                         mapbox_token=app.config['MAPBOX_TOKEN'])

@app.route('/save-property/<int:property_id>', methods=['POST'])
@login_required
def save_property(property_id):
    """Save/unsave property"""
    property = Property.query.get_or_404(property_id)
    
    saved = SavedProperty.query.filter_by(
        user_id=current_user.id,
        property_id=property_id
    ).first()
    
    if saved:
        db.session.delete(saved)
        db.session.commit()
        return jsonify({'saved': False, 'message': 'Property removed from saved'})
    else:
        saved = SavedProperty(user_id=current_user.id, property_id=property_id)
        db.session.add(saved)
        db.session.commit()
        return jsonify({'saved': True, 'message': 'Property saved successfully'})

@app.route('/search')
def search():
    query = request.args.get('q', '')
    city = request.args.get('city', '')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    property_type = request.args.get('type', '')
    max_distance = request.args.get('distance', type=float)  # New filter
    
    properties = Property.query.filter_by(status='available')
    
    if query:
        properties = properties.filter(
            Property.title.contains(query) |
            Property.description.contains(query)
        )
    
    if city:
        properties = properties.filter_by(city=city)
    
    if min_price:
        properties = properties.filter(Property.price >= min_price)
    
    if max_price:
        properties = properties.filter(Property.price <= max_price)
    
    if property_type:
        properties = properties.filter_by(property_type=property_type)
    
    properties = properties.all()
    
    # Apply distance filter if specified
    if max_distance and current_user.is_authenticated:
        # In a real app, you'd store user location
        user_lat, user_lon = get_coordinates(city if city else 'Nairobi')
        filtered_properties = []
        
        for prop in properties:
            distance = calculate_distance(user_lat, user_lon, prop.latitude, prop.longitude)
            if distance and distance <= max_distance:
                prop.distance = round(distance, 2)
                filtered_properties.append(prop)
        
        properties = filtered_properties
    
    return render_template('index.html', 
                         properties=properties, 
                         format_price=format_price,
                         query=query,
                         city=city,
                         min_price=min_price,
                         max_price=max_price,
                         property_type=property_type)

# NEW API ENDPOINTS FOR MAPBOX AND DISTANCE CALCULATIONS
@app.route('/api/calculate-route')
def calculate_route():
    """Calculate route from user location to property"""
    start_lat = request.args.get('start_lat', type=float)
    start_lon = request.args.get('start_lon', type=float)
    end_lat = request.args.get('end_lat', type=float)
    end_lon = request.args.get('end_lon', type=float)
    
    if not all([start_lat, start_lon, end_lat, end_lon]):
        return jsonify({'error': 'Missing coordinates'}), 400
    
    # Calculate distance
    distance_km = calculate_distance(start_lat, start_lon, end_lat, end_lon)
    
    # Estimate travel time (assuming average speed of 30km/h in city)
    estimated_time_minutes = round((distance_km / 30) * 60) if distance_km else 0
    
    return jsonify({
        'distance_km': round(distance_km, 2) if distance_km else None,
        'estimated_time_minutes': estimated_time_minutes,
        'start_coords': [start_lon, start_lat],
        'end_coords': [end_lon, end_lat]
    })

@app.route('/api/get-property-coordinates/<int:property_id>')
def get_property_coordinates(property_id):
    """Get coordinates for a specific property"""
    property = Property.query.get_or_404(property_id)
    return jsonify({
        'latitude': property.latitude,
        'longitude': property.longitude,
        'address': property.address
    })

# Template filter for JSON parsing
@app.template_filter('from_json')
def from_json_filter(value):
    """Convert JSON string to Python object in templates"""
    if value:
        try:
            return json.loads(value)
        except:
            return []
    return []

def init_db():
    with app.app_context():
        db.drop_all()  # Clear existing database
        db.create_all()
        
        # Create admin user
        admin = User(
            email='admin@patacrib.co.ke',
            password=generate_password_hash('admin123', method='sha256'),
            name='Patacrib Admin',
            phone='+254700000000',
            user_type='admin'
        )
        db.session.add(admin)
        
        db.session.commit()
        
        print("✅ Database initialized")
        print("✅ Admin user created: admin@patacrib.co.ke / admin123")

if __name__ == '__main__':
    # Install required packages if not installed
    try:
        from geopy.distance import geodesic
        from PIL import Image
    except ImportError:
        print("⚠️  Installing required packages...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'geopy', 'Pillow'])
        print("✅ Packages installed successfully")
    
    init_db()
    print("\n🚀 Patacrib Kenya - Premium Real Estate")
    print("🌐 Open: http://localhost:5000")
    print("🔑 Admin: admin@patacrib.co.ke / admin123")
    print("\n⚠️  IMPORTANT: Add your Mapbox token to app.config['MAPBOX_TOKEN']")
    app.run(debug=True, port=5000)