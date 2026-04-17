const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const Otp = require('../models/Otp');
require('dotenv').config();

// ── Send OTP ─────────────────────────────────────────────────────
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Ensure uniqueness
    let result = await Otp.findOne({ otp: otpCode });
    while (result) {
      otpCode = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await Otp.findOne({ otp: otpCode });
    }

    const otpBody = await Otp.create({ email, otp: otpCode });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpBody,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: err.message });
  }
};

// ── Sign Up ───────────────────────────────────────────────────────
exports.signUphandler = async (req, res) => {
  try {
    const { email, firstName, lastName, password, role, confirmPassword, otp } = req.body;

    if (!email || !firstName || !lastName || !password || !role || !confirmPassword || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide all the details' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Validate OTP — get the most recent one for this email
    const recentOtp = await Otp.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({ success: false, message: 'OTP not found' });
    }
    if (otp !== recentOtp[0].otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
    });

    return res.status(200).json({ success: true, message: 'User created successfully', user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────
exports.loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all the details' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    const payload = { email: user.email, id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    user.password = undefined;

    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      httpOnly: true,
    };

    return res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to login', error: err.message });
  }
};