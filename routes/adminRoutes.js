const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    createDepartment,
    getDepartments,
    addFaculty,
    getAllFaculty,
    assignHOD,
    addAcademicsUser,
    getFacultyByDepartment,
    updateFaculty,
    deleteFaculty
} = require('../controllers/adminController');

// All routes here require Admin role
// middleware: [auth, checkRole(['admin'])]

router.post('/departments', [auth, checkRole(['admin'])], createDepartment);
router.get('/departments', [auth, checkRole(['admin', 'academics'])], getDepartments);
router.put('/departments/:id/assign-hod', [auth, checkRole(['admin'])], assignHOD);
router.get('/departments/:deptId/faculty', [auth, checkRole(['admin', 'academics'])], getFacultyByDepartment);

router.post('/faculty', [auth, checkRole(['admin'])], addFaculty);
router.get('/faculty', [auth, checkRole(['admin', 'academics'])], getAllFaculty);
router.put('/faculty/:id', [auth, checkRole(['admin'])], updateFaculty);
router.delete('/faculty/:id', [auth, checkRole(['admin'])], deleteFaculty);

router.post('/academics', [auth, checkRole(['admin'])], addAcademicsUser);

module.exports = router;
