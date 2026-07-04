import { useEffect, useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { Today } from './screens/Today'
import { Stats } from './screens/Stats'
import { Missions } from './screens/Missions'
import { Profile } from './screens/Profile'
import { ensureProfile } from './db/schema'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')

  useEffect(() => {
    void ensureProfile()
    // Ask the browser to protect IndexedDB from eviction
    if (navigator.storage?.persist) {
      void navigator.storage.persist()
    }
  }, [])

  return (
    <div
      className="mx-auto max-w-md"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
      }}
    >
      {tab === 'today' && <Today />}
      {tab === 'stats' && <Stats />}
      {tab === 'missions' && <Missions />}
      {tab === 'profile' && <Profile />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
