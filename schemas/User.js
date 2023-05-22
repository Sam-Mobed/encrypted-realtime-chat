const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

//although the password should be a hashed 64bit hexadecimal or wtv

module.exports = mongoose.model("Users", userSchema);