const Emergency = require('../models/Emergency');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');
const { recommendHospitals } = require('./recommendationService');

/**
 * Auto-escalation service
 * Runs every 30 seconds to check for hospitals that haven't responded
 */
const checkEscalations = async (io) => {
    try {
        const now = new Date();

        // Find emergencies where hospital hasn't responded within deadline
        const overdueEmergencies = await Emergency.find({
            status: 'hospital_assigned',
            hospitalResponseDeadline: { $lt: now }
        }).populate('assignedHospital');

        for (const emergency of overdueEmergencies) {
            await escalateEmergency(emergency, io);
        }
    } catch (err) {
        console.error('Escalation check error:', err);
    }
};

const escalateEmergency = async (emergency, io) => {
    try {
        emergency.escalationCount += 1;
        emergency.timeline.push({
            event: 'Auto-Escalation Triggered',
            details: `Hospital ${emergency.assignedHospital?.name || 'Unknown'} did not respond within time limit`
        });

        // Find next best hospital from ranked list
        const currentHospitalId = emergency.assignedHospital?._id?.toString();
        const nextHospital = emergency.rankedHospitals.find(
            r => r.hospital.toString() !== currentHospitalId
        );

        if (nextHospital) {
            const newHospital = await Hospital.findById(nextHospital.hospital);
            if (newHospital && newHospital.isAcceptingEmergencies) {
                emergency.assignedHospital = newHospital._id;
                emergency.hospitalResponseDeadline = new Date(Date.now() + 3 * 60 * 1000);
                emergency.status = 'hospital_assigned';
                emergency.timeline.push({
                    event: 'Rerouted',
                    details: `Assigned to ${newHospital.name}`
                });

                // Notify new hospital
                await Notification.create({
                    hospitalId: newHospital._id,
                    emergencyId: emergency._id,
                    type: 'escalation',
                    title: '🚨 ESCALATED Emergency - Immediate Response Required',
                    message: `Emergency escalated from previous hospital. ${emergency.severity.toUpperCase()} ${emergency.emergencyType}. Patient: ${emergency.patientName}`,
                    priority: 'critical'
                });

                io.to(`hospital-${newHospital._id}`).emit('escalated-emergency', {
                    emergency,
                    message: 'Emergency escalated to your hospital - immediate response required'
                });
            } else {
                emergency.status = 'escalated';
                emergency.timeline.push({ event: 'No Available Hospital', details: 'All ranked hospitals exhausted' });
            }
        } else {
            // Re-run recommendation
            const newRanked = await recommendHospitals({
                location: emergency.location,
                emergencyType: emergency.emergencyType,
                severity: emergency.severity,
                bloodType: emergency.patientBloodType
            });

            if (newRanked.length > 0) {
                const newHospital = newRanked[0].hospital;
                emergency.assignedHospital = newHospital._id;
                emergency.hospitalResponseDeadline = new Date(Date.now() + 3 * 60 * 1000);
                emergency.status = 'hospital_assigned';
                emergency.rankedHospitals = newRanked.map(r => ({
                    hospital: r.hospital._id, score: r.score, distance: r.distance, estimatedTime: r.estimatedTime
                }));
                emergency.timeline.push({ event: 'Re-Routed (Fresh Search)', details: `Assigned to ${newHospital.name}` });
            } else {
                emergency.status = 'escalated';
            }
        }

        await emergency.save();

        // Notify patient
        io.to(`patient-${emergency.patientId}`).emit('emergency-escalated', {
            emergency,
            message: emergency.status === 'escalated'
                ? 'Emergency escalated - searching for available hospitals'
                : `Rerouted to new hospital: ${emergency.assignedHospital}`
        });

        console.log(`⚡ Escalated emergency ${emergency._id} (count: ${emergency.escalationCount})`);
    } catch (err) {
        console.error('Escalation error for emergency', emergency._id, err);
    }
};

module.exports = { checkEscalations, escalateEmergency };
