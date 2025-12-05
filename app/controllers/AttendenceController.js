const Attendance = require("../model/attendenceModel");
const Doctor =require('../model/doctorModel')
const mongoose=require('mongoose')
// Normalize date (removes time)
const getToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// CHECK-IN
exports.checkIn = async (req, res) => {
    try {
        const staffId = req.user.id;

        if (!staffId) {
            req.flash('error', 'Staff ID is required!');
            return res.redirect('/doctor/attendance');
        }

        const today = getToday();

        // Prevent double check-in
        const alreadyCheckedIn = await Attendance.findOne({ staffId, date: today });
        if (alreadyCheckedIn) {
            req.flash('error', 'Already checked in today!');
            return res.redirect('/doctor/attendance');
        }

        await Attendance.create({
            staffId,
            date: today,
            checkIn: new Date()
        });

        req.flash('success', 'Checked in successfully!');
        return res.redirect('/doctor/attendance');

    } catch (error) {
        console.error(error);
        req.flash('error', 'Check-in failed!');
        return res.redirect('/doctor/attendance');
    }
};


// CHECK-OUT
exports.checkOut = async (req, res) => {
    try {
        const staffId = req.user.id;

        if (!staffId) {
            req.flash('error', 'Staff ID is required!');
            return res.redirect('/doctor/attendance');
        }

        const today = getToday();

        // Find today's attendance
        const attendance = await Attendance.findOne({ staffId, date: today });

        if (!attendance) {
            req.flash('error', 'Check-in not found for today!');
            return res.redirect('/doctor/attendance');
        }

        // Prevent double check-out
        if (attendance.checkOut) {
            req.flash('error', 'Already checked out today!');
            return res.redirect('/doctor/attendance');
        }

        // Perform check-out
        attendance.checkOut = new Date();
        attendance.hoursWorked = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60); // in hours
        await attendance.save();

        req.flash('success', 'Checked out successfully!');
        return res.redirect('/doctor/attendance');

    } catch (error) {
        console.error(error);
        req.flash('error', 'Check-out failed!');
        return res.redirect('/doctor/attendance');
    }
};


// doctor attendence
exports.getAttendancePage = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get doctor profile
        const doctorProfile = await Doctor.aggregate([
            {
                $match: { userId:new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'doctorDetails'
                }
            },
            { $unwind: '$doctorDetails' }
        ]);

        const profile = doctorProfile[0] || null;

        // Get today's attendance
        const today = getToday();
        const attendance = await Attendance.findOne({ staffId: userId, date: today });

        // Get last 7 days attendance
        const attendanceList = await Attendance.find({ staffId: userId })
            .sort({ date: -1 })
            .limit(7);

        res.render('doctor_Management/doctorAttendance', {
            title: 'Doctor Attendance',
            profile,
            attendance,
            attendanceList,
            success: req.flash('success'),
            error: req.flash('error')
        });

    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to load attendance page');
        res.redirect('/doctor/dashboard');
    }
};

// GET ALL ATTENDANCE
exports.getAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find().populate("staffId");
        console.log(attendance);
        
        res.render("admin_Management/staffAttendence", { attendance: attendance, title: 'Staff_Attendence' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to fetch attendance" });
    }
};
