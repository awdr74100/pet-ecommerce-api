require('dotenv').config();
const app = require('express')();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const corsOptions = {
  credentials: true,
  origin: ['https://pet-ecommerce.netlify.app'],
};

const jwtUnless = [
  /^\/api\/products/,
  /^\/api\/coupons/,
  /^\/api\/admin\/signin$/,
  /^\/api\/admin\/signout$/,
  /^\/api\/user\/signin$/,
  /^\/api\/user\/signup$/,
  /^\/api\/user\/signout$/,
  /^\/api\/user\/password$/,
];

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// jwt middleware
app.use((req, res, next) => {
  const isMatch = jwtUnless.some((rx) => rx.test(req.originalUrl));
  if (isMatch) return next();
  const role = /^\/api\/(?!admin)/.test(req.originalUrl) ? 'user' : 'admin';
  const token = role === 'user' ? req.cookies.uToken : req.cookies.aToken;
  try {
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`);
    if (decoded.role !== role) throw new Error('jwt invalid');
    req.user = decoded;
    return next();
  } catch (error) {
    throw new Error(error.message);
  }
});

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
const coupons = require('./router/coupons');

// set Router
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
app.use('/api/coupons', coupons);

// error handler
app.use((err, req, res, next) => {
  if (err.message === 'jwt invalid') return res.send({ success: false, message: '無效的訪問令牌' });
  if (err.message === 'jwt expired') return res.send({ success: false, message: '訪問令牌已過期' });
  if (err.message === 'jwt must be provided') return res.send({ success: false, message: '未帶有訪問令牌' });
  return res.send({ success: false, message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`開啟 port 為 ${port} 的 localhost`));
