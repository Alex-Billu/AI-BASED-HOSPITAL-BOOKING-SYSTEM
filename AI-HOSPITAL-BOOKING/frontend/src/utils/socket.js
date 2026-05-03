import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId, role, hospitalId) => {
    if (socket) socket.disconnect();

    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
        if (userId) socket.emit('join-room', `patient-${userId}`);
        if (role === 'hospital_admin' && hospitalId) socket.emit('join-room', `hospital-${hospitalId}`);
        if (role === 'ambulance') socket.emit('join-room', 'ambulance-room');
    });

    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
