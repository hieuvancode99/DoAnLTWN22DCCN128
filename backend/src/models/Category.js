const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  icon: { type: String, default: 'tag' }, // lucide-react icon name
  color: { type: String, default: '#6B7280' },
  isSystem: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // null if it is system-wide
});

module.exports = mongoose.model('Category', CategorySchema);
