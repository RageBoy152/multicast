//  React Hooks
import { useEffect } from "react";
import useUserData, { forcedNotif } from '../hooks/useUserData';


//  React Compontents
import { FeedListSideBar } from "../components/FeedListSideBar";
import { OutputList } from "../components/OutputList";
import { NavBar } from "../components/NavBar";
import { ContextMenu } from '../components/ContextMenu';
import { FeedModal } from '../components/FeedModal';
import { useState } from 'react';
import { SettingsModal } from "../components/SettingsModal";
import { NotificationToastList } from "../components/NotificationToastList";
import { BugReportModal } from "../components/BugReportModal";
import { AppNavBar } from "../components/AppNavBar";



export default function Console() {
  const [userData, setUserData] = useUserData({});
  const [editFeedObj, setEditFeedObj] = useState({});


  useEffect(() => {
    const syncState = (e) => {
      if (e.key === 'rage.multicast.config')
        setUserData(JSON.parse(e.newValue))
    }
    window.addEventListener('storage', syncState)


    const loadBlurCtxMenu = async () => {
      await import('../utils/blurCtxMenu.js');
    }
    loadBlurCtxMenu();


    const loadConsoleLog = async () => {
      await import('../utils/logConsoleActivity.js');
    }
    loadConsoleLog();


    return () => {
      document.removeEventListener('click', () => {});
      window.removeEventListener('storage', syncState);
    }
  }, [])


  console.log(userData);


  return (
    <>
      <NotificationToastList setUserData={setUserData} notifications={userData.notifications} />
      <FeedModal setUserData={setUserData} editFeedObj={editFeedObj} setEditFeedObj={setEditFeedObj} />
      <SettingsModal userData={userData} setUserData={setUserData} />
      <BugReportModal setUserData={setUserData} />
      <ContextMenu setUserData={setUserData} userData={userData} editFeedObj={editFeedObj} setEditFeedObj={setEditFeedObj} />
      <AppNavBar />
      <main className="flex">
        <FeedListSideBar feedListData={userData.feedList} setUserData={setUserData} />
        <OutputList outputsData={userData.outputs} setUserData={setUserData} />
      </main>
      <NavBar notifications={userData.notifications} setUserData={setUserData} forcedNotif={forcedNotif} />
    </>
  )
}
