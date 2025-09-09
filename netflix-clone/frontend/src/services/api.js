netflix-clone
├── backend
│   ├── src
│   │   ├── config
│   │   │   └── db.js
│   │   ├── controllers
│   │   │   ├── authController.js
│   │   │   ├── videoController.js
│   │   │   ├── subscriptionController.js
│   │   │   └── paymentController.js
│   │   ├── middleware
│   │   │   └── authMiddleware.js
│   │   ├── routes
│   │   │   ├── auth.js
│   │   │   ├── videos.js
│   │   │   ├── subscriptions.js
│   │   │   └── payments.js
│   │   ├── utils
│   │   │   └── generateTokens.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── components
│   │   │   └── Navbar.jsx
│   │   ├── pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Player.jsx
│   │   │   └── Subscription.jsx
│   │   ├── App.jsx
│   │   ├── services
│   │   │   └── api.js
│   │   └── index.js
│   ├── package.json
│   └── .env
└── database
    └── schema.sql