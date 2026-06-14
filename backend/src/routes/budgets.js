const express = require('express');
const router = express.Router();
const { getBudgets, setBudget, getBudgetStatus, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(setBudget);

router.route('/status')
  .get(getBudgetStatus);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
