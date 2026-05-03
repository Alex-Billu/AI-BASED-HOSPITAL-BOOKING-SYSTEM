const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true
    },
    units: { type: Number, default: 0, min: 0 },
    criticalLevel: { type: Number, default: 5 },
    lastUpdated: { type: Date, default: Date.now }
});

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    phone: { type: String, required: true },
    email: { type: String },
    type: {
        type: String,
        enum: ['government', 'private', 'trauma_center', 'specialty'],
        default: 'government'
    },
    emergencyCapacity: { type: Number, default: 20 },
    currentEmergencyLoad: { type: Number, default: 0 },
    onDutyDoctors: { type: Number, default: 0 },
    specializations: [{ type: String }],
    bloodInventory: [bloodInventorySchema],
    isAcceptingEmergencies: { type: Boolean, default: true },
    averageResponseTime: { type: Number, default: 15 }, // minutes
    readinessScore: { type: Number, default: 100 }, // 0-100
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

// Calculate readiness score before save
hospitalSchema.pre('save', function (next) {
    const loadFactor = this.emergencyCapacity > 0
        ? (1 - this.currentEmergencyLoad / this.emergencyCapacity) * 40
        : 0;
    const doctorFactor = Math.min(this.onDutyDoctors * 5, 30);
    const acceptingFactor = this.isAcceptingEmergencies ? 30 : 0;
    this.readinessScore = Math.max(0, Math.min(100, loadFactor + doctorFactor + acceptingFactor));
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Hospital', hospitalSchema);
