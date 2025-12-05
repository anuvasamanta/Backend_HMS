const nodemailer = require("nodemailer");

exports.sendShiftDeptUpdateMail = async (email, name, department, shift) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Shift & Department Updated",
        html: `
            <h3>Hello ${name},</h3>
            <p>Your shift and department have been updated by the hospital admin.</p>
            <p><strong>New Department:</strong> ${department}</p>
            <p><strong>New Shift:</strong> ${shift}</p>
            <br>
            <p>Thank you!</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

