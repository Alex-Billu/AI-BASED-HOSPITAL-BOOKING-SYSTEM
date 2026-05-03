const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/hospitals - Get all hospitals with readiness data
router.get('/', async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isActive: true })
            .select('-__v')
            .sort({ readinessScore: -1 });
        res.json({ success: true, count: hospitals.length, data: hospitals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
        res.json({ success: true, data: hospital });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route POST /api/hospitals - Create hospital (hospital_admin)
router.post('/', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const hospital = await Hospital.create({ ...req.body, adminId: req.user._id });
        res.status(201).json({ success: true, data: hospital });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/hospitals/:id - Update hospital status
router.put('/:id', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

        // Emit real-time update
        const io = req.app.get('io');
        io.emit('hospital-updated', hospital);

        res.json({ success: true, data: hospital });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route PUT /api/hospitals/:id/blood - Update blood inventory
router.put('/:id/blood', protect, authorize('hospital_admin'), async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

        const { bloodType, units } = req.body;
        const bloodEntry = hospital.bloodInventory.find(b => b.type === bloodType);
        if (bloodEntry) {
            bloodEntry.units = units;
            bloodEntry.lastUpdated = new Date();
        } else {
            hospital.bloodInventory.push({ type: bloodType, units });
        }

        await hospital.save();

        const io = req.app.get('io');
        io.emit('hospital-updated', hospital);

        // Check for critical blood levels
        const criticalBloods = hospital.bloodInventory.filter(b => b.units <= b.criticalLevel);
        if (criticalBloods.length > 0) {
            io.emit('blood-critical', { hospitalId: hospital._id, hospitalName: hospital.name, criticalBloods });
        }

        res.json({ success: true, data: hospital });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/hospitals/nearby - Find nearby hospitals
router.post('/nearby', async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 50000 } = req.body; // maxDistance in meters
        const hospitals = await Hospital.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                    $maxDistance: maxDistance
                }
            },
            isActive: true,
            isAcceptingEmergencies: true
        });
        res.json({ success: true, count: hospitals.length, data: hospitals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
