const express = require('express')
const route = express.Router();
const AdminController = require("../controllers/AdminController")
const verifyToken = require('../middleware/verifyRoleToken')
const upload = require('../config/multerConfig');
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
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admindashboard retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/dashboard', verifyToken("admin"), AdminController.dashboard)


// Admin routes for staff create
/**
 * @swagger
 * /admin/create-staff:
 *   post:
 *     summary: Admin create staff.(Doctor, Nurse, Staff etc.)
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: Add Staff
 *         description: Add Staff in MongoDB.
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - phone
 *             - password
 *             - location
 *             - department
 *             - specialization
 *             - assignLocation
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             password:
 *               type: string
 *             location:
 *               type: string
 *             department:
 *               type: string
 *             specialization:
 *               type: string
 *             assignLocation:
 *               type: string
 *     responses:
 *       200:
 *         description: Staff Created successfully!
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
route.post('/create-staff', verifyToken("admin"), AdminController.createStaff)

/**
 * @swagger
 * /admin/list-staff:
 *   get:
 *     summary: Get list of staff.
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin  retrieved list of staff successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/list-staff', verifyToken("admin"), AdminController.staffList)



/**
 * @swagger
 * /admin/assign/shifting/{id}:
 *   post:
 *     summary: Assign shifting to the Nurse and Staff.
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the staff to update
 *       - in: body
 *         name: staff
 *         description: staff data to update
 *         schema:
 *           type: object
 *           properties:
 *             department:
 *               type: string
 *             shifting:
 *               type: string
 *     responses:
 *       200:
 *         description: Staff data updated
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server Error
 */
route.post("/assign/shifting/:id", verifyToken('admin'), AdminController.updateStaffShiftDepartment);

/**
 * @swagger
 * /admin/update-staff/{id}:
 *   post:
 *     summary: Update staff data..
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the staff to update
 *       - in: body
 *         name: staff
 *         description: staff data to update
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             role:
 *               type: string
 *             department:
 *               type: string
 *             specialization:
 *               type: string
 *             assignLocation:
 *               type: string
 *             shifting:
 *               type: string
 *     responses:
 *       200:
 *         description: Staff data updated
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server Error
 */
route.post('/update-staff/:id', verifyToken('admin'), AdminController.updateStaff);


/**
 * @swagger
 * /admin/delete-staff/{id}:
 *   get:
 *     summary: Delete a staff by ID
 *     tags:
 *       - admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the staff to delete
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server Error
 */
route.get('/delete-staff/:id', verifyToken('admin'), AdminController.deleteStaff);


// Admin routes for doctors and appointments

/**
 * @swagger
 * /admin/doctors-appointments:
 *   get:
 *     summary: Get admin all doctors-appointments.
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin retrieved doctors-appointments successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/doctors-appointments', verifyToken('admin'), AdminController.getAllDoctorsWithAppointments);

/**
 * @swagger
 * /admin/doctor-feedback:
 *   get:
 *     summary: Get admin all doctor-feedback.
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin retrieved doctor-feedback successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/doctor-feedback', verifyToken('admin'), AdminController.doctorFeedbackList)

/**
 * @swagger
 * /admin/doctor-feedback/{doctorId}:
 *   get:
 *     summary: View individual doctor feedback.
 *     tags:
 *       - admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the doctor to view feedback
 *     responses:
 *       200:
 *         description:Feedback retrived successfully
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server Error
 */
route.get('/doctor-feedback/:doctorId', verifyToken('admin'), AdminController.viewDoctorFeedback)

/**
 * @swagger
 * /admin/logout:
 *   get:
 *     summary: Logout admin
 *     tags:
 *       - admin
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/logout', verifyToken("admin"), AdminController.adminlogout)

// Ejs
route.get('/edit-staff/:id', verifyToken('admin'), AdminController.editStaff);
module.exports = route

