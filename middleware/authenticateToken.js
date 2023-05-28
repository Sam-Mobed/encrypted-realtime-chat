require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    //verify the token that the user sends
    //the token can be stored inside the header of requests, like so Bearer: TOKEN
    //const authHeader = req.headers['authorization']; //this returns "bearer token"
    //but we store our JWT in a HTTP-only coockie instead of the header so
    const token = req.cookies.jwt;

    //const token = authHeader && authHeader.split(' ')[1]; //we use && to make sure that we have a header.
    if (token == null) return res.sendStatus(401);

    //403: you have a token, but it's no longer valid
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; //we don't have any errors, so we can set our user on our request.
        next();
    });
}

module.exports = authenticateToken;