const mongoose = require('mongoose')
const schemas = require("./productSchemas.js")
const information = require("./hardcoded.js")

// const mongoDB = "mongodb+srv://trelloSynch:elazar@first-6qtxx.mongodb.net/trelloSyncher?retryWrites=true";
const mongoDB ="mongodb+srv://trelloSyncPB:newtrello555@productb-dxo1d.mongodb.net/trelloSyncPB?retryWrites=true";
// const projectModel = require("./mongoSchemas.js")
const ProjectModel = mongoose.model(information.collectionName.Project, schemas.projectSchema)


mongoose.set('useCreateIndex', true)
mongoose.connect(mongoDB, {
    useNewUrlParser: true
});
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));




async function saveProjectToDb(projectObj) {
    let project = new ProjectModel({
        _id: projectObj.id,
        projectName:  projectObj.projectName,
        boardId: projectObj.boardId,
        tasks:projectObj.tasks,
        sprintTracker: projectObj.sprintTracker
    })
    project.save(function (err, newProject) {
        
        
        if (!err) {
            console.log('new project created');
        } else {
            console.log(err);
        }
    });
    
    
}

async function updateIdealBurnDaily(boardId, projectObj) {
    
        ProjectModel.findOneAndUpdate({boardId: boardId}, projectObj, {new: true},
         
         (err, data)=> {
            //  console.log('DATA: ', data);
             
         })
}

// async function getIdealBurn(boardId) {
//     let copyObject = {};
//    await ProjectModel.findOne({boardId: boardId}, async (err, project) => {
//         if(err){return handleError(err)}
//        copyObject = await project
//     //    console.log(project);
       
//     })
//     return copyObject
// }




async function getIdealBurn(boardId) {

    return new Promise((res, rej)=>{
        ProjectModel.findOne({
            boardId: boardId
            }, async function (err, data) {
                console.log(data);
            if (res.statusCode >= 400) {
                console.log(err);
                rej(res.statusMessage)
                // return
            }else{
                res(data)

            }
                
                
        });
    
        })
//     let copyObject = {};
//    await ProjectModel.findOne({boardId: boardId}, async (err, project) => {
//         if(err){return handleError(err)}
//        copyObject = await project
//     //    console.log(project);
       
//     })
//     return copyObject
}




// updateActualBurnDaily('5c694e02009b938d148d004d', 33333)
// async function updateActualBurn(boardId, currentSum) {
async function updateActualBurnDaily(boardId, currentSum) {

        
       
           await ProjectModel.findOne({boardId: boardId}, (err, project) => {
               if(!err)
               console.log('PROJECT: ' , project.sprintTracker.actualBurnLive);
               project.sprintTracker.actualBurnLive.push(currentSum) ;
               
                  project.save()
                });
                
                
                
            }
            
            
            


            async function updateActualBurn(boardId, currentSum) {
                
                await ProjectModel.findOne({boardId: boardId}, (err, project) => {
                    if(!err && project.sprintTracker.actualBurnLive.length > 0)
                    
                    project.sprintTracker.actualBurnLive[project.sprintTracker.actualBurnLive.length - 1] = currentSum
        
                    ProjectModel.findOneAndUpdate({boardId: boardId}, project, {new: true},
                     
                     (err, data)=> {
                         console.log('DATA: ', data);
                         
                     })
               });
            
            
            
        }
    //     async function updateActualBurnWork111111(projectId, currentSum) {
            
    //         await ProjectModel.findById(projectId , (err, project) => {
    //             if(!err && project.sprintTracker.actualBurnLive.length > 0)
    //             console.log('PROJECT: ' , project.sprintTracker.actualBurnLive);
    //             var currentDay = project.sprintTracker.actualBurnLive ;
    //             currentDay[currentDay.length-1] = currentSum
    //             console.log('currentDay: ' ,currentDay);
                
    //             // project.sprintTracker.actualBurnLive.push(currentSum) ;
    //             // project.sprintTracker.actualBurnLive[]currentSum ;
              

    //             ProjectModel.findByIdAndUpdate(projectId, project, {new: true},
                 
    //              (err, data)=> {
    //                  console.log('DATA: ', data);
                     
    //              })
    //        });
        
        
        
    // }
        





async function createSprintTrackerDB(sprintTrackerObj) {
    console.log('sprintTrackerObj : ' , sprintTrackerObj);
    
    let newArr = new Array(sprintTrackerObj.numberOfWeek * 7).fill(0)
    // const sprintTasks = cardObjArr
    newArr[0] = sprintTrackerObj.sumOfSP
    
    // const boardDetails = await getBoardIdByProjectId(plannerObj.ProjectId)
    // var numberOfWeek = (plannerObj.sprintLength / 7)
    
    await sprintTrackerModel.create({
        _id: sprintTrackerObj.id,
        boardId: sprintTrackerObj.boardId,
        name: sprintTrackerObj.projectName,
        numberOfWeek: sprintTrackerObj.numberOfWeek,
        actualBurnLive: [sprintTrackerObj.sumOfSP],
        idealBurnLive: newArr,
        sprintTasks: sprintTrackerObj.sprintTasks
        
    }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            
            console.log("Document Save Done : " , doc);
        }
        
    });
    
}
async function handleError(err) {
    console.log(err.errmsg);
    
    return err.errmsg;
    
}


  




module.exports = {saveProjectToDb, updateActualBurnDaily, updateIdealBurnDaily, updateActualBurn, getIdealBurn}