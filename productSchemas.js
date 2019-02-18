const mongoose = require('mongoose')

const Schema = mongoose.Schema;


const taskSchema = new Schema({
    _id: String,
    cardTrelloId: String,
    taskName: String,
    storyPoints: Number,
    details: String,
    userStory:{}
})

const sprintTrackerSchema= new Schema({
    // _id: String,
    boardId: String,
    sprintDay: {type: Number, default:0},
    name:  String, // {type:String, required:true},
    numberOfWeek: Number,
    startDate: {type:Date, default: new Date()},
    actualBurnLive:[Number],
    idealBurnLive: [Number],
    sprintTasks:[Object]
});



const projectSchema = new Schema({

    _id: String,
    projectName: String,
    boardId: String,
    tasks:[taskSchema],
    sprintTracker: sprintTrackerSchema
}) 

module.exports = {sprintTrackerSchema, projectSchema, taskSchema}