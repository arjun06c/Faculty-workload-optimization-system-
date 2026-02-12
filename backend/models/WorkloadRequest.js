const mongoose = require('mongoose');

const WorkloadRequestSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Escalated', 'Reassigned', 'Rejected'],
        default: 'Pending'
    },
    escalatedTo: {
        type: String, // 'Academics Office' or null
        default: null
    },
    affectedPeriods: [{
        day: String,
        period: Number
    }],
    decisionLog: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WorkloadRequest', WorkloadRequestSchema);
