
const userModel = require("../model/userModel");
const sendConfirmationMail = require("../helper/ConfirmationMail");
const { sendShiftDeptUpdateMail } = require('../helper/emailService')
const HospitalSettings = require("../model/hospitalSetting.model")
const bcrypt = require('bcryptjs')
const Appointment = require('../model/appointmentModel')
const mongoose = require('mongoose')
class AdminController {
    // admin dashboard
   async dashboard(req, res) {
    try {
        // Count stats
        const totalDoctors = await userModel.countDocuments({ role: 'doctor' });
        const totalNurses = await userModel.countDocuments({ role: 'nurse' });
        const totalStaff = await userModel.countDocuments({ role: 'staff' });
        const totalAppointments = await Appointment.countDocuments();

        // Top doctors with appointment stats
        const topDoctors = await Appointment.aggregate([
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

        return res.render('admin_Management/dashboard', {
            title: "Admin Dashboard",
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
        return res.redirect("/admin/dashboard");
    }
}

    // create staff
    async createStaff(req, res) {
        try {
            const { name, email, phone, role, department, specialization, assignLocation } = req.body;

            // Validate role
            if (!['doctor', 'nurse', 'staff'].includes(role)) {
                req.flash("error", "Invalid role for staff creation");
                return res.redirect('/create-staff');
            }

            // Check if user exists
            const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                req.flash("error", "Email already registered");
                return res.redirect('/create-staff');
            }

            // Fetch hospital details
            const hospital = await HospitalSettings.findById(assignLocation);
            if (!hospital) {
                req.flash("error", "Invalid hospital location");
                return res.redirect('/create-staff');
            }

            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            // Create user
            const newStaff = await userModel.create({
                name,
                email,
                phone,
                role,
                department,
                specialization,
                password: hashedPassword,
                assignLocation,
                is_verified: true
            });

            // Send Mail
            await sendConfirmationMail(
                newStaff.email,
                newStaff.name,
                newStaff.role,
                tempPassword,
                hospital.hospitalName,
                hospital.address
            );

            // ✅ SUCCESS FLASH
            req.flash("success", "Staff created successfully. Login details sent to their email.");
            return res.redirect('/admin/list-staff');   // redirect to staff list page

        } catch (error) {
            // console.error("Error creating staff:", error);

            // ❌ ERROR FLASH
            req.flash("error", "Server error: " + error.message);
            return res.redirect('/admin/create-staff');
        }
    }

    // staff list
    async staffList(req, res) {
        try {
            const staffList = await userModel.aggregate([
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

            // console.log(staffList);

            return res.render("admin_Management/viewStaff", {
                title: "Staff List",
                staffList: staffList
            });
        } catch (error) {
            // console.log(error);
            return res.status(500).send("Error loading staff list");
        }
    }

    // update shifting and department
    async updateStaffShiftDepartment(req, res) {
        try {
            const { id } = req.params;
            const { department, shifting } = req.body;

            if (!department || !shifting) {
                req.flash("error", "Both Department & Shift are required");
                return res.redirect(`/admin/asign/shifting/${id}`);
            }

            const user = await userModel.findById(id);
            if (!user) {
                req.flash("error", "User not found");
                return res.redirect("/admin/list-staff");
            }

            // OLD VALUES (OPTIONAL FOR ADMIN)
            const oldDepartment = user.department;
            const oldShifting = user.shifting;

            // UPDATE
            user.department = department;
            user.shifting = shifting;

            await user.save();
            // SEND EMAIL NOTIFICATION
            await sendShiftDeptUpdateMail(
                user.email,
                user.name,
                department,
                shifting
            );

            req.flash(
                "success",
                `Updated Successfully!  
            Old Dept: ${oldDepartment || "N/A"} → New Dept: ${department}  
            Old Shift: ${oldShifting || "N/A"} → New Shift: ${shifting}`
            );

            return res.redirect("/admin/list-staff");

        } catch (error) {
            // console.log("UPDATE SHIFT/DEPT ERROR:", error);
            req.flash("error", "Internal Server Error");
            return res.redirect("/admin/list-staff");
        }
    }

    // edit staff 
    async editStaff(req, res) {
        try {
            const { id } = req.params;

            const staff = await userModel.findById(id);
            if (!staff) {
                req.flash("error", "Staff member not found");
                return res.redirect('/admin/list-staff');
            }

            // Get hospitals for dropdown
            const hospitals = await HospitalSettings.find({}, 'hospitalName address');

            return res.render("admin_Management/editStaff", {
                title: "Edit Staff",
                staff: staff,
                hospitals: hospitals,
                success: req.flash("success"),
                error: req.flash("error")
            });

        } catch (error) {
            console.error("Error fetching staff:", error);
            req.flash("error", "Error loading staff details");
            return res.redirect('/admin/list-staff');
        }
    }

    // update staff - POST
    async updateStaff(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, role, department, specialization, assignLocation, shifting } = req.body;

            // Check if staff exists
            const staff = await userModel.findById(id);
            if (!staff) {
                req.flash("error", "Staff member not found");
                return res.redirect('/admin/list-staff');
            }

            // Check if email already exists (excluding current staff)
            const existingUser = await userModel.findOne({
                email: email,
                _id: { $ne: id }
            });

            if (existingUser) {
                req.flash("error", "Email already registered to another staff member");
                return res.redirect(`/admin/edit-staff/${id}`);
            }

            // Update staff
            const updatedStaff = await userModel.findByIdAndUpdate(
                id,
                {
                    name,
                    email,
                    phone,
                    role,
                    department,
                    specialization,
                    assignLocation,
                    shifting,
                    updatedAt: Date.now()
                },
                { new: true, runValidators: true }
            );

            req.flash("success", "Staff updated successfully");
            return res.redirect('/admin/list-staff');

        } catch (error) {
            console.error("Error updating staff:", error);
            req.flash("error", "Error updating staff: " + error.message);
            return res.redirect(`/admin/edit-staff/${req.params.id}`);
        }
    }

    // delete staff
    async deleteStaff(req, res) {
        try {
            const { id } = req.params;

            const staff = await userModel.findById(id);
            if (!staff) {
                req.flash("error", "Staff member not found");
                return res.redirect('/admin/list-staff');
            }

            await userModel.findByIdAndDelete(id);

            req.flash("success", "Staff deleted successfully");
            return res.redirect('/admin/list-staff');

        } catch (error) {
            console.error("Error deleting staff:", error);
            req.flash("error", "Error deleting staff");
            return res.redirect('/admin/list-staff');
        }
    }


    // admin logout
    async adminlogout(req, res) {
        try {
            req.flash('success', 'You have been logged out successfully!');
            res.clearCookie('adminToken')
            res.redirect('/staff-login')
        } catch (error) {
            console.log(error);
        }
    }


    async getAllDoctorsWithAppointments(req, res) {
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

            return res.render('admin_Management/doctorsAppointments', {
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
            res.render("admin_Management/feedback", {
                feedbackSummary,
                title: "Doctor_Feedback"
            });

        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error");
        }
    }

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
                return res.render("admin_Management/feedback", {
                    doctor: null,
                    feedbackList: []
                });
            }

            res.render("admin_Management/doctorFeedbackModal", {
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
}
module.exports = new AdminController()