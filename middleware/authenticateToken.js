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
        if (err) return res.status(403).redirect("/"); //the user is sent back to the root, has to sign in again
        if (req.params.username!==user.user) {
            res.sendStatus(403); //checks if the username in the path matches the one extracted from the JWT token payload.
            return;
        }
        //with the above line, the user can't jump to another user's homepage by changing the URL's path.
        req.user = user; //we don't have any errors, so we can set our user on our request.
        next();
    });
}

module.exports = authenticateToken;