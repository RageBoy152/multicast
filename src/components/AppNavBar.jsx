export function AppNavBar() {

  function winMin() { window.electronAPI.send('win-min'); }
  function winMax() { window.electronAPI.send('win-max'); }
  function winClose() { window.electronAPI.send('win-close'); }

  return (
    <nav className="bg-primary border-b border-b-secondary/50 flex justify-end items-center gap-1 ps-8 h-[33px] drag">
      <a className="font-Orbitron justify-self-start mr-auto h-min text-base text-text-shade select-none">MultiCast
      <span className=" text-text-shade text-xs">V2.0</span>
      </a>
      <a onClick={winMin} className="text-text-shade hover:text-text hover:bg-secondary/25 text-base no-drag cursor-pointer w-[33px] aspect-square flex items-center justify-center"><i className="bi bi-dash-lg text-sm"></i></a>
      <a onClick={winMax} className="text-text-shade hover:text-text hover:bg-secondary/25 text-base no-drag cursor-pointer w-[33px] aspect-square flex items-center justify-center"><i className="bi bi-square text-sm"></i></a>
      <a onClick={winClose} className="text-text-shade hover:text-text hover:bg-red-500/80 text-base no-drag cursor-pointer w-[33px] aspect-square flex items-center justify-center"><i className="bi bi-x-lg text-sm"></i></a>
    </nav>
  )
}