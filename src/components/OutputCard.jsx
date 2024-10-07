import { useEffect, useState } from "react";
import { OutputCardPreview } from "./OutputCardPreview";
import { Link } from 'react-router-dom'


export function OutputCard({ feeds, outputName, outputId, setUserData }) {
  const [newFeedCount, setNewFeedCount] = useState(feeds.length);
  const [prevNewFeedCount, setPrevNewFeedCount] = useState(feeds.length);


  function updateFeedCount(e) {
    setPrevNewFeedCount(newFeedCount);
    setNewFeedCount(e.target.value);
  }


  useEffect(() => {
    if (newFeedCount > 9 || newFeedCount < 0 || (newFeedCount == 0 && newFeedCount != '')) setNewFeedCount(prevNewFeedCount);

    if (newFeedCount < 10 && newFeedCount > 0 && newFeedCount != feeds.length) {
      let newFeedsArray = [];

      if (newFeedCount > feeds.length) {
        newFeedsArray = feeds;

        for (let i=feeds.length; i<newFeedCount; i++) {
          newFeedsArray.push({});
        }
      }
      else {
        newFeedsArray = feeds.slice(0, Number(newFeedCount));
      }



      setUserData((currentUserData) => {
        let movedFeeds = [...currentUserData.outputs.filter(outputObj => outputObj.outputId == outputId)[0].feeds.filter((feedObj, i) => i+1 > newFeedCount)].filter(feedObj => feedObj.feedId && feedObj);


        return ({
        ...currentUserData,
        feedList: [...movedFeeds, ...currentUserData.feedList],
        outputs: [...currentUserData.outputs.map(outputObj => outputObj.outputId == outputId ? {
          ...outputObj,
          feedCount: newFeedCount,
          feeds: newFeedsArray
          } : outputObj)]
        })
      })
    }
  }, [newFeedCount])



  return (
    <div className="w-[500px]">
      <div className="bg-primary flex justify-between items-center">
          <a onClick={() => window.electronAPI.send('open-output', `/output?outputId=${outputId}`)} className="text-l px-3 py-2 text-text-shade hover:text-text hover:bg-secondary/50 cursor-pointer w-full h-full"><i className="bi bi-box-arrow-up-right mr-1"></i> {outputName}</a>
      </div>
      <OutputCardPreview outputFeeds={feeds} outputName={outputName} setUserData={setUserData} />
      <div className="bg-primary flex gap-3 items-center px-3 py-2 text-l">
          <label className="h-min">Feeds:</label>
          <input type="number" value={newFeedCount} min={1} max={9} onChange={updateFeedCount} className="bg-secondary w-[45px] text-center" />
      </div>
    </div>
  )
}