const cloudinary = require('cloudinary').v2;
const StatusCode = require("../helper/statusCode");
const { hospitalSettingsSchema } = require("../helper/Validation");
const HospitalSettings = require('../model/hospitalSetting.model')
const mongoose=require('mongoose')
class HospitalController {
    // create hospital
    async createHospital(req, res) {
        try {
            const { error } = hospitalSettingsSchema.validate(req.body);
            if (error) {
                req.flash("error", error.details[0].message);
                return res.redirect("/create-hospital");
            }

            if (!req.file) {
                req.flash("error", "Image is required");
                return res.redirect("/create-hospital");
            }

            const hospitalSettings = new HospitalSettings({
                ...req.body,
                image: req.file.path,
            });

            await hospitalSettings.save();

            req.flash("success", "Hospital settings created successfully!");
            return res.redirect("/admin/view/hospital");

        } catch (error) {
            console.error("Error creating hospital settings:", error);

            req.flash("error", "Internal server error, please try again.");
            return res.redirect("/create-hospital");
        }
    }

    // update hospital
    async updateHospital(req, res) {
        try {
            const { id } = req.params;

            const { error } = hospitalSettingsSchema.validate(req.body);
            if (error) {
                req.flash('error', error.details[0].message);
                return res.redirect(`/edit/hospital/${id}`);
            }

            const hospitalSettings = await HospitalSettings.findById(id);
            if (!hospitalSettings) {
                req.flash('error', 'Hospital settings not found');
                return res.redirect(`/edit/hospital/${id}`);
            }

            if (req.file) {
                const urlParts = hospitalSettings.image.split('/');
                const publicId = 'services/' + urlParts[urlParts.length - 1].split('.')[0];

                await cloudinary.uploader.destroy(publicId);

                hospitalSettings.image = req.file.path;
            }

            hospitalSettings.set(req.body);
            await hospitalSettings.save();

            req.flash('success', 'Hospital settings updated successfully');
            return res.redirect('/admin/view/hospital');

        } catch (error) {
            console.error('Error updating hospital settings:', error);

            req.flash('error', 'Error updating hospital settings: ' + error.message);
            return res.redirect(`/edit/hospital/${req.params.id}`);
        }
    }
    // delete hospital
 async deleteHospital(req, res) {
    try {
        const { id } = req.params;
        const hospitalSettings = await HospitalSettings.findById(id);
        if (!hospitalSettings) {
            req.flash('error', 'Hospital settings not found');
            return res.redirect('/admin/view/hospital'); 
        }

        // Get the public ID from the image URL
        const urlParts = hospitalSettings.image.split('/');
        const publicId = 'services/' + urlParts[urlParts.length - 1].split('.')[0];

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Delete the hospital settings from DB
        await HospitalSettings.findByIdAndDelete(id);

        req.flash('success', 'Hospital settings deleted successfully');
        res.redirect('/admin/view/hospital'); 

    } catch (error) {
        console.error('Error deleting hospital settings:', error);
        req.flash('error', 'Error deleting hospital settings: ' + error.message);
        res.redirect('/admin/view/hospital');
    }
}

    // get hospital
    async viewHospital(req, res) {
        try {
            const hospital = await HospitalSettings.find();
            return res.render('admin_Management/viewHospitalList', {
                title: 'Hospital_List',
                hospital: hospital
            })
        } catch (error) {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Error Occours!" })
        }
    }

   async singleviewHospital(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(StatusCode.BAD_REQUEST).json({
                success: false,
                message: 'Hospital ID is required',
            });
        }

        const hospital = await HospitalSettings.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'assignLocation',
                    as: 'staff',
                },
            },
            {
                $addFields: {
                    doctorCount: {
                        $size: {
                            $filter: {
                                input: '$staff',
                                as: 'staff',
                                cond: { $eq: ['$$staff.role', 'doctor'] }
                            }
                        }
                    },
                    nurseCount: {
                        $size: {
                            $filter: {
                                input: '$staff',
                                as: 'staff',
                                cond: { $eq: ['$$staff.role', 'nurse'] }
                            }
                        }
                    },
                    staffCount: {
                        $size: {
                            $filter: {
                                input: '$staff',
                                as: 'staff',
                                cond: { $eq: ['$$staff.role', 'staff'] }
                            }
                        }
                    }
                }
            }
        ]);

        if (!hospital || hospital.length === 0) {
            return res.status(StatusCode.NOT_FOUND).json({
                success: false,
                message: 'Hospital not found',
            });
        }

        // Return JSON for AJAX calls
        return res.json({
            success: true,
            hospital: hospital[0] // Return single hospital object
        });

    } catch (error) {
        console.error('Error fetching hospital:', error);
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error Occurred!',
        });
    }
}
}
module.exports = new HospitalController()