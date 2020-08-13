const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 取得訂單列表
router.get('/', async (req, res) => {
  try {
    const ordersSnapshot = await db.ref('/orders').once('value');
    const orders = ordersSnapshot.val() || [];
    const ordersToArray = Object.keys(orders).reduce((arr1, uid) => {
      const userOrders = Object.keys(orders[uid]).reduce((arr2, orderId) => {
        const order = orders[uid][orderId];
        return arr2.concat({
          uid,
          id: orderId,
          ...order,
        });
      }, []);
      return arr1.concat(userOrders);
    }, []);
    return res.send({ success: true, orders: ordersToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
