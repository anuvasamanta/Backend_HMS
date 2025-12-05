const HospitalSettings = require("../model/hospitalSetting.model")
const StatusCode = require("../helper/statusCode")
const User = require("../model/userModel");
const Doctor = require("../model/doctorModel");
const Appointment=require('../model/appointmentModel')
const mongoose = require('mongoose')
class UserController {
    // get hospital by staff
    async getHospitalStaffSummary(req, res) {
        try {
            const result = await HospitalSettings.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "assignLocation",
                        as: "assignedUsers",
                    },
                },

                // Add role-wise lists
                {
                    $addFields: {
                        doctors: {
                            $filter: {
                                input: "$assignedUsers",
                                as: "user",
                                cond: { $eq: ["$$user.role", "doctor"] },
                            },
                        },

                        nurses: {
                            $filter: {
                                input: "$assignedUsers",
                                as: "user",
                                cond: { $eq: ["$$user.role", "nurse"] },
                            },
                        },

                        staff: {
                            $filter: {
                                input: "$assignedUsers",
                                as: "user",
                                cond: { $eq: ["$$user.role", "staff"] },
                            },
                        },
                    },
                },

                // Projection with counts
                {
                    $project: {
                        _id: 1,
                        hospitalName: 1,
                        address: 1,
                        contactPhone: 1,
                        contactEmail: 1,
                        image: 1,

                        doctorCount: { $size: "$doctors" },
                        nurseCount: { $size: "$nurses" },
                        staffCount: { $size: "$staff" },

                        doctors: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            specialization: 1,
                            department: 1,
                            shifting: 1
                        },

                        nurses: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            department: 1,
                            shifting: 1
                        },

