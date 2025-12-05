const appointmentModel = require("../model/appointmentModel");
const userModel = require("../model/userModel");
const Attendance = require('../model/attendenceModel');
const doctorModel = require("../model/doctorModel");

function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

class NurseController {
    // dashboard
    async dashboard(req, res) {
        try {
            // Count stats
            const totalDoctors = await userModel.countDocuments({ role: 'doctor' });
            const totalNurses = await userModel.countDocuments({ role: 'nurse' });
            const totalStaff = await userModel.countDocuments({ role: 'staff' });
            const totalAppointments = await appointmentModel.countDocuments();

            // Top doctors with appointment stats
            const topDoctors = await appointmentModel.aggregate([
                { $match: { doctor: { $ne: null } } }, // prevent null doctors
                { $group: { _id: "$doctor", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctorDetails"
                    }
                },
                { $unwind: "$doctorDetails" },
                {
                    $project: {
                        name: "$doctorDetails.name",
                        email: "$doctorDetails.email",
                        totalAppointments: "$count"
                    }
                }
            ]);

            // Staff list with hospital details
            const staffList = await userModel.aggregate([
                { $match: { role: "staff" } }, // choose your preference
                {
                    $lookup: {
                        from: "hospitalsettings",
                        localField: "assignLocation",
                        foreignField: "_id",
                        as: "hospitalDetails"
                    }
                },
                { $unwind: "$hospitalDetails" },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        phone: 1,
                        role: 1,
                        department: 1,
                        specialization: 1,
                        hospitalName: "$hospitalDetails.hospitalName",
                        address: "$hospitalDetails.address",
                        shifting: 1,
                        createdAt: 1
                    }
                }
            ]);

            return res.render('nurse_Management/dashboard', {
                title: "Nurse Dashboard",
                stats: {
                    totalDoctors,
                    totalNurses,
                    totalStaff,
                    totalAppointments,
                    topDoctors,
                    staffList
                }
            });

        } catch (err) {
            console.error(err);
            req.flash("error", "Unable to load dashboard");
            return res.redirect("/nurse/dashboard");
        }
    }
    // nurse logout
    async nurselogout(req, res) {
        try {
            req.flash('success', 'You have been logged out successfully!');
            res.clearCookie('nurseToken')
            res.redirect('/staff-login')
        } catch (error) {
            console.log(error);
        }
    }
    // attendence
    async checkIn(req, res) {
        try {
            const staffId = req.user.id;

            if (!staffId) {
                req.flash('error', 'Staff ID is required!');
                return res.redirect('/nurse/attendance');
            }

            const today = getToday();

            const alreadyCheckedIn = await Attendance.findOne({ staffId, date: today });

            if (alreadyCheckedIn) {
                req.flash('error', 'Already checked in today!');
                return res.redirect('/nurse/attendance');
            }

            await Attendance.create({
                staffId,
                date: today,
                checkIn: new Date()
            });

            req.flash('success', 'Checked in successfully!');
            return res.redirect('/nurse/attendance');

        } catch (error) {
            console.error(error);
            req.flash('error', 'Check-in failed!');
            return res.redirect('/nurse/attendance');
        }
    }
    async checkOut(req, res) {
        try {
            const staffId = req.user.id;

            if (!staffId) {
                req.flash('error', 'Staff ID is required!');
                return res.redirect('/nurse/attendance');
            }

            const today = getToday();

            // Find today's attendance
            const attendance = await Attendance.findOne({ staffId, date: today });

            if (!attendance) {
                req.flash('error', 'Check-in not found for today!');
                return res.redirect('/nurse/attendance');
            }

            // Prevent double check-out
            if (attendance.checkOut) {
                req.flash('error', 'Already checked out today!');
                return res.redirect('/nurse/attendance');
            }

            // Perform check-out
            attendance.checkOut = new Date();
            attendance.hoursWorked = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60); // in hours
            await attendance.save();

            req.flash('success', 'Checked out successfully!');
            return res.redirect('/nurse/attendance');

        } catch (error) {
            console.error(error);
            req.flash('error', 'Check-out failed!');
            return res.redirect('/nurse/attendance');
        }
    }
    async getAttendancePage(req, res) {
        try {
            const userId = req.user.id;

            const today = getToday();

            const attendance = await Attendance.findOne({ staffId: userId, date: today });

            const attendanceList = await Attendance.find({ staffId: userId })
                .sort({ date: -1 })
                .limit(7);

            res.render('nurse_Management/nurseAttendance', {
                title: 'Nurse Attendance',
                attendance,
                attendanceList,
                success: req.flash('success'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error(error);
            req.flash('error', 'Failed to load attendance page');
            res.redirect('/nurse/dashboard');
        }
    }
    // appointments
    async appointment(req, res) {
        try {
            const doctorsWithAppointments = await userModel.aggregate([
                // Match only doctors
                { $match: { role: 'doctor', is_verified: true } },
                // Lookup appointments for each doctor
                {
                    $lookup: {
                        from: 'appointments',
                        localField: '_id',
                        foreignField: 'doctor',
                        as: 'appointments'
                    }
                },
                // Lookup hospital details
                {
                    $lookup: {
                        from: 'hospitalsettings',
                        localField: 'assignLocation',
                        foreignField: '_id',
                        as: 'hospitalDetails'
                    }
                },
                // Project final fields
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        phone: 1,
                        department: 1,
                        specialization: 1,
                        hospitalName: { $arrayElemAt: ['$hospitalDetails.hospitalName', 0] },
                        appointments: 1
                    }
                }
            ]);

            const filteredDoctors = doctorsWithAppointments.filter(doctor => doctor.appointments.length > 0);
            // console.log(filteredDoctors);

            return res.render('nurse_Management/doctorsAppointments', {
                title: 'Doctors & Appointments',
                doctors: filteredDoctors,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error fetching doctors with appointments:', error);
            req.flash('error', 'Error loading doctors and appointments');
            return res.redirect('/admin/dashboard');
        }
    }
}
module.exports = new NurseController