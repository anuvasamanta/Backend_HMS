const express=require('express')
const route=express.Router()
const UserController=require("../controllers/UserControlller")

/**
 * @swagger
 * /user/view/hospital/staff-summary:
 *   get:
 *     summary: Get Hospital Staff Summary
 *     tags:
 *       - home
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
route.get('/view/hospital/staff-summary',UserController.getHospitalStaffSummary)

/**
 * @swagger
 * /user/view/hospital/details/{id}:
 *   get:
 *     summary: Get Hospital Staff Summary
 *     tags: [home]
 *     produces:
 *       - application/json
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
 *         description: Hospital details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
route.get('/view/hospital/details/:id',UserController.getHospitalDetails)

/**
 * @swagger
 * /user/view/doctor:
 *   get:
 *     summary: Get Hospital Staff Summary
 *     tags:
 *       - home
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
route.get('/view/doctor',UserController.getDoctors)

/**
 * @swagger
 * /user/doctor:
 *   get:
 *     summary: Get filtered Doctor
 *     tags:
 *       - home
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
route.get('/doctor',UserController.getFilteredDoctors)

/**
 * @swagger
 * /user/getDoctorSpecialties:
 *   get:
 *     summary: Get Doctor Specialties
 *     tags:
 *       - home
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
route.get('/getDoctorSpecialties',UserController.getDoctorSpecialties)

/**
 * @swagger
 * /user/getfeedback:
 *   get:
 *     summary: Get All Feedback
 *     tags:
 *       - home
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
route.get('/getfeedback',UserController.getAllFeedback)
module.exports=route