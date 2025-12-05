const mongoose = require('mongoose')
const HospitalSettingsSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  contactPhone: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  workingHours: {
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
  },
  appointmentRules: {
    maxAppointmentsPerDay: { type: Number, default: 50 },
    allowOnlineBooking: { type: Boolean, default: true },
  },
  emergencySettings: {
    ambulanceService: { type: Boolean, default: true },
    emergencyContact: { type: String },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("HospitalSettings", HospitalSettingsSchema);