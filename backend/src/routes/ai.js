const express = require('express');
const router = express.Router();
const { getSavingsSuggestions, chatWithAi } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

router.post('/savings-suggestion', protect, getSavingsSuggestions);
router.post('/chat', protect, chatWithAi);

module.exports = router;
