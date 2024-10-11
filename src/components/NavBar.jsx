import { NotificationDropdown } from './NotificationDropdown';
import { toggleModal } from '../utils/toggleModal';

import Astrolytics from 'astrolytics-desktop';


export function NavBar({ notifications, setUserData, forcedNotif }) {

  function toggleNotificationsDropdown() {
    $('#notifications-container').fadeToggle(200);
  }



  return (
    <nav className="bg-primary border-t border-t-accent flex justify-end items-center gap-10 px-20 h-[50px] absolute w-full bottom-0">
      <NotificationDropdown notifications={notifications} setUserData={setUserData} forcedNotif={forcedNotif} />
      <a onClick={() => {Astrolytics.track('notifications-navbar-link-pressed'); toggleNotificationsDropdown()}} id="notifications-dropdown-btn" className="text-text-shade hover:text-text h-min text-base cursor-pointer"><i className="bi bi-bell"></i></a>
      <a onClick={() => {Astrolytics.track('bug-navbar-link-pressed'); toggleModal('bug-report-modal-container')}} className="text-text-shade hover:text-text h-min text-base cursor-pointer"><i className="bi bi-bug"></i></a>
      <a onClick={() => {Astrolytics.track('settings-navbar-link-pressed'); toggleModal('settings-modal-container')}} className="text-text-shade hover:text-text h-min text-base cursor-pointer"><i className="bi bi-gear"></i></a>
    </nav>
  )
}