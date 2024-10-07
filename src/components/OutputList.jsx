import { OutputCard } from "./OutputCard";


export function OutputList({ outputsData, setUserData }) {
  return (
    <section className="flex flex-col items-center w-full h-[calc(100vh-50px-33px)] overflow-auto">
      <div className="w-10/12 py-4">
        <div className="text-xxl flex items-center justify-between">
          <h1>Outputs</h1>
          <p className="text-xs">
            MultiCast V2.0 | Developed by <a onClick={() => window.electronAPI.send('openExternal', 'https://discord.com/users/693191740961718420')} className="text-text-shade hover:text-text cursor-pointer underline">Rage</a>
          </p>
        </div>
      </div>
      

      <div className="flex justify-center gap-10 pb-6 px-20 flex-wrap">
        {outputsData.map(outputData => {
          return (
            <OutputCard key={outputData.outputId} {...outputData} setUserData={setUserData} />
          )
        })}
      </div>
    </section>
  )
}