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
    window.addEventListener('storage', syncState)


    return () => {
      window.removeEventListener('storage', syncState)
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
