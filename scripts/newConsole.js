document.addEventListener("dragover", (event) => {
    event.preventDefault()
})


config = getConfig()

setInterval(() => {
    config = getConfig()
}, 1000)



async function initFeeds() {
    $('.feedCards')[0].innerHTML = ''
 
    for (let i=0;i<config.feedList.length;i++) {
        feed = config.feedList[i]

        $('.feedCards')[0].innerHTML += `
            <div class="feedCard output" draggable="true" ondragstart="dragStart(this, event)" id="feed_${feed.feedId}">
                <div class="feedTitle d-flex bg-primary px-3 justify-content-between">
                    <h4>${feed.feedName}</h4>
                    <a class="whiteLink fs-2" onclick="addFeed({feedid:'${feed.feedId}',outputindex:'undefined',feedindex:'undefined'},true,false)"><i class="bi bi-x"></i></a>
                </div>
                <div class="feedPreview d-flex align-items-center justify-content-center">
                    <img src="https://i.ytimg.com/vi/${feed.videoId}/maxresdefault.jpg" draggable="false">
                </div>
            </div>
        `
    }

    //  insert add feed button
    $('.feedCards')[0].innerHTML += `
    <div class="feedCard addFeed d-flex justify-content-center align-items-center">
        <a class="whiteLink" data-bs-toggle="modal" data-bs-target="#addFeedModal"><i class="bi bi-plus-square fs-2"></i></a>
    </div>
    `

    initFeedCardContextMenu()
}
initFeeds()





// Function to generate grid items based on the number of divs
function generateGridItems(numDivs, container, outputIndex, edit) {
    outputFeeds = config.outputs[outputIndex].feeds


    if (edit == 'true') {
        inputElem = numDivs
        numDivs = numDivs.value
        if (numDivs > 9) { inputElem.value = 9;return }
        else if (numDivs < 1 || isNaN(numDivs)) { return }


        // update num divs
        config.outputs[outputIndex].feedCount = parseInt(numDivs)

        // update output feeds array (remove or add one object)
        let removedFeedObj = {}
        if (outputFeeds.length < numDivs) {outputFeeds.push({})}
        else if (outputFeeds.length > numDivs) {removedFeedObj = outputFeeds.pop()}

        // if removed object, check if it was a feed and append to feedList if true
        if (removedFeedObj.feedId) {
            config.feedList.push(removedFeedObj)
            initFeeds()
        }

        writeToConfig(config)
        refreshOutputs(outputIndex,null,`REFRESHWINDOW_${numDivs}`)
    }


    // grid setup
    container.classList.remove('grid-1', 'grid-2', 'grid-2h2', 'grid-3')

    let gridType = '1';
    if (numDivs > 2 && numDivs < 5) {gridType = '2'}
    if (numDivs == 5) {gridType = '2h2'}
    else if (numDivs >= 5) {gridType = '3'}
    
    container.classList.add(`grid-${gridType}`)

    
    // clear container
    container.innerHTML = ''


    // loop for numDivs
    for (let i = 0;i<numDivs;i++) {
        if (outputFeeds[i].feedId) {
            // add feed to container
            container.innerHTML += `<div class="output bg-accent flex-center" ondrop="previewDrop(this,event,'${outputIndex}','${i}')">
                <div class="feedCard output" draggable="true" ondragstart="dragStart(this, event)" data-outputindex="${outputIndex}" data-feedindex="${i}" id="feed_${outputFeeds[i].feedId}">
                    <div class="feedTitle d-flex bg-primary px-3 justify-content-between">
                        <h4>${outputFeeds[i].feedName}</h4>
                        <a class="whiteLink fs-2" onclick="removeFeed(this)"><i class="bi bi-x"></i></a>
                    </div>
                    <div class="feedPreview flex-center">
                        <img src="https://i.ytimg.com/vi/${outputFeeds[i].videoId}/maxresdefault.jpg" draggable="false">
                    </div>
                </div>
            </div>`
        }   else {
            //  add number to container
            container.innerHTML += `<div class="output bg-accent flex-center" ondrop="previewDrop(this,event,'${outputIndex}','${i}')">
                <div>${toAlpha(parseInt(container.id.split('-')[2]) + 1)} - ${i+1}</div>
            </div>`
        }
            
    }


    //  add odd divs
    if (numDivs%2 && gridType == '2') {
        container.innerHTML += `<div class="output emptyOutput flex-center">EMPTY</div>`
    }   else if (gridType == '3') {
        repeat = 9 - numDivs + 1
        
        for (let i=0;i<repeat&&container.children.length<9;i++) {
            container.innerHTML += `<div class="output emptyOutput flex-center">EMPTY</div>`
        }
    }
}




