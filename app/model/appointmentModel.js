
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },            // patient name
  age: { type: Number, required: true },
  email: { type: String, required: true },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  appointmentStatus: {
    type: String,
    enum: ['booked', 'completed', 'cancelled'],
    default: 'booked'
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // optional: staff assigns later
  slot: { type: String, default: null },

  reason: { type: String },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  cancelReason: { type: String, default: null },

  // FEEDBACK SYSTEM
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: String, default: null },
  feedbackDate: { type: Date, default: null },

  prescription: {
    fileUrl: { type: String, default: null },
    uploadedAt: { type: Date, default: null },
    notes: { type: String, default: null }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AppointmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
