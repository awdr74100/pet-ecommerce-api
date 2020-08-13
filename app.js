require('dotenv').config();
const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressJwt = require('express-jwt');

const corsOptions = {
  credentials: true,
  origin: ['http://localhost:3001'],
};

const expressJwtOptions = {
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  getToken: function fromHeaderOrQuerystring(req) {
    const role = /^\/api\/(?!admin)/.test(req.originalUrl) ? 'user' : 'admin';
    if (role === 'user' && req.cookies.uToken) return req.cookies.uToken;
    if (role === 'admin' && req.cookies.aToken) return req.cookies.aToken;
    return null;
  },
};

const expressJwtUnless = {
  path: [
    // /^\/*/,
    { url: /^\/api\/products/ },
    { url: /^\/api\/admin\/signin$/ },
    { url: /^\/api\/admin\/signup$/ },
    { url: /^\/api\/user\/signin$/ },
    { url: /^\/api\/user\/signup$/ },
  ],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressJwt(expressJwtOptions).unless(expressJwtUnless));

// import Router
const admin = require('./router/admin/index');
const adminProducts = require('./router/admin/products');
const adminCoupons = require('./router/admin/coupons');
const adminOrders = require('./router/admin/orders');
const adminUpload = require('./router/admin/upload');
const user = require('./router/user/index');
const userCart = require('./router/user/cart');
const userCoupon = require('./router/user/coupon');
const userOrders = require('./router/user/orders');
const userPay = require('./router/user/pay');
const products = require('./router/products');

app.use('/api/admin', admin);
app.use('/api/admin/products', adminProducts);
app.use('/api/admin/coupons', adminCoupons);
app.use('/api/admin/orders', adminOrders);
app.use('/api/admin/upload', adminUpload);
app.use('/api/user', user);
app.use('/api/user/cart', userCart);
app.use('/api/user/coupon', userCoupon);
app.use('/api/user/orders', userOrders);
app.use('/api/user/pay', userPay);
app.use('/api/products', products);

// error handler
app.use((err, req, res, next) => {
  if (err.code === 'credentials_required') return res.send({ success: false, message: '未帶有訪問令牌' });
  if (err.code === 'invalid_token') return res.send({ success: false, message: '無效的訪問令牌' });
  return res.send({ success: false, message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`開啟 port 為 ${port} 的 localhost`));
