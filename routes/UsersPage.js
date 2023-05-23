const express = require('express');
const router = express.Router();

router.get('/:username', (req,res) => {
    try {
        res.status(200).render('../views/userpage.ejs');
    } catch (e) {
        res.status(500).send("Server side error");
    }
})

//and then we would have /:username/CreateChatRoom
//and also /:username/:chatRoom
//don't think we'll need query parameters here. 

module.exports = router;