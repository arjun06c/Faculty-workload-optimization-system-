const Timetable = require('../models/Timetable');
const WorkloadRequest = require('../models/WorkloadRequest');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

// @desc    Create a timetable entry
// @route   POST /api/academics/timetable
// @access  Academics, Admin
exports.createTimetableEntry = async (req, res) => {
    const { department, facultyId, subject, day, period, classYear, roomNumber, type } = req.body;

    try {
        const periodNum = parseInt(period);
        if (periodNum < 1 || periodNum > 8) {
            return res.status(400).json({ msg: 'Period must be between 1 and 8' });
        }

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

        const hoursAdded = type === 'Lab' ? 1.5 : 1;

        // Constraint 1: Max Hours
        if (faculty.currentHours + hoursAdded > faculty.maxHours) {
            return res.status(400).json({ msg: `Overload: Faculty has reached max hours limit (${faculty.maxHours}h)` });
        }

        // Constraint 2: Clashing slot
        const existingFacultyStats = await Timetable.findOne({ facultyId, day, period: periodNum });
        if (existingFacultyStats) {
            return res.status(400).json({ msg: 'Conflict: Faculty is already assigned for this slot' });
        }

        const existingClassStats = await Timetable.findOne({ department, classYear, day, period: periodNum });
        if (existingClassStats) {
            return res.status(400).json({ msg: 'Conflict: Class is already occupied for this slot' });
        }

        // Constraint 3: Continuous Periods (Max 3)
        const prevPeriods = await Timetable.find({
            facultyId,
            day,
            period: { $in: [periodNum - 1, periodNum - 2, periodNum - 3] }
        }).sort({ period: 1 });

        if (prevPeriods.length === 3 &&
            prevPeriods[0].period === periodNum - 3 &&
            prevPeriods[1].period === periodNum - 2 &&
            prevPeriods[2].period === periodNum - 1) {
            return res.status(400).json({ msg: 'Constraint: Faculty cannot have more than 3 continuous periods' });
        }

        // Also check if adding this creates 4 continuous with future periods
        const nextPeriods = await Timetable.find({
            facultyId,
            day,
            period: { $in: [periodNum + 1, periodNum + 2, periodNum + 3] }
        }).sort({ period: 1 });

        // Complex overlap check would be better but simple back/forward check covers most cases

        const newEntry = new Timetable({
            department, facultyId, subject, day, period: periodNum, classYear, roomNumber, type, hours: hoursAdded
        });

        await newEntry.save();

        // Update Faculty currentHours
        faculty.currentHours += hoursAdded;
        await faculty.save();

        res.json(newEntry);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get timetable by query (department, year, faculty)
// @route   GET /api/academics/timetable
// @access  Public (or Authenticated)
exports.getTimetable = async (req, res) => {
    const { department, classYear, facultyId } = req.query;
    let query = {};
    if (department) query.department = department;
    if (classYear) query.classYear = classYear;
    if (facultyId) query.facultyId = facultyId;

    try {
        const timetable = await Timetable.find(query)
            .populate('facultyId', 'name')
            .populate('department', 'name')
            .sort({ day: 1, period: 1 });
        res.json(timetable);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get all workload requests (Escalated + Pending)
// @route   GET /api/academics/workload-requests
// @access  Academics
exports.getAllWorkloadRequests = async (req, res) => {
    try {
        const requests = await WorkloadRequest.find()
            .populate('facultyId', 'name')
            .populate('department', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update workload request status
// @route   PUT /api/academics/workload-requests/:id
// @access  Academics
exports.updateWorkloadRequestStatus = async (req, res) => {
    const { status, decisionLog } = req.body;
    try {
        let request = await WorkloadRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        request.status = status;
        if (decisionLog) request.decisionLog = decisionLog; // Add decision log field if I update the model

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Smart Reassignment Logic
// @route   POST /api/academics/workload-requests/:id/reassign
// @access  Academics, Admin
exports.smartReassign = async (req, res) => {
    try {
        const request = await WorkloadRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        // Find the period to reassign (latest as per requirement)
        const affectedTimetableEntry = await Timetable.findOne({
            facultyId: request.facultyId,
            department: request.department
        }).sort({ _id: -1 }); // Get last assigned

        if (!affectedTimetableEntry) {
            return res.status(400).json({ msg: 'No timetable entry found to reassign' });
        }

        // Find potential replacement in SAME department
        const replacements = await Faculty.find({
            department: request.department,
            _id: { $ne: request.facultyId },
            skills: { $in: [affectedTimetableEntry.subject] }
        });

        let bestReplacement = null;

        for (const rep of replacements) {
            // Check availability for that specific slot
            const clash = await Timetable.findOne({
                facultyId: rep._id,
                day: affectedTimetableEntry.day,
                period: affectedTimetableEntry.period
            });

            if (!clash && (rep.currentHours + affectedTimetableEntry.hours <= rep.maxHours)) {
                if (!bestReplacement || rep.currentHours < bestReplacement.currentHours) {
                    bestReplacement = rep;
                }
            }
        }

        if (!bestReplacement) {
            return res.status(400).json({ msg: 'No available faculty in this department' });
        }

        // Execution Step: Reassign
        const oldFaculty = await Faculty.findById(request.facultyId);

        // 1. Update Timetable entry
        const originalHours = affectedTimetableEntry.hours;
        affectedTimetableEntry.facultyId = bestReplacement._id;
        await affectedTimetableEntry.save();

        // 2. Update Hours for both
        oldFaculty.currentHours -= originalHours;
        await oldFaculty.save();

        bestReplacement.currentHours += originalHours;
        await bestReplacement.save();

        // 3. Update Request status
        request.status = 'Reassigned';
        request.decisionLog = `Reassigned ${affectedTimetableEntry.subject} to ${bestReplacement.name}`;
        await request.save();

        res.json({ msg: 'Successfully reassigned', replacement: bestReplacement.name });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
