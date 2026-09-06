const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");

// ========================================
// Email Transporter
// ========================================

const transporter = nodemailer.createTransport({
   host: "smtp.gmail.com",
   port: 587,
   secure: false,

   // Force IPv4 connection
   family: 4,

   auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
   },

   connectionTimeout: 30000,
   greetingTimeout: 30000,
   socketTimeout: 30000
});


// ========================================
// Generate JWT
// ========================================

const generateToken = (userId) => {
   return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      {
         expiresIn: "7d"
      }
   );
};


// ========================================
// Register User
// ========================================

const register = async (req, res) => {
   try {

      const { name, email, password } = req.body;

      if (!name || !email || !password) {
         return res.status(400).json({
            message: "Name, email and password are required"
         });
      }

      if (name.trim().length < 2) {
         return res.status(400).json({
            message: "Name must contain at least 2 characters"
         });
      }

      if (password.length < 6) {
         return res.status(400).json({
            message: "Password must be at least 6 characters"
         });
      }

      const normalizedEmail = email
         .toLowerCase()
         .trim();

      const existingUser = await User.findOne({
         email: normalizedEmail
      });

      if (existingUser) {
         return res.status(409).json({
            message: "An account with this email already exists"
         });
      }

      const hashedPassword = await bcrypt.hash(
         password,
         12
      );

      const user = await User.create({
         name: name.trim(),
         email: normalizedEmail,
         password: hashedPassword
      });

      const token = generateToken(
         user._id.toString()
      );

      res.status(201).json({
         message: "Account created successfully",

         token,

         user: {
            id: user._id,
            name: user.name,
            email: user.email
         }
      });

   } catch (error) {

      console.error(
         "Registration error:",
         error.message
      );

      res.status(500).json({
         message: "Server error during registration"
      });
   }
};


// ========================================
// Login User
// ========================================

const login = async (req, res) => {
   try {

      const { email, password } = req.body;

      if (!email || !password) {
         return res.status(400).json({
            message: "Email and password are required"
         });
      }

      const normalizedEmail = email
         .toLowerCase()
         .trim();

      const user = await User.findOne({
         email: normalizedEmail
      });

      if (!user) {
         return res.status(401).json({
            message: "Invalid email or password"
         });
      }

      const passwordMatch = await bcrypt.compare(
         password,
         user.password
      );

      if (!passwordMatch) {
         return res.status(401).json({
            message: "Invalid email or password"
         });
      }

      const token = generateToken(
         user._id.toString()
      );

      res.status(200).json({
         message: "Login successful",

         token,

         user: {
            id: user._id,
            name: user.name,
            email: user.email
         }
      });

   } catch (error) {

      console.error(
         "Login error:",
         error.message
      );

      res.status(500).json({
         message: "Server error during login"
      });
   }
};


// ========================================
// Get Current User
// ========================================

const getMe = async (req, res) => {
   try {

      const user = await User
         .findById(req.userId)
         .select("-password");

      if (!user) {
         return res.status(404).json({
            message: "User not found"
         });
      }

      res.status(200).json({
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
         }
      });

   } catch (error) {

      console.error(
         "Get user error:",
         error.message
      );

      res.status(500).json({
         message: "Unable to fetch user"
      });
   }
};


// ========================================
// Forgot Password
// ========================================

