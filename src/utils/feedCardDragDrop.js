export function feedCardDragStart(e, feedId, outputName) {
  e.dataTransfer.setData('feedId', feedId);
  e.dataTransfer.setData('outputName', outputName);
}



export function feedCardDragOver(e) {
  e.preventDefault();
}



export function feedCardDrop(e, targetFeedIndex, targetFeedId, targetOutputName, inFeedList, setUserData) {
  if (inFeedList) { e.preventDefault(); return; }

  if (targetFeedId == e.dataTransfer.getData('feedId')) { console.log("same feed, return"); return; }

  let originFeedId = e.dataTransfer.getData('feedId');
  let originOutputName = e.dataTransfer.getData('outputName');


  // console.log(`FROM\nfeedId: ${originFeedId}\noutputName: ${originOutputName}\n\nTO\nfeedIndex: ${targetFeedIndex}\nfeedId: ${targetFeedId}\noutputName: ${targetOutputName}`);



  //  return if droping from feedlist to feedlist
  if (originOutputName == 'undefined' && targetFeedIndex == null && targetOutputName == null) { e.preventDefault(); return; }
  

  
  setUserData((currentUserData) => {
    let movedFeedObj = {};


    if (originOutputName == 'undefined' && !isNaN(targetFeedIndex) && targetOutputName) {
      //  dragging from feedlist to an output feed box
      //  logic for removing feed that may occupy the output feed box is in the return feedList: [] line 

      movedFeedObj = currentUserData.feedList.find(feedObj => feedObj.feedId == originFeedId); 

      return {
        ...currentUserData,
        feedList: targetFeedId != undefined ? [currentUserData.outputs.find(outputObj => outputObj.outputName == targetOutputName).feeds.find(feedObj => feedObj.feedId == targetFeedId), ...currentUserData.feedList.filter(feedObj => feedObj.feedId != originFeedId)] : [...currentUserData.feedList.filter(feedObj => feedObj.feedId != originFeedId)],
        outputs: [...currentUserData.outputs.map(outputObj => outputObj.outputName == targetOutputName ? {...outputObj, feeds: [...outputObj.feeds.map((feedObj, i) => i == targetFeedIndex ? movedFeedObj : feedObj)]} : outputObj)]
      }
    }
    else if (originOutputName != 'undefined' && originFeedId != undefined && targetFeedIndex == null && targetFeedId == null && targetOutputName == null) {
      //  dragging from output feed box to feedListSideBar

      movedFeedObj = currentUserData.outputs.find(outputObj => outputObj.outputName == originOutputName).feeds.find(feedObj => feedObj.feedId == originFeedId);
      
      return {
        ...currentUserData,
        feedList: [movedFeedObj, ...currentUserData.feedList],
        outputs: [...currentUserData.outputs.map(outputObj => outputObj.outputName == originOutputName ? {...outputObj, feeds: [...outputObj.feeds.map(feedObj => feedObj.feedId == originFeedId ? {} : feedObj)]} : outputObj)]
      }
    }
    else if (originOutputName != 'undefined' && originFeedId != undefined && !isNaN(targetFeedIndex) && targetOutputName) {
      //  dragging between output feed boxes

      movedFeedObj = currentUserData.outputs.find(outputObj => outputObj.outputName == originOutputName).feeds.find(feedObj => feedObj.feedId == originFeedId);

      return {
        ...currentUserData,
        feedList: targetFeedId != undefined ? [currentUserData.outputs.find(outputObj => outputObj.outputName == targetOutputName).feeds.find(feedObj => feedObj.feedId == targetFeedId), ...currentUserData.feedList] : [...currentUserData.feedList],
        outputs: [...currentUserData.outputs.map(outputObj => outputObj.outputName == originOutputName ? {...outputObj, feeds: [...outputObj.feeds.map(feedObj => feedObj.feedId == originFeedId ? {} : feedObj)]} : outputObj)].map(outputObj => outputObj.outputName == targetOutputName ? {...outputObj, feeds: [...outputObj.feeds.map((feedObj, i) => i == targetFeedIndex ? movedFeedObj : feedObj)]} : outputObj)
      }
    }
  })
}