require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');

const DEPARTMENTS = [
    'Computer Technology',
    'Information Technology',
    'Computer Science',
    'Artificial Intelligence & Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Mathematics'
];

const DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor'];
const SKILLS_POOL = ['Java', 'Python', 'AI', 'Machine Learning', 'Data Structures', 'Database', 'Networking'];

const NAMES = [
    'Arjun', 'Vijay', 'Rahul', 'Priya', 'Ananya', 'Suresh', 'Ramesh', 'Aman', 'Sita', 'Gita',
    'Vikram', 'Aditya', 'Sneha', 'Deepak', 'Preeti', 'Karan', 'Ishita', 'Manoj', 'Kavita', 'Sunil',
    'Rohan', 'Neha', 'Sanjay', 'Pooja', 'Abhishek', 'Swati', 'Rajesh', 'Megha', 'Amit', 'Divya',
    'Nitin', 'Shweta', 'Varun', 'Ritu', 'Akash', 'Jyoti', 'Pankaj', 'Komal', 'Harish', 'Sapna',
    'Yogesh', 'Bhavna', 'Gaurav', 'Nidhi', 'Sumit', 'Seema', 'Anuj', 'Archana', 'Tarun', 'Monica',
    'Vikas', 'Rashmi', 'Prashant', 'Tanvi', 'Sandip', 'Pallavi', 'Anil', 'Leena', 'Jitendra', 'Sheetal',
    'Siddharth', 'Isha', 'Kapil', 'Renuka', 'Mayank', 'Bela', 'Alok', 'Hema', 'Tushar', 'Kirti',
    'Ashish', 'Usha', 'Vineet', 'Meena', 'Pradeep', 'Anjali', 'Arvind', 'Bindu', 'Hemant', 'Chaitali',
    'Lalit', 'Dipti', 'Mohit', 'Gayatri', 'Chirag', 'Hina', 'Bhavesh', 'Indu', 'Bharat', 'Jaya',
    'Parag', 'Kiran', 'Nirmal', 'Lata', 'Tapan', 'Mona', 'Kartik', 'Nisha', 'Dhruv', 'Omi',
    'Sagar', 'Payal', 'Swapnil', 'Rina', 'Chetan', 'Sari', 'Amol', 'Tanu', 'Kishore', 'Uma',
    'Mahesh', 'Vani', 'Dinesh', 'Zoya', 'Umesh', 'Wali', 'Ashwin', 'Xena', 'Brijesh', 'Yara',
    'Ganesh', 'Tara', 'Rushi', 'Pala', 'Omkar', 'Nena', 'Madan', 'Lina', 'Inder', 'Kala',
    'Harsh', 'Hana', 'Giri', 'Fara', 'Eshwar', 'Dina', 'Charu', 'Bala', 'Asif', 'Aara',
    'Sanyam', 'Rani', 'Pratush', 'Oshna', 'Nanu', 'Mishu', 'Lali', 'Kushu', 'Jara', 'Ina'
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data (optional, but good for fresh start)
        await User.deleteMany({ role: 'faculty' });
        await Faculty.deleteMany({});
        await Department.deleteMany({});

        console.log('Cleared existing faculty and departments.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123', salt);

        // 1. Create Departments
        const deptObjects = [];
        for (const deptName of DEPARTMENTS) {
            const dept = new Department({ name: deptName });
            await dept.save();
            deptObjects.push(dept);
        }
        console.log(`Created ${deptObjects.length} departments.`);

        // 2. Create 150 Faculty members (15 per department)
        let nameIndex = 0;
        for (const dept of deptObjects) {
            for (let i = 0; i < 15; i++) {
                const baseName = NAMES[nameIndex % NAMES.length];
                const suffix = Math.floor(nameIndex / NAMES.length);
                const name = suffix > 0 ? `${baseName} ${suffix}` : baseName;
                const email = `${baseName.toLowerCase()}${nameIndex + 1}@gmail.com`;

                // Create User
                const user = new User({
                    name,
                    email,
                    password: hashedPassword,
                    role: 'faculty',
                    department: dept._id
                });
                await user.save();

                // Generate random skills
                const skillsCount = Math.floor(Math.random() * 3) + 2; // 2-4 skills
                const shuffledSkills = [...SKILLS_POOL].sort(() => 0.5 - Math.random());
                const facultySkills = shuffledSkills.slice(0, skillsCount);

                // Create Faculty
                const faculty = new Faculty({
                    userId: user._id,
                    name,
                    department: dept._id,
                    designation: DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)],
                    facultyId: `FAC-${1000 + nameIndex}`,
                    joiningDate: new Date(2015 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                    experience: Math.floor(Math.random() * 15) + 1,
                    skills: facultySkills,
                    maxHours: 16,
                    currentHours: 0,
                    phone: Math.floor(6000000000 + Math.random() * 3999999999).toString()
                });
                await faculty.save();

                nameIndex++;
            }
            console.log(`Seeded 15 faculty for ${dept.name}`);
        }

        console.log('Total Seeding Completed!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
