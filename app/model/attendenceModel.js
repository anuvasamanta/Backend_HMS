const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        default: () => new Date().setHours(0, 0, 0, 0), // Normalized date
        required: true,
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
    },
    hoursWorked: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Attendance", attendanceSchema);
