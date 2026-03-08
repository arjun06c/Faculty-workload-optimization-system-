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
            .populate({ path: 'facultyId', populate: { path: 'department', select: 'name' } })
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

// @desc    Edit a query (subject, priority, status)
// @route   PUT /api/queries/:id
// @access  Academics, Admin
exports.editQuery = async (req, res) => {
    const { subject, priority, status } = req.body;

    try {
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ msg: 'Query not found' });

        // Ownership Check for Faculty
        if (req.user.role === 'faculty') {
            const faculty = await Faculty.findOne({ userId: req.user.id });
            if (!faculty || query.facultyId.toString() !== faculty._id.toString()) {
                return res.status(403).json({ msg: 'Not authorized to edit this query' });
            }
            // Faculty can't change status
            if (status !== undefined && status !== query.status) {
                return res.status(403).json({ msg: 'Faculty cannot change query status' });
            }
        }

        if (subject !== undefined) query.subject = subject;
        if (priority !== undefined) query.priority = priority;
        if (status !== undefined && (req.user.role === 'academics' || req.user.role === 'admin')) {
            query.status = status;
        }

        await query.save();
        res.json(query);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete a query
// @route   DELETE /api/queries/:id
// @access  Academics, Admin
exports.deleteQuery = async (req, res) => {
    try {
        const query = await Query.findById(req.params.id);
        if (!query) return res.status(404).json({ msg: 'Query not found' });

        // Ownership Check for Faculty
        if (req.user.role === 'faculty') {
            const faculty = await Faculty.findOne({ userId: req.user.id });
            if (!faculty || query.facultyId.toString() !== faculty._id.toString()) {
                return res.status(403).json({ msg: 'Not authorized to delete this query' });
            }
        }

        await query.deleteOne();
        res.json({ msg: 'Query deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
