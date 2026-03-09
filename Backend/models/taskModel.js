import mongoose from "mongoose";

const taskSchema= new mongoose.Schema({
    title : {
        type : String,
        required: true
    },
    description : {
        type: String , 
        default : ''
    },
    priority : {
        type : String, 
        enum : ['critical','high','medium','low'],
        default : 'medium'
    },
    dueDate : {
        type: Date
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    estimatedMinutes: { type: Number, default: 25 },
    focusedMinutes: { type: Number, default: 0 },
    lastWorked: { type: String, default: 'Never' },
    project: { type: String },
    type: { type: String, default: 'normal' },
    url: { type: String },
    repeats: { type: Boolean, default: false },
    nextReview: { type: String },
    scheduled: { type: Boolean, default: false },
    completed : {
        type : Boolean,
        default : false
    },
    order: { type: Number, default: 0 },
    startTime: { type: String },
    createdAt: {
        type : Date,
        default : Date.now
    }    
});

const Task = mongoose.models.Task || mongoose.model('Task',taskSchema);
export default Task;