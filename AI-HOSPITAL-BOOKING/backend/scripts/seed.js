const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');

const seedDatabase = async (shouldDisconnect = false) => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Hospital.deleteMany({});
        await Ambulance.deleteMany({});
        console.log('Cleared existing data');

        // Create hospital admin users
        const adminPassword = await bcrypt.hash('password123', 12);

        const admin1 = await User.create({
            name: 'Dr. Rajesh Kumar',
            email: 'admin@aiims.com',
            password: 'password123',
            role: 'hospital_admin',
            phone: '+91-9876543210'
        });

        const admin2 = await User.create({
            name: 'Dr. Priya Sharma',
            email: 'admin@apollo.com',
            password: 'password123',
            role: 'hospital_admin',
            phone: '+91-9876543211'
        });

        const admin3 = await User.create({
            name: 'Dr. Suresh Patel',
            email: 'admin@fortis.com',
            password: 'password123',
            role: 'hospital_admin',
            phone: '+91-9876543212'
        });

        // Create patient user
        const patient = await User.create({
            name: 'Arjun Mehta',
            email: 'patient@demo.com',
            password: 'password123',
            role: 'patient',
            phone: '+91-9876543213',
            bloodType: 'O+'
        });

        // Create ambulance driver
        const driver = await User.create({
            name: 'Ravi Ambulance Driver',
            email: 'driver@demo.com',
            password: 'password123',
            role: 'ambulance',
            phone: '+91-9876543214'
        });

        // Create hospitals (Delhi area coordinates)
        const hospital1 = await Hospital.create({
            name: 'AIIMS Delhi',
            address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, 110029',
            location: { type: 'Point', coordinates: [77.2090, 28.5672] },
            phone: '+91-11-26588500',
            email: 'emergency@aiims.ac.in',
            type: 'government',
            emergencyCapacity: 50,
            currentEmergencyLoad: 12,
            onDutyDoctors: 8,
            specializations: ['cardiology', 'neurology', 'trauma', 'burns', 'pediatrics'],
            bloodInventory: [
                { type: 'A+', units: 25, criticalLevel: 5 },
                { type: 'A-', units: 8, criticalLevel: 3 },
                { type: 'B+', units: 30, criticalLevel: 5 },
                { type: 'B-', units: 4, criticalLevel: 3 },
                { type: 'AB+', units: 12, criticalLevel: 3 },
                { type: 'AB-', units: 2, criticalLevel: 2 },
                { type: 'O+', units: 35, criticalLevel: 8 },
                { type: 'O-', units: 6, criticalLevel: 5 }
            ],
            isAcceptingEmergencies: true,
            averageResponseTime: 10,
            adminId: admin1._id
        });

        const hospital2 = await Hospital.create({
            name: 'Apollo Hospital Sarita Vihar',
            address: 'Sarita Vihar, Mathura Road, New Delhi, 110076',
            location: { type: 'Point', coordinates: [77.2910, 28.5355] },
            phone: '+91-11-71791090',
            email: 'emergency@apollo.com',
            type: 'private',
            emergencyCapacity: 30,
            currentEmergencyLoad: 8,
            onDutyDoctors: 6,
            specializations: ['cardiology', 'orthopedics', 'obstetrics', 'neurology'],
            bloodInventory: [
                { type: 'A+', units: 15, criticalLevel: 5 },
                { type: 'A-', units: 3, criticalLevel: 3 },
                { type: 'B+', units: 18, criticalLevel: 5 },
                { type: 'B-', units: 2, criticalLevel: 2 },
                { type: 'AB+', units: 7, criticalLevel: 3 },
                { type: 'AB-', units: 1, criticalLevel: 2 },
                { type: 'O+', units: 20, criticalLevel: 8 },
                { type: 'O-', units: 3, criticalLevel: 3 }
            ],
            isAcceptingEmergencies: true,
            averageResponseTime: 12,
            adminId: admin2._id
        });

        const hospital3 = await Hospital.create({
            name: 'Fortis Hospital Vasant Kunj',
            address: 'Sector B, Pocket 1, Vasant Kunj, New Delhi, 110070',
            location: { type: 'Point', coordinates: [77.1588, 28.5245] },
            phone: '+91-11-42776222',
            email: 'emergency@fortis.com',
            type: 'private',
            emergencyCapacity: 25,
            currentEmergencyLoad: 20,
            onDutyDoctors: 3,
            specializations: ['trauma', 'orthopedics', 'burns'],
            bloodInventory: [
                { type: 'A+', units: 10, criticalLevel: 5 },
                { type: 'A-', units: 2, criticalLevel: 3 },
                { type: 'B+', units: 8, criticalLevel: 5 },
                { type: 'B-', units: 1, criticalLevel: 2 },
                { type: 'AB+', units: 4, criticalLevel: 3 },
                { type: 'AB-', units: 0, criticalLevel: 2 },
                { type: 'O+', units: 12, criticalLevel: 8 },
                { type: 'O-', units: 2, criticalLevel: 3 }
            ],
            isAcceptingEmergencies: true,
            averageResponseTime: 15,
            adminId: admin3._id
        });

        const hospital4 = await Hospital.create({
            name: 'Safdarjung Hospital',
            address: 'Safdarjung, New Delhi, 110029',
            location: { type: 'Point', coordinates: [77.2019, 28.5697] },
            phone: '+91-11-26707444',
            email: 'emergency@safdarjung.gov.in',
            type: 'government',
            emergencyCapacity: 40,
            currentEmergencyLoad: 5,
            onDutyDoctors: 10,
            specializations: ['trauma', 'burns', 'obstetrics', 'pediatrics', 'respiratory'],
            bloodInventory: [
                { type: 'A+', units: 40, criticalLevel: 8 },
                { type: 'A-', units: 10, criticalLevel: 4 },
                { type: 'B+', units: 45, criticalLevel: 8 },
                { type: 'B-', units: 8, criticalLevel: 4 },
                { type: 'AB+', units: 15, criticalLevel: 4 },
                { type: 'AB-', units: 5, criticalLevel: 3 },
                { type: 'O+', units: 50, criticalLevel: 10 },
                { type: 'O-', units: 12, criticalLevel: 6 }
            ],
            isAcceptingEmergencies: true,
            averageResponseTime: 8,
            adminId: admin1._id
        });

        // Update admin users with hospital IDs
        await User.findByIdAndUpdate(admin1._id, { hospitalId: hospital1._id });
        await User.findByIdAndUpdate(admin2._id, { hospitalId: hospital2._id });
        await User.findByIdAndUpdate(admin3._id, { hospitalId: hospital3._id });

        // Create ambulances
        await Ambulance.create([
            {
                vehicleNumber: 'DL-01-AM-0001',
                driverId: driver._id,
                driverName: 'Ravi Kumar',
                phone: '+91-9876543214',
                type: 'advanced',
                currentLocation: { type: 'Point', coordinates: [77.2300, 28.5500] },
                locationAddress: 'Lajpat Nagar, New Delhi',
                status: 'available',
                assignedHospitalId: hospital1._id,
                equipment: ['Defibrillator', 'Oxygen', 'IV Kit', 'Stretcher']
            },
            {
                vehicleNumber: 'DL-01-AM-0002',
                driverName: 'Suresh Singh',
                phone: '+91-9876543215',
                type: 'mobile_icu',
                currentLocation: { type: 'Point', coordinates: [77.2500, 28.5600] },
                locationAddress: 'Greater Kailash, New Delhi',
                status: 'available',
                assignedHospitalId: hospital2._id,
                equipment: ['ICU Equipment', 'Ventilator', 'Cardiac Monitor', 'Defibrillator']
            },
            {
                vehicleNumber: 'DL-01-AM-0003',
                driverName: 'Mohan Lal',
                phone: '+91-9876543216',
                type: 'basic',
                currentLocation: { type: 'Point', coordinates: [77.1700, 28.5300] },
                locationAddress: 'Vasant Kunj, New Delhi',
                status: 'available',
                assignedHospitalId: hospital3._id,
                equipment: ['First Aid Kit', 'Oxygen', 'Stretcher']
            }
        ]);

        console.log('✅ Seed data created successfully!');
        if (shouldDisconnect) {
            await mongoose.disconnect();
            process.exit(0);
        }
    } catch (err) {
        console.error('Seed error:', err);
        if (shouldDisconnect) process.exit(1);
        throw err;
    }
};

module.exports = { seedDatabase };

// Only run standalone if this script is executed directly
if (require.main === module) {
    (async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emerge_ai');
        console.log('Connected to MongoDB');
        await seedDatabase(true);
    })();
}
