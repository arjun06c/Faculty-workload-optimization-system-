const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    getMe,
    getMyTimetable,
    raiseWorkloadRequest,
    getMyWorkloadRequests
} = require('../controllers/facultyController');

router.get('/me', [auth, checkRole(['faculty', 'admin', 'academics'])], getMe); // Allow admin to view generic profile if needed, but primary use is for faculty dashboard
router.get('/timetable', [auth, checkRole(['faculty'])], getMyTimetable);
router.post('/workload-request', [auth, checkRole(['faculty'])], raiseWorkloadRequest);
router.get('/workload-requests', [auth, checkRole(['faculty'])], getMyWorkloadRequests);

module.exports = router;
