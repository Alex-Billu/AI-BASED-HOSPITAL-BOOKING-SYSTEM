const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/ambulance - Get all ambulances
router.get('/', protect, async (req, res) => {
    try {
        const ambulances = await Ambulance.find({ isActive: true })
            .populate('currentEmergencyId', 'status emergencyType severity')
            .sort({ status: 1 });
        res.json({ success: true, count: ambulances.length, data: ambulances });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/ambulance - Create ambulance
router.post('/', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const ambulance = await Ambulance.create({ ...req.body, driverId: req.user._id });
        res.status(201).json({ success: true, data: ambulance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/ambulance/:id/location - Update ambulance location
router.put('/:id/location', protect, async (req, res) => {
    try {
        const { longitude, latitude, address } = req.body;
        const ambulance = await Ambulance.findByIdAndUpdate(
            req.params.id,
            {
                currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
                locationAddress: address,
                lastLocationUpdate: new Date()
            },
            { new: true }
        );
        if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });

        const io = req.app.get('io');
        if (ambulance.currentEmergencyId) {
            io.to(`emergency-${ambulance.currentEmergencyId}`).emit('ambulance-moved', {
                ambulanceId: ambulance._id,
                location: { longitude, latitude },
                address
            });
        }

        res.json({ success: true, data: ambulance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/ambulance/:id/status - Update ambulance status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });

        const io = req.app.get('io');
        io.emit('ambulance-status-updated', ambulance);

        res.json({ success: true, data: ambulance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
