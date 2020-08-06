```plain
router/
    admin/
        index.js
        products.js
        orders.js
        coupons.js
        upload.js
    products.js
    carts.js
    coupons.js
    orders.js
    pay.js
    mail.js
```

```js
const admin = require('./router/admin/index');
const adminProducts = require('./router/admin/products');
const adminOrders = require('./router/admin/orders');
const adminCoupons = require('./router/admin/coupons');
const adminUpload = require('./router/admin/upload');
const products = require('./router/products');
const carts = require('./router/carts');
const coupons = require('./router/coupons');
const orders = require('./router/orders');
const pay = require('./router/pay');
const mail = require('./router/mail');

app.use('/api/admin', admin);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/orders', adminOrders);
app.use('/api/admin/coupons', adminCoupons);
app.use('/api/admin/upload', adminUpload);
app.use('/api/products', products);
app.use('/api/carts', carts);
app.use('/api/coupons', coupons);
app.use('/api/orders', orders);
app.use('/api/upload', upload);
app.use('/api/pay', pay);
app.use('/api/mail', mail);
```
