const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
    vehicleNumber: { type: String, required: true, unique: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: { type: String },
    phone: { type: String },
    type: {
        type: String,
        enum: ['basic', 'advanced', 'mobile_icu', 'neonatal'],
        default: 'basic'
    },
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    locationAddress: { type: String },
    status: {
        type: String,
        enum: ['available', 'dispatched', 'en_route', 'at_scene', 'transporting', 'maintenance'],
        default: 'available'
    },
    currentEmergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
    assignedHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    equipment: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLocationUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

ambulanceSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
