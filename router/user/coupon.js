const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 套用優惠卷
router.post('/', async (req, res) => {
  const { uid } = req.user;
  const { code } = req.body;
  try {
    const couponsSnapshot = await db.ref('/coupons').once('value');
    const coupons = couponsSnapshot.val() || [];
    const coupon = Object.values(coupons).find((item) => item.code === code);
    if (!coupon) return res.send({ success: false, message: '找不到優惠卷' });
    if (!coupon.is_enabled) return res.send({ success: false, message: '優惠卷未啟用' });
    if (coupon.due_date < Date.now()) return res.send({ success: false, message: '優惠卷已過期' });
    const cartSnapshot = await db.ref('/carts').child(uid).once('value');
    const cart = cartSnapshot.val();
    const updateCart = Object.entries(cart).reduce((arr, cartProduct) => {
      const newArr = arr;
      const [cartProductId, cartProductContent] = cartProduct;
      const newCartProductContent = { ...cartProductContent, coupon };
      newArr[cartProductId] = { ...newCartProductContent };
      return newArr;
    }, {});
    await db.ref('/carts').child(uid).update(updateCart);
    return res.send({ success: true, message: '已套用優惠卷' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
