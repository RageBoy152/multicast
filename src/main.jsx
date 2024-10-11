import { StrictMode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import Console from './pages/Console.jsx'
import Output from './pages/Output.jsx'
import '../defaultStyles.css'



//  ANALYTICS

import Astrolytics from 'astrolytics-desktop';

Astrolytics.init('6708e68a76ab3658de0ec9ea');

window.electronAPI.invoke("get-app-version").then((version) => {
  Astrolytics.setProps({
    version: version
  })
})






createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Console />}></Route>
        <Route path="/output" element={<Output />}></Route>
      </Routes>
    </HashRouter>
  // </StrictMode>
)
