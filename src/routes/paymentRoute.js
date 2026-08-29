const express = require("express");
const paymentRouter = express.Router();

const { createOrder, verifyPayment } = require("../controllers/paymentController");
const userMiddleware = require("../middleware/userMiddleware");

paymentRouter.post("/create-order", userMiddleware, createOrder);
paymentRouter.post("/verify-payment", userMiddleware, verifyPayment);

module.exports = paymentRouter;