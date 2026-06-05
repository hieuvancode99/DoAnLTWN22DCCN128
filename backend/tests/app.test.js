const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');

let token;
let userId;
let categoryId;
const testEmail = `testuser_${Date.now()}@example.com`;

beforeAll(async () => {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance_test');
  
  // Clean up any potential leftover test data
  await User.deleteMany({ email: testEmail });
});

afterAll(async () => {
  // Clean up test data
  if (userId) {
    await User.deleteMany({ _id: userId });
    await Transaction.deleteMany({ userId });
    await Budget.deleteMany({ userId });
  }
  await mongoose.connection.close();
});

describe('Personal Finance API Integration Tests', () => {
  
  // 1. Test Auth Registration
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: 'testpassword123'
      });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.email).toBe(testEmail);
    
    token = res.body.data.token;
    userId = res.body.data._id;
  });

  // 2. Test Auth Login
  it('should authenticate registered user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'testpassword123'
      });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    token = res.body.data.token;
  });

  // 3. Test Categories Retrieval & Creation
  it('should fetch categories (at least system categories or empty)', async () => {
    // Create one temporary test category first if none exists
    const cat = await Category.create({
      name: 'Test Food',
      type: 'expense',
      isSystem: true
    });
    categoryId = cat._id;

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // 4. Test Budgets Setup
  it('should establish a budget limit for a category', async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        amountLimit: 100000, // 100,000 VND limit
        month,
        year
      });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amountLimit).toBe(100000);
  });

  // 5. Test Transaction Creation with Budget Limit Warnings
  it('should create an expense and trigger budget warning if limit is exceeded', async () => {
    const today = new Date();
    
    // First transaction: 40,000 VND (within 100,000 VND limit)
    const res1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        amount: 40000,
        type: 'expense',
        date: today,
        description: 'Buying snacks'
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.budgetWarning).toBe(false);

    // Second transaction: 70,000 VND (40k + 70k = 110k, exceeding 100k limit)
    const res2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId,
        amount: 70000,
        type: 'expense',
        date: today,
        description: 'Buying lunch'
      });

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
    expect(res2.body.budgetWarning).toBe(true);
    expect(res2.body.warningMessage).toContain('vượt quá hạn mức ngân sách');
  });

});
