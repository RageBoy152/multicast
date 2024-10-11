//  React Hooks
import { useEffect } from "react";
import useUserData, { forcedNotif } from '../hooks/useUserData';


//  React Compontents
import { OutputCardPreview } from "../components/OutputCardPreview";
import { NotificationToastList } from "../components/NotificationToastList";
import { AppNavBar } from "../components/AppNavBar";



export default function Output() {
  const [userData, setUserData] = useUserData();


  // let outputId = new URL(window.location).searchParams.get('outputId');
  let outputId = window.location.hash.split('/output?outputId=')[1];
  let outputObj = userData.outputs.find(outputObj => outputObj.outputId == outputId)


  useEffect(() => {
    document.title = outputObj.outputName || 'Output';


    const syncState = (e) => {
      if (e.key === 'rage.multicast.config')
        setUserData(JSON.parse(e.newValue))
    }
    window.addEventListener('storage', syncState);


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
      window.removeEventListener('storage', syncState);

      window.electronAPI.receive('autoUpdate-error', () => {});
      window.electronAPI.receive('autoUpdate-ready', () => {});
    }
  }, [])

  
  console.log(userData)


  return (
    <>
      <AppNavBar />
      <NotificationToastList setUserData={setUserData} notifications={userData.notifications} />
      <OutputCardPreview outputFeeds={outputObj.feeds} {...outputObj} inOutput={true} setUserData={setUserData} userData={userData} />
    </>
  )
}
