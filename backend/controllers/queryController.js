const Query = require('../models/Query');
const Faculty = require('../models/Faculty');

// @desc    Create a new query
// @route   POST /api/queries
// @access  Faculty
exports.createQuery = async (req, res) => {
    const { subject, message, priority, facultyId } = req.body;

    try {
        const newQuery = new Query({
            facultyId,
            subject,
            priority,
            messages: [{
                sender: 'faculty',
                text: message
            }]
        });

        await newQuery.save();
        res.json(newQuery);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get all queries (for Academics) or My Queries (for Faculty)
// @route   GET /api/queries
// @access  Faculty, Academics
exports.getQueries = async (req, res) => {
    try {
        let query = {};
        // If faculty, show only their queries
        if (req.user.role === 'faculty') {
            // Find faculty profile for this user
            const faculty = await Faculty.findOne({ userId: req.user.id });
            if (faculty) {
                query.facultyId = faculty._id;
            }
        }

        const queries = await Query.find(query)
            .populate('facultyId', 'name department')
            .sort({ createdAt: -1 });

        res.json(queries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Reply to a query
// @route   POST /api/queries/:id/reply
// @access  Faculty, Academics
exports.replyQuery = async (req, res) => {
    const { text, sender } = req.body; // sender: 'faculty' or 'academic'

    try {
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ msg: 'Query not found' });

        query.messages.push({
            sender,
            text
        });

        await query.save();
        res.json(query);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update query status
// @route   PUT /api/queries/:id/status
// @access  Academics
exports.updateQueryStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ msg: 'Query not found' });

        query.status = status;
        await query.save();
        res.json(query);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
