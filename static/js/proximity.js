// Distance and proximity calculations
class ProximityCalculator {
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    static toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    static findNearestProperties(userLat, userLon, properties, maxDistance = 10) {
        return properties
            .map(prop => ({
                ...prop,
                distance: this.calculateDistance(userLat, userLon, prop.latitude, prop.longitude)
            }))
            .filter(prop => prop.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);
    }

    static estimateTravelTime(distanceKm, mode = 'driving') {
        const speeds = {
            driving: 30, // km/h in city
            walking: 5,
            cycling: 15,
            public: 20
        };
        return Math.round((distanceKm / speeds[mode]) * 60); // minutes
    }

    static getNearbyAmenities(userLat, userLon, amenitiesData, radiusKm = 2) {
        return amenitiesData.filter(amenity => 
            this.calculateDistance(userLat, userLon, amenity.lat, amenity.lon) <= radiusKm
        );
    }
}

// Map integration for routes
class RouteCalculator {
    constructor(mapboxToken) {
        this.token = mapboxToken;
    }

    async getRoute(startCoords, endCoords, profile = 'driving') {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startCoords.join(',')};${endCoords.join(',')}?access_token=${this.token}&geometries=geojson`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
                const route = data.routes[0];
                return {
                    distance: (route.distance / 1000).toFixed(2), // Convert to km
                    duration: (route.duration / 60).toFixed(0), // Convert to minutes
                    geometry: route.geometry
                };
            }
        } catch (error) {
            console.error('Error fetching route:', error);
            return null;
        }
    }

    drawRouteOnMap(map, geometry, color = '#3b9ddd') {
        if (map.getSource('route')) {
            map.removeLayer('route');
            map.removeSource('route');
        }

        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: geometry
            }
        });

        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': color,
                'line-width': 4,
                'line-opacity': 0.75
            }
        });
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ProximityCalculator = ProximityCalculator;
    window.RouteCalculator = RouteCalculator;
}