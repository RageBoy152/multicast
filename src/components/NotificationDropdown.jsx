import { useEffect } from 'react';
import { Notification } from './Notification';



export function NotificationDropdown({ notifications, setUserData, forcedNotif }) {

  function calcTimeAgo(timestamp) {
    let notiTime = new Date(timestamp);
      let currentTime = new Date();

      let timeDifference = currentTime - notiTime;

      let s = Math.floor(timeDifference / 1000);
      let m = Math.floor(s / 60);
      let h = Math.floor(m / 60);
      let d = Math.floor(h / 24);

      return { s, m, h, d }
  }


  function removeOldNotifs() {
    let filteredNotificationsArray = notifications.filter(notificationObj => {
      let { s,m,h,d } = calcTimeAgo(notificationObj.timestamp);

      if (s < 86400) return notificationObj;
    })


    if (filteredNotificationsArray != notifications) {
      setUserData((currentUserData) => ({
        ...currentUserData,
        notifications: [...filteredNotificationsArray]
      }))
    }
  }


  //  useEffect to check for old notifications
  useEffect(() => {
    removeOldNotifs();
    let oldcheckInterval = window.setInterval(removeOldNotifs, 900000);   // check for old notifs every 15 mins

    let refreshInterval = window.setInterval(() => {
        if ($('#settings-modal-container')[0].style.display == 'none') {
          // refresh user data for new time ago str every minute
          setUserData((currentUserData) => ({
            ...currentUserData
          }))
        }
    }, 60000)
      


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
      window.clearInterval(oldcheckInterval);
      window.clearInterval(refreshInterval);
      window.electronAPI.receive('autoUpdate-error', () => {});
      window.electronAPI.receive('autoUpdate-ready', () => {});
    }
  }, [])
  
  

  return (
    <div id="notifications-container" className="bg-primary absolute bottom-[50px] mr-28 w-3/12 max-h-80 z-50 flex flex-col-reverse" style={{display: "none"}}>
      <div className="flex flex-col py-1 px-3 border-t border-accent">
        <p className='h-[25px]'>Notifications</p>
        <p className="text-xs text-text-shade">Deleted automatically after 24 hours.</p>
      </div>
      <div className="flex flex-col gap-1 overflow-auto">
        {notifications.length ? notifications.map(notification => <Notification key={notification.notificationId} {...notification} setUserData={setUserData} forcedNotif={forcedNotif} timeAgo={calcTimeAgo(notification.timestamp)} />) : <p className='text-text-shade text-center text-sm py-4'>No notifications</p>}
      </div>
    </div>
  )
}