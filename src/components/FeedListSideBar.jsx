import { AddFeedCard } from "./AddFeedCard";
import { FeedCard } from "./FeedCard";


import { feedCardDragOver, feedCardDrop } from '../utils/feedCardDragDrop';


export function FeedListSideBar({ feedListData, setUserData }) {
  return (
    <section onDrop={(e) => feedCardDrop(e, null, null, null, null, setUserData)} onDragOver={feedCardDragOver} className="bg-primary/25 border-r border-r-accent flex items-center flex-col pb-[12px] w-3/12 h-[calc(100vh-50px-33px)] overflow-auto">
      <h1 className="w-10/12 py-4 text-xxl">Feeds</h1>
      <div className="flex flex-col items-center w-full gap-4">
        <AddFeedCard />
        {feedListData.map(feedData => {
          return (
            <FeedCard key={feedData.feedId} {...feedData} setUserData={setUserData} />
          )
        })}
        <p className="text-sm text-text-shade">End of list.</p>
      </div>
    </section>
  )
}