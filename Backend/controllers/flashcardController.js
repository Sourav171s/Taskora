import Flashcard from "../models/flashcardModel.js";

export const getFlashcards = async (req, res) => {
  try {
    const items = await Flashcard.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createFlashcard = async (req, res) => {
  try {
    const item = new Flashcard({ ...req.body, userId: req.user._id });
    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateFlashcard = async (req, res) => {
  try {
    const item = await Flashcard.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteFlashcard = async (req, res) => {
  try {
    const item = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