// init output previews
function initOutputs() {
    $(`.outputs`)[0].innerHTML = ''

    config.outputs.forEach((output,i)=>{
        $(`.outputs`)[0].innerHTML += `
        <div class="outputWrapper">
            <div class="bg-primary d-flex py-1 px-2 align-items-center">
                Output ${toAlpha(i+1)} - <input type="text" value="${output.outputName}" oninput="updateOutputName(this.value, ${i})" class="p-2 py-1 ms-1" maxlength="18" placeholder="Output Name">
                <a class="whiteLink ms-auto p-2" onclick="openWindow('output.html?outputPage=${i}', this.parentNode.parentNode.querySelectorAll('input')[1].value)"><i class="ms-2 bi bi-box-arrow-up-right"></i></a>
            </div>
            <div class="outputContainer d-flex flex-wrap bg-primary h-100" id="output-container-${i}"></div>
            <div class="bg-primary d-flex align-items-center gap-3 p-2">
                Feeds: <input class="py-1 px-2" type="number" value="${output.feedCount}" max="9" min="1" oninput="generateGridItems(this, this.parentNode.parentNode.getElementsByClassName('outputContainer')[0],${i},'true')">
            </div>
        </div>
        `
        
        generateGridItems(output.feedCount, $(`.outputs .outputWrapper .outputContainer`)[i], i)
        initFeedCardContextMenu()
    })
}
initOutputs()




//  handles addFeedModal

const addFeedModal = new bootstrap.Modal('#addFeedModal')

$('#addFeedModal')[0].addEventListener('hidden.bs.modal', event => {
    $('#addFeedModal')[0].innerHTML = `
    <div class="modal-dialog mx-auto my-5">
        <div class="modal-content p-1">
            <div class="modal-header p-3">
                <h1 class="modal-title fs-5">Add Feed</h1>
                <a class="whiteLink ms-auto fs-4" data-bs-dismiss="modal"><i class="bi bi-x-lg"></i></a>
            </div>
            <div class="modal-body p-4 d-flex flex-column">
                <div>
                    <h5>Name:</h5>
                    <input id="addFeedName" type="text" placeholder="name" class="w-100 mt-1">
                </div>
                
                <div class="mt-4">
                    <h5>Source:</h5>
                    <input id="addFeedSource" type="text" placeholder="https://youtube.com/watch?v=mhJRzQsLZGg" class="w-100 mt-1">
                </div>
            </div>
            <div class="modal-footer p-3 d-flex gap-3">
                <a class="button bg-secondary w-25 ms-auto" data-bs-dismiss="modal">Cancel</a>
                <a class="button w-25" onclick="addFeed()">Add Feed</a>
            </div>
        </div>
    </div>
    `
})




function previewDrop(elem,event, outputIndexNew, outputFeedNumNew) {
    // old data locations on output - may be undefined if old location was in feedList
    outputIndex = event.dataTransfer.getData('outputIndex')
    outputFeedNum = event.dataTransfer.getData('outputFeedNum')

    
    // check if we just dragged the feed onto itself and return if true
    if (outputIndexNew == outputIndex && outputFeedNumNew == outputFeedNum) {return}


    feedElemId = event.dataTransfer.getData('feedElemId')


    if (elem.querySelectorAll('.feedCard').length > 0) {
        // check if there is already a feed card in the location we're tryna drop in
        config.feedList.push(config.outputs[outputIndexNew].feeds[outputFeedNumNew])
        initFeeds()
    }


    elem.innerHTML = ''
    elem.appendChild(document.getElementById(feedElemId))

    $(`#${feedElemId}`)[0].dataset.outputindex = outputIndexNew
    $(`#${feedElemId}`)[0].dataset.feedindex = outputFeedNumNew

    

    // if previous location was an output feed, fill it will the A-1 feed syntax
    if ($('.outputs .outputWrapper')[outputIndex]) {
        $('.outputs .outputWrapper')[outputIndex].querySelectorAll('.outputContainer > .output')[outputFeedNum].innerHTML = `
        <div>${toAlpha(parseInt(outputIndex) + 1)} - ${parseInt(outputFeedNum) + 1}</div>
    `
    }




    // check if feed with feed id is in feedList array
    oldFeedListLocation = 'null'
    for (let i=0;i<config.feedList.length;i++) {if (config.feedList[i].feedId == feedElemId.split('_')[1]) {oldFeedListLocation = i;break}}

    // if it is, copy paste data into where the new location is
    if (oldFeedListLocation != "null") {
        config.outputs[outputIndexNew].feeds[outputFeedNumNew] = config.feedList[oldFeedListLocation]
        config.feedList.splice(oldFeedListLocation, 1)
    }   else {
        // if it isn't, copy paste data from using outputIndex and outputFeedNum into where the new location is
        config.outputs[outputIndexNew].feeds[outputFeedNumNew] = config.outputs[outputIndex].feeds[outputFeedNum]
        config.outputs[outputIndex].feeds[outputFeedNum] = {}
    }

    writeToConfig(config)
    console.log(outputIndex, outputFeedNum)
    if (!isNaN(outputIndex) && !isNaN(outputFeedNum)) { refreshOutputs(outputIndex, outputFeedNum, 'REFRESH') }
    refreshOutputs(outputIndexNew, outputFeedNumNew, 'REFRESH')
}


