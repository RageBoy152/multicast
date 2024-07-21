// gets config
config = getConfig()



//  get general window info
const outputIndex = parseInt(new URL(window.location).searchParams.get('outputPage'))
const feedIndex = parseInt(new URL(window.location).searchParams.get('feed'))

const outputLetter = toAlpha(outputIndex + 1)

document.title = `Output ${outputLetter} - ${config.outputs[outputIndex].outputName}`


createFeed()




//    GENERATES FEED HTML OBJECT BASED ON DATA GIVEN  -  "EMPTY", "A-2", <div class="player">
function createFeed() {
    // get feed data
    let feedData = config.outputs[outputIndex].feeds[feedIndex]
    
    // init feedHTML
    let feedHTML = ''


    if (!feedData) {
        // feed index out of range - return empty feed box

        feedHTML = `
        <div class="output flex-center emptyOutput">
            <p>EMPTY</p>
        </div>
        `
    }
    else if (!feedData.videoId) {
        // feed is not defined - return feed info

        feedHTML = `
        <div class="output bg-accent flex-center">
            <p>${outputLetter} - ${feedIndex+1}</p>
        </div>
        `
    }
    else if (feedData.videoId) {
        // feed has video id, add feed object

        feedHTML = `
        <div class="output bg-accent flex-center align-items-start position-relative">
            <div class="audioControl flex-center justify-content-between flex-column bg-primary">
                <p id="volText" class="text-center mt-2">${config.outputs[outputIndex].feeds[feedIndex].volume == null ? 50 : config.outputs[outputIndex].feeds[feedIndex].volume}%</p>
                <input id="volInput" type="range" min="0" max="100" value="${config.outputs[outputIndex].feeds[feedIndex].volume == null ? 50 : config.outputs[outputIndex].feeds[feedIndex].volume}" oninput="volumeInput(this)">
                
                <div class="flex-center flex-column gap-3 mb-2">
                    <a onclick='copyCredits(${JSON.stringify({feedid: feedData.feedId, outputindex: outputIndex, feedindex: feedIndex})})' class="button square"><i class="bi bi-clipboard"></i></a>
                    <a onclick='openExternalURL("https://www.youtube.com/live_chat?is_popout=1&dark_theme=true&v=${feedData.videoId}")' class="button square"><i class="bi bi-chat-left-text"></i></a>
                </div>
            </div>
            <webview id="feed-${feedIndex}-${feedData.videoId}" src="https://www.youtube.com/embed/${feedData.videoId}?autoplay=1" allowfullscreen></webview>
        </div>
        `
    }


    $('.outputContainer')[0].innerHTML = feedHTML

    if ($('webview').length == 0) { return }
    $('webview')[0].addEventListener('did-finish-load', () => {
        const webview = $('webview')[0]
    

        webview.addEventListener('console-message', (e) => {
            if (e.message.includes('UPDATEAUDIOSLIDER_')) {

                $('.audioControl input')[0].value = parseInt(e.message.split('UPDATEAUDIOSLIDER_')[1])
                $('.audioControl #volText')[0].innerText = `${e.message.split('UPDATEAUDIOSLIDER_')[1]}%`

            }   else if (e.message.includes('AUDIO-DB')) {

                // -60 to 12 dB
                dB = parseInt(e.message.split('AUDIO-DB_')[1])

                minDB = -60
                maxDB = 12

                // 0 to 100 %
                normalDB = Math.max(0, Math.min(100, (((dB - minDB) / (maxDB - minDB)) * 100)))


                // vizualize audio level on meter
                isNaN(normalDB) ? meterValue = 100 : meterValue = 100 - (normalDB*1.1)

                document.querySelector('.audioControl input').style.setProperty('--clip-top', `${meterValue}%`)
            }   else {
                console.log(e.message)
                return
            }
        })
    

        webview.executeJavaScript(`
            //   REMOVE VOLUME UI FROM PLAYER   \\
            
            document.querySelector('.ytp-volume-area').remove()


            volumeInitsialized = false

            if (JSON.parse(JSON.parse(localStorage.getItem('yt-player-volume')).data).volume == 1) {
                volumeInitsialized = true
            }


            if (!volumeInitsialized) {
            
                //   INIT PLAYER VOLUME AT 1%   \\

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
                    "data": '{\"volume\":1,\"muted\":false}',
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

            gainNode.gain.value = ${calcGainFromVolValue(config.outputs[outputIndex].feeds[feedIndex].volume)}
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
    return ((vol / 100) * 90)
}



//  handles volume slider input
function volumeInput(input) {
    //  set volume % text to value
    input.parentNode.querySelector('p').innerText = `${input.value}%`


    //  set volume on gain node
    document.querySelector("webview").executeJavaScript(`
        window.setGainValue(${calcGainFromVolValue(input.value)})
    `)
}



//  save volume to config every second
setInterval(()=>{
    if ($('webview').length == 0) { return }


    config = getConfig()

    config.outputs[outputIndex].feeds[feedIndex].volume = $('#volInput')[0].value
    writeToConfig(config)
}, 1000)




//  OUTPUT REFRESH FUNCTIONS


setTimeout(()=>{
    //  sync window title

    ipcRenderer.on('update-title',(e,setTitleTo)=>{
        $('#window-menu-bar h1')[0].innerText = `MutliCast - Output ${outputLetter} - ${setTitleTo}`
    })



    //  refresh feed tab

    ipcRenderer.on('refresh-feed',e=>{
        window.location.href = ""
    })
}, 500)