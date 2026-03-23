const express = require('express');
const multer = require('multer');
const os = require('os');
const router = express.Router();
const {
  getAllUsers,
  addUser,
  getUserById,
  deleteUser
} = require('../controllers/userController');

// Multer: store upload in system temp dir; controller moves it to Training images
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// List all registered students
router.get('/', getAllUsers);

// Register a new student (accepts optional multipart photo field named "photo")
router.post('/add', upload.single('photo'), addUser);

// Get a single student by id
router.get('/:id', getUserById);

// Remove a student by id
router.delete('/:id', deleteUser);

module.exports = router;