const forgotPassword = async (req, res) => {
   try {

      const { email } = req.body;

      if (!email) {
         return res.status(400).json({
            message: "Email is required"
         });
      }

      const normalizedEmail = email
         .toLowerCase()
         .trim();

      const user = await User.findOne({
         email: normalizedEmail
      });

      // Do not reveal whether an email exists
      if (!user) {
         return res.status(200).json({
            message:
               "If an account exists for that email, a password reset link has been sent."
         });
      }


      // ========================================
      // Generate Reset Token
      // ========================================

      const resetToken = crypto
         .randomBytes(32)
         .toString("hex");


      // Hash token before storing in database
      const hashedToken = crypto
         .createHash("sha256")
         .update(resetToken)
         .digest("hex");


      user.resetPasswordToken = hashedToken;

      // Token expires in 15 minutes
      user.resetPasswordExpires = new Date(
         Date.now() + 15 * 60 * 1000
      );

      await user.save();


      // ========================================
      // Frontend URL
      // ========================================

      const frontendUrl =
         process.env.FRONTEND_URL ||
         "http://localhost:5173";


      // ========================================
      // Password Reset URL
      // ========================================

      const resetUrl =
         `${frontendUrl}/reset-password?token=${resetToken}`;


      // ========================================
      // Send Email
      // ========================================

      await transporter.sendMail({

         from:
            `"CryptoTracker" <${process.env.EMAIL_USER}>`,

         to:
            user.email,

         subject:
            "CryptoTracker - Reset Your Password",


         // =====================================
         // Plain Text Email
         // =====================================

         text: `
Hello ${user.name},

We received a request to reset your CryptoTracker password.

Reset your password using this link:

${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

Back to CryptoTracker:
${frontendUrl}

CryptoTracker
         `,


         // =====================================
         // HTML Email
         // =====================================

         html: `
<!DOCTYPE html>

<html>

<head>

   <meta charset="UTF-8">

   <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
   >

</head>


<body style="
   margin: 0;
   padding: 0;
   background: #f8fafc;
   font-family:
      Arial,
      Helvetica,
      sans-serif;
">


<div style="
   max-width: 600px;
   margin: 0 auto;
   padding: 30px 16px;
">


   <div style="
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow:
         0 8px 30px
         rgba(15, 23, 42, 0.08);
   ">


      <!-- Header -->

      <div style="
         padding: 28px 30px;
         background: #0f172a;
      ">

         <h2 style="
            margin: 0;
            color: #ffffff;
            font-size: 22px;
         ">

            CryptoTracker

         </h2>

      </div>


      <!-- Content -->

      <div style="
         padding: 30px;
         color: #334155;
      ">


         <h2 style="
            margin-top: 0;
            color: #0f172a;
         ">

            Reset your password

         </h2>


         <p>
            Hello ${user.name},
         </p>


         <p>
            We received a request to reset your
            CryptoTracker password.
         </p>


         <p>
            Click the button below to create a
            new password.
         </p>


         <!-- Reset Button -->

         <div style="
            margin: 28px 0;
         ">

            <a
               href="${resetUrl}"
               style="
                  display: inline-block;
                  padding: 13px 24px;
                  background: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
               "
            >

               Reset Password

            </a>

         </div>


         <p style="
            font-size: 14px;
            color: #64748b;
         ">

            This link will expire in
            <strong>
               15 minutes
            </strong>.

         </p>


         <p style="
            font-size: 14px;
            color: #64748b;
         ">

            If you did not request this password
            reset, you can safely ignore this email.

         </p>


         <hr style="
            border: 0;
            border-top:
               1px solid #e5e7eb;
            margin: 25px 0;
         ">


         <!-- Back to Website -->

         <p style="
            margin-bottom: 0;
            text-align: center;
         ">

            <a
               href="${frontendUrl}"
               style="
                  color: #2563eb;
                  text-decoration: none;
                  font-weight: bold;
               "
            >

               Back to CryptoTracker

            </a>

         </p>


      </div>


   </div>


</div>


</body>

</html>
         `
      });


      // ========================================
      // Success Response
      // ========================================

      res.status(200).json({
         message:
            "If an account exists for that email, a password reset link has been sent."
      });

   } catch (error) {

      console.error(
         "Forgot password error:",
         error
      );

      res.status(500).json({
         message:
            "Unable to process password reset request"
      });
   }
};


// ========================================
// Reset Password
// ========================================

const resetPassword = async (req, res) => {
   try {

      const { token } = req.params;

      const { password } = req.body;


      if (!token) {
         return res.status(400).json({
            message: "Reset token is required"
         });
      }


      if (!password) {
         return res.status(400).json({
            message: "New password is required"
         });
      }


      if (password.length < 6) {
         return res.status(400).json({
            message:
               "Password must be at least 6 characters"
         });
      }


      // ========================================
      // Hash token received from URL
      // ========================================

      const hashedToken = crypto
         .createHash("sha256")
         .update(token)
         .digest("hex");


      // ========================================
      // Find valid token
      // ========================================

      const user = await User.findOne({

         resetPasswordToken:
            hashedToken,

         resetPasswordExpires: {
            $gt: new Date()
         }

      });


      if (!user) {
         return res.status(400).json({
            message:
               "Password reset token is invalid or has expired"
         });
      }


      // ========================================
      // Hash new password
      // ========================================

      user.password = await bcrypt.hash(
         password,
         12
      );


      // ========================================
      // Remove reset token
      // ========================================

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();


      res.status(200).json({
         message:
            "Password reset successful. You can now login."
      });

   } catch (error) {

      console.error(
         "Reset password error:",
         error
      );

      res.status(500).json({
         message:
            "Unable to reset password"
      });
   }
};


// ========================================
// Export Controllers
// ========================================

module.exports = {
   register,
   login,
   getMe,
   forgotPassword,
   resetPassword
};