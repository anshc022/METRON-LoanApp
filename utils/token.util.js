const jwt = require('jsonwebtoken');


const {secret, expiresIn} = require('../config/auth.config');

exports.generateToken = (payload) => {{{
    return jwt.sign(payload, secret, { expiresIn });
    }};
};

//verify token
exports.verifyToken = (token) => {
    return jwt.verify(token, secret);
  };