const multer = require("multer");

const storage = multer.memoryStorage(); // or use diskStorage for saving to disk

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
});

module.exports = upload;
