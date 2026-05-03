const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { protect } = require('../middleware/auth');

// @route GET /api/blood - Get blood availability across all hospitals
router.get('/', async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isActive: true })
            .select('name address bloodInventory location phone readinessScore isAcceptingEmergencies');

        const bloodData = hospitals.map(h => ({
            hospitalId: h._id,
            hospitalName: h.name,
            address: h.address,
            phone: h.phone,
            location: h.location,
            readinessScore: h.readinessScore,
            isAcceptingEmergencies: h.isAcceptingEmergencies,
            bloodInventory: h.bloodInventory,
            criticalTypes: h.bloodInventory.filter(b => b.units <= b.criticalLevel).map(b => b.type)
        }));

        res.json({ success: true, count: bloodData.length, data: bloodData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/blood/search - Search hospitals by blood type
router.get('/search', async (req, res) => {
    try {
        const { bloodType, minUnits = 1 } = req.query;
        if (!bloodType) return res.status(400).json({ success: false, message: 'bloodType query param required' });

        const hospitals = await Hospital.find({
            isActive: true,
            bloodInventory: {
                $elemMatch: { type: bloodType, units: { $gte: parseInt(minUnits) } }
            }
        }).select('name address phone bloodInventory location readinessScore isAcceptingEmergencies');

        res.json({ success: true, count: hospitals.length, data: hospitals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route GET /api/blood/summary - Get blood type summary across all hospitals
router.get('/summary', async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isActive: true }).select('bloodInventory');
        const summary = {};
        const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

        types.forEach(type => {
            summary[type] = { totalUnits: 0, hospitalCount: 0, criticalHospitals: 0 };
        });

        hospitals.forEach(h => {
            h.bloodInventory.forEach(b => {
                if (summary[b.type]) {
                    summary[b.type].totalUnits += b.units;
                    summary[b.type].hospitalCount += 1;
                    if (b.units <= b.criticalLevel) summary[b.type].criticalHospitals += 1;
                }
            });
        });

        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
