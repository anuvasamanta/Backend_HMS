const Appointment = require('../model/appointmentModel')

class FeedBackController {

    // create feedback
    async createFeedback(req, res) {
        try {
            const { appointmentId } = req.params;
            const { rating, feedback } = req.body;

            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                return res.status(404).json({ message: "Appointment not found." });
            }

            if (appointment.appointmentStatus !== "completed") {
                return res.status(400).json({
                    message: "Feedback can only be added after appointment is completed."
                });
            }

            // Save feedback
            appointment.rating = rating;
            appointment.feedback = feedback;
            appointment.feedbackDate = new Date();

            await appointment.save();

            res.status(200).json({
                message: "Thank you! Your feedback has been submitted.",
                data: appointment,
            });

        } catch (error) {
            console.error("Feedback error:", error);
            res.status(500).json({ message: "Internal Server Error", error });
        }
    }

}
module.exports = new FeedBackController()