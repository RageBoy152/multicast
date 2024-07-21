const settings = ["runOnStartup", "autoUpdate"]


function toggleSetting(settingKey) {
    ipcRenderer.send("toggleSetting",settingKey)
}


function getSettings() {
    settings.forEach(setting=>{
        ipcRenderer.send("getSetting",setting)
    })
}
getSettings()

ipcRenderer.on('getSettingResult',(e,data)=>{
    data = JSON.parse(data)
    console.log($(`#${data.setting}`)[0].checked)
    console.log(data.value)
    $(`#${data.setting}`)[0].checked = data.value
})