const router = require('express').Router();
const { db } = require('../connection/firebase-admin');

// 取得產品列表
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('/products').once('value');
    const products = snapshot.val() || [];
    const productsToArray = Object.entries(products).reduce((arr, [id, value]) => {
      const newArr = arr.concat({ id, ...value });
      return newArr;
    }, []);
    return res.send({ success: true, products: productsToArray });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
});

module.exports = router;
