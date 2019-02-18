const axios = require("axios")
const information = require("./hardcoded.js")
const DBManager = require("./DBManager.js")
const key = information.trello.key;
const token = information.trello.token;
const schedule = require('node-schedule');



// runNewProject('5c694e02009b938d148d004d')
runSprinter('5c694e02009b938d148d004d') 
// actualUpdate('5c694e02009b938d148d004d')
// IdealBurnCheck('5c694e02009b938d148d004d', 1)





// run every hour update actualBurn
async function actualUpdate(boardId) {
    const sprintCardsArr = await getSprintCards(boardId)
   const sumOfSP = await getActualStoryPoints(sprintCardsArr)
    DBManager.updateActualBurn(boardId, sumOfSP)
}



const date = new Date(2019, 1, 17, 12, 50, 0);
// runNewProject('5c694e02009b938d148d004d')

// run by the spesifide date for the first time 
schedule.scheduleJob(date, function () {
    runNewProject('5c694e02009b938d148d004d')
    
    // every 14 days starting a new sprint
    // setInterval(function() {
    //  
    //   


    // }, 12096e5);
    
});




schedule.scheduleJob(date, function () {
    
    // every 24 houers updating ActualBurn
    setInterval(function() {   
        runSprinter('5c694e02009b938d148d004d') 
}, 8.64e+7);
    
});




// run first time 
// creating a project in DB
async function runNewProject(boardId) {
    
    
    // project name by boardId
    const projectName = await getProjectName(boardId)
    
    const allCards = await getCardsByBoardId(boardId)
    
    // takes all cards from board to save in DB
    const tasksArr = await createTasksArr(allCards)


    // taks all the card from sprint lists
    let sprintCardsArr = await getSprintCards(boardId)
    
    // create s
    const sprintTracker = await createNewSprintTrackerObj(boardId, projectName, sprintCardsArr)



// raw project object to save in project DB
    const projectObj =  {
        
        id : boardId +'ProductB',
        sprintTracker: sprintTracker,
        projectName: projectName,
        boardId: boardId,
        tasks: tasksArr
    }
// console.log(projectObj);

    await DBManager.saveProjectToDb(projectObj)



}





// every day run on sprint lists and track status (IdealBurn) & progres (ActualBurn) 
// runSprinter('5c694e02009b938d148d004d') 
async function runSprinter(boardId) {

    let sprintCardsArr = await getSprintCards(boardId)
    
    let sumOfSP = await getActualStoryPoints(sprintCardsArr)
    console.log('sumOfSP: ' ,sumOfSP);
    
   await DBManager.updateActualBurnDaily(boardId, sumOfSP)
    
    IdealBurnCheck(boardId)
    
}





async function IdealBurnCheck(boardId){

    let currentEstimate = 0;
    let sprintCardsArr = await getSprintCards(boardId)

    const objectFromDB = await DBManager.getIdealBurn(boardId)
    // console.log('sprintTasks[0]);: ' , objectFromDB.sprintTracker.sprintTasks[0].id);

const sprintDay = await objectFromDB.sprintTracker.actualBurnLive.length - 1
let cardHasTaskInDB = false;
for (const card of sprintCardsArr) {
    cardHasTaskInDB = false;
    for (const task of objectFromDB.sprintTracker.sprintTasks) {
        if (card.trelloId === task.id) {
            cardHasTaskInDB = true;
            if (card.estimate != task.storyPoints) {
   
                let oldValue = task.storyPoints
                let newValue = card.estimate
                currentEstimate = (newValue - oldValue)
             
                
                // add to idealBurn in the card created sprintDay
                const cardSprintDay = task.sprintDay;
                objectFromDB.sprintTracker.idealBurnLive[cardSprintDay] += currentEstimate
               
                // update task.storyPoints in DB with the nwe value
                task.storyPoints = currentEstimate
            }
        }
    }
    if(!cardHasTaskInDB){
       
        
        currentEstimate = card.estimate
        objectFromDB.sprintTracker.idealBurnLive[sprintDay] += currentEstimate


        // TO DO add card to DB
        const task = {
            id: card.trelloId,
            name: card.name,
            storyPoints: card.estimate,
            sprintDay: sprintDay
        }
        objectFromDB.sprintTracker.sprintTasks.push(task)
        console.log(card);
        
    
    }
}

await DBManager.updateIdealBurnDaily(boardId, objectFromDB)
}








