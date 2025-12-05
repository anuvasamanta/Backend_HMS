const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, 
        },

        qualification: { type: String, required: true },
        experience: { type: Number, required: true },
        timing: { type: String, required: true },
        profile: { type: String, default: "" },
        language: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
