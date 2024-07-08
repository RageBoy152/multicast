// gets config
config = getConfig()



//  sets window title
const outputIndex = parseInt(window.location.search.split('=')[1])
const outputData = config.outputs[outputIndex]
const outputLetter = toAlpha(outputIndex + 1)


const container = $('.outputContainer')[0]

document.title = `Output ${outputLetter} - ${outputData.outputName}`



// Function to generate grid items based on the number of divs
function generateGridItems(numDivs) {
    outputFeeds = config.outputs[outputIndex].feeds


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
            container.innerHTML += `<div class="output bg-accent flex-center">
                <iframe class="iframe" id="${i}" src="https://www.youtube.com/embed/${outputFeeds[i].videoId}?autoplay=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </div>`
        }   else {
            //  add number to container
            container.innerHTML += `<div class="output bg-accent flex-center">
                <div>${toAlpha(outputIndex + 1)} - ${i+1}</div>
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

generateGridItems(outputData.feedCount)


ipcRenderer.on("refresh",(e,data)=>{window.location.href = ""})