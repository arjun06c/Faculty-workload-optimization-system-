const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    createTimetableEntry,
    getTimetable,
    getAllWorkloadRequests,
    updateWorkloadRequest,
    deleteWorkloadRequest
} = require('../controllers/academicsController');

// Timetable Management
router.post('/timetable', [auth, checkRole(['admin', 'academics'])], createTimetableEntry);
router.get('/timetable', [auth], getTimetable); // Accessible by all authenticated users

// Workload Request Management (Academics View)
router.get('/workload-requests', [auth, checkRole(['admin', 'academics'])], getAllWorkloadRequests);
router.put('/workload-requests/:id', [auth, checkRole(['admin', 'academics'])], updateWorkloadRequest);
router.delete('/workload-requests/:id', [auth, checkRole(['admin', 'academics'])], deleteWorkloadRequest);
router.post('/workload-requests/:id/reassign', [auth, checkRole(['admin', 'academics'])], require('../controllers/academicsController').smartReassign);

module.exports = router;
