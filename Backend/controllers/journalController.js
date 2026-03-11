import Journal from "../models/journalModel.js";

export const getJournals = async (req, res) => {
  try {
    const items = await Journal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createJournal = async (req, res) => {
  try {
    const item = new Journal({ ...req.body, userId: req.user._id });
    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateJournal = async (req, res) => {
  try {
    const item = await Journal.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteJournal = async (req, res) => {
  try {
    const item = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
