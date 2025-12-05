
const StatusCode = require("../helper/statusCode");
const Attendance = require("../model/attendenceModel");
const userModel = require('../model/userModel');
const Appointment = require("../model/appointmentModel")
const mongoose = require('mongoose')
// Standalone function (no this needed)
function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

class StaffController {

    // staff dashboard

    async dashboard(req, res) {
        try {
            //  Fetch counts
            const totalDoctors = await userModel.countDocuments({ role: "doctor", is_verified: true });
            const totalNurses = await userModel.countDocuments({ role: "nurse", is_verified: true });
            const totalStaff = await userModel.countDocuments({ role: { $nin: ["doctor", "nurse"] }, is_verified: true });
            const totalAppointments = await Appointment.countDocuments();

            // Fetch top doctors (by number of completed appointments)
            const topDoctors = await Appointment.aggregate([
                { $match: { appointmentStatus: "completed" } },
                { $group: { _id: "$doctor", totalAppointments: { $sum: 1 } } },
                { $sort: { totalAppointments: -1 } },
                { $limit: 5 }, // top 5 doctors
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctorData"
                    }
                },
                { $unwind: "$doctorData" },
                {
                    $project: {
                        _id: 0,
                        name: "$doctorData.name",
                        email: "$doctorData.email",
                        totalAppointments: 1
                    }
                }
            ]);

        



