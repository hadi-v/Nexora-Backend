const express =  require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User , validateRegisterUser ,validateLoginUser , validateUpdateUser , validateNewPassword} = require("../models/User");
const { UserVerification } = require("../models/UserVerification")
const { BlacklistedToken } = require("../models/BlacklistedToken");
const { verifyToken } = require("../middlewares/verifyToken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS 
    }
});


router.post("/register", asyncHandler(async (req, res) => {

    const { error } = validateRegisterUser(req.body);

    if (error){
        return res.status(400).json({ message: error.details[0].message });
    }

    let user = await User.findOne({ email: req.body.email });

    if (user){
     return res.status(400).json({ message: "User Already Exist" });
    } 

    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    user = new User({
        email: req.body.email,
        userName: req.body.userName,
        password: req.body.password
    });

    const result = await user.save();

    const otp = await sentOtp(result);

    const token = user.generateToken(req);

    res.status(201).json({
        message: "User registered successfully. OTP sent to email.",
        data: { userId: result._id, email: result.email, tokem:token, otp:otp}
    });

}));


router.post("/verify", verifyToken, asyncHandler(async (req, res) => {

    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
    }

    const userId = req.user.id;

    const userVerification = await UserVerification.findOne({ userId });

    if (!userVerification) {
        return res.status(400).json({ message: "No OTP found for this user" });
    }

    if (userVerification.expiresAt < Date.now()) {
        return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp.toString(), userVerification.otp);

    if (!isMatch) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    await UserVerification.deleteOne({ userId });

    await User.findByIdAndUpdate(userId, {verified: true });

    res.json({ message: "Email verified successfully" });

}));


router.post("/forgotPassword", asyncHandler(async (req, res) => {

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Email not found" });
    }

    if (!user.verified) {
        return res.status(400).json({ message: "Account not verified" });
    }

    await UserVerification.deleteMany({ userId: user._id });

    const otp = Math.floor(1000 + Math.random() * 9000);
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    await new UserVerification({
        userId: user._id,
        otp: hashedOTP,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000 
    }).save();

    const resetToken = jwt.sign(
    { id: user._id, purpose: "resetPassword" },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "10m" }
     );

    await transporter.sendMail({
        from: `"Nexora" <${process.env.AUTH_EMAIL}>`,
        to: email,
        subject: "Reset Password Code",
        html: `
            <div style="font-family: Arial; padding: 20px;">
                <h2>Password Reset</h2>
                <p>Here is your reset code:</p>
                <h1 style="letter-spacing: 5px;">${otp}</h1>
            </div>
        `
    });

    res.json({
        message: "OTP sent to email",
        token: resetToken,
        otp: otp
    });
}));


router.post("/resetPassword", asyncHandler(async (req, res) => {

    const { otp, newPassword } = req.body;
    const token = req.headers.token;

    if (!token) {
        return res.status(400).json({ message: "Reset token missing" });
    }

    let decoded;
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (decoded.purpose !== "resetPassword") {
        return res.status(400).json({ message: "Invalid reset token" });
    }

    const { error } = validateNewPassword({newPassword});
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const record = await UserVerification.findOne({ userId: user._id });
    if (!record) {
        return res.status(400).json({ message: "No OTP found" });
    }

    if (record.expiresAt < Date.now()) {
        return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp.toString(), record.otp);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    await UserVerification.deleteMany({ userId: user._id });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ message: "Password reset successfully" });
}));


router.post("/login", asyncHandler(async (req,res)=>{

        const { error } =  validateLoginUser(req.body);
        
        if(error){
           return res.status(400).json({message: error.details[0].message});
        }

        let user = await User.findOne({email: req.body.email});

        if(!user){ 
            return res.status(400).json({message: "invalid email"});
        }

       const PasswordMatch = await bcrypt.compare(req.body.password , user.password);

         if(!PasswordMatch){  
            return res.status(400).json({message: "invalid password"});
        }

        if (!user.verified) {
       return res.status(400).json({ message: "Account not verified. Please verify your email first" });
        }

        const token = user.generateToken(req);
        const { password , ...other} = user._doc;
        res.status(200).json({
        message: "User logged in successfully",
        user: other,
        token: token
    });


    }
));


router.post("/logout", verifyToken, asyncHandler(async (req, res) => {

    const token = req.headers.token;

    if (!req.user) {
        return res.status(400).json({ message: "Invalid token" });
    }

    await BlacklistedToken.create({ token });

    return res.json({ message: "User Logged out successfully" });
}));





const sentOtp = async ({ _id, email }) => {

    const otp = Math.floor(1000 + Math.random() * 9000);

    const mailOptions = {
       from: `"Nexora" <${process.env.AUTH_EMAIL}>`,
        to: email,
        subject: "Verify Your Email",
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Welcome!</h2>
              <p>Here's your Verification Code:</p>
              <h1 style="letter-spacing: 5px; font-size: 32px;">${otp}</h1>
       </div>`
    };

    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    await new UserVerification({
        userId: _id,
        otp: hashedOTP,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000
    }).save();

    await transporter.sendMail(mailOptions);

    return otp;
};




module.exports=router;

