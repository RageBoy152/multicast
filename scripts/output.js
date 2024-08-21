// gets config
config = getConfig()



//  get general window info
const outputIndex = parseInt(new URL(window.location).searchParams.get('outputPage'))
let outputData = config.outputs[outputIndex]
const outputLetter = toAlpha(outputIndex + 1)

document.title = `Output ${outputLetter} - ${outputData.outputName}`


const container = $('.outputContainer')[0]


generateGridItems(outputData.feedCount)



function addFeed(i) {
    if (outputData.feeds[i] != null && outputData.feeds[i].feedId) {
        // add feed to container
        container.innerHTML += `<div class="output bg-accent flex-center align-items-start position-relative">
        <div class="audioControl flex-center justify-content-between flex-column bg-primary">
            <p id="volText" class="text-center mt-2">${outputData.feeds[i].volume == null ? 50 : outputData.feeds[i].volume}%</p>
            <input id="volInput" type="range" min="0" max="100" value="${outputData.feeds[i].volume == null ? 50 : outputData.feeds[i].volume}" oninput="volumeInput(this)">
            
            <div class="flex-center flex-column gap-3 mb-2">
                <a onclick='copyCredits(${JSON.stringify({feedid: outputData.feeds[i].feedId, outputindex: outputIndex, feedindex: i})})' class="button square"><i class="bi bi-clipboard"></i></a>
                <a onclick='openExternalURL("https://www.youtube.com/live_chat?is_popout=1&dark_theme=true&v=${outputData.feeds[i].videoId}")' class="button square"><i class="bi bi-chat-left-text"></i></a>
            </div>
        </div>
        <webview id="feed-${i}-${outputData.feeds[i].videoId}" src="https://www.youtube.com/embed/${outputData.feeds[i].videoId}?autoplay=1" allowfullscreen></webview>
    </div>`
    }   else {
        //  add number to container
        container.innerHTML += `<div class="output bg-accent flex-center">
            <div>${toAlpha(outputIndex + 1)} - ${i+1}</div>
        </div>`
    }
}



function generateGridClass(feedCount) {
    // grid setup
    container.classList.remove('grid-1', 'grid-2', 'grid-2h2', 'grid-3')

    let gridType = '1';
    if (feedCount > 2 && feedCount < 5) {gridType = '2'}
    if (feedCount == 5) {gridType = '2h2'}
    else if (feedCount >= 5) {gridType = '3'}

    container.classList.add(`grid-${gridType}`)

    return gridType
}



