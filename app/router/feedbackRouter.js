const express = require('express')
const FeedBackController = require("../controllers/FeedBackController")
const patientAuth=require("../middleware/patientAuthCheck")
const router = express.Router()



/**
 * @swagger
 * /feedback/{appointmentId}:
 *   post:
 *     summary: Create feedback for an appointment (patient only)
 *     tags: [appointment]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: feedback
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             rating: { type: number, example: 5 }
 *             feedback: { type: string, example: "The doctor was very helpful and knowledgeable." }
 *     responses:
 *       200: { description: Feedback submitted successfully }
 *       400: { description: Bad request. Feedback can only be added after appointment is completed. }
 *       404: { description: Appointment not found. }
 *       500: { description: Internal server error. }
 */
router.post('/:appointmentId', FeedBackController.createFeedback)

module.exports = router