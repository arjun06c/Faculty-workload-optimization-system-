const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create a new department
// @route   POST /api/admin/departments
// @access  Admin
exports.createDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        let department = await Department.findOne({ name });
        if (department) {
            return res.status(400).json({ msg: 'Department already exists' });
        }
        department = new Department({ name });
        await department.save();
        res.json(department);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Admin, Academics
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().populate('hodId', 'name');
        res.json(departments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update a department
// @route   PUT /api/admin/departments/:id
// @access  Admin
exports.updateDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        let department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ msg: 'Department not found' });

        department.name = name || department.name;
        await department.save();
        res.json(department);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @access  Admin
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ msg: 'Department not found' });

        await Department.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Department deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Add a new faculty member (and create User)

// @route   POST /api/admin/faculty
// @access  Admin
exports.addFaculty = async (req, res) => {
    const { name, email, password, department, designation, phone, maxHours, skills } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create User
        user = new User({
            email,
            password,
            role: 'faculty',
            department
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Create Faculty Profile
        const faculty = new Faculty({
            userId: user.id,
            name,
            department,
            designation,
            phone,
            maxHours: maxHours || 16,
            skills: skills || []
        });

        await faculty.save();
        res.json(faculty);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get all faculty members
// @route   GET /api/admin/faculty
// @access  Admin, Academics, HOD
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find().populate('department', 'name').populate('userId', 'email');
        res.json(faculty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Add a new Academics Office user
// @route   POST /api/admin/academics
// @access  Admin
exports.addAcademicsUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({
            email,
            password,
            role: 'academics'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.json({ msg: 'Academics Office user created', email: user.email });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Assign HOD to a department
// @route   PUT /api/admin/departments/:id/assign-hod
// @access  Admin
exports.assignHOD = async (req, res) => {
    const { facultyId } = req.body;
    try {
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ msg: 'Department not found' });

        department.hodId = facultyId;
        await department.save();
        res.json(department);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get faculty by department ID
// @route   GET /api/admin/departments/:deptId/faculty
// @access  Admin, Academics
exports.getFacultyByDepartment = async (req, res) => {
    try {
        const faculty = await Faculty.find({ department: req.params.deptId })
            .populate('department', 'name')
            .populate('userId', 'email');
        res.json(faculty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update faculty details
// @route   PUT /api/admin/faculty/:id
// @access  Admin
exports.updateFaculty = async (req, res) => {
    const { name, email, password, department, designation, phone, maxHours, skills } = req.body;

    try {
        let faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ msg: 'Faculty member not found' });

        // Update Faculty fields
        faculty.name = name || faculty.name;
        faculty.department = department || faculty.department;
        faculty.designation = designation || faculty.designation;
        faculty.phone = phone || faculty.phone;
        faculty.maxHours = maxHours || faculty.maxHours;
        faculty.skills = skills || faculty.skills;

        await faculty.save();

        // Update User fields if provided
        const userUpdate = {};
        if (email) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== faculty.userId.toString()) {
                return res.status(400).json({ msg: 'Email is already in use' });
            }
            userUpdate.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            userUpdate.password = await bcrypt.hash(password, salt);
        }

        if (department) {
            userUpdate.department = department;
        }

        if (Object.keys(userUpdate).length > 0) {
            await User.findByIdAndUpdate(faculty.userId, userUpdate);
        }

        res.json(faculty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// @desc    Delete faculty member and associated user
// @route   DELETE /api/admin/faculty/:id
// @access  Admin
exports.deleteFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ msg: 'Faculty member not found' });

        // Delete associated user
        await User.findByIdAndDelete(faculty.userId);

        // Delete faculty profile
        await Faculty.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Faculty member and associated user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
