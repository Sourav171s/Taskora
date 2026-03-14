import Subscription from "../models/subscriptionModel.js";

const VALID_PLANS = new Set(["free", "pro"]);

export async function getSubscription(req, res) {
  try {
    const sub = await Subscription.findOne({ userId: req.user.id });
    if (!sub) {
      return res.json({
        success: true,
        subscription: {
          userId: req.user.id,
          plan: "free",
          status: "active",
          startDate: null,
        },
      });
    }
    return res.json({ success: true, subscription: sub });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function upsertSubscription(req, res) {
  try {
    const { plan, status = "active" } = req.body || {};
    if (!plan || !VALID_PLANS.has(plan)) {
      return res.status(400).json({
        success: false,
        message: "plan is required and must be one of: free, pro",
      });
    }

    const existing = await Subscription.findOne({ userId: req.user.id });
    const isPlanChange = existing ? existing.plan !== plan : true;

    const updated = await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        plan,
        status,
        ...(isPlanChange ? { startDate: new Date() } : {}),
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(existing ? 200 : 201).json({ success: true, subscription: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

