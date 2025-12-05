const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Appointment = require('../model/appointmentModel')
const UserModel = require('../model/userModel');
const Doctor = require('../model/doctorModel');
const StatusCode = require('../helper/statusCode');
const { doctorProfileValidation } = require('../helper/Validation');
const fs = require('fs');
const { title } = require('process');

class DoctorController {

    // Doctor dashboard
    async dashboard(req, res) {
        try {
            const doctorId = req.user.id;

            // -------------------------
            // 1. Fetch Doctor Profile
            // -------------------------
            const doctorProfile = await Doctor.aggregate([
                {
                    $match: { userId: new mongoose.Types.ObjectId(doctorId) }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: "$userDetails" },
                {
                    $lookup: {
                        from: "hospitalsettings",
                        localField: "userDetails.assignLocation",
                        foreignField: "_id",
                        as: "hospitalDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$hospitalDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        profile: 1,
                        qualification: 1,
                        experience: 1,
                        timing: 1,
                        language: 1,
                        specialization: "$userDetails.specialization",
                        name: "$userDetails.name",
                        email: "$userDetails.email",
                        phone: "$userDetails.phone",
                        department: "$userDetails.department",
                        hospitalName: "$hospitalDetails.hospitalName",
                        hospitalLocation: "$hospitalDetails.address"
                    }
                }
            ]);

            const profile = doctorProfile[0] || null;

            // -------------------------
            // 2. Today's appointments
            // --------------------------
            const today = new Date().toISOString().split("T")[0];

            const todaysAppointments = await Appointment.find({
                doctor: doctorId,
                appointmentDate: today
            })
                .populate("patient", "name age email")
                .sort({ appointmentTime: 1 });

            // -------------------------
            // 3. Stats
            // -------------------------
            const stats = {
                total: await Appointment.countDocuments({ doctor: doctorId }),
                pending: await Appointment.countDocuments({
                    doctor: doctorId,
                    appointmentStatus: "pending"
                }),
                completed: await Appointment.countDocuments({
                    doctor: doctorId,
                    appointmentStatus: "completed"
                }),
                cancelled: await Appointment.countDocuments({
                    doctor: doctorId,
                    appointmentStatus: "cancelled"
                })
            };

            // -------------------------
            // 4. Recent Feedback (latest 5)
            // -------------------------
            const recentFeedback = await Appointment.find({
                doctor: doctorId,
                feedback: { $exists: true, $ne: "" }
            })
                .populate("patient", "name")
                .sort({ feedbackDate: -1 })
                .limit(5);

            // -------------------------
            // 5. Upcoming Appointments (next 7 days)
            // -------------------------
            const upcomingAppointments = await Appointment.find({
                doctor: doctorId,
                appointmentDate: { $gte: new Date() }
            })
                .populate("patient", "name email")
                .sort({ appointmentDate: 1 })
                .limit(10);

            // Render Dashboard Page
            return res.render("doctor_Management/dashboard", {
                title: "Doctor Dashboard",
                profile,
                todaysAppointments,
                stats,
                recentFeedback,
                upcomingAppointments
            });

        } catch (error) {
            console.error("Dashboard Error:", error);
            return res.status(500).send("Internal Server Error");
        }
    }


    // Create doctor profile
    async doctorProfile(req, res) {
        try {
            const { error } = doctorProfileValidation.validate(req.body);
            if (error) {
                req.flash('error', error.details[0].message); // flash error
                return res.redirect('/doctor/profile');
            }

            const userId = req.user.id;
            const user = await UserModel.findById(userId);
            if (!user) {
                req.flash('error', 'User not found');
                return res.redirect('/doctor/profile');
            }

            if (user.role !== "doctor") {
                req.flash('error', 'Only doctors can create profile');
                return res.redirect('/doctor/profile');
            }

            const existing = await Doctor.findOne({ userId });
            if (existing) {
                req.flash('error', 'Doctor profile already exists');
                return res.redirect('/doctor/profile');
            }

            if (!req.file) {
                req.flash('error', 'Image is required');
                return res.redirect('/doctor/profile');
            }

            const doctor = await Doctor.create({
                userId,
                qualification: req.body.qualification,
                experience: req.body.experience,
                timing: req.body.timing,
                language: req.body.language,
                profile: req.file.path, // or Cloudinary URL
            });

            req.flash('success', 'Doctor profile created successfully');
            return res.redirect('/doctor/profile');

        } catch (error) {
            console.error("Error creating doctor profile:", error);
            req.flash('error', 'Internal Server Error');
            return res.redirect('/doctor/profile');
        }
    }

