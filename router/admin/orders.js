const router = require('express').Router();
const { db } = require('../../connection/firebase-admin');

// 取得訂單列表 (同時檢查訂單狀態)
router.get('/', async (req, res) => {
  try {
    const ordersSnapshot = await db.ref('/orders').once('value');
    const orders = ordersSnapshot.val() || [];
    const adjustUserOrder = {};
    const ordersToArray = Object.keys(orders).reduce((arr, uid) => {
      const cacheOrdersToArray = arr;
      const uOrders = Object.keys(orders[uid]).map((uOrderId) => {
        const uOrder = orders[uid][uOrderId];
        let [newStatus, newArrivalDate, newCompleteDate] = [false, false, false];
        // 包裹已送達 (shipping -> arrived) (2天送達)
        if (uOrder.status === 'shipping' && uOrder.shipping_date + 86400000 * 2 - Date.now() < 0) {
          adjustUserOrder[`${uid}/${uOrderId}/status`] = 'arrived';
          newStatus = 'arrived';
          adjustUserOrder[`${uid}/${uOrderId}/arrival_date`] = uOrder.shipping_date + 86400000 * 2;
          newArrivalDate = uOrder.shipping_date + 86400000 * 2;
        }
        // 自動完成訂單 (arrived -> completed) (7天完成))
        if (uOrder.status === 'arrived' && uOrder.arrival_date + 86400000 * 7 - Date.now() < 0) {
          adjustUserOrder[`${uid}/${uOrderId}/status`] = 'completed';
          newStatus = 'completed';
          adjustUserOrder[`${uid}/${uOrderId}/complete_date`] = uOrder.arrival_date + 86400000 * 7;
          newCompleteDate = uOrder.arrival_date + 86400000 * 7;
        }
        return {
          uid,
          id: uOrderId,
          ...uOrder,
          status: newStatus || uOrder.status, // 如果更動及覆蓋
          arrival_date: newArrivalDate || uOrder.arrival_date, // 如果更動即覆蓋
          complete_date: newCompleteDate || uOrder.complete_date, // 如果更動即覆蓋
        };
      });
      return [...cacheOrdersToArray, ...uOrders];
    }, []);
    // 更新訂單狀態
    if (Object.keys(adjustUserOrder).length > 0) {
      await db.ref('/orders').update(adjustUserOrder);
    }
    return res.send({ success: true, orders: ordersToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

// 訂單出貨 (toship -> shipping)
router.patch('/:uid/:id/ship', async (req, res) => {
  const { uid, id } = req.params;
  try {
    const userOrderSnapshot = await db.ref('/orders').child(uid).child(id).once('value');
    if (!userOrderSnapshot.exists()) return res.send({ success: false, message: '找不到訂單' });
    const userOrder = userOrderSnapshot.val();
    // 限訂單狀態為 toship
    if (userOrder.status !== 'toship') return res.send({ success: false, message: '操作異常' });
    await db.ref('/orders').child(uid).child(id).update({
      status: 'shipping',
      shipping_date: Date.now(),
    });
    return res.send({ success: true, message: '訂單已出貨' });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
