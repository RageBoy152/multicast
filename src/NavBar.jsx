export function NavBar() {
  return (
    <nav className="bg-primary border-b border-b-accent flex justify-end items-center gap-5 px-20 h-[50px]">
      <a href="#" className="font-Orbitron justify-self-start mr-auto h-min text-l">MultiCast <span className=" text-text-shade text-xs">V2.0</span></a>
      <a href="#" className="text-text-shade hover:text-text h-min text-base"><i className="bi bi-bell"></i></a>
      <a href="#" className="text-text-shade hover:text-text h-min text-base"><i className="bi bi-gear"></i></a>
    </nav>
  )
}