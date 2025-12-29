import Hero from '@/components/Hero'
import Reliquary from '@/components/Reliquary'
import ChooseYourPath from '@/components/ChooseYourPath'
import RecentExcavations from '@/components/RecentExcavations'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with video background */}
      <Hero />
      
      {/* The Reliquary circular gem menu */}
      <Reliquary />
      
      {/* Choose Your Path - 3 Wing Cards */}
      <ChooseYourPath />
      
      {/* Recent Excavations - Latest products */}
      <RecentExcavations />
    </div>
  )
}