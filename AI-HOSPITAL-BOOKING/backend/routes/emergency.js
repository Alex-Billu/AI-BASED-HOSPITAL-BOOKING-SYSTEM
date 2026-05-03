const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { recommendHospitals } = require('../services/recommendationService');
const { generateCaseSummary } = require('../services/caseSummaryService');

// @route POST /api/emergency - Create emergency request
router.post('/', protect, async (req, res) => {
    try {
        const { emergencyType, severity, description, location, locationAddress, patientBloodType } = req.body;

        // Get ranked hospital recommendations
        const rankedHospitals = await recommendHospitals({
            location,
            emergencyType,
            severity,
            bloodType: patientBloodType
        });

        if (rankedHospitals.length === 0) {
            return res.status(404).json({ success: false, message: 'No available hospitals found nearby' });
        }

        const bestHospital = rankedHospitals[0];
        const responseDeadline = new Date(Date.now() + 3 * 60 * 1000); // 3 min to respond

        const emergency = await Emergency.create({
            patientId: req.user._id,
            patientName: req.user.name,
            patientPhone: req.user.phone,
            patientBloodType,
            emergencyType,
            severity,
            description,
            location,
            locationAddress,
            assignedHospital: bestHospital.hospital._id,
            rankedHospitals: rankedHospitals.map(r => ({
                hospital: r.hospital._id,
                score: r.score,
                distance: r.distance,
                estimatedTime: r.estimatedTime
            })),
            hospitalResponseDeadline: responseDeadline,
            status: 'hospital_assigned',
            timeline: [{ event: 'Emergency Created', details: `Assigned to ${bestHospital.hospital.name}` }]
        });

        // Generate AI case summary
        const caseSummary = generateCaseSummary(emergency, req.user);
        emergency.caseSummary = caseSummary;
        emergency.preRegistrationSent = true;
        await emergency.save();

        // Find nearest available ambulance
        const ambulance = await Ambulance.findOne({ status: 'available', isActive: true });
        if (ambulance) {
            ambulance.status = 'dispatched';
            ambulance.currentEmergencyId = emergency._id;
            await ambulance.save();
            emergency.assignedAmbulance = ambulance._id;
            emergency.status = 'ambulance_dispatched';
            emergency.timeline.push({ event: 'Ambulance Dispatched', details: `Vehicle: ${ambulance.vehicleNumber}` });
            await emergency.save();
        }

        // Notify hospital
        const io = req.app.get('io');
        await Notification.create({
            hospitalId: bestHospital.hospital._id,
            emergencyId: emergency._id,
            type: 'emergency_assigned',
            title: '🚨 New Emergency Assigned',
            message: `${severity.toUpperCase()} ${emergencyType} emergency. Patient: ${req.user.name}. Respond within 3 minutes.`,
            priority: severity === 'critical' ? 'critical' : 'high'
        });

        io.to(`hospital-${bestHospital.hospital._id}`).emit('new-emergency', {
            emergency: await emergency.populate('assignedHospital assignedAmbulance'),
            caseSummary
        });

        io.to(`patient-${req.user._id}`).emit('emergency-created', { emergency, rankedHospitals });

        res.status(201).json({
            success: true,
            data: emergency,
            rankedHospitals,
            caseSummary
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/emergency - Get emergencies
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patientId = req.user._id;
        if (req.user.role === 'hospital_admin') query.assignedHospital = req.user.hospitalId;

        const emergencies = await Emergency.find(query)
            .populate('assignedHospital', 'name address phone')
            .populate('assignedAmbulance', 'vehicleNumber driverName phone')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, count: emergencies.length, data: emergencies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/emergency/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const emergency = await Emergency.findById(req.params.id)
            .populate('assignedHospital')
            .populate('assignedAmbulance')
            .populate('patientId', 'name phone bloodType');
        if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });
        res.json({ success: true, data: emergency });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/emergency/:id/respond - Hospital responds to emergency
router.put('/:id/respond', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        const emergency = await Emergency.findById(req.params.id);
        if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

        if (action === 'accept') {
            emergency.status = 'en_route';
            emergency.timeline.push({ event: 'Hospital Accepted', details: 'Hospital confirmed readiness' });
        } else {
            // Escalate to next hospital
            emergency.escalationCount += 1;
            emergency.status = 'escalated';
            emergency.timeline.push({ event: 'Hospital Rejected', details: 'Escalating to next hospital' });
        }

        await emergency.save();
        const io = req.app.get('io');
        io.to(`patient-${emergency.patientId}`).emit('emergency-updated', emergency);

        res.json({ success: true, data: emergency });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/emergency/:id/status - Update emergency status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, details } = req.body;
        const emergency = await Emergency.findById(req.params.id);
        if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

        emergency.status = status;
        emergency.timeline.push({ event: `Status: ${status}`, details: details || '' });

        if (status === 'resolved') {
            emergency.resolvedAt = new Date();
            emergency.totalResponseTime = Math.round((emergency.resolvedAt - emergency.createdAt) / 60000);
        }

        await emergency.save();
        const io = req.app.get('io');
        io.to(`emergency-${emergency._id}`).emit('emergency-updated', emergency);
        io.to(`patient-${emergency.patientId}`).emit('emergency-updated', emergency);

        res.json({ success: true, data: emergency });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/emergency/active/all - Get all active emergencies (admin)
router.get('/active/all', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const emergencies = await Emergency.find({
            status: { $nin: ['resolved', 'cancelled'] }
        }).populate('assignedHospital assignedAmbulance').sort({ createdAt: -1 });
        res.json({ success: true, data: emergencies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
