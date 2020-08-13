const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 結帳付款
router.post('/:id', async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const orderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!orderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    await db.ref('/orders').child(uid).child(id).update({ is_paid: true, paid_date: Date.now() });
    return res.send({ success: true, message: '結帳完成' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
