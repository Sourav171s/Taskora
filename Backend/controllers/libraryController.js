import Library from "../models/libraryModel.js";

export const getLibrary = async (req, res) => {
  try {
    const items = await Library.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createLibrary = async (req, res) => {
  try {
    const item = new Library({ ...req.body, userId: req.user._id });
    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateLibrary = async (req, res) => {
  try {
    const item = await Library.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteLibrary = async (req, res) => {
  try {
    const item = await Library.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
