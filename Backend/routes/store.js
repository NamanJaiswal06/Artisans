const express = require("express");
const router = express.Router();

const {storeThreat} = require("../controllers/storeController");

router.post("/store",storeThreat);

module.exports = router;