function dragStart(draggedElem, event) {
    event.dataTransfer.setData('feedElemId', event.target.id)
    event.dataTransfer.setData('outputIndex', draggedElem.dataset.outputindex)
    event.dataTransfer.setData('outputFeedNum', draggedElem.dataset.feedindex)
}



//  "X" button onclick on feeds in the outputs, removes from output and adds the feedList

function removeFeed(xButton) {
    outputIndex = xButton.parentNode.parentNode.dataset.outputindex
    feedIndex = xButton.parentNode.parentNode.dataset.feedindex

    feedId = xButton.parentNode.parentNode.id.split('_')[1]


    // if feed is in an output, remove it and replace with A-1 feed syntax
    if ($('.outputs .outputWrapper')[outputIndex]) {
        $('.outputs .outputWrapper')[outputIndex].querySelectorAll('.outputContainer > .output')[feedIndex].innerHTML = `
            <div>${toAlpha(parseInt(outputIndex) + 1)} - ${parseInt(feedIndex) + 1}</div>
        `

        // move feed data from original output location to feedList, remove feed data from original output location, and refresh feedList
        config.feedList.push(config.outputs[outputIndex].feeds[feedIndex])
        config.outputs[outputIndex].feeds[feedIndex] = {}
        
        
        writeToConfig(config)
        refreshOutputs(outputIndex, feedIndex, 'REFRESH')
        initFeeds()

        addNotification({"title":`Removed feed '${feedNameDeleting}' from output ${toAlpha(parseInt(outputIndex) + 1)}`,"body":"","color":"success"}, 'true')
    }   else {
        // if feed is in the feedList already, bring up the edit dialog for now
        addFeedModal.toggle()
    }

    
}



//   FEED CARD CONTEXT MENU


//  hide feed card context menu
document.onclick = closeFeedContextMenu


const feedContextMenu = $('#feedContextMenu')[0]

function closeFeedContextMenu() {
    feedContextMenu.style.display = 'none'
}

function openFeedContextMenu(e) {
    e.preventDefault()

    // get feed card by looping up parents of whatever element we clicked
    let feedCard = e.target
    while (feedCard && !feedCard.classList.contains('feedCard')) {feedCard = feedCard.parentElement}

    // set data attribute on context menu elem to feed id of elem we clicked
    feedContextMenu.dataset.feedid = feedCard.id.split('_')[1]
    feedContextMenu.dataset.outputindex = feedCard.dataset.outputindex
    feedContextMenu.dataset.feedindex = feedCard.dataset.feedindex


    // show context menu at current position
    feedContextMenu.style.display = 'flex'
    feedContextMenu.style.top = e.pageY + "px"
    feedContextMenu.style.left = e.pageX + "px"
}


//  add context menu open and close functions to feed cards
function initFeedCardContextMenu() {
    for (let i=0;i<$('.feedCard').length;i++) {if (!$('.feedCard')[i].classList.contains('addFeed')) {
        $('.feedCard')[i].oncontextmenu = openFeedContextMenu
    }}
}
initFeedCardContextMenu()




