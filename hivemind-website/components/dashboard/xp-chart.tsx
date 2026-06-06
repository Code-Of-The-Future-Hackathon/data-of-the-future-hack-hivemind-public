export function XpChart({ logs }: { logs: any[] }) {
  // Group XP by day (Last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0] // YYYY-MM-DD
  })

  const data = days.map(date => {
    const dayLogs = logs.filter(l => l.createdAt.toISOString().startsWith(date))
    const totalXp = dayLogs.reduce((acc, l) => acc + l.xpGained, 0)
    return { date, xp: totalXp }
  })

  const maxVal = Math.max(...data.map(d => d.xp), 100) // Default scale 100

  return (
    <div className="flex items-end justify-between h-32 gap-2 mt-4">
      {data.map((item, i) => (
        <div key={item.date} className="flex flex-col items-center flex-1 h-full justify-end group">
            <div 
                className="w-full bg-blue-500 rounded-t-sm opacity-80 hover:opacity-100 transition-all relative"
                style={{ height: `${(item.xp / maxVal) * 100}%`, minHeight: '4px' }}
            >
                {/* Tooltip */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.xp} XP
                </span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-2">
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
        </div>
      ))}
    </div>
  )
}