import { MapPin, Briefcase, Heart, Mail } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'

const PERKS = [
  { title: 'Remote-first',          desc: 'Work from anywhere with sane time-zone overlap. Hubs in Bangalore and Singapore for those who want an office.' },
  { title: 'Equity from day one',   desc: 'Every full-time hire gets meaningful equity with a 4-year vest, 1-year cliff. Refreshers every 2 years.' },
  { title: '$2,000/yr learning budget', desc: 'Conferences, books, courses, hardware. Whatever helps you ship better.' },
  { title: 'Mental health support', desc: 'Free counselling for you and your immediate family. No questions asked.' },
  { title: 'Real time off',         desc: '4 weeks paid + your local public holidays + an annual two-week shutdown so the whole team rests at the same time.' },
  { title: 'Top-tier hardware',     desc: 'Pick your machine — MacBook Pro, Linux workstation, ThinkPad. Plus monitor, chair, and any accessories you need.' },
]

const ROLES: { team: string; openings: { title: string; location: string }[] }[] = [
  {
    team: 'Engineering',
    openings: [
      { title: 'Senior Backend Engineer (Compute)',          location: 'Remote · India / SG' },
      { title: 'Senior Site Reliability Engineer',           location: 'Remote · India / EU' },
      { title: 'Distributed Systems Engineer (Networking)',  location: 'Remote · APAC' },
    ],
  },
  {
    team: 'Product',
    openings: [
      { title: 'Product Designer (Console)',                 location: 'Remote · APAC' },
    ],
  },
  {
    team: 'Customer',
    openings: [
      { title: 'Solutions Engineer',                         location: 'Remote · India / SG / AU' },
      { title: 'Technical Account Manager',                  location: 'Remote · India' },
    ],
  },
  {
    team: 'Operations',
    openings: [
      { title: 'Data Center Operations Engineer',            location: 'Mumbai · On-site' },
    ],
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />

      <section className="pt-32 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <span className="inline-block px-3 h-7 leading-7 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300">
          We're hiring
        </span>
        <h1 className="mt-6 text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
          Build the cloud with us
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          We're a small team shipping a lot. If you like writing software that runs at the lowest layer
          and care about doing it well, we'd love to hear from you.
        </p>
      </section>

      {/* Perks */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <h2 className="text-[24px] font-semibold tracking-tight mb-8 flex items-center gap-2">
          <Heart size={20} className="text-[#0070f3]" /> Perks &amp; benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERKS.map((p) => (
            <div
              key={p.title}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-1">{p.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <h2 className="text-[24px] font-semibold tracking-tight mb-8 flex items-center gap-2">
          <Briefcase size={20} className="text-[#0070f3]" /> Open roles
        </h2>
        <div className="space-y-8">
          {ROLES.map((g) => (
            <div key={g.team}>
              <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">{g.team}</h3>
              <div className="space-y-2">
                {g.openings.map((r) => (
                  <a
                    key={r.title}
                    href={`mailto:careers@netlayer.com?subject=${encodeURIComponent('Application: ' + r.title)}`}
                    className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] rounded-lg px-5 py-4 hover:bg-white/[0.04] hover:border-[#0070f3]/30 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-[#00d4ff] transition-colors">{r.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={10} /> {r.location}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 group-hover:text-[#00d4ff] transition-colors">Apply →</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <h3 className="text-lg font-medium text-white mb-2">Don't see your role?</h3>
        <p className="text-sm text-gray-400 mb-5">
          We're always open to hearing from exceptional people. Send us a note and we'll find a way to talk.
        </p>
        <a
          href="mailto:careers@netlayer.com"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff] hover:from-[#0080ff] hover:to-[#00a0ff] cursor-pointer transition-colors"
        >
          <Mail size={14} /> careers@netlayer.com
        </a>
      </section>

      <Footer />
    </div>
  )
}
