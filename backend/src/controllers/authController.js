const User = require('../models/User');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction', {
    expiresIn: '30d'
  });
};

// Danh mục mặc định gợi ý khi tạo tài khoản mới
const DEFAULT_CATEGORIES = [
  { name: 'Lương', type: 'income', icon: 'briefcase', color: '#10B981' },
  { name: 'Đầu tư', type: 'income', icon: 'trending-up', color: '#059669' },
  { name: 'Phụ cấp / Thưởng', type: 'income', icon: 'award', color: '#6EE7B7' },
  { name: 'Khác (Thu nhập)', type: 'income', icon: 'plus-circle', color: '#34D399' },
  { name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#EF4444' },
  { name: 'Di chuyển', type: 'expense', icon: 'car', color: '#F59E0B' },
  { name: 'Nhà cửa & Tiện ích', type: 'expense', icon: 'home', color: '#3B82F6' },
  { name: 'Giải trí', type: 'expense', icon: 'film', color: '#EC4899' },
  { name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6' },
  { name: 'Sức khỏe & Y tế', type: 'expense', icon: 'heart', color: '#14B8A6' },
  { name: 'Giáo dục', type: 'expense', icon: 'graduation-cap', color: '#6366F1' },
  { name: 'Khác (Chi tiêu)', type: 'expense', icon: 'minus-circle', color: '#9CA3AF' }
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin và mã OTP' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }
    
    await Otp.deleteOne({ _id: validOtp._id });

    const user = await User.create({ name, email, password, role: 'User' });

    if (user) {
      // Tạo 12 danh mục gợi ý riêng cho user mới
      const userCategories = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        isSystem: false,
        userId: user._id
      }));
      await Category.insertMany(userCategories);

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Kiểm tra tài khoản bị cấm
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();

    await Otp.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Smart Finance" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác nhận đăng ký tài khoản - Smart Finance',
      html: `<h3>Mã xác nhận OTP của bạn là: <b>${otpCode}</b></h3><p>Mã này sẽ hết hạn sau 5 phút.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn' });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi OTP' });
  }
};

module.exports = { registerUser, loginUser, sendOtp };
