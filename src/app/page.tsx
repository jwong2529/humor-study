import { supabase } from '@/types/supabase'

export default async function ListPage() {
  const { data: rows, error } = await supabase
    .from('captions')
    .select('*')

  if (error) {
    return (
      <div className="p-8 min-h-screen bg-[#0f172a] text-white">
        <h1 className="text-2xl font-bold text-red-400">Error</h1>
        <p className="mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 w-full">
      <main className="p-8 lg:p-12 max-w-7xl mx-auto">
        <header className="mb-12 border-b border-slate-700 pb-8">
          <h1 className="text-4xl font-black tracking-tight text-white">Database Explorer</h1>
          <p className="text-blue-400 mt-2 text-lg font-medium">Supabase Table: <span className="text-blue-200 underline decoration-blue-500/50 underline-offset-4">captions</span></p>
        </header>

        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          {rows?.map((row, index) => (
            <div 
              key={row.id || index} 
              className="group bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="bg-[#334155] px-6 py-4 flex justify-between items-center">
                <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Record Entry</span>
                <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/20">
                  ID: {row.id || index}
                </span>
              </div>
              
              <div className="p-8 space-y-6">
                {Object.entries(row).map(([key, value]) => {
                  if (key === 'id') return null;
                  return (
                    <div key={key} className="relative pl-6 border-l-2 border-slate-700 hover:border-blue-500 transition-colors">
                      <span className="absolute -left-[1.25rem] top-2 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                      <span className="block text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2">
                        {key}
                      </span>
                      <div className="text-white text-lg leading-relaxed font-medium">
                        {typeof value === 'object' ? (
                          <pre className="text-sm bg-[#0f172a] p-4 rounded-xl border border-slate-800 text-blue-100 overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {(!rows || rows.length === 0) && (
          <div className="text-center py-32 bg-[#1e293b] border-2 border-dashed border-slate-700 rounded-3xl">
            <p className="text-slate-500 text-2xl font-bold italic tracking-tight">No data detected in table.</p>
          </div>
        )}
      </main>
    </div>
  )
}