    // Get doctor profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const doctorProfile = await Doctor.aggregate([
                // Add this match stage to filter by current user
                {
                    $match: { userId: new mongoose.Types.ObjectId(userId) }
                },
                {
                    $lookup: {
                        from: 'users',          // User collection
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'doctorDetails'
                    }
                },
                { $unwind: '$doctorDetails' },
                {
                    $lookup: {
                        from: 'hospitalsettings',     // Hospital collection
                        localField: 'doctorDetails.assignLocation',
                        foreignField: '_id',
                        as: 'hospitalDetails'
                    }
                },
                { $unwind: { path: '$hospitalDetails', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        name: '$doctorDetails.name',
                        email: '$doctorDetails.email',
                        phone: '$doctorDetails.phone',
                        profile: 1,
                        qualification: 1,
                        language: 1,
                        timing: 1,
                        experience: 1,
                        specialization: '$doctorDetails.specialization',
                        hospitalName: '$hospitalDetails.hospitalName',
                        location: '$hospitalDetails.address'
                    }
                }
            ]);

            // console.log("Doctor profile aggregation result:", doctorProfile);

            const profile = doctorProfile[0] || null;

            return res.render("doctor_Management/doctorProfile", {
                title: "Doctor Profile",
                profile
            });

        } catch (error) {
            console.error("Error retrieving doctor profile:", error);
            return res.status(500).send("Error retrieving Doctor profile");
        }
    }

    //getDoctorsGroupedByHospital 
    async getDoctorsGroupedByHospital(req, res) {
        try {
            const doctorsGrouped = await Doctor.aggregate([
                {
                    $lookup: {
                        from: 'users',          // User collection
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'doctorDetails'
                    }
                },
                { $unwind: '$doctorDetails' },
                {
                    $lookup: {
                        from: 'hospitalsettings', // Hospital collection
                        localField: 'doctorDetails.assignLocation',
                        foreignField: '_id',
                        as: 'hospitalDetails'
                    }
                },
                { $unwind: { path: '$hospitalDetails', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$hospitalDetails._id',
                        hospitalName: { $first: '$hospitalDetails.hospitalName' },
                        location: { $first: '$hospitalDetails.address' },
                        doctors: {
                            $push: {
                                doctorId: '$doctorDetails._id',  // USER ID
                                mainId: '$_id',
                                name: '$doctorDetails.name',
                                email: '$doctorDetails.email',
                                phone: '$doctorDetails.phone',
                                profile: '$profile',
                                qualification: '$qualification',
                                language: '$language',
                                timing: '$timing',
                                experience: '$experience',
                                specialization: '$doctorDetails.specialization'
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        doctorCount: { $size: '$doctors' } // ← count number of doctors per hospital
                    }
                },
                {
                    $project: {
                        _id: 1,
                        hospitalName: 1,
                        location: 1,
                        doctorCount: 1, // include the count
                        doctors: 1
                    }
                }
            ]);

            return res.status(StatusCode.OK).json({ doctorsGrouped });

        } catch (error) {
            console.error("Error grouping doctors by hospital:", error);
            return res.status(500).send("Error retrieving doctors grouped by hospital");
        }
    }

    // getDoctorsGroupedByDepartment
    async getDoctorsGroupedByDepartment(req, res) {
        try {
            const doctorsGrouped = await Doctor.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'doctorDetails'
                    }
                },
                { $unwind: '$doctorDetails' },
                {
                    $lookup: {
                        from: 'hospitalsettings',
                        localField: 'doctorDetails.assignLocation',
                        foreignField: '_id',
                        as: 'hospitalDetails'
                    }
                },
                { $unwind: { path: '$hospitalDetails', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$doctorDetails.department',
                        doctors: {
                            $push: {
                                doctorId: '$doctorDetails._id',  // USER ID
                                mainId: '$_id',                   // DOCTOR COLLECTION ID
                                name: '$doctorDetails.name',
                                email: '$doctorDetails.email',
                                phone: '$doctorDetails.phone',
                                profile: '$profile',
                                qualification: '$qualification',
                                language: '$language',
                                timing: '$timing',
                                experience: '$experience',
                                specialization: '$doctorDetails.specialization',
                                hospitalName: '$hospitalDetails.hospitalName',
                                location: '$hospitalDetails.address'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        department: '$_id',
                        doctors: 1
                    }
                }
            ]);

            return res.status(StatusCode.OK).json({ doctor: doctorsGrouped });

        } catch (error) {
            console.error("Error grouping doctors by department:", error);
            return res.status(500).send("Error retrieving doctors grouped by department");
        }
    }

    // doctor logout
    async doctorlogout(req, res) {
        try {
            req.flash('success', 'You have been logged out successfully!');
            res.clearCookie('doctorToken')
            res.redirect('/staff-login')
        } catch (error) {
            console.log(error);
        }
    }

    // doctor feedback
    async getDoctorFeedbackPage(req, res) {
        try {
            const doctor = req.user.id;

            const feedbackList = await Appointment.find({
                doctor,
                feedback: { $exists: true, $ne: "" }
            })
                .populate("patient", "name email age")
                .sort({ feedbackDate: -1 });
            console.log(feedbackList);

            res.render("doctor_Management/feedback-list", { feedbackList, title: "Feedback" });

        } catch (error) {
            console.error(error);
            res.status(500).send("Server Error");
        }
    }

    // Search doctors by name or specialization
    async searchDoctors(req, res) {
        try {
            const { query } = req.query;
            if (!query) return res.status(400).json({ message: "Query is required" });

            const regex = new RegExp(query, "i"); // case-insensitive search

            const doctors = await Doctor.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "doctorDetails"
                    }
                },
                { $unwind: "$doctorDetails" },
                {
                    $match: {
                        $or: [
                            { "doctorDetails.name": { $regex: regex } },
                            { "doctorDetails.specialization": { $regex: regex } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "hospitalsettings",
                        localField: "doctorDetails.assignLocation",
                        foreignField: "_id",
                        as: "hospitalDetails"
                    }
                },
                { $unwind: { path: "$hospitalDetails", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        name: "$doctorDetails.name",
                        email: "$doctorDetails.email",
                        phone: "$doctorDetails.phone",
                        _id:"$doctorDetails._id",
                        profile: 1,
                        qualification: 1,
                        language: 1,
                        timing: 1,
                        experience: 1,
                        specialization: "$doctorDetails.specialization",
                        department: "$doctorDetails.department",
                        hospitalName: "$hospitalDetails.hospitalName",
                        location: "$hospitalDetails.address"
                    }
                }
            ]);
            // console.log("search",doctors);
            return res.status(200).json(doctors);
        } catch (error) {
            console.error("Doctor search error:", error);
            return res.status(500).json({ message: "Server Error" });
        }
    }

    // create prescription
    async createprescription(req, res) {
        try {
            const { appointmentId } = req.params;
            const { notes } = req.body;

            // Find the appointment
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                req.flash('error', 'Appointment not found');
                return res.redirect('/api/appointments/doctor/get');
            }

            // Only the assigned doctor can add a prescription
            if (appointment.doctor.toString() !== req.user.id) {
                req.flash('error', 'Unauthorized access to this appointment');
                return res.redirect('/api/appointments/doctor/get');
            }



            // Update prescription field
            appointment.prescription = {
                fileUrl: req.file.path,
                notes: notes || null,
                uploadedAt: new Date()
            };

            // Update appointment status to completed
            appointment.appointmentStatus = 'completed';

            // Save updated appointment
            await appointment.save();


            req.flash('success', 'Prescription added successfully');
            res.redirect('/api/appointments/doctor/get');

        } catch (error) {
            // console.error('Error creating prescription:', error);
            req.flash('error', 'Failed to create prescription');
            res.redirect("/api/appointments/doctor/get");
        }
    }

    async prescription(req, res) {
        try {
            // console.log('=== PRESCRIPTION ROUTE DEBUG ===');
            // console.log('Full req.params:', req.params);
            const appointmentId = req.params.appointmentId;
            // console.log('Extracted appointmentId:', appointmentId);

            if (!appointmentId) {
                return res.status(400).send(`
                <h1>Bad Request</h1>
                <p>No appointment ID provided</p>
                <a href="/doctor/appointments">Back to Appointments</a>
            `);
            }

            // console.log(' Logged-in user ID:', req.user.id);

            // Find the appointment
            const appointment = await Appointment.findById(appointmentId)
                .populate('patient', 'name email phone')
                .populate('doctor', 'name specialization');

            console.log('📋 Found appointment:', appointment);

            if (!appointment) {
                return res.status(404).send(`
                <h1>Appointment Not Found</h1>
                <p>No appointment found with ID: ${appointmentId}</p>
                <a href="/doctor/appointments">Back to Appointments</a>
            `);
            }

            // Check authorization
            if (appointment.doctor._id.toString() !== req.user.id) {
                return res.status(403).send(`
                <h1>Access Denied</h1>
                <p>You are not authorized to access this appointment</p>
                <a href="/doctor/appointments">Back to Appointments</a>
            `);
            }

            // console.log(' Rendering prescription form');

            res.render('doctor_management/prescription', {
                appointment: appointment,
                title: "Create Prescription"
            });
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).send(`
            <h1>Server Error</h1>
            <p>${error.message}</p>
            <a href="/doctor/appointments">Back to Appointments</a>
        `);
        }
    }
}

module.exports = new DoctorController();
