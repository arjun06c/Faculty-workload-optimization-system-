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
        const { date } = req.query;
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        let query = { facultyId: faculty._id };

        // If a specific date is requested, filter by that date
        // We match strictly on the date part or use a range to cover the full day
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const timetable = await Timetable.find(query)
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
    const { reason, date, type, periods } = req.body; // type: 'SINGLE' | 'FULL_DAY'

    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        // For FULL_DAY, we might auto-fetch periods if not provided, 
        // but for now, we assume frontend provides the periods array.

        const newRequest = new WorkloadRequest({
            facultyId: faculty._id,
            department: faculty.department,
            reason,
            date,
            type: type || 'SINGLE',
            periods: periods || [],
            status: 'Pending'
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
