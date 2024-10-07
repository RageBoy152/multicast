import { useEffect, useState } from 'react';
import { toggleModal } from '../utils/toggleModal';
import { logs, errors, warns, debugs } from '../utils/logConsoleActivity';



export function BugReportModal({ setUserData }) {  
  const [consoleValue, setConsoleValue] = useState({});
  const [submitting, setSubmitting] = useState(false);



  function toggleModalHandler() {
    toggleModal('bug-report-modal-container', () => {
      $('#bugDescription')[0].value = '';
      $('#contactInfo')[0].value = '';
      setConsoleValue({});
      setSubmitting(false)
    });
  }


  function prepBugReport(e) {
    setConsoleValue({
      logs: logs,
      errors: errors,
      warns: warns,
      debugs: debugs
    })
  }


  useEffect(() => {
    if (consoleValue.logs) {
      setSubmitting(true)
      submitForm($('#bug-report-form')[0])
    }
  }, [consoleValue])



  function submitForm(form) {
    const formData = {
      description: form.bugDescription.value,
      contact: form.contactInfo.value,
      console: consoleValue
    }

    window.electronAPI.send('bug-report', formData);

    window.electronAPI.receive('bug-report-res', (res) => {
      setUserData((currentUserData) => ({
        ...currentUserData,
        notifications: [{
          "notificationId": crypto.randomUUID(),
          "timestamp": new Date().toISOString(),
          "title": res ? 'Error sending bug report via SMTP' : 'Bug report sent.',
          "body": res ? res.message : 'Thanks for helping make MultiCast better :)',
          "status": res ? 'error' : 'success'
        }, ...currentUserData.notifications]
      }))

      toggleModalHandler();
    })
  }


  
  return (
    <div onMouseDown={(e)=>{if (e.target.id == "bug-report-modal-container" && !submitting) toggleModalHandler()}} id="bug-report-modal-container" className="bg-black/25 flex items-top justify-center absolute z-[60] w-full h-full" style={{display: "none"}}>
      <div className="bg-primary border border-secondary px-2 flex flex-col items-center mt-24 w-1/3 h-min">
        <div className="border-b border-accent px-3 py-3 flex justify-between items-center w-full">
          <h3 className="text-xl">Report a Bug</h3>
          <a className="cursor-pointer text-text-shade hover:text-text" onClick={(e) => !submitting && toggleModalHandler(e)}><i className="bi bi-x-lg"></i></a>
        </div>
        <form className="flex w-11/12 flex-col gap-5 py-4" id='bug-report-form'>
          <input type="hidden" name="form-name" value="bug-report-form" />

          <div className="flex flex-col gap-1">
            <label htmlFor="bugDescription">Brief or detailed description</label>
            <textarea name="bugDescription" id="bugDescription" className='bg-secondary px-2 py-1 resize-none h-[120px]'></textarea>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="contactInfo">How can we get back to you? (optional)</label>
            <input type="text" name="contactInfo" id="contactInfo" className='bg-secondary p-2' />
          </div>

          <div className="flex-col gap-1 hidden">
            <label htmlFor="console">Console (automated)</label>
            <input type="text" name="console" id="console" className='bg-secondary p-2' value={JSON.stringify(consoleValue)} />
          </div>

          <div className="flex justify-end gap-4 border-t border-accent pt-4">
            <a className="bg-secondary hover:bg-secondary/80 cursor-pointer p-2 px-5" onClick={(e) => !submitting && toggleModalHandler(e)}>Cancel</a>
            <a className="bg-accent hover:bg-accent/80 cursor-pointer p-2 px-5 flex items-center gap-2" onClick={prepBugReport}>Submit Bug Report {submitting && <div className='loader'></div>}</a>
          </div>
        </form>
      </div>
    </div>
  )
}