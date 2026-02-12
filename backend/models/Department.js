const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    hodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    }
});

module.exports = mongoose.model('Department', DepartmentSchema);
