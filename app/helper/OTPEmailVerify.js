const transporter = require("../config/mailConfig");
const otpVerifyModel = require('../model/otp');

const sendEmailVerificationOTP = async (req, user) => {
    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP in Database
    await otpVerifyModel.create({
        userId: user._id,
        otp: otp
    });

    // Email HTML Template (Styled)
    const emailHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 0 8px rgba(0,0,0,0.1);">
            
            <h2 style="text-align: center; color: #4A90E2;">Email Verification</h2>
            <p style="font-size: 15px; color: #333;">Hello <strong>${user.name}</strong>,</p>

            <p style="font-size: 15px; color: #555;">
                Thank you for signing up. Please use the OTP below to verify your email address.
            </p>

            <div style="text-align: center; margin: 25px 0;">
                <span style="
                    display: inline-block;
                    background: #4A90E2;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-size: 28px;
                    letter-spacing: 5px;
                    font-weight: bold;
                ">
                    ${otp}
                </span>
            </div>

            <p style="font-size: 14px; color: #777;">This OTP is valid for <strong>15 minutes</strong>.</p>
            <p style="font-size: 14px; color: #999;">If you did not request this OTP, you can safely ignore this email.</p>

        </div>
    </div>
    `;

    // Sending Mail
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Your Email Verification OTP",
        html: emailHTML
    });

    return otp;
};

module.exports = sendEmailVerificationOTP;
