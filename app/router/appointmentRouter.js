// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const patientAuthcheck=require('../middleware/patientAuthCheck')
const doctorAuthCheck=require('../middleware/doctorAuthCheck')
const staffAuthCheck=require("../middleware/satffAuthCheck")
// Patient books (no slot, no email)
/**
 * @swagger
 * /api/appointments/book:
 *   post:
 *     summary: Create appointments
 *     tags:
 *       - appointment
 *     produces:
 *       - application/json
 *     parameters:
 *      - in: body
 *        name: Add appointments
 *        description: Add appointment in MongoDB.
 *        schema:
 *          type: object
 *          required:
 *            - name
 *            - email
 *            - age
 *            - patient
 *            - doctor
 *            - reason
 *          properties:
 *            name:
 *              type: string
 *            email:
 *              type: string
 *            age:
 *              type: number
 *            patient:
 *              type: string
 *            doctor:
 *              type: string
 *            reason:
 *              type: string
 *     responses:
 *        200:
 *          description: Appointment data added
 *        400:
 *          description: Bad Request
 *        500:
 *          description: Server Error
 */
router.post('/book', appointmentController.bookAppointment);

router.post('/:id',staffAuthCheck,appointmentController.updateAppointment)

// Patient view own appointments
/**
 * @swagger
 * /api/appointments/me:
 *  get:
 *    summary: Get all the appointment from Database
 *    tags:
 *       - appointment
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
router.get('/me',patientAuthcheck, appointmentController.getMyAppointments);

// Staff: assign slot (sends email)
/**
 * @swagger
 * /api/appointments/assign-slot/{appointmentId}:
 *   post:
 *     summary: Assign a slot to an appointment
 *     tags: [staff]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: slot
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             slot:
 *               type: string
 *               example: "2023-03-15 10:00 AM - 11:00 AM"
 *     responses:
 *       200:
 *         description: Slot assigned successfully
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/assign-slot/:appointmentId', appointmentController.assignSlot);

// show appointment to doctor protal
/**
 * @swagger
 * /api/appointments/doctor/get:
 *  get:
 *    summary: Get all the appointment from Database
 *    tags:
 *       - doctor
 *    produces:
 *      - application/json
 *    responses:
 *      '200':
 *        description: data fetched successfully.
 */
router.get('/doctor/get',doctorAuthCheck,appointmentController.getDoctorAppointmentsPage)

// Cancel
router.post('/cancel/:appointmentId',doctorAuthCheck, appointmentController.cancelAppointment);

router.patch(
  '/:appointmentId/cancel',
  patientAuthcheck,
  appointmentController.cancelAppointmentByPatient
);
module.exports = router;
