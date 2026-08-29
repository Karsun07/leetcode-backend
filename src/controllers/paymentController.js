const crypto = require("crypto");
const razorpayInstance = require("../config/razorpay");
const User = require("../models/user");

// Fixed one-time price for premium access. Kept in .env so it can be
// changed without a code deploy.
const PREMIUM_PRICE_INR = Number(process.env.PREMIUM_PRICE_INR || 100);

const createOrder = async (req, res) => {
    try {
        // req.result is set by userMiddleware — this route requires login,
        // since we need to know who to grant premium to after payment
        if (req.result.isPremium) {
            return res.status(400).json({ message: "You already have premium access" });
        }
        if (req.result.role === 'admin') {
            return res.status(400).json({ message: "Admins already have free access to all editorials" });
        }

        const amountInPaise = PREMIUM_PRICE_INR * 100; // Razorpay works in the smallest currency unit

        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `premium_${req.result._id}_${Date.now()}`,
            notes: {
                userId: req.result._id.toString(),
                purpose: "premium_unlock",
            },
        });

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID, // public key — safe to send to the frontend
        });
    }
    catch (err) {
        console.error("Razorpay createOrder error:", err);
        res.status(500).json({ message: "Failed to create payment order" });
    }
}

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        // This is the actual security check. Razorpay signs
        // "order_id|payment_id" with our key secret; we recompute that same
        // signature ourselves and compare. If it matches, the payment is
        // provably genuine — a forged request from the browser (or anyone
        // else) couldn't reproduce this signature without knowing our secret.
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed — signature mismatch" });
        }

        await User.findByIdAndUpdate(req.result._id, { isPremium: true });

        res.status(200).json({ message: "Payment verified. Premium access unlocked." });
    }
    catch (err) {
        console.error("Razorpay verifyPayment error:", err);
        res.status(500).json({ message: "Failed to verify payment" });
    }
}

module.exports = { createOrder, verifyPayment };