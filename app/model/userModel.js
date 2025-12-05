const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, require: true },
    phone: { type: String, require: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient', 'staff'], required: true, default: 'patient' },
    is_verified: {
        type: Boolean,
        default: false
    },
    // For doctors/nurses/staff
    department: { type: String },
    specialization: { type: String },
    assignLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalSettings' },
    shifting: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema)