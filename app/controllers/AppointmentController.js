
const Appointment = require('../model/appointmentModel');
const User = require('../model/userModel');
const transporter = require('../config/mailConfig');
const mongoose = require('mongoose')
const sendCancellationEmail=require('../helper/sendCancellationEmail')
// Patient books appointment (no slot, no email)
exports.bookAppointment = async (req, res) => {
  try {
    const { name, age, email, patient, doctor, reason } = req.body;

    console.log("Received booking request:", req.body);

    if (!name || !age || !email || !patient || !doctor) {
      return res.status(400).json({
        message: 'Missing required fields.',
        received: { name: !!name, age: !!age, email: !!email, patient: !!patient, doctor: !!doctor }
      });
    }

    // Ensure doctor and patient exist
    const [doctorDoc, patientDoc] = await Promise.all([
      User.findById(doctor),
      User.findById(patient)
    ]);

    console.log("Found doctor:", !!doctorDoc, "Found patient:", !!patientDoc);

    if (!doctorDoc) return res.status(404).json({ message: 'Doctor not found.' });
    if (!patientDoc) return res.status(404).json({ message: 'Patient not found.' });

    const appt = new Appointment({
      name,
      age,
      email,
      patient,
      doctor,
      reason,
      appointmentStatus: 'booked',
      slot: null
    });

    await appt.save();

    return res.status(201).json({
      message: 'Appointment booked successfully. Staff will assign a slot soon.',
      appointment: appt
    });
  } catch (err) {
    console.error('bookAppointment error', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message
    });
  }
};

exports.updateAppointment = async (req, res) => {
    try {
        const { appointmentStatus, paymentStatus, cancelReason } = req.body;

        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found' });

        if (appointmentStatus) {
            if (appointmentStatus === 'cancelled') {
                appt.cancelledBy = req.user.id;
                appt.cancelReason = cancelReason || 'Cancelled by staff';
            } else {
                appt.cancelledBy = null;
                appt.cancelReason = null;
            }
            appt.appointmentStatus = appointmentStatus;
        }

        if (paymentStatus) appt.paymentStatus = paymentStatus;

        await appt.save();
        res.json({ message: 'Appointment updated successfully', appointment: appt });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update appointment', error: err.message });
    }
};

// Staff assigns slot -> sends email to patient
exports.assignSlot = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { slot } = req.body;

    if (!slot) return res.status(400).json({ message: 'Slot is required.' });

    const appt = await Appointment.findById(appointmentId).populate('patient').populate('doctor', 'name email');

    if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

    appt.slot = slot;
    // keep status booked (or you might want 'confirmed' if you add)
    await appt.save();

    // Send email to patient
    const patientEmail = appt.patient.email;
    const patientName = appt.name || appt.patient.name || 'Patient';
    const doctorName = appt.doctor?.name || 'Doctor';

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: patientEmail,
      subject: 'Appointment Slot Assigned',
      html: `
      <p>Hi <strong>${patientName}</strong>,</p>
      <p>Your appointment with <strong>${doctorName}</strong> has been scheduled.</p>
      <ul>
        <li><strong>Slot:</strong> ${slot}</li>
        <li><strong>Doctor:</strong> ${doctorName}</li>
        <li><strong>Reason:</strong> ${appt.reason || 'N/A'}</li>
      </ul>
      <p>Please arrive 10 minutes early. Thank you.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Failed to send slot assignment email:', mailErr);
      // continue — we still respond success but warn
      return res.status(200).json({
        message: 'Slot assigned but failed to send email.',
        appointment: appt,
        emailError: mailErr.message
      });
    }

    return res.status(200).json({
      message: 'Slot assigned and email sent to patient.',
      appointment: appt
    });
  } catch (err) {
    console.error('assignSlot error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get appointments for logged-in patient
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user?.id;
   
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const appts = await Appointment.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ date: -1, createdAt: -1 }) 
      .lean();  

    // console.log("APPOINTMENTS FOUND FOR USER:", appts);

    return res.json({ appointments: appts });

  } catch (err) {
    console.error('getMyAppointments error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getDoctorAppointmentsPage = async (req, res) => {
  try {
    const doctorId = req.user._id || req.user.id; 

    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

    const appointments = await Appointment.aggregate([
      
      { $match: { doctor: doctorObjectId } },

      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },

     
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: '$doctorInfo' },

     
      {
        $project: {
          _id: 1,
          name: 1,
          age: 1,
          email: 1,
          slot: 1,
          reason: 1,
          appointmentStatus: 1,
          paymentStatus: 1,
          cancelledBy: 1,
          cancelReason: 1,
          createdAt: 1,
          updatedAt: 1,
          'patientInfo._id': 1,
          'patientInfo.name': 1,
          'patientInfo.email': 1,
          'patientInfo.phone': 1,
          'doctorInfo._id': 1,
          'doctorInfo.name': 1,
          'doctorInfo.email': 1
        }
      },

   
      { $sort: { createdAt: -1 } }
    ]);

    // console.log('Aggregated appointments:', appointments);

    res.render('doctor_Management/doctorAppointments', { title: 'My Appointments', appointments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// Cancel appointment (doctor)
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancelReason } = req.body;
    const cancelledBy = req.user && req.user._id ? req.user._id : null;

    const appt = await Appointment.findById(appointmentId).populate('patient doctor');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (appt.appointmentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Appointment already cancelled' });
    }

    // Update appointment
    appt.appointmentStatus = 'cancelled';
    appt.cancelReason = cancelReason || null;
    appt.cancelledBy = cancelledBy;
    await appt.save();

    // Send cancellation email
    if (appt.patient && appt.patient.email) {
      await sendCancellationEmail(appt.patient.email, {
        patientName: appt.patient.name,
        doctorName: appt.doctor.name,
        slot: appt.slot || 'Not assigned',
        reason: cancelReason || 'No reason provided',
        appointmentDate: appt.createdAt
      });
    }

    //  Only send JSON response
    return res.json({ message: 'Appointment cancelled', appointment: appt });

  } catch (err) {
    console.error('cancelAppointment error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// Cancel appointment (patient)
exports.cancelAppointmentByPatient = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancelReason } = req.body;

    const appt = await Appointment.findById(appointmentId).populate("patient doctor");
    if (!appt) return res.status(404).json({ message: "Appointment not found" });


    // Check if already cancelled
    if (appt.appointmentStatus === "cancelled") {
      return res.status(400).json({ message: "Appointment already cancelled" });
    }

    appt.appointmentStatus = "cancelled";
    appt.cancelReason = cancelReason || "No reason provided";
    appt.cancelledBy = req.user.id;

    await appt.save();

    return res.json({ message: "Appointment cancelled successfully", appointment: appt });

  } catch (err) {
    console.error("cancelAppointment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



