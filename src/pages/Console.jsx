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
  const [userData, setUserData] = useUserData();
  const [editFeedObj, setEditFeedObj] = useState({});


  useEffect(() => {
    document.title = 'Console';
    
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


    //  Autoupdate status receivers for notifying user
    
    window.electronAPI.receive('autoUpdate-ready', () => {
      setUserData((currentUserData) => ({
        ...currentUserData,
        notifications: [{
          "notificationId": crypto.randomUUID(),
          "timestamp": new Date().toISOString(),
          "title": "New MultiCast update available",
          "body": `Update will install automatically on next launch or you can <a onclick="window.electronAPI.send('exit-app')" class='text-text-shade hover:text-text cursor-pointer underline'>restart now</a>`,
          "status": "info"
        }, ...currentUserData.notifications]
      }))
    })
    window.electronAPI.receive('autoUpdate-error', (err) => {
      setUserData((currentUserData) => ({
        ...currentUserData,
        notifications: [{
          "notificationId": crypto.randomUUID(),
          "timestamp": new Date().toISOString(),
          "title": "Error during auto update",
          "body": err,
          "status": "danger"
        }, ...currentUserData.notifications]
      }))
    })
    
    

    return () => {
      document.removeEventListener('click', () => {});
      window.removeEventListener('storage', syncState);

      window.electronAPI.receive('autoUpdate-error', () => {});
      window.electronAPI.receive('autoUpdate-ready', () => {});
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
