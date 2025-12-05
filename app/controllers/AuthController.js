const UserModel = require("../model/userModel");
const { userValidation, loginValidation } = require('../helper/Validation');
const OtpModel = require('../model/otp')
const StatusCode = require("../helper/statusCode");
const hashedPassword = require('../helper/HashedPassword');
const ComparePassword = require("../helper/ComparePassword")
const sendEmailVerificationOTP = require("../helper/OTPEmailVerify")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const nodemailer = require("nodemailer");
const redis = require("../config/radis");
// Setup email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

class AuthController {
    // register
    async register(req, res) {
        try {
            // Joi Validation
            const { error } = userValidation.validate(req.body);
            if (error) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.details[0].message });
            }
            const { name, email, location, password } = req.body;

            // Check if user already exists
            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return res.status(StatusCode.SERVICE_UNAVAILABLE).json({ success: false, message: "Email already registered" });
            }

            // Hash password correctly
            const encryptedPassword = await hashedPassword(password);

            // Create new user
            const user = await UserModel.create({
                name,
                email,
                location,
                password: encryptedPassword
            });

            sendEmailVerificationOTP(req, user)
            return res.status(StatusCode.CREATED).json({
                success: true,
                message: "User registered successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    location: user.location,
                    role: user.role
                }
            });
        } catch (err) {
            console.error(err);
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" });
        }
    }
    //mail verify 
    async verify(req, res) {
        try {
            const { email, otp } = req.body;

            // Check if all required fields are provided
            if (!email || !otp) {
                return res.status(StatusCode.BAD_REQUEST).json({ status: false, message: "All fields are required" });
            }

            const existingUser = await UserModel.findOne({ email });

            // Check if user exists
            if (!existingUser) {
                return res.status(StatusCode.BAD_REQUEST).json({ status: "failed", message: "Email doesn't exists" });
            }

            // Check if email is already verified
            if (existingUser.is_verified) {
                return res.status(StatusCode.BAD_REQUEST).json({ status: false, message: "Email is already verified" });
            }

            // CORRECTED LINE: Use _id instead of _email
            const emailVerification = await OtpModel.findOne({
                userId: existingUser._id,
                otp: otp
            });

            // Check if OTP exists
            if (!emailVerification) {
                if (!existingUser.is_verified) {
                    console.log("Invalid OTP, sending new OTP to:", existingUser.email);
                    await sendEmailVerificationOTP(req, existingUser);
                    return res.status(StatusCode.BAD_REQUEST).json({
                        status: false,
                        message: "Invalid OTP, new OTP sent to your email"
                    });
                }
                return res.status(StatusCode.BAD_REQUEST).json({
                    status: false,
                    message: "Invalid OTP"
                });
            }

            // Check if OTP is expired
            const currentTime = new Date();
            const expirationTime = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);

            if (currentTime > expirationTime) {
                // OTP expired, send new OTP
                await sendEmailVerificationOTP(req, existingUser);
                // Delete expired OTP
                await OtpModel.deleteOne({ _id: emailVerification._id });
                return res.status(StatusCode.BAD_REQUEST).json({
                    status: "failed",
                    message: "OTP expired, new OTP sent to your email"
                });
            }

            // OTP is valid and not expired, mark email as verified
            existingUser.is_verified = true;
            await existingUser.save();

            // Delete the used OTP document
            await OtpModel.deleteOne({ _id: emailVerification._id });

            return res.status(StatusCode.OK).json({
                status: true,
                message: "Email verified successfully"
            });
        } catch (error) {
            console.error("OTP Verification Error:", error);
            res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: "Unable to verify email, please try again later"
            });
        }
    }
    //patient login
    async patientLogin(req, res) {
        try {
            const { error } = loginValidation.validate(req.body, { abortEarly: false });
            if (error) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.details[0].message });
            }

            const { email, password } = req.body;
            const user = await UserModel.findOne({ email });

            if (!user || !(await ComparePassword(password, user.password))) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: 'Invalid email or password' });
            }

            if (!user.is_verified) {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: 'Email is not verified' });
            }

            let jwtSecret;
            let cookieName;

            if (user.role === 'patient') {
                jwtSecret = process.env.JWT_SECRET || "hellowelcometowebskittersacademy123456";
                cookieName = 'patientToken';
            } else {
                return res.status(StatusCode.BAD_REQUEST).json({ success: false, message: 'Forbidden' });
            }

            if (!jwtSecret) {
                return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
            }

            const token = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    location: user.location,
                },
                jwtSecret,
                { expiresIn: '60m' }
            );

            // User data to be sent in response
            const userData = {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                location: user.location,
                is_verified: user.is_verified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            res.cookie(cookieName, token, { httpOnly: true, secure: true });
            return res.status(StatusCode.CREATED).json({
                success: true,
                message: 'Login successful',
                token,
                user: userData
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
        }
    }
    // staff login
    async staffLogin(req, res) {
        try {
            const { error } = loginValidation.validate(req.body, { abortEarly: false });
            if (error) {
                req.flash("error", error.details[0].message);
                return res.redirect("/staff-login");
            }

            const { email, password } = req.body;
            const user = await UserModel.findOne({ email });

            if (!user || !(await ComparePassword(password, user.password))) {
                req.flash("error", "Invalid email or password");
                return res.redirect("/staff-login");
            }

            if (!user.is_verified) {
                req.flash("error", "Email is not verified");
                return res.redirect("/staff-login");
            }

            // Role-based settings
            const role = user.role;
            let jwtSecret;
            let cookieName;
            let redirect;

            if (role === "doctor") {
                jwtSecret = process.env.JWT_SECRECT_DOCTOR || "hellowelcomedoctor123";
                cookieName = "doctorToken";
                redirect = "/doctor/dashboard";
            } else if (role === "nurse") {
                jwtSecret = process.env.JWT_SECRECT_NURSE || "hellowelcomnurse";
                cookieName = "nurseToken";
                redirect = "/nurse/dashboard";
            } else if (role === "staff") {
                jwtSecret = process.env.JWT_SECRECT_STAFF || "hellowelcomestaff";
                cookieName = "staffToken";
                redirect = "/staff/dashboard";
            } else if (role === "admin") {
                jwtSecret = process.env.JWT_SECRECT_ADMIN || "hellowelcomadmin";
                cookieName = "adminToken";
                redirect = "/admin/dashboard";
            } else {
                req.flash("error", "Invalid user role");
                return res.redirect("/staff-login");
            }

            // ============================
            //  Create JWT 
            // ============================
            const token = jwt.sign(
                {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    location: user.location,
                },
                jwtSecret,
                { expiresIn: "60m" }
            );

            // ============================
            //  Store session in Redis
            //  Key format: session:<role>:<id>
            // ============================
            const sessionKey = `session:${role}:${user._id}`;

            const sessionData = {
                id: String(user._id),
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                location: user.location
            };

            await redis.set(sessionKey, JSON.stringify(sessionData), {
                EX: 60 * 60, // 1 hour
            });

            // ============================
            //  Set cookie for this role only
            // ============================
            res.cookie(cookieName, token, {
                httpOnly: true,
                sameSite: "lax",
                // secure: true,    // enable in HTTPS
                maxAge: 1000 * 60 * 60, // 1 hour
            });

            req.flash("success", `Welcome back ${user.name}!`);
            return res.redirect(redirect);

        } catch (error) {
            console.error("Login error:", error);
            req.flash("error", "Internal server error");
            return res.redirect("/staff-login");
        }
    }


    // GET PROFILE
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const user = await UserModel.findById(userId).select("-password");

            if (!user) {
                return res.status(404).render("error", {
                    message: "User not found"
                });
            }

            console.log("Logged-in User:", user);

            // Render EJS page instead of sending JSON
            return res.render("profile", {
                title: "My Profile",
                user
            });

        } catch (error) {
            console.error("Get Profile Error:", error);
            return res.status(500).render("error", {
                message: "Internal Server Error"
            });
        }
    }
    //render forgotPasswordPage
    async forgotPasswordPage(req, res) {
        res.render("auth/forgotPassword", { title: "Forgot Password" });
    }

    //  Render Reset Password Page
    async resetPasswordPage(req, res) {
        const { id, token } = req.params;
        res.render("auth/resetPassword", { title: "Reset Password", id, token });
    }

    // Send Password Reset Email
    async resetPasswordLink(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                req.flash("error", "Email is required");
                return res.redirect("/auth/forgot-password");
            }

            const user = await UserModel.findOne({ email });
            if (!user) {
                req.flash("error", "Email does not exist");
                return res.redirect("/auth/forgot-password");
            }

            const secret = user._id + process.env.JWT_SECRET_KEY;
            const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "20m" });

            const resetLink = `${process.env.BACKEND_HOST}/auth/reset-password/${user._id}/${token}`;

            // Send email
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Request - Apollo Hospitals",
                html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .header { 
                    background: linear(135deg, #ffc107, #ff8c00); 
                    padding: 20px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }
                .header h1 { 
                    color: white; 
                    margin: 0; 
                    font-size: 24px;
                }
                .content { 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #ddd;
                    border-top: none;
                }
                .button { 
                    display: inline-block; 
                    background: #ffc107; 
                    color: #000 !important; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    margin: 20px 0;
                    text-align: center;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 20px; 
                    color: #666; 
                    font-size: 12px;
                }
                .warning { 
                    background: #fff3cd; 
                    border: 1px solid #ffeaa7; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🩺 Apollo Hospitals</h1>
            </div>
            <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>We received a request to reset your password for your Apollo Hospitals account.</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">
                        Reset Your Password
                    </a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                    If you didn't request this reset, please ignore this email.
                </div>
                
                <p>For security reasons, we recommend:</p>
                <ul>
                    <li>Choose a strong, unique password</li>
                    <li>Don't share your password with anyone</li>
                    <li>Update your password regularly</li>
                </ul>
                
                <p>If you need assistance, contact our support team.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Apollo Hospitals. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
    `
            });

            req.flash("success", "Password reset link sent to your email");
            return res.redirect("/auth/forgot-password");

        } catch (error) {
            console.log(error);
            req.flash("error", "Something went wrong. Try again later.");
            return res.redirect("/auth/forgot-password");
        }
    }

    // Reset Password Logic
    async resetPassword(req, res) {
        try {
            const { password, confirm_password } = req.body;
            const { id, token } = req.params;

            const user = await UserModel.findById(id);
            if (!user) {
                req.flash("error", "Invalid user");
                return res.redirect(`/auth/reset-password/${id}/${token}`);
            }

            const secret = user._id + process.env.JWT_SECRET_KEY;
            jwt.verify(token, secret);

            if (!password || !confirm_password) {
                req.flash("error", "Password fields are required");
                return res.redirect(`/auth/reset-password/${id}/${token}`);
            }

            if (password !== confirm_password) {
                req.flash("error", "Passwords do not match");
                return res.redirect(`/auth/reset-password/${id}/${token}`);
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await UserModel.findByIdAndUpdate(user._id, { password: hashedPassword });

            req.flash("success", "Password reset successfully! You can login now");
            res.redirect("/staff-login");

        } catch (error) {
            console.log(error);
            req.flash("error", "Invalid or expired link");
            return res.redirect("/auth/forgot-password");
        }
    }




}

module.exports = new AuthController();