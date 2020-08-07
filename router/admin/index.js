const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { db } = require('../../connection/firebase-admin');
const { auth } = require('../../connection/firebase');

// Issues: https://github.com/firebase/firebase-js-sdk/issues/1881

// 管理員註冊
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  auth
    .createUserWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      await db.ref('/admin').child(user.uid).set({
        uid: user.uid,
        email,
        nickname,
      });
      return res.send({ success: true, message: '註冊成功' });
    })
    .catch((error) => {
      if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
      if (error.code === 'auth/email-already-in-use') return res.send({ success: false, message: '已存在用戶' });
      if (error.code === 'auth/weak-password') return res.send({ success: false, message: '密碼強度不夠' });
      return res.status(500).send({ success: false, message: error.message });
    });
});

// 管理員登入
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  auth
    .signInWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      const snapshot = await db.ref('/admin').child(user.uid).once('value');
      const { nickname } = snapshot.val();
      const token = jwt.sign({ id: user.uid }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 20 });
      return res
        .cookie('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 20, // 20min
          // sameSite: 'none',
          // secure: true,
        })
        .send({ success: true, account: { email: user.email, nickname } });
    })
    .catch((error) => {
      if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
      if (error.code === 'auth/user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
      if (error.code === 'auth/wrong-password') return res.send({ success: false, message: '帳號或密碼錯誤' });
      return res.status(500).send({ success: false, message: error.message });
    });
});

// 管理員登出
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    // sameSite: 'none',
    // secure: true,
  });
  return res.send({ success: true, message: '已登出' });
});

// 檢查是否持續登入
router.post('/check', (req, res) => {
  const exp = new Date(req.user.exp * 1000).getMinutes();
  const now = new Date().getMinutes();
  const interval = exp - now < 0 ? 60 + (exp - now) : exp - now;
  if (interval < 5) {
    const token = jwt.sign({ id: req.user.id }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 20 });
    return res
      .cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 20, // 20min
        // sameSite: 'none',
        // secure: true,
      })
      .send({ success: true });
  }
  return res.send({ success: true });
});

module.exports = router;
