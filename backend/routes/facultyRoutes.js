const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const {
    getMe,
    getMyTimetable,
    raiseWorkloadRequest,
    getMyWorkloadRequests,
    updateProfile,
    uploadPicture
} = require('../controllers/facultyController');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile-pictures/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images (jpg, jpeg, png) are allowed!'));
    }
});

router.get('/me', [auth, checkRole(['faculty', 'admin', 'academics'])], getMe);
router.get('/timetable', [auth, checkRole(['faculty'])], getMyTimetable);
router.post('/workload-request', [auth, checkRole(['faculty'])], raiseWorkloadRequest);
router.get('/workload-requests', [auth, checkRole(['faculty'])], getMyWorkloadRequests);
router.put('/update-profile', [auth, checkRole(['faculty'])], updateProfile);
router.post('/upload-picture', [auth, checkRole(['faculty'])], upload.single('picture'), uploadPicture);

module.exports = router;
