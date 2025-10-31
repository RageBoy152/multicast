import ReactPlayer from 'react-player';

import { useEffect, useState } from "react";

import { copyCredits } from "../utils/copyCredits";


function openCtxMenu(e) {
  e.preventDefault();

  // clear old active feed class
  if ($('.feedCardActive').length > 0) $('.feedCardActive')[0].classList.remove('feedCardActive');

  // get ctx menu
  let ctxMenu = $('#contextMenu')[0];
  
  // position ctx menu
  ctxMenu.style.top = e.type == "contextmenu" ? `${e.clientY}px` : `${e.target.getBoundingClientRect().top}px`;
  ctxMenu.style.left = e.type == "contextmenu" ? `${e.clientX}px` : `${e.target.getBoundingClientRect().right}px`;
  ctxMenu.style.display = 'flex';

  // add active feed class - different parent tree based on caller location
  e.type != "contextmenu" ? e.target.parentNode.parentNode.parentNode.classList.add('feedCardActive') : e.target.parentNode.parentNode.classList.add('feedCardActive');
}



export function Feed({ outputName, feedId, videoId, volume, basisClass = '', heightClass = '', setUserData, userData }) {
  //  defines context dependant styles for different parts of the feedcard. context dependant meanin either in the feeds list or in the output preview
  let feedCardContextClassStyles = basisClass == '' ? 'w-9/12' : 'flex-grow';

  const [newVolume, setNewVolume] = useState(volume);
  const [feedFuncsHidden, setFeedFuncsHidden] = useState(false);

  const [feedFuncBarMode, setFeedFuncBarMode] = useState("always");

  const [pullPoints, setPullPoints] = useState({ point0: 10, point1: 0 });
  const [playHeadValue, setPlayHeadValue] = useState(0);    // -X seconds from live



  function setVol(e) {
    setNewVolume(e.target.value)

    $(`#${feedId}`)[0].executeJavaScript(`
      for (let i=0; i<5; i++) {
        window.setGainValue(${calcGainFromVolPercent(e.target.value)}, audioCtx.currentTime, 0.01);
      }
    `)

    setUserData((currentData) => ({
      ...currentData,
      outputs: [
        ...currentData.outputs.map(outputObj =>
          outputObj.outputName == outputName ? {...outputObj, feeds: outputObj.feeds.map(feedObj => feedObj.feedId == feedId ? {...feedObj, volume: e.target.value.toString()} : feedObj)} : outputObj
        )
      ]
    }))
  }



  function setPoint(point) {
    setPullPoints((prev) => ({ point0: point === 0 ? playHeadValue : prev.point0, point1: point === 1 ? playHeadValue : prev.point1 }));
  }



  // function startPull() {
  //   electronAPI.send('pull-start', { videoId: videoId, ...pullPoints });

  //   electronAPI.receive('pull-loading', (loading) => {
  //     console.log(`Pulling... (${loading.percent * 100}%) | ${loading.status}`);
  //   });

  //   electronAPI.receive('pull-finish', (res) => {
  //     console.log("Finished pull.");
  //     console.log(res);
  //   });

  //   electronAPI.receive('pull-error', (err) => {
  //     console.error("Error pulling GIF:");
  //     console.error(err);
  //   });
  // }


  
  useEffect(() => {
    //  Get preferences from main
    window.electronAPI.send('get-preference', 'feedFuncBarMode');

    const handlePreferenceReply = (data) => {
      if (data.key == 'feedFuncBarMode') { setFeedFuncBarMode(data.preference); setFeedFuncsHidden(data.preference != 'always') }
    }

    window.electronAPI.receive('get-preference-reply', handlePreferenceReply);




    //  webveiw stuff

    const webview = $(`#${feedId}`)[0];
    if (!webview) return;



    //  READ AUDIO
    function parseAudioReading(message) {
      const dB = parseInt(message.split('_')[1]);

        const minDB = -60;
        const maxDB = 12;

        const normalizedDB = Math.max(0, Math.min(100, (((dB - minDB) / (maxDB - minDB)) * 100)));

        const meterValue = isNaN(normalizedDB) ? 100 : (100 - (normalizedDB)) * 0.8;

        $(`#volInput_${feedId}`).css({'--clip-top': `${meterValue}%`});
    }



    //  READ PULL POINT
    function parsePlayheadPosition(message) {
      const positionValue = message.split('_')[1];

      // console.log(`Playhead position: ${positionValue}`);
      setPlayHeadValue(positionValue);
    }



    webview.addEventListener('did-finish-load', () => {
      webview.openDevTools();


      webview.addEventListener('console-message', (e) => {
        if (e.message.includes('AUDIO-DB_')) { parseAudioReading(e.message); }
        else if (e.message.includes('PLAYHEAD-POSITION_')) { parsePlayheadPosition(e.message); }
        else { return; }
      });



      webview.executeJavaScript(`
        //  remove volume slider from ytp

        let volAreaElem = document.querySelector('.ytp-volume-area');
        volAreaElem && volAreaElem.remove();



        //  init audio context

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: 'interactive'
        });
        const video = document.querySelector('video');
        const source = audioCtx.createMediaElementSource(video);



        //  add gain node

        const gainNode = audioCtx.createGain();

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.value = ${calcGainFromVolPercent(newVolume)};
        window.setGainValue = (value) => { gainNode.gain.value = value; }



        //  audio analysis node

        const analyser = audioCtx.createAnalyser();

        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256/4;
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



        //  send back db

        function logAudioLevel() {
          analyser.getByteFrequencyData(dataArray);
          const average = getAverageVolume(dataArray);
          const dB = 20 * Math.log10(average / 255);
          console.log('AUDIO-DB_'+dB.toString());
        }

        setInterval(logAudioLevel, 100);



        //  send back playhead position

        function logPlayheadPos() {
          const maxVal = parseInt(document.querySelector('.ytp-progress-bar').getAttribute('aria-valuemax'));
          const currentVal = parseInt(document.querySelector('.ytp-progress-bar').getAttribute('aria-valuenow'));

          console.log('PLAYHEAD-POSITION_'+ (maxVal-currentVal));
        }
        setInterval(logPlayheadPos, 100);
      `, true)
    })



    return () => {
      webview.addEventListener('did-finish-load', () => {});
      window.electronAPI.receive('get-preference-reply', handlePreferenceReply);
    }
  }, [])


  function calcGainFromVolPercent(volume) {
    let gainValue = volume / 100;
    
    return gainValue < 0.01 ? 0 : gainValue;
  }



  return (
    <div className={`${feedCardContextClassStyles} relative flex items-center ${basisClass} ${heightClass}`} onMouseOver={() => feedFuncBarMode == 'hover' && setFeedFuncsHidden(false)} onMouseLeave={() => feedFuncBarMode == 'hover' && setFeedFuncsHidden(true)}>
      <div className={`bg-primary flex flex-col items-center h-full transition-all duration-150 ease-linear ${feedFuncsHidden ? 'w-0' : 'w-[45px] px-2'}`}>
        {!feedFuncsHidden && (
          <>
            {/* <p className="text-xs h-[10%] flex items-center">{newVolume}%</p> */}
            {/* <input id={`volInput_${feedId}`} className="volumeInput h-[65%]" type="range" min={0} max={100} value={newVolume} onChange={setVol} /> */}

            <div className="h-[100%] flex flex-col justify-center gap-3 text-xs">
              {/* <div className="flex w-full justify-between gap-2">
                <a onClick={() => setPoint(0)} className="bg-accent hover:bg-accent/80 cursor-pointer h-[20px] w-1/2 rounded-sm flex items-center justify-center">A</a>
                <a onClick={() => setPoint(1)} className="bg-accent hover:bg-accent/80 cursor-pointer h-[20px] w-1/2 rounded-sm flex items-center justify-center">B</a>
              </div>
              <a onClick={startPull} className="bg-accent hover:bg-accent/80 cursor-pointer h-[20px] w-[30px] rounded flex items-center justify-center">P</a> */}

              <a onClick={() => copyCredits(userData, setUserData, outputName, feedId)} className="bg-accent hover:bg-accent/80 cursor-pointer h-[30px] w-[30px] rounded flex items-center justify-center"><i className="bi bi-clipboard"></i></a>
              <a onClick={() => window.electronAPI.send('openExternal', `https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`)} className="bg-accent hover:bg-accent/80 cursor-pointer h-[30px] w-[30px] rounded flex items-center justify-center"><i className="bi bi-chat-left-text"></i></a>
            </div>
          </> 
        )}
        
      </div>
      <div className={`bg-accent transition-all duration-150 ease-linear ${feedFuncsHidden ? 'w-full' : 'w-[calc(100%-45px)]'} h-full`}>
        {/* <webview id={feedId} src={`https://www.youtube.com/embed/${videoId}`} referrerpolicy="strict-origin-when-cross-origin" className='h-full' /> */}
        {/* <iframe src={`http://localhost:5174/embed?v=${videoId}`} allowFullScreen className='w-full h-full' /> */}
        <iframe src={`https://multicast.watch/embed?v=${videoId}`} allowFullScreen className='w-full h-full' />
      </div>
    </div>
  )
}