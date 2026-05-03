const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientRole: { type: String, enum: ['patient', 'ambulance', 'hospital_admin', 'all'] },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
    type: {
        type: String,
        enum: ['emergency_assigned', 'ambulance_dispatched', 'hospital_response_required',
            'escalation', 'status_update', 'blood_critical', 'pre_registration'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