                        staff: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            department: 1,
                            shifting: 1
                        }
                    },
                },
            ]);

            res.json({
                success: true,
                data: result,
            });

        } catch (err) {
            console.error("Error fetching hospital staff data:", err);
            res.status(500).json({
                success: false,
                message: "Server Error",
            });
        }
    }
    // get hospital detials
    async getHospitalDetails(req, res) {
        try {
            const { id } = req.params;

            const hospital = await HospitalSettings.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(id) }
                },

                // 1. Find all users assigned to this hospital
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "assignLocation",
                        as: "assignedUsers"
                    }
                },

                // 2. Filter doctors only
                {
                    $addFields: {
                        doctorUsers: {
                            $filter: {
                                input: "$assignedUsers",
                                as: "u",
                                cond: { $eq: ["$$u.role", "doctor"] }
                            }
                        }
                    }
                },

                // 3. Join Doctor schema details
                {
                    $lookup: {
                        from: "doctors",
                        localField: "doctorUsers._id",
                        foreignField: "userId",
                        as: "doctorDetails"
                    }
                },

                // 4. Merge user + doctor detail
                {
                    $addFields: {
                        doctors: {
                            $map: {
                                input: "$doctorUsers",
                                as: "u",
                                in: {
                                    $mergeObjects: [
                                        "$$u",
                                        {
                                            $let: {
                                                vars: {
                                                    doc: {
                                                        $arrayElemAt: [
                                                            {
                                                                $filter: {
                                                                    input: "$doctorDetails",
                                                                    as: "d",
                                                                    cond: { $eq: ["$$d.userId", "$$u._id"] }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                in: {
                                                    doctorId: "$$doc._id",
                                                    profile: "$$doc.profile",
                                                    qualification: "$$doc.qualification",
                                                    experience: "$$doc.experience",
                                                    timing: "$$doc.timing",
                                                    language: "$$doc.language",
                                                    specialization: "$$doc.specialization",
                                                    department: "$$doc.department",
                                                    shifting: "$$doc.shifting"
                                                }
                                            }
                                        }
                                    ]
                                }

                            }
                        }
                    }
                },

                // 5. Clean output
                {
                    $project: {
                        hospitalName: 1,
                        address: 1,
                        image: 1,
                        doctors: 1
                    }
                }
            ]);

            if (!hospital.length) {
                return res.status(404).json({ success: false, message: "Hospital not found" });
            }

            res.json({ success: true, data: hospital[0] });

        } catch (error) {
            console.error("ERROR:", error);
            res.status(500).json({ success: false, message: "Server Error", error });
        }
    }
    // get doctor
    async getDoctors(req, res) {
        try {
            const doctors = await User.aggregate([
                { $match: { role: "doctor" } }, // Only doctors
                {
                    $lookup: {
                        from: "hospitalsettings", // collection name (lowercase + plural)
                        localField: "assignLocation", // field inside User
                        foreignField: "_id", // field inside HospitalSettings
                        as: "hospitalDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$hospitalDetails",
                        preserveNullAndEmptyArrays: true // in case doctor has no assigned location
                    }
                },
                {
                    $lookup: {
                        from: "doctors", // collection name (lowercase + plural)
                        localField: "_id", // field inside User
                        foreignField: "userId", // field inside Doctor
                        as: "doctorDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$doctorDetails",
                        preserveNullAndEmptyArrays: true // in case doctor has no details
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        location: 1,
                        department: 1,
                        specialization: 1,
                        role: 1,
                        qualification: "$doctorDetails.qualification",
                        experience: "$doctorDetails.experience",
                        timing: "$doctorDetails.timing",
                        profile: "$doctorDetails.profile",
                        language: "$doctorDetails.language",
                        hospital: {
                            hospitalName: "$hospitalDetails.hospitalName",
                            address: "$hospitalDetails.address",
                            contactEmail: "$hospitalDetails.contactEmail",
                            contactPhone: "$hospitalDetails.contactPhone",
                            workingHours: "$hospitalHours",
                            image: "$hospitalDetails.image",
                        }
                    }
                }
            ]);

            return res.status(200).json({ message: "Doctor data retrieved successfully", doctors });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error!" });
        }
    }


    // get getFilteredDoctors
    async getFilteredDoctors(req, res) {
        try {
            const {
                search,
                department,
                specialization,
                location,
                minExp,
                maxExp,
            } = req.query;

            const matchStage = { role: "doctor" };

            if (search) matchStage.name = { $regex: search, $options: "i" };
            if (department) matchStage.department = { $regex: department, $options: "i" };
            if (specialization) matchStage.specialization = { $regex: specialization, $options: "i" };
            if (location) matchStage.location = { $regex: location, $options: "i" };

            if (minExp || maxExp) {
                matchStage["doctorDetails.experience"] = {};
                if (minExp) matchStage["doctorDetails.experience"].$gte = Number(minExp);
                if (maxExp) matchStage["doctorDetails.experience"].$lte = Number(maxExp);
            }

            const doctors = await User.aggregate([
                { $match: matchStage },

                // Join hospital info
                {
                    $lookup: {
                        from: "hospitalsettings",
                        localField: "assignLocation",
                        foreignField: "_id",
                        as: "hospitalDetails"
                    }
                },
                { $unwind: { path: "$hospitalDetails", preserveNullAndEmptyArrays: true } },

                // Join doctorDetails
                {
                    $lookup: {
                        from: "doctors",
                        localField: "_id",
                        foreignField: "userId",
                        as: "doctorDetails"
                    }
                },
                { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        location: 1,
                        department: 1,
                        specialization: 1,
                        qualification: "$doctorDetails.qualification",
                        experience: "$doctorDetails.experience",
                        timing: "$doctorDetails.timing",
                        profile: "$doctorDetails.profile",
                        language: "$doctorDetails.language",
                        hospital: {
                            hospitalName: "$hospitalDetails.hospitalName",
                            address: "$hospitalDetails.address",
                            image: "$hospitalDetails.image",
                            contactEmail: "$hospitalDetails.contactEmail",
                            contactPhone: "$hospitalDetails.contactPhone",
                        }
                    }
                },
            ]);

            return res.status(200).json({
                message: "Filtered doctors retrieved successfully",
                count: doctors.length,
                doctors
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({
                message: "Internal server error!",
                error: err.message
            });
        }
    }


    // getDoctorSpecialties
    async getDoctorSpecialties(req, res) {
        try {
            const specialties = await User.distinct("specialization", { role: "doctor" });

            return res.status(200).json({
                success: true,
                specialties
            });
        } catch (err) {
            res.status(500).json({ message: "Server error", error: err.message });
        }
    }

    
    // Get all feedback with patient info using lookup
    async getAllFeedback(req, res) {
        try {
            const feedbackList = await Appointment.aggregate([
                {
                    $match: {
                        appointmentStatus: "completed",
                        rating: { $ne: null }
                    }
                },
                {
                    $lookup: {
                        from: "users",          // collection name in MongoDB
                        localField: "patient",  // field in Appointment
                        foreignField: "_id",    // field in User
                        as: "patientData"
                    }
                },
                { $unwind: "$patientData" },  // flatten array
                {
                    $project: {
                        _id: 1,
                        rating: 1,
                        feedback: 1,
                        feedbackDate: 1,
                        "patientName": "$patientData.name",
                        "patientEmail": "$patientData.email"
                    }
                },
                { $sort: { feedbackDate: -1 } }
            ]);

            res.json(feedbackList);

        } catch (error) {
            console.error("Error fetching feedback:", error);
            res.status(500).json({ message: "Server Error" });
        }
    }

}

module.exports = new UserController()