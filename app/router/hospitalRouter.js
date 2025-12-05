const express = require('express')
const route = express.Router();
const HospitalController = require("../controllers/HospitalConstroller")
const upload = require('../config/multerConfig');
const verifyToken=require('../middleware/verifyRoleToken')
// Fixed debug middleware
route.use((req, res, next) => {
    next();
});

// Safe upload handler
const handleUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            let errorMessage = 'Upload failed';
            if (err.message) {
                errorMessage += `: ${err.message}`;
            }
            return res.status(400).json({ success: false, message: errorMessage });
        }
        next();
    });
};

/**
 * @swagger
 * /admin/create/hospital:
 *   post:
 *     summary: Create new Hospital (Admin only)
 *     tags: [hospital]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: hospitalName
 *         type: string
 *         required: true
 *       - in: formData
 *         name: address
 *         type: string
 *         required: true
 *       - in: formData
 *         name: contactEmail
 *         type: string
 *         required: true
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *       - in: formData
 *         name: contactPhone
 *         type: string
 *         required: true
 *       - in: formData
 *         name: openingTime
 *         type: string
 *         required: true
 *       - in: formData
 *         name: closingTime
 *         type: string
 *         required: true
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *       400:
 *         description: Bad request. Missing or invalid parameters.
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       500:
 *         description: Internal server error.
 */
route.post('/create/hospital',verifyToken("admin"), handleUpload, HospitalController.createHospital)

/**
 * @swagger
 * /admin/update/hospital/{id}:
 *   post:
 *     summary: Update hospital (Admin only)
 *     tags: [hospital]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: hospitalName
 *         type: string
 *       - in: formData
 *         name: address
 *         type: string
 *       - in: formData
 *         name: contactEmail
 *         type: string
 *       - in: formData
 *         name: image
 *         type: file
 *       - in: formData
 *         name: contactPhone
 *         type: string
 *       - in: formData
 *         name: openingTime
 *         type: string
 *       - in: formData
 *         name: closingTime
 *         type: string
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *       400:
 *         description: Bad request. Missing or invalid parameters.
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       500:
 *         description: Internal server error.
 */
route.post('/update/hospital/:id',verifyToken("admin"), handleUpload, HospitalController.updateHospital)

/**
 * @swagger
 * /admin/delete/hospital/{id}:
 *   get:
 *     summary: Delete hospital (Admin only)
 *     tags: [hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital deleted successfully
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       500:
 *         description: Internal server error.
 */
route.get('/delete/hospital/:id',verifyToken("admin"), HospitalController.deleteHospital)

/**
 * @swagger
 * /admin/view/hospital:
 *   get:
 *     summary: View all hospitals
 *     tags: [hospital]
 *     responses:
 *       200:
 *         description: Hospitals retrieved successfully
 *       500:
 *         description: Internal server error.
 */
route.get('/view/hospital',HospitalController.viewHospital)

/**
 * @swagger
 * /admin/single/view/{id}:
 *   get:
 *     summary: View single hospital (Admin only)
 *     tags: [hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital retrieved successfully
 *       401:
 *         description: Unauthorized. Invalid or expired token.
 *       500:
 *         description: Internal server error.
 */
route.get('/single/view/:id',verifyToken("admin"),HospitalController.singleviewHospital)
module.exports = route

