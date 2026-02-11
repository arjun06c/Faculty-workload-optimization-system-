const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    skills: [{
        type: String // Array of subjects they can teach
    }],
    maxHours: {
        type: Number,
        default: 16
    },
    currentHours: {
        type: Number,
        default: 0
    },
    phone: {
        type: String
    }
});

module.exports = mongoose.model('Faculty', FacultySchema);
