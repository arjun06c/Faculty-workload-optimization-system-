const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    subjectCode: {
        type: String,
        required: true,
        unique: true
    },
    subjectName: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    }
});

module.exports = mongoose.model('Subject', SubjectSchema);