function addFeed(feedData, deleting, editing) {
    if (!feedData)
        feedData = $('#feedContextMenu')[0].dataset
    
    feedId = feedData.feedid
    outputIndex = feedData.outputindex
    feedIndex = feedData.feedindex


    if (!deleting) {

        // get inputs from fields
        feedName = $('#addFeedName').val()
        source = $('#addFeedSource').val()

        

        // input validation
        if (source === "" || feedName === "") {console.log("invalid input");return}


        // get videoId from URL
        videoId = ""
        sourceLinkURL = new URL(source)

        if (sourceLinkURL.searchParams.get('v')) {videoId = sourceLinkURL.searchParams.get('v')}
        else if (sourceLinkURL.pathname.startsWith("/live/")) {videoId = sourceLinkURL.pathname.split("live/")[1]}

    }

    // edit / add to / delete from config data

    feedId = feedId
    if (feedId && deleting) {
        // deleting case

        let feedNameDeleting;

        if (outputIndex === 'undefined' || feedIndex === 'undefined') {
            // if output location is not present, update data in feedList
            for (let i=0;i<config.feedList.length;i++) {
                if (config.feedList[i].feedId == feedId) {
                    feedNameDeleting = config.feedList[i].feedName
                    config.feedList.splice(i,1)
                }
            }
        }   else {
            feedNameDeleting = config.outputs[parseInt(outputIndex)].feeds[parseInt(feedIndex)].feedName
            config.outputs[parseInt(outputIndex)].feeds[parseInt(feedIndex)] = {}
        }

        if (feedNameDeleting)
            addNotification({"title":`Feed '${feedNameDeleting}' deleted`,"body":"","color":"success"}, 'true')
    
    }   else if (feedId && editing) {
        // editing case
        newFeedData = {
            "feedId": feedId,
            "feedName": feedName,
            "videoId": videoId
        }

        if (outputIndex === 'undefined' || feedIndex === 'undefined') {
            // if output location is not present, update data in feedList
            for (let i=0;i<config.feedList.length;i++) {
                if (config.feedList[i].feedId == feedId) {
                    config.feedList[i] = newFeedData;break;
                }
            }
        }   else {
            config.outputs[parseInt(outputIndex)].feeds[parseInt(feedIndex)] = newFeedData
        }

        addNotification({"title":`Feed '${feedName}' edited`,"body":"","color":"success"}, 'true')
    }   else {
        // adding new case
        config.feedList.push(
            {
                "feedId": uuidv4(),
                "feedName": feedName,
                "videoId": videoId
            }
        )
        addNotification({"title":`Feed '${feedName}' added`,"body":"","color":"success"}, 'true')
    }

    
    // write config, refresh list, close modal
    writeToConfig(config)
    if ((editing || deleting) && !(outputIndex === 'undefined' || feedIndex === 'undefined')) { refreshOutputs(outputIndex, feedIndex, 'REFRESH') }

    initFeeds()
    initOutputs()
    

    if (!deleting)
        addFeedModal.toggle()
}




function showEditFeedModal(feedData) {
    feedId = feedData.feedid
    outputIndex = feedData.outputindex
    feedIndex = feedData.feedindex

    feedName = ""
    videoId = ""

    if (outputIndex === 'undefined' || feedIndex === 'undefined') {
        // if output location is not present, update data in feedList
        for (let i=0;i<config.feedList.length;i++) {
            if (config.feedList[i].feedId == feedId) {
                feedName = config.feedList[i].feedName
                videoId = config.feedList[i].videoId
                break
            }
        }
    }   else {
        let feedObj = config.outputs[parseInt(outputIndex)].feeds[parseInt(feedIndex)]
        feedName = feedObj.feedName
        videoId = feedObj.videoId
    }


    $('#addFeedModal')[0].innerHTML = `
        <div class="modal-dialog mx-auto my-5">
            <div class="modal-content p-1">
                <div class="modal-header p-3">
                    <h1 class="modal-title fs-5">Edit '${feedName}'</h1>
                    <a class="whiteLink ms-auto fs-4" data-bs-dismiss="modal"><i class="bi bi-x-lg"></i></a>
                </div>
                <div class="modal-body p-4 d-flex flex-column">
                    <div>
                        <h5>Name:</h5>
                        <input id="addFeedName" type="text" placeholder="name" value="${feedName}" class="w-100 mt-1">
                    </div>
                    
                    <div class="mt-4">
                        <h5>Source:</h5>
                        <input id="addFeedSource" type="text" placeholder="https://youtube.com/watch?v=mhJRzQsLZGg" value="https://youtube.com/watch?v=${videoId}" class="w-100 mt-1">
                    </div>
                </div>
                <div class="modal-footer p-3 d-flex gap-3">
                    <a class="button bg-secondary w-25 ms-auto" data-bs-dismiss="modal">Cancel</a>
                    <a class="button w-25" onclick="addFeed(null, false, true)">Edit Feed</a>
                </div>
            </div>
        </div>
    `

    addFeedModal.toggle()
}



function updateOutputName(nameValue, outputIndex) {
    if (nameValue === "" || nameValue == config.outputs[outputIndex].outputName) {return}
    
    config.outputs[outputIndex].outputName = nameValue

    writeToConfig(config)
    refreshOutputs(outputIndex,null,`SETTITLE_${nameValue}`)
}