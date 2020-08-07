const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { upload, uploadLimits } = require('../../middleware/uploadHandler');
const { bucket } = require('../../connection/firebase-admin');

// 上傳圖片
router.post('/', upload.single('image'), uploadLimits, async (req, res) => {
  if (!req.file) return res.send({ success: false, message: '欄位輸入不正確' });
  const filename = `image/${Date.now()}`;
  const token = uuidv4();
  const options = {
    gzip: true,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
      contentType: req.file.mimetype,
    },
  };
  try {
    await bucket.file(filename).save(req.file.buffer, options);
    const encode = encodeURIComponent(filename);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encode}?alt=media&token=${token}`;
    return res.send({ success: true, imgUrl: publicUrl });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
