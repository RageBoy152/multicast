import { FeedCard } from "./FeedCard";
import { Feed } from "./Feed";


import { feedCardDragOver, feedCardDrop } from '../utils/feedCardDragDrop';


export function OutputCardPreview({ outputFeeds, outputName, inOutput, setUserData, userData }) {
  //  define height and flex basis classes depending on feed count

  let outputPreviewClassNameProps = {
    heightClass: outputFeeds.length > 2 && outputFeeds.length < 7 ? 'h-1/2' : outputFeeds.length > 6 ? 'h-1/3' : 'h-full',
    basisClass: outputFeeds.length > 4 ? 'basis-1/3' : 'basis-1/2'
  }


  return (
    <div className={`bg-accent ${inOutput ? 'h-[calc(100vh-33px)]' : 'aspect-video'} flex flex-wrap`}>
      {outputFeeds.map((outputFeed, i) => {
        if (outputFeed.feedId) {
          //  return feed card with preview mode
          return (
            inOutput ? <Feed key={outputFeed.feedId} {...outputFeed} {...outputPreviewClassNameProps} setUserData={setUserData} userData={userData} outputName={outputName} /> : <FeedCard key={outputFeed.feedId} {...outputFeed} {...outputPreviewClassNameProps} outputName={outputName} setUserData={setUserData} feedIndex={i} />
          )
        }
        else {
          //  no feed here: return outputLetter - feedIndex
          return (
            <div key={i} onDragOver={feedCardDragOver} onDrop={(e) => feedCardDrop(e, i, outputFeed.feedId, outputName, null, setUserData)} className={`bg-accent aspect-video border flex justify-center items-center border-primary ${outputPreviewClassNameProps.basisClass} ${outputPreviewClassNameProps.heightClass} flex-grow`}>
              <p className="text-sm">{outputName.split('Output ')[1]} - {i+1}</p>
            </div>
          )
        }
        
      })}
    </div>
  )
}