const nodemailer = require('nodemailer');

// Configure transporter (use your SMTP credentials)
 const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

/**
 * Send cancellation email to patient
 * @param {string} to - patient email
 * @param {object} data - { patientName, doctorName, slot, reason, appointmentDate }
 */
const sendCancellationEmail = async (to, data) => {
  try {
    const mailOptions = {
      from: `"Hospital Management" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Appointment Cancelled',
      html: `
        <p>Dear <strong>${data.patientName}</strong>,</p>
        <p>Your appointment with Dr. <strong>${data.doctorName}</strong> has been cancelled.</p>
        <ul>
          <li>Scheduled Slot: ${data.slot}</li>
          <li>Cancellation Reason: ${data.reason}</li>
          <li>Appointment Booked At: ${new Date(data.appointmentDate).toLocaleString()}</li>
        </ul>
        <p>Please contact the hospital if you have any questions.</p>
        <p>Regards,<br/>Hospital Management System</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${to}`);
  } catch (err) {
    console.error('Error sending cancellation email:', err);
  }
};

module.exports = sendCancellationEmail;
