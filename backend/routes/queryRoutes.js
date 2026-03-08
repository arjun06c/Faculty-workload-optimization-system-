const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/authMiddleware');
const {
    createQuery,
    getQueries,
    replyQuery,
    updateQueryStatus,
    editQuery,
    deleteQuery
} = require('../controllers/queryController');

// Create Query (Faculty)
router.post('/', [auth, checkRole(['faculty'])], createQuery);

// Get Queries (Faculty sees own, Academics sees all)
router.get('/', [auth, checkRole(['faculty', 'academics', 'admin'])], getQueries);

// Reply to Query (Old) & Messages (New)
router.post('/:id/reply', [auth, checkRole(['faculty', 'academics', 'admin'])], replyQuery);
router.post('/:id/message', [auth, checkRole(['faculty', 'academics', 'admin'])], replyQuery);

// Status Management
router.put('/:id/status', [auth, checkRole(['academics', 'admin'])], updateQueryStatus);
router.put('/:id/resolve', [auth, checkRole(['academics', 'admin', 'faculty'])], async (req, res) => {
    try {
        const Query = require('../models/Query');
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ msg: 'Query not found' });
        query.status = 'Resolved';
        await query.save();
        res.json(query);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Edit Query (Faculty edits own, Academics/Admin edit all)
router.put('/:id', [auth, checkRole(['faculty', 'academics', 'admin'])], editQuery);

// Delete Query (Faculty deletes own, Academics/Admin delete all)
router.delete('/:id', [auth, checkRole(['faculty', 'academics', 'admin'])], deleteQuery);

module.exports = router;
