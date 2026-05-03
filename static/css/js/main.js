// Main JavaScript file for Patacrib Kenya

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Flash message auto-hide
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
    
    // Form validation
    var forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
});

// Save property function
function toggleSaveProperty(propertyId) {
    fetch(`/save-property/${propertyId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        const button = document.getElementById(`save-btn-${propertyId}`);
        if (data.saved) {
            button.innerHTML = '<i class="fas fa-heart"></i> Saved';
            button.classList.remove('btn-outline-warning');
            button.classList.add('btn-warning');
            showToast('Property saved to favorites!', 'success');
        } else {
            button.innerHTML = '<i class="far fa-heart"></i> Save';
            button.classList.remove('btn-warning');
            button.classList.add('btn-outline-warning');
            showToast('Property removed from favorites', 'info');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error saving property', 'error');
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Image gallery lightbox
function openLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';
    
    lightbox.appendChild(img);
    document.body.appendChild(lightbox);
    
    lightbox.addEventListener('click', () => {
        lightbox.remove();
    });
}

// Price formatting
function formatPrice(price) {
    if (price >= 1000000) {
        return `KSh ${(price/1000000).toFixed(1)}M`;
    } else if (price >= 100000) {
        return `KSh ${(price/1000).toFixed(0)}K`;
    } else {
        return `KSh ${price.toLocaleString()}`;
    }
}

// Distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Property search with filters
function searchProperties() {
    const query = document.getElementById('search-input').value;
    const city = document.getElementById('city-select').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    const propertyType = document.getElementById('property-type').value;
    
    let url = '/search?';
    const params = [];
    
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (minPrice) params.push(`min_price=${minPrice}`);
    if (maxPrice) params.push(`max_price=${maxPrice}`);
    if (propertyType) params.push(`type=${encodeURIComponent(propertyType)}`);
    
    window.location.href = url + params.join('&');
}

// Initialize map for property detail
function initMapboxMap(propertyId, latitude, longitude) {
    if (typeof mapboxgl === 'undefined') return;
    
    mapboxgl.accessToken = document.getElementById('map').dataset.token;
    
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: 14
    });
    
    // Add marker
    new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([longitude, latitude])
        .addTo(map);
    
    // Add controls
    map.addControl(new mapboxgl.NavigationControl());
    
    return map;
}

// Webcam functions
let webcamStream;
let mediaRecorder;
let recordedChunks = [];

async function initWebcam() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: true 
        });
        const videoElement = document.getElementById('webcam');
        if (videoElement) {
            videoElement.srcObject = webcamStream;
        }
    } catch (err) {
        console.error('Error accessing webcam:', err);
        showToast('Unable to access camera. Please check permissions.', 'error');
    }
}

function capturePhoto() {
    const video = document.getElementById('webcam');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg');
}

function startVideoRecording() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(webcamStream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        const recordedVideo = document.getElementById('recordedVideo');
        if (recordedVideo) {
            recordedVideo.src = videoURL;
            recordedVideo.style.display = 'block';
        }
        
        // Convert to base64 for form submission
        const reader = new FileReader();
        reader.onloadend = () => {
            const videoInput = document.getElementById('webcamVideoInput');
            if (videoInput) {
                videoInput.value = reader.result;
            }
        };
        reader.readAsDataURL(blob);
    };
    
    mediaRecorder.start();
}

function stopVideoRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Initialize webcam when page loads if needed
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('webcam')) {
        initWebcam();
    }
});