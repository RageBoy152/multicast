import { useEffect, useState } from "react";



const defaultConfig = {
  "feedList": [
    {
      "feedId": "c9a55ea2-f911-4f21-8786-5d46e8853ef6",
      "feedName": "LP Multi Plex",
      "videoId": "EiKm0TgbVdg",
      "volume": "50"
    },
    {
      "feedId": "52a859c2-2159-41d5-a18f-c0c096bfc1c8",
      "feedName": "LP Cape Cam",
      "videoId": "uH1W01t_lGc",
      "volume": "50"
    }
  ],
  "outputs": [
    {
      "outputName": "Output A",
      "outputId": "6a09b3bd-7b6e-427d-8a03-ab24e48539de",
      "feedCount": 5,
      "feeds": [
        {
          "feedId": "b2f835f8-dab0-4fd6-8f28-ad482dd2971e",
          "feedName": "LP Rover 2",
          "videoId": "tS2PHJmvJzo",
          "volume": "50"
        },
        {
          "feedId": "32597360-c5bd-446f-bb9a-4464e4acc808",
          "feedName": "LP Saphire",
          "videoId": "LP3m2L_hkA4",
          "volume": "50"
        },
        {
          "feedId": "d20f58af-6dec-4ad6-995e-7dd6dbb67215",
          "feedName": "LP Rocket Ranch",
          "videoId": "qw3uaLRrYNY",
          "volume": "50"
        },
        {
          "feedId": "159c83ab-abee-4fd7-988c-22f3a1fa5552",
          "feedName": "NSF SBL",
          "videoId": "mhJRzQsLZGg",
          "volume": "50"
        },
        {
          "feedId": "53d66a35-6cb9-4d9a-bafc-69c4cf2abf6a",
          "feedName": "LP Rover 1",
          "videoId": "Rg7kw-KLDL8",
          "volume": "50"
        }
      ]
    },
    {
      "outputName": "Output B",
      "outputId": "ba9d2042-b8d9-46b9-a0fa-36ab2fd20d08",
      "feedCount": "9",
      "feeds": [
        {
          "feedId": "e687fcf2-22ef-4071-a64b-07b779accf38",
          "feedName": "LP Lab Cam",
          "videoId": "OWCh3wmKtak",
          "volume": "50"
        },
        {
          "feedId": "e637f95e-7594-453b-9878-4e3aeca03dbd",
          "feedName": "LP Nerdle",
          "videoId": "c212qMUTnEs",
          "volume": "50"
        },
        {
          "feedId": "bb775faa-ac42-4c05-a991-0676d73d0eb5",
          "feedName": "LP Sentinel",
          "videoId": "IQV0DlS1Ew0",
          "volume": "50"
        },
        {
          "feedId": "5ee44667-e6fb-4466-8580-1cd80adfd1e6",
          "feedName": "WAI Live",
          "videoId": "U3ERnA7MJuI",
          "volume": "50"
        },
        {},
        {
          "feedId": "8a4c505e-1b17-4975-a61e-8e84e092ff07",
          "feedName": "LP Gator Cam",
          "videoId": "FTw5xuq2swo",
          "volume": "50"
        },
        {},
        {},
        {
          "feedId": "d30ad1e7-62b8-4bc4-adbc-d9f86c805315",
          "feedName": "NSF SCL",
          "videoId": "Jm8wRjD3xVA",
          "volume": "50"
        }
      ]
    },
    {
      "outputName": "Output C",
      "outputId": "e4283b55-da6e-49a7-a55f-842858562a79",
      "feedCount": "1",
      "feeds": [
        {
          "feedId": "ed11b388-ba7c-43d3-bd57-8818c62e23d8",
          "feedName": "NSF McGregor",
          "videoId": "cOmmvhDQ2HM",
          "volume": "50"
        }
      ]
    }
  ],
  "notifications": [],
  "version": "2.0.9"
}



export const forcedNotif = {
  "notificationId": "forced-2025-10-31T184600Z",
  "timestamp": new Date().toISOString(),
  "title": "MultiCast V2.0.9 - Critical Bug Fix",
  "body": `Read the release notes <a onclick="window.electronAPI.send('openExternal', 'https://github.com/RageBoy152/multicast/releases/tag/2.0.9')" class='text-text-shade hover:text-text cursor-pointer underline'>here</a>`,
  "status": "info",
  "toasted": true
}

const version = "2.0.9";      //  APP VERSION VARIABLE - ALSO MANUALLY UPDATE PACKAGE.JSON


function getData() {
  let localStorageData = localStorage.getItem("rage.multicast.config");

  //  return local storage value or return initialValue or result of initialValue()
  if (localStorageData != null && JSON.parse(localStorageData).version) {
    return JSON.parse(localStorageData);
  }
  else {
    localStorage.setItem("rage.multicast.config", JSON.stringify(defaultConfig));
    return defaultConfig;
  }
}


export default function useUserData() {
  const [userData, setUserData] = useState(getData());


  //  save to local storage on update
  useEffect(() => {
    if (userData.version != version) {
      setUserData((currentUserData) => ({
        ...currentUserData,
        notifications: [forcedNotif, ...currentUserData.notifications],
        forcedNotifDismissed: false,
        version: version
      }))
    }


    localStorage.setItem("rage.multicast.config", JSON.stringify(userData));
  }, [userData])
  

  return [userData, setUserData];
}