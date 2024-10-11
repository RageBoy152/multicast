import { useEffect, useState } from 'react';
import { toggleModal } from '../utils/toggleModal';



export function FeedModal({ setUserData, editFeedObj, setEditFeedObj }) {
  const [newFeedName, setNewFeedName] = useState(() => editFeedObj.feedName ? editFeedObj.feedName : '');
  const [newFeedSource, setNewFeedSource] = useState(() => editFeedObj.videoId ? `https://youtube.com/watch?v=${editFeedObj.videoId}` : '');

  const [nameInputErr, setNameInputErr] = useState('');
  const [sourceInputErr, setSourceInputErr] = useState('');


  useEffect(() => {
    setNewFeedName(() => editFeedObj.feedName ? editFeedObj.feedName : '');
    setNewFeedSource(() => editFeedObj.videoId ? `https://youtube.com/watch?v=${editFeedObj.videoId}` : '');
  }, [editFeedObj])


  function addFeed() {
    let invalid = false;

    if (!newFeedName.match(/[\w]/)) { setNameInputErr('Invalid name'); invalid = true; }
    else { setNameInputErr(''); }
    

    let videoURL = '';
    try {
      videoURL = new URL(newFeedSource);
      setSourceInputErr('');
    } catch (err) {
      setSourceInputErr('Invalid source'); invalid = true;
    }

    if (invalid) return;



    let videoId = videoURL.pathname.includes('/live/') ? videoURL.pathname.split('/live/')[1].split('?')[0] : videoURL.searchParams.get('v');

  
    let newFeedObj = {
      feedId: editFeedObj.feedName ? editFeedObj.feedId : crypto.randomUUID(),
      feedName: `${newFeedName}`,
      videoId: `${videoId}`,
      volume: 50,
    }


    let addFeedNotificationObj = {
      notificationId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      title: `${editFeedObj.feedName ? 'Edited' : 'Added'} feed '${newFeedName}'`,
      status: 'success'
    }

    toggleFeedModalHandler();

    if (editFeedObj.feedName) {
      if (editFeedObj.outputName) {
        //  editing feed in output

        setUserData((currentData) => ({
          ...currentData,
          outputs: [
            ...currentData.outputs.map(outputObj =>
              outputObj.outputName == editFeedObj.outputName ? {...outputObj, feeds: outputObj.feeds.map(feedObj => feedObj.feedId == editFeedObj.feedId ? {...feedObj, feedName: newFeedObj.feedName, videoId: newFeedObj.videoId} : feedObj)} : outputObj
            )
          ],
          notifications: [addFeedNotificationObj, ...currentData.notifications]
        }))
      }
      else {
        //  editing feed in feedlist

        setUserData((currentData) => ({
          ...currentData,
          feedList: [...currentData.feedList.map(feedObj => feedObj.feedId == editFeedObj.feedId ? {...feedObj, feedName: newFeedObj.feedName, videoId: newFeedObj.videoId} : feedObj)],
          notifications: [addFeedNotificationObj, ...currentData.notifications]
        }))
      }
    }
    else {
      setUserData((currentData) => ({
        ...currentData,
        feedList: [newFeedObj, ...currentData.feedList],
        notifications: [addFeedNotificationObj, ...currentData.notifications]
      }))
    }
    
  }


  function toggleFeedModalHandler() {
    toggleModal('feed-modal-container', () => {
      setNameInputErr('');
      setSourceInputErr('');
      setEditFeedObj({});
      setNewFeedName('');
      setNewFeedSource('');
    });
  }



  return (
    <div onMouseDown={(e)=>{if (e.target.id == "feed-modal-container") toggleFeedModalHandler()}} id="feed-modal-container" className="bg-black/25 flex items-top justify-center absolute z-[60] w-full h-full" style={{display: "none"}}>
      <div className="bg-primary border border-secondary px-2 flex flex-col items-center mt-24 w-1/3 h-min">
        <div className="border-b border-accent px-3 py-3 flex justify-between items-center w-full">
          <h3 className="text-xl">{!editFeedObj.feedName ? 'Add Feed' : `Edit Feed '${editFeedObj.feedName}'`}</h3>
          <a className="cursor-pointer text-text-shade hover:text-text" onClick={toggleFeedModalHandler}><i className="bi bi-x-lg"></i></a>
        </div>
        <div className="flex w-11/12 flex-col gap-3 py-4">
          <div className="flex flex-col">
            <label htmlFor="feed-name" className="text-l">Name:</label>
            <input id="feed-name" value={newFeedName} onChange={e => setNewFeedName(e.target.value)} className="bg-secondary text-l px-2 py-1" type="text" />
            <p className='text-sm mt-1 text-red-400'>{nameInputErr}</p>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="feed-source" className="text-l">Source:</label>
            <input id="feed-source" value={newFeedSource} onChange={e => setNewFeedSource(e.target.value)} className="bg-secondary text-l px-2 py-1" type="text" />
            <p className='text-sm mt-1 text-red-400'>{sourceInputErr}</p>
          </div>
        </div>
        <div className="border-t border-accent flex justify-end gap-5 w-full py-3 px-3">
          <a className="bg-secondary hover:bg-secondary/80 cursor-pointer p-2 px-5" onClick={toggleFeedModalHandler}>Cancel</a>
          <a className="bg-accent hover:bg-accent/80 cursor-pointer p-2 px-5" onClick={addFeed}>{!editFeedObj.feedName ? 'Add' : 'Edit'} Feed</a>
        </div>
      </div>
    </div>
  )
}