import Finance from "../models/financeModel.js";

export const getFinances = async (req, res) => {
  try {
    const items = await Finance.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createFinance = async (req, res) => {
  try {
    const item = new Finance({ ...req.body, userId: req.user._id });
    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateFinance = async (req, res) => {
  try {
    const item = await Finance.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteFinance = async (req, res) => {
  try {
    const item = await Finance.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
