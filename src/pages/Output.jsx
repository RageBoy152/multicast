//  React Hooks
import { useEffect } from "react";
import useUserData, { forcedNotif } from '../hooks/useUserData';


//  React Compontents
import { OutputCardPreview } from "../components/OutputCardPreview";
import { NotificationToastList } from "../components/NotificationToastList";
import { AppNavBar } from "../components/AppNavBar";



export default function Output() {
  const [userData, setUserData] = useUserData({});

  useEffect(() => {
    const syncState = (e) => {
      if (e.key === 'rage.multicast.config')
        setUserData(JSON.parse(e.newValue))
    }
    window.addEventListener('storage', syncState)


    return () => {
      window.removeEventListener('storage', syncState)
    }
  }, [])

  
  console.log(userData)


  let outputId = new URL(window.location).searchParams.get('outputId');
  let outputObj = userData.outputs.find(outputObj => outputObj.outputId == outputId)

  return (
    <>
      <AppNavBar />
      <NotificationToastList setUserData={setUserData} notifications={userData.notifications} />
      <OutputCardPreview outputFeeds={outputObj.feeds} {...outputObj} inOutput={true} setUserData={setUserData} userData={userData} />
    </>
  )
}