            // ender dashboard with all stats
            return res.render('staff_Management/dashboard', {
                title: "Staff Dashboard",
                stats: {
                    totalDoctors,
                    totalNurses,
                    totalStaff,
                    totalAppointments,
                    topDoctors,
                },
                success: req.flash('success'),
                error: req.flash('error')
            });

        } catch (err) {
            console.error("Dashboard error:", err);
            req.flash('error', 'Failed to load dashboard');
            return res.redirect('/staff/dashboard');
        }
    }


    // staff logout
    async stafflogout(req, res) {
        try {
            req.flash('success', 'You have been logged out successfully!');
            res.clearCookie('staffToken');
            res.redirect('/staff-login');
        } catch (error) {
            console.log(error);
        }
    }

    // staff checkin
    async checkIn(req, res) {
        try {
            const staffId = req.user.id;

            if (!staffId) {
                req.flash('error', 'Staff ID is required!');
                return res.redirect('/staff/attendances');
            }

            const today = getToday();

            const alreadyCheckedIn = await Attendance.findOne({ staffId, date: today });

            if (alreadyCheckedIn) {
                req.flash('error', 'Already checked in today!');
                return res.redirect('/staff/attendances');
            }

            await Attendance.create({
                staffId,
                date: today,
                checkIn: new Date()
            });

            req.flash('success', 'Checked in successfully!');
            return res.redirect('/staff/attendances');

        } catch (error) {
            console.error(error);
            req.flash('error', 'Check-in failed!');
            return res.redirect('/staff/attendances');
        }
    }

    // staff checkout
    async checkOut(req, res) {
        try {
            const staffId = req.user.id;

            if (!staffId) {
                req.flash('error', 'Staff ID is required!');
                return res.redirect('/staff/attendances');
            }

            const today = getToday();

            const attendance = await Attendance.findOne({ staffId, date: today });

            if (!attendance) {
                req.flash('error', 'Check-in not found for today!');
                return res.redirect('/staff/attendances');
            }

            if (attendance.checkOut) {
                req.flash('error', 'Already checked out today!');
                return res.redirect('/staff/attendances');
            }

            attendance.checkOut = new Date();
            attendance.hoursWorked =
                (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

            await attendance.save();

            req.flash('success', 'Checked out successfully!');
            return res.redirect('/staff/attendances');

        } catch (error) {
            console.error(error);
            req.flash('error', 'Check-out failed!');
            return res.redirect('/staff/attendances');
        }
    }

    // staff attendance page
    async getStaffAttendancePage(req, res) {
        try {
            const userId = req.user.id;

            const today = getToday();

            const attendance = await Attendance.findOne({ staffId: userId, date: today });

            const attendanceList = await Attendance.find({ staffId: userId })
                .sort({ date: -1 })
                .limit(7);

            res.render('staff_Management/staffAttendance', {
                title: 'Staff Attendance',
                attendance,
                attendanceList,
                success: req.flash('success'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error(error);
            req.flash('error', 'Failed to load attendance page');
            res.redirect('/staff/dashboard');
        }
    }

    // view appointments
   async viewAppointments(req, res) {
    try {
        const doctorsWithAppointments = await userModel.aggregate([
            // Match only doctors
            { $match: { role: 'doctor', is_verified: true } },
           
            {
                $lookup: {
                    from: 'appointments',
                    let: { doctorId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$doctor', '$$doctorId'] } } },
                        { $sort: { createdAt: -1 } } 
                    ],
                    as: 'appointments'
                }
            },
         
            {
                $lookup: {
                    from: 'hospitalsettings',
                    localField: 'assignLocation',
                    foreignField: '_id',
                    as: 'hospitalDetails'
                }
            },
           
            {
                $project: {
                    _id: 1,
                    name: 1,
                    phone: 1,
                    department: 1,
                    specialization: 1,
                    hospitalName: { $arrayElemAt: ['$hospitalDetails.hospitalName', 0] },
                    appointments: 1,
                }
            }
           
        ]);

        const filteredDoctors = doctorsWithAppointments.filter(doctor => doctor.appointments.length > 0);
        
        return res.render('staff_Management/doctorsAppointments', {
            title: 'Doctors & Appointments',
            doctors: filteredDoctors,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching doctors with appointments:', error);
        req.flash('error', 'Error loading doctors and appointments');
        return res.redirect('/staff/dashboard');
    }
}

    // doctorFeedbackList
    async doctorFeedbackList(req, res) {
        try {
            const feedbackSummary = await Appointment.aggregate([

                {
                    $match: {
                        appointmentStatus: "completed",
                        rating: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: "$doctor",
                        avgRating: { $avg: "$rating" },
                        totalFeedbacks: { $sum: 1 },
                        latestFeedback: { $last: "$feedback" },
                        latestRating: { $last: "$rating" },
                        latestFeedbackDate: { $last: "$feedbackDate" }
                    }
                },


                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctorData"
                    }
                },
                { $unwind: "$doctorData" },

                {
                    $project: {
                        _id: 1,
                        avgRating: { $round: ["$avgRating", 1] },
                        totalFeedbacks: 1,
                        latestFeedback: 1,
                        latestRating: 1,
                        latestFeedbackDate: 1,
                        doctorName: "$doctorData.name",
                        specialization: "$doctorData.specialization"
                    }
                },

                {
                    $sort: { avgRating: -1 }
                }
            ]);
            // res.status(200).json({feedbackSummary})
            res.render("staff_Management/feedback", {
                feedbackSummary,
                title: "Doctor_Feedback"
            });

        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error");
        }
    }

    // viewDoctorFeedback
    async viewDoctorFeedback(req, res) {
        try {
            const { doctorId } = req.params;

            const data = await Appointment.aggregate([
                {
                    $match: {
                        doctor: new mongoose.Types.ObjectId(doctorId),
                        appointmentStatus: "completed",
                        rating: { $ne: null }
                    }
                },

                // Join patient info
                {
                    $lookup: {
                        from: "users",
                        localField: "patient",
                        foreignField: "_id",
                        as: "patientData"
                    }
                },
                { $unwind: "$patientData" },

                // Join doctor info
                {
                    $lookup: {
                        from: "users",
                        localField: "doctor",
                        foreignField: "_id",
                        as: "doctorData"
                    }
                },
                { $unwind: "$doctorData" },

                // Format data
                {
                    $project: {
                        rating: 1,
                        feedback: 1,
                        feedbackDate: 1,
                        appointmentStatus: 1,
                        patientName: "$patientData.name",
                        patientEmail: "$patientData.email",
                        doctorName: "$doctorData.name",
                        specialization: "$doctorData.specialization"
                    }
                },

                { $sort: { feedbackDate: -1 } }
            ]);

            if (!data.length) {
                return res.render("staff_Management/feedback", {
                    doctor: null,
                    feedbackList: []
                });
            }

            res.render("staff_Management/doctorFeedbackModal", {
                doctor: {
                    name: data[0].doctorName,
                    specialization: data[0].specialization
                },
                feedbackList: data
            });

        } catch (error) {
            console.log(error);
            res.status(500).send("Server error");
        }
    }

    // edit appointment
    async editAppointment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            console.log("Updating appointment:", id, "with data:", updateData);

            if (!id) {
                return res.status(400).json({ message: 'Appointment ID is required.' });
            }

            // Find the existing appointment
            const existingAppointment = await Appointment.findById(id);
            if (!existingAppointment) {
                return res.status(404).json({ message: 'Appointment not found.' });
            }

            // Check if appointment can be modified (only pending or booked appointments can be modified)
            if (existingAppointment.appointmentStatus === 'cancelled' || existingAppointment.appointmentStatus === 'completed') {
                return res.status(400).json({
                    message: `Cannot modify ${existingAppointment.appointmentStatus} appointment.`
                });
            }

            // If updating date/time, check for conflicts
            if (updateData.appointmentDate || updateData.appointmentTime) {
                const newDate = updateData.appointmentDate || existingAppointment.appointmentDate;
                const newTime = updateData.appointmentTime || existingAppointment.appointmentTime;
                const doctorId = updateData.doctor || existingAppointment.doctor;

                const conflictingAppointment = await Appointment.findOne({
                    _id: { $ne: id }, // Exclude current appointment
                    doctor: doctorId,
                    appointmentDate: newDate,
                    appointmentTime: newTime,
                    appointmentStatus: { $in: ['booked', 'confirmed'] }
                });

                if (conflictingAppointment) {
                    return res.status(409).json({
                        message: 'Doctor is not available at the selected time. Please choose a different time slot.',
                        conflictingSlot: {
                            date: newDate,
                            time: newTime
                        }
                    });
                }

                // Update slot if date or time changed
                updateData.slot = `${newDate} ${newTime}`;
            }

            // Add updated timestamp
            updateData.updatedAt = new Date();

            const updatedAppointment = await Appointment.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).populate('doctor', 'name email specialization')
                .populate('patient', 'name email');

            console.log("Appointment updated successfully:", updatedAppointment._id);

            return res.status(200).json({
                message: 'Appointment updated successfully.',
                appointment: updatedAppointment
            });

        } catch (err) {
            console.error('updateAppointment error', err);
            return res.status(500).json({
                message: 'Internal server error while updating appointment',
                error: err.message
            });
        }
    }
}

module.exports = new StaffController();
