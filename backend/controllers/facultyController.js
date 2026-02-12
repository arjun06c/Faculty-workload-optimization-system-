const Timetable = require('../models/Timetable');
const WorkloadRequest = require('../models/WorkloadRequest');
const Faculty = require('../models/Faculty');

// @desc    Get logged-in faculty's details
// @route   GET /api/faculty/me
// @access  Faculty
exports.getMe = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user.id }).populate('department', 'name');
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }
        res.json(faculty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get faculty's timetable
// @route   GET /api/faculty/timetable
// @access  Faculty
exports.getMyTimetable = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        const timetable = await Timetable.find({ facultyId: faculty._id })
            .populate('department', 'name')
            .sort({ day: 1, period: 1 });

        res.json(timetable);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Raise a workload request
// @route   POST /api/faculty/workload-request
// @access  Faculty
exports.raiseWorkloadRequest = async (req, res) => {
    const { reason, affectedPeriods } = req.body;

    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        const newRequest = new WorkloadRequest({
            facultyId: faculty._id,
            department: faculty.department,
            reason,
            affectedPeriods, // Array of { day, period }
            status: 'Pending' // Initial status
        });

        await newRequest.save();
        res.json(newRequest);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get faculty's workload requests history
// @route   GET /api/faculty/workload-requests
// @access  Faculty
exports.getMyWorkloadRequests = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

        const requests = await WorkloadRequest.find({ facultyId: faculty._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
