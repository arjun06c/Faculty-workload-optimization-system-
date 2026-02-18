const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    createQuery,
    getQueries,
    replyQuery,
    updateQueryStatus
} = require('../controllers/queryController');

// Create Query (Faculty)
router.post('/', [auth, checkRole(['faculty'])], createQuery);

// Get Queries (Faculty sees own, Academics sees all)
router.get('/', [auth, checkRole(['faculty', 'academics', 'admin'])], getQueries);

// Reply to Query
router.post('/:id/reply', [auth, checkRole(['faculty', 'academics', 'admin'])], replyQuery);

// Update Status (Academics)
router.put('/:id/status', [auth, checkRole(['academics', 'admin'])], updateQueryStatus);

module.exports = router;
