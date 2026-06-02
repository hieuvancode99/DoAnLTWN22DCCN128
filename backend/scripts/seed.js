const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');

// Load environment variables
dotenv.config();

const systemCategories = [
  // Income
  { name: 'Lương', type: 'income', icon: 'briefcase', color: '#10B981', isSystem: true },
  { name: 'Đầu tư', type: 'income', icon: 'trending-up', color: '#059669', isSystem: true },
  { name: 'Phụ cấp / Thưởng', type: 'income', icon: 'award', color: '#6EE7B7', isSystem: true },
  { name: 'Khác (Thu nhập)', type: 'income', icon: 'plus-circle', color: '#34D399', isSystem: true },
  
  // Expense
  { name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#EF4444', isSystem: true },
  { name: 'Di chuyển', type: 'expense', icon: 'car', color: '#F59E0B', isSystem: true },
  { name: 'Nhà cửa & Tiện ích', type: 'expense', icon: 'home', color: '#3B82F6', isSystem: true },
  { name: 'Giải trí', type: 'expense', icon: 'film', color: '#EC4899', isSystem: true },
  { name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6', isSystem: true },
  { name: 'Sức khỏe & Y tế', type: 'expense', icon: 'heart', color: '#14B8A6', isSystem: true },
  { name: 'Giáo dục', type: 'expense', icon: 'graduation-cap', color: '#6366F1', isSystem: true },
  { name: 'Khác (Chi tiêu)', type: 'expense', icon: 'minus-circle', color: '#9CA3AF', isSystem: true }
];

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance');
    console.log('Database connected successfully.');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    await Budget.deleteMany({});
    console.log('Existing data cleared.');

    // Seed Users trước
    console.log('Seeding users...');
    
    // Test Admin
    const adminUser = await User.create({
      name: 'Hệ Thống Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'Admin'
    });

    // Test Normal User
    const normalUser = await User.create({
      name: 'Nguyễn Văn A',
      email: 'user@example.com',
      password: 'password123',
      role: 'User'
    });

    console.log('Users seeded:');
    console.log(`- Admin: ${adminUser.email} / password123`);
    console.log(`- User: ${normalUser.email} / password123`);

    // Seed Categories (system categories vẫn giữ để làm template)
    console.log('Seeding system categories (template)...');
    const createdCategories = await Category.insertMany(systemCategories);
    console.log(`Seeded ${createdCategories.length} system categories.`);

    // Copy categories cho normalUser (giả lập flow đăng ký tài khoản mới)
    console.log('Copying categories for normal user...');
    const userCategories = systemCategories.map(cat => ({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isSystem: false,
      userId: normalUser._id
    }));
    const createdUserCategories = await Category.insertMany(userCategories);
    console.log(`Copied ${createdUserCategories.length} categories for user.`);

    // Helper to find category ID by name (dùng categories của normalUser)
    const findCatId = (name) => {
      const cat = createdUserCategories.find(c => c.name === name);
      return cat ? cat._id : null;
    };

    // Dates for seeding
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // Seed Budgets for current month
    console.log('Seeding budgets...');
    const budgets = [
      {
        userId: normalUser._id,
        categoryId: findCatId('Ăn uống'),
        amountLimit: 3000000,
        month: currentMonth + 1,
        year: currentYear
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Giải trí'),
        amountLimit: 1500000,
        month: currentMonth + 1,
        year: currentYear
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Mua sắm'),
        amountLimit: 2000000,
        month: currentMonth + 1,
        year: currentYear
      }
    ];
    await Budget.insertMany(budgets);
    console.log('Budgets seeded.');

    // Seed Transactions
    console.log('Seeding transactions...');
    const transactions = [
      // Current Month Income
      {
        userId: normalUser._id,
        categoryId: findCatId('Lương'),
        amount: 25000000,
        type: 'income',
        date: new Date(currentYear, currentMonth, 1, 10, 0, 0),
        description: 'Lương công ty tháng này'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Đầu tư'),
        amount: 2500000,
        type: 'income',
        date: new Date(currentYear, currentMonth, 15, 14, 30, 0),
        description: 'Lợi nhuận cổ phiếu'
      },
      
      // Current Month Expense
      {
        userId: normalUser._id,
        categoryId: findCatId('Nhà cửa & Tiện ích'),
        amount: 6000000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 2, 9, 0, 0),
        description: 'Tiền thuê nhà và điện nước'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Ăn uống'),
        amount: 350000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 3, 12, 30, 0),
        description: 'Ăn trưa và cà phê cùng đối tác'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Ăn uống'),
        amount: 850000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 8, 19, 0, 0),
        description: 'Đi siêu thị mua đồ ăn cả tuần'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Di chuyển'),
        amount: 250000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 5, 8, 15, 0),
        description: 'Đổ xăng xe máy & nạp tiền Grab'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Mua sắm'),
        amount: 1200000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 10, 20, 0, 0),
        description: 'Mua giày thể thao mới'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Giải trí'),
        amount: 450000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 12, 18, 0, 0),
        description: 'Xem phim và trà sữa cuối tuần'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Sức khỏe & Y tế'),
        amount: 350000,
        type: 'expense',
        date: new Date(currentYear, currentMonth, 20, 10, 0, 0),
        description: 'Mua thuốc bổ và vitamin'
      },
      
      // Last Month Data (for realistic analytics graphs)
      {
        userId: normalUser._id,
        categoryId: findCatId('Lương'),
        amount: 25000000,
        type: 'income',
        date: new Date(currentYear, currentMonth - 1, 1, 10, 0, 0),
        description: 'Lương tháng trước'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Nhà cửa & Tiện ích'),
        amount: 6000000,
        type: 'expense',
        date: new Date(currentYear, currentMonth - 1, 2, 9, 0, 0),
        description: 'Tiền nhà tháng trước'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Ăn uống'),
        amount: 2400000,
        type: 'expense',
        date: new Date(currentYear, currentMonth - 1, 15, 12, 0, 0),
        description: 'Tổng ăn uống tháng trước'
      },
      {
        userId: normalUser._id,
        categoryId: findCatId('Mua sắm'),
        amount: 3500000,
        type: 'expense',
        date: new Date(currentYear, currentMonth - 1, 18, 15, 0, 0),
        description: 'Mua quần áo và vật dụng cá nhân'
      }
    ];

    await Transaction.insertMany(transactions);
    console.log('Transactions seeded successfully.');
    console.log('Database seeding completed!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
