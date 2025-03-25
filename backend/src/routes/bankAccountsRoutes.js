const express = require("express");
const router = express.Router();
const {
  getClientAccounts,
  getCompanyAccounts
} = require("../controllers/bankAccountsController");

router.get("/client/:clientId", getClientAccounts);
router.get("/company", getCompanyAccounts);

module.exports = router;
