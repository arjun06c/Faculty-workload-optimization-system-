const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    picture: {
        type: String
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'academics', 'faculty'],
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    }
});

module.exports = mongoose.model('User', UserSchema);
