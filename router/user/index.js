const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { db } = require('../../connection/firebase-admin');
const { auth } = require('../../connection/firebase');

// Issues: https://github.com/firebase/firebase-js-sdk/issues/1881

// 用戶註冊
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  auth
    .createUserWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      await db.ref('/user').child(user.uid).set({
        uid: user.uid,
        email,
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

// 用戶登入
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  auth
    .signInWithEmailAndPassword(email, password)
    .then(async ({ user }) => {
      const uToken = jwt.sign({ uid: user.uid, role: 'user' }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 30 });
      return res
        .cookie('uToken', uToken, {
          httpOnly: true,
          maxAge: 1000 * 60 * 30, // 30min
          // sameSite: 'none',
          // secure: true,
        })
        .send({ success: true, user: { email: user.email } });
    })
    .catch((error) => {
      if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
      if (error.code === 'auth/user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
      if (error.code === 'auth/wrong-password') return res.send({ success: false, message: '帳號或密碼錯誤' });
      return res.status(500).send({ success: false, message: error.message });
    });
});

// 用戶登出
router.post('/logout', (req, res) => {
  res.clearCookie('uToken', {
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
    const uToken = jwt.sign({ id: req.user.id }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 30 });
    return res
      .cookie('uToken', uToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 30, // 30min
        // sameSite: 'none',
        // secure: true,
      })
      .send({ success: true });
  }
  return res.send({ success: true });
});

module.exports = router;
