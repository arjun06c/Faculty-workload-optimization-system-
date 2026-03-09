const Timetable = require('../models/Timetable');
const WorkloadRequest = require('../models/WorkloadRequest');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

// @desc    Create a timetable entry
// @route   POST /api/academics/timetable
// @access  Academics, Admin
exports.createTimetableEntry = async (req, res) => {
    const { department, facultyId, subject, day, period, classYear, roomNumber, type, date } = req.body;

    try {
        if (!date) return res.status(400).json({ msg: 'Date is required' });

        const periodNum = parseInt(period);
        if (periodNum < 1 || periodNum > 8) {
            return res.status(400).json({ msg: 'Period must be between 1 and 8' });
        }

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

        // --- CONFLICT CHECK 1: Faculty Availability ---
        // Block if the faculty is marked unavailable for this day
        if (faculty.unavailableDays && faculty.unavailableDays.includes(day)) {
            return res.status(400).json({ msg: 'Selected faculty is unavailable for this time.' });
        }
        // Block if the faculty is marked unavailable for this period
        if (faculty.unavailablePeriods && faculty.unavailablePeriods.includes(periodNum)) {
            return res.status(400).json({ msg: 'Selected faculty is unavailable for this time.' });
        }

        const hoursAdded = type === 'Lab' ? 1.5 : 1;

        // Constraint: Max Hours
        if (faculty.currentHours + hoursAdded > faculty.maxHours) {
            return res.status(400).json({ msg: `Overload: Faculty has reached max hours limit (${faculty.maxHours}h)` });
        }

        const dateObj = new Date(date);

        // --- CONFLICT CHECK 2: Faculty Time Conflict (same day + period) ---
        const facultyDayConflict = await Timetable.findOne({
            facultyId,
            day,
            period: periodNum
        });
        if (facultyDayConflict) {
            return res.status(400).json({ msg: 'Faculty already assigned to another class during this period.' });
        }

        // --- CONFLICT CHECK 3: Classroom Conflict (same room + day + period) ---
        if (roomNumber) {
            const roomConflict = await Timetable.findOne({
                roomNumber,
                day,
                period: periodNum
            });
            if (roomConflict) {
                return res.status(400).json({ msg: 'Classroom is already occupied during this time slot.' });
            }
        }

        // --- CONFLICT CHECK 4: Class Slot Conflict (same class group cannot have two classes at the same day + period) ---
        const classSlotConflict = await Timetable.findOne({
            department,
            classYear,
            day,
            period: periodNum
        });
        if (classSlotConflict) {
            return res.status(400).json({
                msg: `Scheduling conflict: ${classYear} (${classSlotConflict.subject}) already has a class in Period ${periodNum} on ${day}. Each class group can only have one slot per period.`
            });
        }

        // Legacy date-based faculty clash check
        const existingFacultyStats = await Timetable.findOne({
            facultyId,
            date: dateObj,
            period: periodNum
        });
        if (existingFacultyStats) {
            return res.status(400).json({ msg: 'Faculty already assigned to another class during this period.' });
        }

        // NOTE: Legacy date-based class clash check removed.
        // The day-based class slot conflict check (Check #4) above already handles this correctly
        // using the recurring `day` field which is the authoritative schedule identifier.

        // Constraint: Continuous Periods (Max 3)
        const prevPeriods = await Timetable.find({
            facultyId,
            date: dateObj,
            period: { $in: [periodNum - 1, periodNum - 2, periodNum - 3] }
        }).sort({ period: 1 });

        if (prevPeriods.length === 3 &&
            prevPeriods[0].period === periodNum - 3 &&
            prevPeriods[1].period === periodNum - 2 &&
            prevPeriods[2].period === periodNum - 1) {
            return res.status(400).json({ msg: 'Constraint: Faculty cannot have more than 3 continuous periods' });
        }

        const newEntry = new Timetable({
            department,
            facultyId,
            subject,
            day,
            period: periodNum,
            classYear,
            roomNumber,
            type,
            hours: hoursAdded,
            date: dateObj
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

// @desc    Update workload request (Status, Decision Log, Reason, Department)
// @route   PUT /api/academics/workload-requests/:id
// @access  Academics
exports.updateWorkloadRequest = async (req, res) => {
    const { status, decisionLog, reason, department } = req.body;
    try {
        let request = await WorkloadRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        if (status) request.status = status;
        if (decisionLog !== undefined) request.decisionLog = decisionLog;
        if (reason) request.reason = reason;
        if (department) request.department = department;

        await request.save();

        // Return populated request
        const updatedRequest = await WorkloadRequest.findById(req.params.id)
            .populate('facultyId', 'name')
            .populate('department', 'name');

        res.json(updatedRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete workload request
// @route   DELETE /api/academics/workload-requests/:id
// @access  Academics
exports.deleteWorkloadRequest = async (req, res) => {
    try {
        const request = await WorkloadRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        await request.deleteOne();
        res.json({ msg: 'Workload request removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Smart Auto Assign Reassignment Logic
// @route   POST /api/academics/workload-requests/:id/reassign
// @access  Academics, Admin
exports.smartReassign = async (req, res) => {
    try {
        const request = await WorkloadRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        if (request.status === 'Reassigned') {
            return res.status(400).json({ msg: 'Request already reassigned' });
        }

        const dateObj = new Date(request.date);
        const periodsToReassign = request.periods || []; // Array of periods
        let successLog = [];
        let failedLog = [];

        // Iterate over each requested period
        for (const targetPeriod of periodsToReassign) {

            // Find specific timetable entry for this date/period
            const affectedTimetableEntry = await Timetable.findOne({
                facultyId: request.facultyId,
                date: dateObj,
                period: targetPeriod
            });

            if (!affectedTimetableEntry) {
                // Skip if no class was scheduled for this period
                continue;
            }

            // --- SMART AUTO ASSIGN LOGIC ---
            // 1. Same Department
            // 2. Not the requester
            const candidates = await Faculty.find({
                department: request.department,
                _id: { $ne: request.facultyId }
            });

            const validCandidates = [];

            for (const faculty of candidates) {
                // Check 1: Overloaded?
                if (faculty.currentHours >= faculty.maxHours) continue;

                // Check 2: Free in this slot on this Date?
                const clash = await Timetable.findOne({
                    facultyId: faculty._id,
                    date: dateObj,
                    period: targetPeriod
                });
                if (clash) continue;

                validCandidates.push(faculty);
            }

            if (validCandidates.length > 0) {
                // Step 4: Faculty with Least Workload
                validCandidates.sort((a, b) => a.currentHours - b.currentHours);
                const bestReplacement = validCandidates[0];

                // Step 5: Assign
                const originalHours = affectedTimetableEntry.hours;

                // Update Timetable
                affectedTimetableEntry.facultyId = bestReplacement._id;
                await affectedTimetableEntry.save();

                // Update Hours
                const oldFaculty = await Faculty.findById(request.facultyId);
                oldFaculty.currentHours -= originalHours;
                await oldFaculty.save();

                bestReplacement.currentHours += originalHours;
                await bestReplacement.save();

                successLog.push(`P${targetPeriod}: Reassigned to ${bestReplacement.name}`);
            } else {
                failedLog.push(`P${targetPeriod}: No replacement found`);
            }
        }

        // Final Status Update
        if (failedLog.length === 0 && successLog.length > 0) {
            request.status = 'Approved'; // Or 'Reassigned'
            request.decisionLog = successLog.join('; ');
        } else if (successLog.length > 0) {
            request.status = 'Escalated'; // Partial success
            request.decisionLog = `Partial: ${successLog.join('; ')} | Failed: ${failedLog.join('; ')}`;
        } else {
            request.decisionLog = failedLog.join('; ');
            // Keep pending or escalate
            request.status = 'Escalated';
        }

        await request.save();

        res.json({
            msg: 'Auto-assign process completed',
            log: request.decisionLog
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
// @desc    Get faculty members of a department with their workload hours
// @route   GET /api/academics/office/scheduled/:departmentId
// @access  Academics, Admin
exports.getScheduledFacultiesByDept = async (req, res) => {
    try {
        const faculty = await Faculty.find({ department: req.params.departmentId })
            .select('name currentHours maxHours designation')
            .sort({ name: 1 });
        res.json(faculty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get full faculty details and their complete timetable
// @route   GET /api/academics/office/faculty/:facultyId
// @access  Academics, Admin
exports.getFacultyFullDetails = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.facultyId)
            .populate('department', 'name')
            .populate('userId', 'email');
        if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

        const timetable = await Timetable.find({ facultyId: req.params.facultyId })
            .sort({ date: -1, period: 1 });

        res.json({
            profile: faculty,
            timetable
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
// @desc    Update a timetable entry
// @route   PUT /api/academics/timetable/:id
// @access  Academics, Admin
exports.updateTimetableEntry = async (req, res) => {
    const { facultyId, subject, day, period, classYear, roomNumber, type, date } = req.body;
    try {
        let entry = await Timetable.findById(req.params.id);
        if (!entry) return res.status(404).json({ msg: 'Timetable entry not found' });

        const oldFacultyId = entry.facultyId.toString();
        const oldHours = entry.hours;
        const newDate = date ? new Date(date) : entry.date;
        const newPeriod = period ? parseInt(period) : entry.period;
        const newType = type || entry.type;
        const newHours = newType === 'Lab' ? 1.5 : 1;
        const newDay = day || entry.day;
        const targetFacultyId = facultyId || oldFacultyId;
        const newRoomNumber = roomNumber !== undefined ? roomNumber : entry.roomNumber;
        const newClassYear = classYear || entry.classYear;

        // --- CONFLICT CHECK 1: Faculty Availability ---
        const targetFaculty = await Faculty.findById(targetFacultyId);
        if (!targetFaculty) return res.status(404).json({ msg: 'Faculty not found' });

        if (targetFaculty.unavailableDays && targetFaculty.unavailableDays.includes(newDay)) {
            return res.status(400).json({ msg: 'Selected faculty is unavailable for this time.' });
        }
        if (targetFaculty.unavailablePeriods && targetFaculty.unavailablePeriods.includes(newPeriod)) {
            return res.status(400).json({ msg: 'Selected faculty is unavailable for this time.' });
        }

        // --- CONFLICT CHECK 2: Faculty Time Conflict (same day + period) ---
        const facultyDayConflict = await Timetable.findOne({
            _id: { $ne: req.params.id },
            facultyId: targetFacultyId,
            day: newDay,
            period: newPeriod
        });
        if (facultyDayConflict) {
            return res.status(400).json({ msg: 'Faculty already assigned to another class during this period.' });
        }

        // --- CONFLICT CHECK 3: Classroom Conflict (same room + day + period) ---
        if (newRoomNumber) {
            const roomConflict = await Timetable.findOne({
                _id: { $ne: req.params.id },
                roomNumber: newRoomNumber,
                day: newDay,
                period: newPeriod
            });
            if (roomConflict) {
                return res.status(400).json({ msg: 'Classroom is already occupied during this time slot.' });
            }
        }

        // --- CONFLICT CHECK 4: Duplicate Entry (same subject + day + period + classYear + department) ---
        // --- CONFLICT CHECK 4: Class Slot Conflict (same class group cannot have two slots at the same day + period) ---
        const classSlotConflict = await Timetable.findOne({
            _id: { $ne: req.params.id },
            department: entry.department,
            classYear: newClassYear,
            day: newDay,
            period: newPeriod
        });
        if (classSlotConflict) {
            return res.status(400).json({
                msg: `Scheduling conflict: ${newClassYear} (${classSlotConflict.subject}) already has a class in Period ${newPeriod} on ${newDay}. Each class group can only have one slot per period.`
            });
        }

        // Legacy date-based clash checks
        const facultyDateClash = await Timetable.findOne({
            _id: { $ne: req.params.id },
            facultyId: targetFacultyId,
            date: newDate,
            period: newPeriod
        });
        if (facultyDateClash) return res.status(400).json({ msg: 'Faculty already assigned to another class during this period.' });

        // NOTE: Legacy date-based class clash check removed.
        // The day-based class slot conflict check (Check #4) above covers this correctly.

        // Workload adjustment if faculty or type (hours) changes
        if (facultyId && facultyId !== oldFacultyId) {
            const newFaculty = await Faculty.findById(facultyId);
            if (!newFaculty) return res.status(404).json({ msg: 'New faculty not found' });

            if (newFaculty.currentHours + newHours > newFaculty.maxHours) {
                return res.status(400).json({ msg: 'Overload: New faculty exceeds max hours' });
            }

            // Decrement old
            await Faculty.findByIdAndUpdate(oldFacultyId, { $inc: { currentHours: -oldHours } });
            // Increment new
            newFaculty.currentHours += newHours;
            await newFaculty.save();
        } else if (newHours !== oldHours) {
            // Same faculty, different type/hours
            const faculty = await Faculty.findById(oldFacultyId);
            if (faculty.currentHours - oldHours + newHours > faculty.maxHours) {
                return res.status(400).json({ msg: 'Overload: Faculty exceeds max hours with this change' });
            }
            faculty.currentHours = faculty.currentHours - oldHours + newHours;
            await faculty.save();
        }

        entry.facultyId = facultyId || entry.facultyId;
        entry.subject = subject || entry.subject;
        entry.day = day || entry.day;
        entry.period = newPeriod;
        entry.classYear = classYear || entry.classYear;
        entry.roomNumber = roomNumber || entry.roomNumber;
        entry.type = newType;
        entry.hours = newHours;
        entry.date = newDate;

        await entry.save();
        res.json(entry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/academics/timetable/:id
// @access  Academics, Admin
exports.deleteTimetableEntry = async (req, res) => {
    try {
        const entry = await Timetable.findById(req.params.id);
        if (!entry) return res.status(404).json({ msg: 'Entry not found' });

        // Decrement faculty hours
        await Faculty.findByIdAndUpdate(entry.facultyId, { $inc: { currentHours: -entry.hours } });

        await entry.deleteOne();
        res.json({ msg: 'Timetable entry removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
