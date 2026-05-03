const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    patientBloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
    emergencyType: {
        type: String,
        enum: ['cardiac', 'trauma', 'stroke', 'respiratory', 'burns', 'obstetric', 'pediatric', 'other'],
        required: true
    },
    severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        required: true
    },
    description: { type: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    locationAddress: { type: String },
    assignedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    assignedAmbulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
    hospitalResponseDeadline: { type: Date },
    escalationCount: { type: Number, default: 0 },
    rankedHospitals: [{
        hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
        score: Number,
        distance: Number,
        estimatedTime: Number
    }],
    status: {
        type: String,
        enum: ['pending', 'hospital_assigned', 'ambulance_dispatched', 'en_route', 'arrived', 'admitted', 'escalated', 'resolved', 'cancelled'],
        default: 'pending'
    },
    caseSummary: { type: String },
    preRegistrationSent: { type: Boolean, default: false },
    timeline: [{
        event: String,
        timestamp: { type: Date, default: Date.now },
        details: String
    }],
    resolvedAt: { type: Date },
    totalResponseTime: { type: Number } // minutes
}, { timestamps: true });

emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);
