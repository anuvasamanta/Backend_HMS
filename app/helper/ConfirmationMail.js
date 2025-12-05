const nodemailer = require("nodemailer");

const sendConfirmationMail = async (email, name, role, password, hospitalName, hospitalAddress) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Role-specific welcome messages
    const roleMessages = {
      'admin': 'As an Administrator, you have full access to manage the hospital system, users, and settings.',
      'doctor': 'As a Doctor, you can manage patient records, appointments, and medical treatments.',
      'nurse': 'As a Nurse, you can access patient records, update vital signs, and assist in patient care.',
      'staff': 'As Staff member, you can manage appointments, patient registrations, and daily operations.',
      'receptionist': 'As a Receptionist, you can manage patient appointments, registrations, and front desk operations.'
    };

    const roleWelcome = roleMessages[role.toLowerCase()] || `As a ${role}, you have been granted access to the Hospital Management System.`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to Hospital Management System - Your ${role} Account Details`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .welcome-section {
                    background: white;
                    padding: 25px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .credentials-section {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .hospital-info {
                    background: #e8f4fd;
                    border: 1px solid #b8daff;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .role-badge {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .important-note {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #721c24;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 14px;
                }
                .button {
                    display: inline-block;
                    background: #28a745;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                h2, h3 {
                    color: #2c3e50;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 Hospital Management System</h1>
                <p>Your Gateway to Efficient Healthcare Management</p>
            </div>
            
            <div class="content">
                <div class="welcome-section">
                    <h2>Welcome, ${name}!</h2>
                    <div class="role-badge">${role.toUpperCase()}</div>
                    <p>We're excited to welcome you to our Hospital Management System platform.</p>
                    <p><strong>${roleWelcome}</strong></p>
                </div>

                <div class="hospital-info">
                    <h3>🏥 Assigned Hospital Details</h3>
                    <p><strong>Hospital Name:</strong> ${hospitalName}</p>
                    <p><strong>Address:</strong> ${hospitalAddress}</p>
                </div>

                <div class="credentials-section">
                    <h3>🔑 Your Login Credentials</h3>
                    <p><strong>Email Address:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background: #f1f1f1; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${password}</code></p>
                    <p><em>This is your temporary password. Please change it after your first login.</em></p>
                </div>

                <div class="important-note">
                    <h3>⚠️ Important Security Notice</h3>
                    <p><strong>For security reasons, you must:</strong></p>
                    <ul>
                        <li>Log in to the system immediately</li>
                        <li>Change your temporary password</li>
                        <li>Set up security questions</li>
                        <li>Keep your login credentials confidential</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 25px 0;">
                    <p><strong>Ready to get started?</strong></p>
                    <a href="http://localhost:8400/staff-login" class="button">Access System Now</a>
                </div>

                <div class="footer">
                    <p><strong>Need Help?</strong></p>
                    <p>Contact our IT Support Team at: <a href="mailto:support@hospital.com">support@hospital.com</a></p>
                    <p>Phone: +1 (555) 123-HELP</p>
                    <br>
                    <p>© ${new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
                    <p style="font-size: 12px; color: #999;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending confirmation mail:", error);
    return false;
  }
};



module.exports = sendConfirmationMail;