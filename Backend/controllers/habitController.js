import Habit from "../models/habitModel.js";

// @desc    Get all habits for user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, habits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res) => {
  try {
    const { title, color, frequency } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const habit = new Habit({
      userId: req.user._id,
      title,
      color: color || '#8b5cf6',
      frequency: frequency || 'daily',
      completedDates: [],
    });

    const createdHabit = await habit.save();
    res.status(201).json({ success: true, habit: createdHabit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle habit completion for a specific date
// @route   POST /api/habits/:id/toggle
// @access  Private
// @body    { date: "YYYY-MM-DD" }
export const toggleHabit = async (req, res) => {
  try {
    const { date } = req.body;
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ success: false, message: "Habit not found" });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required (YYYY-MM-DD)" });
    }

    const idx = habit.completedDates.indexOf(date);
    if (idx > -1) {
      // Toggle off
      habit.completedDates.splice(idx, 1);
    } else {
      // Toggle on
      habit.completedDates.push(date);
    }

    const updatedHabit = await habit.save();
    res.json({ success: true, habit: updatedHabit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ success: false, message: "Habit not found" });
    }

    await habit.deleteOne();
    res.json({ success: true, message: "Habit removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