async function getActualStoryPoints(cardsArr) {
    let sumOfSP = 0;
    for (const card of cardsArr) {

        if (card.listName.includes(information.trello.candidateListName)) {
            sumOfSP += card.estimate

        } else {
           const numbers = card.listName.match(/\d+/g).map(Number)
            const sprintPercentageOfProgress = numbers[0]
            sumOfSP += card.estimate * (1 - (sprintPercentageOfProgress / 100))
        }
    }
    return sumOfSP.toFixed(2)
}









// bildind a raw object to save in project DB
// summarize the amount of story points in sprint lists
// 

async function createNewSprintTrackerObj(boardId, projectName, sprintCardsArr) {
    let tasksArr = []
    let idealBurnLive = new Array(14).fill(0)
    
    let sumOfSP = 0;
    
    for (const card of sprintCardsArr) {
        
        
        if (card.listName.includes(information.trello.candidateListName)) {
            
            sumOfSP += card.estimate
            
        } else {
            // lists that heve %, calculate the estimeted SP for the next sprint
            numbers = card.listName.match(/\d+/g).map(Number)
            const sprintPercentageOfProgress = numbers[0]
            sumOfSP += card.estimate * (1 - (sprintPercentageOfProgress / 100))
        }
        
        const task = {
            id: card.trelloId,
            name: card.name,
            storyPoints: card.estimate,
            sprintDay: 0
        }
        tasksArr.push(task)
    }
    
    idealBurnLive[0] = sumOfSP.toFixed(2)
    
    const sprintTrackerObj =  {
        boardId: boardId,
        name: projectName,
        numberOfWeek: 2,
        sprintTasks: tasksArr,
        // actualBurnLive:[],
        idealBurnLive: idealBurnLive
        
    }
    
    
    return sprintTrackerObj
}


async function createTasksArr(allCardsArr) {
    let cardsArr = []
    let estimate = 0
    for (const card of allCardsArr) {
       

        if (card.pluginData.length > 0) {
        
            const pluginData = card.pluginData
            const pluginDataObj = JSON.parse(pluginData[0].value)
            estimate = parseInt((pluginDataObj.estimate))
            
            
            
        }
                const cardObj = {
                    _id: card.id,
                    taskName: card.name,
                    storyPoints:estimate,
                    details: card.desc,
                    // cardTrelloId: cardId,
                    // userStory: card.userStory
                   }
                   cardsArr.push(cardObj)
    
    }
    // console.log(cardsArr);
    return cardsArr
}









async function getCardsByBoardId(boardId) {

    const cards = await axios.get(`https://api.trello.com/1/boards/${boardId}/cards?pluginData=true&fields=name%2Cid%2Curl%2CidList%2CidBoard%2Cdesc&key=${key}&token=${token}`)
    return cards.data

}


async function getSprintCards(boardId) {

    
    const projectName = await getProjectName(boardId)
    let sprintCardsArr = []

    var allSprintLists = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists?cards=open&filter=open&fields=name%2Cid%2Cdesc&key=${key}&token=${token}`)
    // console.log('allSprintLists.data: ', allSprintLists.data);

    for (const list of allSprintLists.data) {

        // if (list.name.includes('%') && list.cards.length > 0) {
        if ((list.name.includes('%') || list.name.includes(information.trello.candidateListName)) && list.cards.length > 0) {
            // console.log('## listName:  ',list.name);
            const listName = list.name
            for (const card of list.cards) {
                // console.log('carddddddddddddddddddddddddddddddddddddddd  ',card.desc);
                const cardId = card.id
                const cardName = card.name
                const cardUrl = card.url


                const pluginData = await axios.get(`https://api.trello.com/1/cards/${cardId}/pluginData?key=${key}&token=${token}`)
                // console.log('pluginData: ', pluginData);
                let estimate = 0
                if (pluginData.data[0]) {
                    const pluginDataObj = JSON.parse(pluginData.data[0].value)
                    estimate = parseInt((pluginDataObj.estimate))
                    //   console.log(estimate);



                }
                const cardObj = {
                    projectName: projectName,
                    listName: listName,
                    trelloId: cardId,
                    name: cardName,
                    description: card.desc,
                    estimate: estimate,
                    url: cardUrl,
                    //    sprintDay: 0,

                }

                sprintCardsArr.push(cardObj)


            }

        }


    }


    return sprintCardsArr

}


async function getProjectName(boardId) {
    var response = await axios.get(`https://api.trello.com/1/boards/${boardId}/name?key=${key}&token=${token}`)
    
    var boardObj = response.data
    var boardName = boardObj._value
    
    
    return boardName
}


module.exports = {getSprintCards}