const Hospital = require('../models/Hospital');

/**
 * Intelligent hospital recommendation engine
 * Factors: distance, readiness score, emergency type match, blood availability
 */
const recommendHospitals = async ({ location, emergencyType, severity, bloodType }) => {
    try {
        const [longitude, latitude] = location.coordinates;

        // Get all active hospitals accepting emergencies
        let hospitals = await Hospital.find({ isActive: true, isAcceptingEmergencies: true });

        if (hospitals.length === 0) return [];

        // Score each hospital
        const scored = hospitals.map(hospital => {
            const [hLon, hLat] = hospital.location.coordinates;

            // Calculate distance (Haversine formula)
            const distance = haversineDistance(latitude, longitude, hLat, hLon);
            const distanceKm = distance / 1000;

            // Distance score (0-30 points, closer = better)
            const maxDistance = 50; // km
            const distanceScore = Math.max(0, 30 - (distanceKm / maxDistance) * 30);

            // Readiness score (0-40 points)
            const readinessScore = (hospital.readinessScore / 100) * 40;

            // Emergency type match (0-20 points)
            let typeScore = 10; // base
            const specializations = hospital.specializations || [];
            if (emergencyType === 'cardiac' && specializations.includes('cardiology')) typeScore = 20;
            if (emergencyType === 'trauma' && specializations.includes('trauma')) typeScore = 20;
            if (emergencyType === 'stroke' && specializations.includes('neurology')) typeScore = 20;
            if (emergencyType === 'obstetric' && specializations.includes('obstetrics')) typeScore = 20;
            if (emergencyType === 'pediatric' && specializations.includes('pediatrics')) typeScore = 20;
            if (emergencyType === 'burns' && specializations.includes('burns')) typeScore = 20;

            // Blood availability score (0-10 points)
            let bloodScore = 0;
            if (bloodType && bloodType !== 'Unknown') {
                const bloodEntry = hospital.bloodInventory.find(b => b.type === bloodType);
                if (bloodEntry && bloodEntry.units > 0) {
                    bloodScore = Math.min(10, bloodEntry.units);
                }
            } else {
                bloodScore = 5; // neutral if no blood type specified
            }

            // Severity penalty for overloaded hospitals
            const loadRatio = hospital.emergencyCapacity > 0
                ? hospital.currentEmergencyLoad / hospital.emergencyCapacity
                : 1;
            const overloadPenalty = severity === 'critical' && loadRatio > 0.8 ? -15 : 0;

            const totalScore = distanceScore + readinessScore + typeScore + bloodScore + overloadPenalty;

            // Estimated time (minutes): distance / avg speed (40 km/h) + hospital response time
            const estimatedTime = Math.round((distanceKm / 40) * 60 + hospital.averageResponseTime);

            return {
                hospital,
                score: Math.round(totalScore * 10) / 10,
                distance: Math.round(distanceKm * 10) / 10,
                estimatedTime
            };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 5); // Return top 5
    } catch (err) {
        console.error('Recommendation error:', err);
        return [];
    }
};

// Haversine formula to calculate distance between two coordinates
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => deg * (Math.PI / 180);

module.exports = { recommendHospitals };
