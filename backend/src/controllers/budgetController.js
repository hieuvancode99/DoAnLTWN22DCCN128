const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get user budgets for a specific month and year
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const today = new Date();
    const month = parseInt(req.query.month) || (today.getMonth() + 1);
    const year = parseInt(req.query.year) || today.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year
    }).populate('categoryId');

    res.json({ success: true, data: budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Set or update a budget for a category
// @route   POST /api/budgets
// @access  Private
const setBudget = async (req, res) => {
  try {
    const { categoryId, amountLimit, month, year } = req.body;

    if (!categoryId || amountLimit === undefined || !month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (amountLimit < 0) {
      return res.status(400).json({ success: false, message: 'Budget limit cannot be negative' });
    }

    // Upsert budget (update if exists, insert if new)
    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        categoryId,
        month,
        year
      },
      { amountLimit },
      { new: true, upsert: true, runValidators: true }
    ).populate('categoryId');

    // Emit realtime event
    const io = req.app.get('io');
    if (io) {
      io.emit('budget:updated', { userId: req.user._id.toString() });
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get budget status comparing spent amount vs limits
// @route   GET /api/budgets/status
// @access  Private
const getBudgetStatus = async (req, res) => {
  try {
    const today = new Date();
    const month = parseInt(req.query.month) || (today.getMonth() + 1);
    const year = parseInt(req.query.year) || today.getFullYear();

    // Fetch all budgets of the user
    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year
    }).populate('categoryId');

    // For each budget, calculate total spent in that category for that month/year
    const statusData = await Promise.all(budgets.map(async (budget) => {
      // Find start and end date for that month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Sum transactions
      const transactions = await Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            categoryId: budget.categoryId._id,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' }
          }
        }
      ]);

      const spent = transactions.length > 0 ? transactions[0].totalSpent : 0;
      const remaining = budget.amountLimit - spent;
      const percentage = budget.amountLimit > 0 ? Math.round((spent / budget.amountLimit) * 100) : 0;

      return {
        _id: budget._id,
        category: budget.categoryId,
        amountLimit: budget.amountLimit,
        spent,
        remaining,
        percentage,
        month,
        year
      };
    }));

    res.json({ success: true, data: statusData });
  } catch (error) {
    console.error('Get budget status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // Emit realtime event
    const io = req.app.get('io');
    if (io) {
      io.emit('budget:updated', { userId: req.user._id.toString() });
    }

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getBudgets, setBudget, getBudgetStatus, deleteBudget };