function generateGridItems(numDivs) {
    outputFeeds = config.outputs[outputIndex].feeds


    gridType = generateGridClass(numDivs)


    // clear container
    container.innerHTML = ''


    // loop for numDivs
    for (let i = 0;i<numDivs;i++) {
        addFeed(i)
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


    for (let i=0; i<$('.output').length; i++) {
        if ($('.output')[i].querySelectorAll('webview')[0] == null) { continue }

        console.log(i)
        initWebview($('.output')[i].querySelectorAll('webview')[0], i)
    }
}


function initWebview(webview, i) {
    webview.addEventListener('did-finish-load', () => {

        webview.addEventListener('console-message', (e) => {
            if (e.message.includes('UPDATEAUDIOSLIDER_')) {

                $('.output')[i].querySelectorAll('.audioControl input')[0].value = parseInt(e.message.split('UPDATEAUDIOSLIDER_')[1])
                $('.output')[i].querySelectorAll('.audioControl #volText')[0].innerText = `${e.message.split('UPDATEAUDIOSLIDER_')[1]}%`

            }   else if (e.message.includes('AUDIO-DB')) {

                // -60 to 12 dB
                dB = parseInt(e.message.split('AUDIO-DB_')[1])

                minDB = -60
                maxDB = 12

                // 0 to 100 %
                normalDB = Math.max(0, Math.min(100, (((dB - minDB) / (maxDB - minDB)) * 100)))


                // vizualize audio level on meter
                isNaN(normalDB) ? meterValue = 100 : meterValue = 100 - (normalDB*1.1)

                $('.output')[i].querySelectorAll('.audioControl input')[0].style.setProperty('--clip-top', `${meterValue}%`)
            }   else {
                console.log(e.message)
                return
            }
        })
    

        webview.executeJavaScript(`
            //   REMOVE VOLUME UI FROM PLAYER   \\
            
            document.querySelector('.ytp-volume-area').remove()


            volumeInitsialized = false

            if (JSON.parse(JSON.parse(localStorage.getItem('yt-player-volume')).data).volume == 100) {
                volumeInitsialized = true
            }


            if (!volumeInitsialized) {
            
                //   INIT PLAYER VOLUME AT 100%   \\

                function generateTimestamps() {
                    // Get the current time in milliseconds since Unix epoch
                    let creationTime = Date.now()
                    
                    // Calculate the expiration time as 30 days (30 * 24 * 60 * 60 * 1000 milliseconds) after the creation time
                    let expirationTime = creationTime + (30 * 24 * 60 * 60 * 1000)
                
                    // Return the creation and expiration timestamps
                    return {
                        creation: creationTime,
                        expiration: expirationTime
                    }
                }

                ts = generateTimestamps()

                volObj = {
                    "data": '{\"volume\":100,\"muted\":false}',
                    "expiration": ts.expiration,
                    "creation": ts.creation
                }


                localStorage.setItem('yt-player-volume', JSON.stringify(volObj))

                delete volObj.expiration
                sessionStorage.setItem('yt-player-volume', JSON.stringify(volObj))

                window.location.href = ""
            }
            




            //   AUDIO CONTEXT   \\

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const video = document.querySelector('video')
            const source = audioCtx.createMediaElementSource(video)



            //   AUDIO GAIN NODE   \\

            const gainNode = audioCtx.createGain()

            source.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            gainNode.gain.value = ${calcGainFromVolValue(config.outputs[outputIndex].feeds[webview.id[5]].volume)}
            window.setGainValue = (value)=>{ gainNode.gain.value = value }



            //   AUDIO ANALYSIS NODE   \\

            const analyser = audioCtx.createAnalyser()

            gainNode.connect(analyser)
            analyser.connect(audioCtx.destination)
    
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
    
            function getAverageVolume(array) {
                let values = 0;
                let average;
                for (let i = 0; i < array.length; i++) {
                values += array[i];
                }
                average = values / array.length;
                return average;
            }


            //   LOG AUDIO LEVEL IN DB   \\
    
            function logAudioLevel() {
                analyser.getByteFrequencyData(dataArray);
                const average = getAverageVolume(dataArray);
                const dB = 20 * Math.log10(average / 255);
                console.log('AUDIO-DB_'+dB.toString())
            }
    
            setInterval(logAudioLevel, 100); // Log the audio level every second
        `, true)
    })
}




function calcGainFromVolValue(vol) {
    if (vol == null) { vol = 50 }

    return ((vol / 100) * 1)
}



//  handles volume slider input
function volumeInput(input) {
    //  set volume % text to value
    input.parentNode.querySelector('p').innerText = `${input.value}%`


    //  set volume on gain node
    input.parentNode.parentNode.querySelector('webview').executeJavaScript(`
        window.setGainValue(${calcGainFromVolValue(input.value)})
    `)
}



//  save volume to config every second
setInterval(()=>{
    if ($('webview').length == 0) { return }


    // update config
    config = getConfig()
    outputData = config.outputs[outputIndex]


    for (let i=0; i<outputData.feeds.length; i++) {
        if (!$('.output')[i] || $('.output')[i].querySelectorAll('#volInput').length == 0) { continue }

        config.outputs[outputIndex].feeds[i].volume = $('.output')[i].querySelectorAll('#volInput')[0].value
    }
    
    writeToConfig(config)
}, 1000)




//  OUTPUT REFRESH FUNCTIONS


// setTimeout(()=>{
    //  sync window title

    ipcRenderer.on('update-title',(e,setTitleTo)=>{
        $('#window-menu-bar h1')[0].innerText = `MutliCast - Output ${outputLetter} - ${setTitleTo}`
    })



    //  refresh particular feed

    ipcRenderer.on('refresh-feed',(e,feedIndex)=>{
        // update config
        config = getConfig()
        outputData = config.outputs[outputIndex]

        let feedData = outputData.feeds[feedIndex]
    

        if (feedData.feedId) {
            // add feed to output
            $('.output')[feedIndex].classList = 'output bg-accent flex-center align-items-start position-relative'

            $('.output')[feedIndex].innerHTML = `
            <div class="audioControl flex-center justify-content-between flex-column bg-primary">
                <p id="volText" class="text-center mt-2">${feedData.volume == null ? 50 : feedData.volume}%</p>
                <input id="volInput" type="range" min="0" max="100" value="${feedData.volume == null ? 50 : feedData.volume}" oninput="volumeInput(this)">
                
                <div class="flex-center flex-column gap-3 mb-2">
                    <a onclick='copyCredits(${JSON.stringify({feedid: feedData.feedId, outputindex: outputIndex, feedindex: parseInt(feedIndex)})})' class="button square"><i class="bi bi-clipboard"></i></a>
                    <a onclick='openExternalURL("https://www.youtube.com/live_chat?is_popout=1&dark_theme=true&v=${feedData.videoId}")' class="button square"><i class="bi bi-chat-left-text"></i></a>
                </div>
            </div>
            <webview id="feed-${feedIndex}-${feedData.videoId}" src="https://www.youtube.com/embed/${feedData.videoId}?autoplay=1" allowfullscreen></webview>
        `
        }   else {
            //  add number to output
            $('.output')[feedIndex].classList = 'output bg-accent flex-center'

            $('.output')[feedIndex].innerHTML = `<div>${toAlpha(outputIndex + 1)} - ${parseInt(feedIndex)+1}</div>`
        }

        if ($('.output')[feedIndex].querySelectorAll('webview')[0] == null) { return }
        initWebview($('.output')[feedIndex].querySelectorAll('webview')[0], feedIndex)
    })
// }, 500)



ipcRenderer.on('refresh-grid', (e,data)=>{
    let newFeedCount = parseInt(data.split('REFRESHWINDOW_')[1])

    // update config
    config = getConfig()
    outputData = config.outputs[outputIndex]


    // remove empty feed boxes

    let emptyBoxCount = $('.output.emptyOutput').length

    for (let i=0; i<emptyBoxCount; i++) {
        $('.output.emptyOutput')[0].remove()
    }



    if (newFeedCount < $('.output').length) {
        // remove outputs

        // $('.output').length - newFeedCount              // how many to remove

        let temp = $('.output').length - newFeedCount
        for (let i=0; i < temp; i++) {
            $('.output')[$('.output').length - 1].remove()
        }

    }   else if (newFeedCount > $('.output').length) {
        // add outputs
        
        let temp = $('.output').length
        for (let i=0; i < (newFeedCount - temp); i++) {
            addFeed($('.output').length)
        }
    }


    // add empty feed boxes
    if (newFeedCount == 3) {
        container.innerHTML += `<div class="output emptyOutput flex-center">EMPTY</div>`
    }   else if (newFeedCount >= 6 && newFeedCount < 9) {
        for (let i=0; i<9-newFeedCount;i++) {
            container.innerHTML += `<div class="output emptyOutput flex-center">EMPTY</div>`
        }
    }


    //  fix grid class
    generateGridClass(newFeedCount)
})