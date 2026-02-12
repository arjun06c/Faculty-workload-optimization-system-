const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period: {
        type: Number,
        required: true // 1 to 8
    },
    type: {
        type: String,
        enum: ['Theory', 'Lab'],
        default: 'Theory'
    },
    hours: {
        type: Number,
        default: 1 // 1 for Theory, 1.5 for Lab
    },
    classYear: {
        type: String,
        required: true // 1st, 2nd, 3rd, 4th
    },
    roomNumber: {
        type: String
    }
});

module.exports = mongoose.model('Timetable', TimetableSchema);
