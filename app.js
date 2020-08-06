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
    if (req.cookies.token) return req.cookies.token;
    return null;
  },
};

const expressJwtUnless = {
  path: [
    // /^\/*/,
    { url: /^\/api\/admin\/login$/, methods: ['POST'] },
  ],
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressJwt(expressJwtOptions).unless(expressJwtUnless));

// import Router
const admin = require('./router/admin/index');

app.use('/api/admin', admin);

// error handler
app.use((err, req, res, next) => {
  if (err.code === 'credentials_required') return res.send({ success: false, message: '未帶有訪問令牌' });
  if (err.code === 'invalid_token') return res.send({ success: false, message: '無效的訪問令牌' });
  return res.send({ success: false, message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`開啟 port 為 ${port} 的 localhost`));
