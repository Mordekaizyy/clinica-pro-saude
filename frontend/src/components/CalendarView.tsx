import { useMemo, useState } from 'react'

export type CalProfissional = { id: number; nome: string; especialidade: string; ativo: boolean }
export type CalAgendamento = {
  id: number; pacienteNome: string; inicio: string; fim: string; status: string
  profissionalId?: number; profissional?: { id: number; nome: string }; procedimento?: { nome: string }
}

// Expediente: segunda a sábado, 08:00–18:00, intervalos de 30 minutos.
const HORA_INICIO = 8
const HORA_FIM = 18
const SLOT_MINUTOS = 30
const DIAS_SEMANA = 6

const DIA_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = (d.getDay() + 6) % 7 // segunda = 0
  d.setDate(d.getDate() - diff)
  return d
}

function addMinutes(date: Date, minutes: number) { return new Date(date.getTime() + minutes * 60000) }

const pad = (n: number) => String(n).padStart(2, '0')
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Props = {
  profissionais: CalProfissional[]
  agendamentos: CalAgendamento[]
  onPickSlot: (profissionalId: number, inicio: string) => void
}

export function CalendarView({ profissionais, agendamentos, onPickSlot }: Props) {
  const ativos = profissionais.filter(p => p.ativo)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [profId, setProfId] = useState<string>(() => ativos[0] ? String(ativos[0].id) : '')

  const days = useMemo(() => Array.from({ length: DIAS_SEMANA }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  const slots = useMemo(() => {
    const list: { h: number; m: number }[] = []
    for (let t = HORA_INICIO * 60; t < HORA_FIM * 60; t += SLOT_MINUTOS) list.push({ h: Math.floor(t / 60), m: t % 60 })
    return list
  }, [])

  const ativosAg = useMemo(() => agendamentos
    .filter(a => a.status !== 'Cancelado')
    .filter(a => !profId || (a.profissionalId ?? a.profissional?.id) === Number(profId))
    .map(a => ({ ...a, ini: new Date(a.inicio), end: new Date(a.fim) })), [agendamentos, profId])

  const now = new Date()
  const weekEnd = addMinutes(days[DIAS_SEMANA - 1], 24 * 60)
  const totalSemana = ativosAg.filter(a => a.ini >= weekStart && a.ini < weekEnd).length
  let livresSemana = 0

  const shiftWeek = (n: number) => { const d = new Date(weekStart); d.setDate(d.getDate() + n * 7); setWeekStart(d) }
  const isToday = (d: Date) => d.toDateString() === now.toDateString()

  const grid = slots.map(({ h, m }) => days.map(day => {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
    const end = addMinutes(start, SLOT_MINUTOS)
    const overlap = ativosAg.filter(a => a.ini < end && a.end > start)
    const past = end <= now
    if (!overlap.length && !past && profId) livresSemana++
    return { start, overlap, past }
  }))

  return (
    <div className="calendar">
      <div className="calendar-toolbar">
        <div className="week-nav">
          <button type="button" onClick={() => shiftWeek(-1)} aria-label="Semana anterior">‹</button>
          <button type="button" className="today" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button>
          <button type="button" onClick={() => shiftWeek(1)} aria-label="Próxima semana">›</button>
          <strong>{days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {days[DIAS_SEMANA - 1].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
        </div>
        <label className="calendar-filter">Profissional
          <select value={profId} onChange={e => setProfId(e.target.value)}>
            <option value="">Todos (somente agendamentos)</option>
            {ativos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="calendar-legend">
        <span><i className="lg busy" />Agendado ({totalSemana})</span>
        {profId && <span><i className="lg free" />Disponível ({livresSemana})</span>}
        <span><i className="lg past" />Encerrado</span>
        <small>Expediente: Seg–Sáb, {pad(HORA_INICIO)}:00–{pad(HORA_FIM)}:00</small>
      </div>

      <div className="calendar-scroll">
        <div className="calendar-grid" style={{ gridTemplateColumns: `64px repeat(${DIAS_SEMANA}, minmax(120px, 1fr))` }}>
          <div className="cal-head corner" />
          {days.map((d, i) => <div key={i} className={`cal-head ${isToday(d) ? 'is-today' : ''}`}>
            <span>{DIA_LABEL[i]}</span><strong>{pad(d.getDate())}</strong>
          </div>)}

          {grid.map((row, r) => [
            <div key={`t${r}`} className="cal-time">{pad(slots[r].h)}:{pad(slots[r].m)}</div>,
            ...row.map((cell, c) => {
              const key = `${r}-${c}`
              if (cell.overlap.length) {
                return <div key={key} className="cal-cell">
                  {cell.overlap.map(a => {
                    const starts = a.ini >= cell.start && a.ini < addMinutes(cell.start, SLOT_MINUTOS)
                    return <div key={a.id} className={`cal-event ${starts ? '' : 'cont'}`} title={`${a.pacienteNome} · ${a.procedimento?.nome ?? ''}`}>
                      {starts ? <>
                        <strong>{a.pacienteNome}</strong>
                        <span>{a.ini.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}–{a.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {a.procedimento?.nome}</span>
                        {!profId && <em>{a.profissional?.nome}</em>}
                      </> : <span>↳ {a.pacienteNome}</span>}
                    </div>
                  })}
                </div>
              }
              if (cell.past) return <div key={key} className="cal-cell past" />
              if (!profId) return <div key={key} className="cal-cell" />
              return <div key={key} className="cal-cell">
                <button type="button" className="cal-free" onClick={() => onPickSlot(Number(profId), toLocalInput(cell.start))}>
                  Livre <span>+ agendar</span>
                </button>
              </div>
            })
          ])}
        </div>
      </div>
      {!ativos.length && <div className="empty" style={{ marginTop: 16 }}>Cadastre um profissional para visualizar horários disponíveis.</div>}
    </div>
  )
}
