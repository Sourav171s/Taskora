import Project from "../models/projectModel.js";

export const getProjects = async (req, res) => {
  try {
    const items = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createProject = async (req, res) => {
  try {
    const item = new Project({ ...req.body, userId: req.user._id });
    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateProject = async (req, res) => {
  try {
    const item = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteProject = async (req, res) => {
  try {
    const item = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
