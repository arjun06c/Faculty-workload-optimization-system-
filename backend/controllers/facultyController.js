const Timetable = require('../models/Timetable');
const WorkloadRequest = require('../models/WorkloadRequest');
const Faculty = require('../models/Faculty');
const User = require('../models/User');

// @desc    Get logged-in faculty's details
// @route   GET /api/faculty/me
// @access  Faculty
exports.getMe = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user.id })
            .populate('department', 'name')
            .populate('userId', 'email name picture');

        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        // Fetch subjects assigned and classes handling from Timetable
        const timetable = await Timetable.find({ facultyId: faculty._id });

        const subjects = [...new Set(timetable.map(item => item.subject))];
        const classes = [...new Set(timetable.map(item => item.classYear))];

        res.json({
            ...faculty.toObject(),
            subjectsAssigned: subjects,
            classesHandling: classes
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update faculty profile (mobile and picture)
// @route   PUT /api/faculty/update-profile
// @access  Faculty
exports.updateProfile = async (req, res) => {
    const { phone, picture } = req.body;
    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

        if (phone) faculty.phone = phone;
        await faculty.save();

        if (picture) {
            await User.findByIdAndUpdate(req.user.id, { picture });
        }

        res.json({ msg: 'Profile updated successfully', phone, picture });
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
    const { reason, date, type, periods } = req.body;

    try {
        const faculty = await Faculty.findOne({ userId: req.user.id });
        if (!faculty) {
            return res.status(404).json({ msg: 'Faculty profile not found' });
        }

        // Derive the day-of-week name (Monday, Tuesday, etc.) from the submitted date
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getUTCDay()]; // Use UTC to avoid timezone shifts

        if (dayName === 'Sunday' || dayName === 'Saturday') {
            return res.status(400).json({ msg: 'Invalid request. No classes are scheduled on weekends.' });
        }

        // ── VALIDATION: Check timetable ownership ──────────────────────────────
        if (type === 'SINGLE') {
            if (!periods || periods.length === 0) {
                return res.status(400).json({ msg: 'Please select a period for single-period request.' });
            }
            const requestedPeriod = parseInt(periods[0]);

            // Look for a timetable entry matching this faculty, day, and period
            const assignedSlot = await Timetable.findOne({
                facultyId: faculty._id,
                day: dayName,
                period: requestedPeriod
            });

            if (!assignedSlot) {
                return res.status(400).json({
                    msg: `Invalid request. You can only request workload changes for periods that are already assigned to you.`
                });
            }
        } else if (type === 'FULL_DAY') {
            // For full-day, verify faculty has at least one class on that day
            const daySlots = await Timetable.findOne({
                facultyId: faculty._id,
                day: dayName
            });

            if (!daySlots) {
                return res.status(400).json({
                    msg: `Invalid request. You have no classes assigned on ${dayName}. Cannot raise a full-day request for this date.`
                });
            }
        }
        // ── END VALIDATION ────────────────────────────────────────────────────

        const newRequest = new WorkloadRequest({
            facultyId: faculty._id,
            department: faculty.department,
            reason,
            date,
            type: type || 'SINGLE',
            periods: type === 'FULL_DAY' ? [1, 2, 3, 4, 5, 6, 7, 8] : periods || [],
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
// @desc    Upload profile picture
// @route   POST /api/faculty/upload-picture
// @access  Faculty
exports.uploadPicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload a file' });
        }

        const pictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

        await User.findByIdAndUpdate(req.user.id, { picture: pictureUrl });

        res.json({
            msg: 'Profile picture uploaded successfully',
            picture: pictureUrl
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
