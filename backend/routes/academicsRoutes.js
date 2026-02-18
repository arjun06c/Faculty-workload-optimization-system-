const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    createTimetableEntry,
    getTimetable,
    getAllWorkloadRequests,
    updateWorkloadRequest,
    deleteWorkloadRequest,
    getScheduledFacultiesByDept,
    getFacultyFullDetails,
    updateTimetableEntry,
    deleteTimetableEntry
} = require('../controllers/academicsController');

// Timetable Management
router.post('/timetable', [auth, checkRole(['admin', 'academics'])], createTimetableEntry);
router.get('/timetable', [auth], getTimetable);
router.put('/timetable/:id', [auth, checkRole(['admin', 'academics'])], updateTimetableEntry);
router.delete('/timetable/:id', [auth, checkRole(['admin', 'academics'])], deleteTimetableEntry);

// Workload Request Management (Academics View)
router.get('/workload-requests', [auth, checkRole(['admin', 'academics'])], getAllWorkloadRequests);
router.put('/workload-requests/:id', [auth, checkRole(['admin', 'academics'])], updateWorkloadRequest);
router.delete('/workload-requests/:id', [auth, checkRole(['admin', 'academics'])], deleteWorkloadRequest);
router.post('/workload-requests/:id/reassign', [auth, checkRole(['admin', 'academics'])], require('../controllers/academicsController').smartReassign);

// Office Navigation Drill-down
router.get('/office/scheduled/:departmentId', [auth, checkRole(['admin', 'academics'])], getScheduledFacultiesByDept);
router.get('/office/faculty/:facultyId', [auth, checkRole(['admin', 'academics'])], getFacultyFullDetails);

module.exports = router;
