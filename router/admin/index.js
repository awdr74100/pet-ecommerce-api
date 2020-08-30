const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { db } = require('../../connection/firebase-admin');
const { auth } = require('../../connection/firebase');

// Issues: https://github.com/firebase/firebase-js-sdk/issues/1881

// 管理員註冊
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const userNameSnapshot = await db.ref('/users/names').child(username.toLowerCase()).once('value');
    if (userNameSnapshot.exists()) return res.send({ success: false, message: '用戶名重複' });
    return auth
      .createUserWithEmailAndPassword(email, password)
      .then(async ({ user }) => {
        const setUser = {};
        setUser[`details/${user.uid}`] = { email, username, role: 'admin' };
        setUser[`names/${username.toLowerCase()}`] = user.uid;
        await db.ref('/users').update(setUser);
        return res.send({ success: true, message: '註冊成功' });
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
        if (error.code === 'auth/email-already-in-use') return res.send({ success: false, message: '信箱已被使用' });
        if (error.code === 'auth/weak-password') return res.send({ success: false, message: '密碼強度不夠' });
        return res.status(500).send({ success: false, message: error.message });
      });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 管理員登入
router.post('/signin', async (req, res) => {
  const { usernameOrEmail = '', password } = req.body;
  const isEmail = usernameOrEmail.includes('@');
  if (isEmail) {
    return auth
      .signInWithEmailAndPassword(usernameOrEmail, password)
      .then(async ({ user }) => {
        const userDetailSnapshot = await db.ref('/users/details').child(user.uid).once('value');
        const { email, role, username } = userDetailSnapshot.val();
        if (role !== 'admin') return res.send({ success: false, message: '帳號或密碼錯誤' });
        const aToken = jwt.sign({ uid: user.uid, role: 'admin' }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 30 });
        return res
          .cookie('aToken', aToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 30, // 30min
            // sameSite: 'none',
            // secure: true,
          })
          .send({ success: true, admin: { email, username } });
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
        if (error.code === 'auth/user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
        if (error.message === 'user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
        if (error.code === 'auth/wrong-password') return res.send({ success: false, message: '帳號或密碼錯誤' });
        return res.status(500).send({ success: false, message: error.message });
      });
  }
  try {
    const userNameSnapshot = await db.ref('/users/names').child(usernameOrEmail.toLowerCase()).once('value');
    if (!userNameSnapshot.exists()) return res.send({ success: false, message: '帳號或密碼錯誤' });
    const userDetailSnapshot = await db.ref('/users/details').child(userNameSnapshot.val()).once('value');
    const { email, role, username } = userDetailSnapshot.val();
    if (role !== 'admin') return res.send({ success: false, message: '帳號或密碼錯誤' });
    return auth
      .signInWithEmailAndPassword(email, password)
      .then(({ user }) => {
        const aToken = jwt.sign({ uid: user.uid, role: 'admin' }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 30 });
        return res
          .cookie('aToken', aToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 30, // 30min
            // sameSite: 'none',
            // secure: true,
          })
          .send({ success: true, admin: { email, username } });
      })
      .catch((error) => {
        if (error.code === 'auth/invalid-email') return res.send({ success: false, message: '無效電子郵件' });
        if (error.code === 'auth/user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
        if (error.message === 'user-not-found') return res.send({ success: false, message: '帳號或密碼錯誤' });
        if (error.code === 'auth/wrong-password') return res.send({ success: false, message: '帳號或密碼錯誤' });
        return res.status(500).send({ success: false, message: error.message });
      });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 管理員登出
router.post('/signout', (req, res) => {
  res.clearCookie('aToken', {
    // sameSite: 'none',
    // secure: true,
  });
  return res.send({ success: true, message: '已登出' });
});

// 檢查管理員是否持續登入
router.post('/check', (req, res) => {
  const exp = new Date(req.user.exp * 1000).getMinutes();
  const now = new Date().getMinutes();
  const interval = exp - now < 0 ? 60 + (exp - now) : exp - now;
  if (interval < 10) {
    const aToken = jwt.sign({ id: req.user.id, role: 'admin' }, `${process.env.JWT_SECRET}`, { expiresIn: 60 * 30 });
    return res
      .cookie('aToken', aToken, {
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
