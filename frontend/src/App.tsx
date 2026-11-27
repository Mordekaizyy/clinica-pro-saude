import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api } from './services/api'
import { CalendarView } from './components/CalendarView'

type Profissional = { id: number; nome: string; especialidade: string; ativo: boolean }
type Procedimento = { id: number; nome: string; descricao?: string; duracaoMinutos: number; ativo: boolean }
type ModeloMensagem = { id: number; nome: string; conteudo: string; tipo: string; ativo: boolean }
type Agendamento = {
  id: number; pacienteNome: string; inicio: string; fim: string; status: string
  pacienteTelefone?: string; convenio?: boolean; numeroCarteirinha?: string
  profissional?: Profissional; procedimento?: Procedimento
  profissionalId?: number; procedimentoId?: number
}
type Vinculo = { profissionalId: number; procedimentoId: number }
type Tab = 'inicio' | 'agenda' | 'calendario' | 'profissionais' | 'procedimentos' | 'mensagens'

const emptyAppointment = { pacienteNome: '', pacienteTelefone: '', convenio: false, numeroCarteirinha: '', inicio: '', profissionalId: '', procedimentoId: '' }

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const emptyProfessional = { nome: '', especialidade: '', ativo: true }
const emptyProcedure = { nome: '', descricao: '', duracaoMinutos: 30, ativo: true }
const emptyMessage = { nome: '', conteudo: 'Olá, {paciente}! Sua consulta está confirmada para {data} às {hora}.', tipo: 'Confirmacao', ativo: true }

function App() {
  const [tab, setTab] = useState<Tab>('inicio')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [mensagens, setMensagens] = useState<ModeloMensagem[]>([])
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [professionalForm, setProfessionalForm] = useState(emptyProfessional)
  const [procedureForm, setProcedureForm] = useState(emptyProcedure)
  const [messageForm, setMessageForm] = useState(emptyMessage)
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment)
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [procTab, setProcTab] = useState<'cadastro' | 'vinculos'>('cadastro')
  const [linkProfId, setLinkProfId] = useState('')
  const [linkSelection, setLinkSelection] = useState<number[]>([])

  const loadData = useCallback(async () => {
    try {
      const [p, pr, a, m, v] = await Promise.all([
        api.get<Profissional[]>('/profissionais'),
        api.get<Procedimento[]>('/procedimentos'),
        api.get<Agendamento[]>('/agendamentos'),
        api.get<ModeloMensagem[]>('/mensagens'),
        api.get<Vinculo[]>('/profissionais/vinculos')
      ])
      setProfissionais(p.data)
      setProcedimentos(pr.data)
      setAgendamentos(a.data)
      setMensagens(m.data)
      setVinculos(v.data)
      setApiStatus('ok')
      setError('')
    } catch {
      setApiStatus('error')
      setError('Não foi possível conectar à API. Confira se o backend e o PostgreSQL estão em execução.')
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  async function submit(event: FormEvent, action: () => Promise<unknown>, message: string) {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(message)
      await loadData()
    } catch (e: any) {
      const apiMessage = e?.response?.data
      setError(typeof apiMessage === 'string' ? apiMessage : 'Não foi possível salvar. Verifique os dados e tente novamente.')
    }
  }

  const navItems: { id: Tab; label: string }[] = [
    { id: 'inicio', label: 'Visão geral' }, { id: 'agenda', label: 'Agendamentos' },
    { id: 'calendario', label: 'Calendário' },
    { id: 'profissionais', label: 'Profissionais' }, { id: 'procedimentos', label: 'Procedimentos' },
    { id: 'mensagens', label: 'Mensagens' }
  ]

  const procedimentosDoProfissional = appointmentForm.profissionalId
    ? procedimentos.filter(p => p.ativo && vinculos.some(v => v.profissionalId === Number(appointmentForm.profissionalId) && v.procedimentoId === p.id))
    : []

  function selectLinkProfessional(id: string) {
    setLinkProfId(id)
    setLinkSelection(vinculos.filter(v => v.profissionalId === Number(id)).map(v => v.procedimentoId))
  }

  function toggleLink(procId: number) {
    setLinkSelection(s => s.includes(procId) ? s.filter(x => x !== procId) : [...s, procId])
  }

  function pickSlot(profissionalId: number, inicio: string) {
    setAppointmentForm({ ...emptyAppointment, profissionalId: String(profissionalId), inicio })
    setTab('agenda'); setError(''); setSuccess('')
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand-mark">+</div>
        <div className="brand"><strong>Pró Saúde</strong><span>Gestão clínica</span></div>
        <nav>{navItems.map(item =>
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setError(''); setSuccess('') }}>
            {item.label}
          </button>
        )}</nav>
        <div className="sidebar-footer">MVP · Ambiente local</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
            <h1>{navItems.find(x => x.id === tab)?.label}</h1>
            <p>Clínica Pró Saúde · gerenciamento de atendimentos</p>
          </div>
          <div className={`connection ${apiStatus}`}><span className="dot" />
            {apiStatus === 'ok' ? 'API conectada' : apiStatus === 'error' ? 'API indisponível' : 'Conectando...'}
          </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {tab === 'inicio' && <section>
          <div className="stats">
            <article className="stat-card"><span>Profissionais</span><strong>{profissionais.length}</strong><small>Cadastros realizados</small></article>
            <article className="stat-card"><span>Procedimentos</span><strong>{procedimentos.length}</strong><small>Tipos de atendimento</small></article>
            <article className="stat-card"><span>Agendamentos</span><strong>{agendamentos.filter(x => x.status !== 'Cancelado').length}</strong><small>Não cancelados</small></article>
          </div>
          <section className="panel">
            <div className="panel-heading"><div><h2>Próximos agendamentos</h2><p>Registros ordenados por horário.</p></div><button className="primary small" onClick={() => setTab('agenda')}>Novo agendamento</button></div>
            <AppointmentTable items={agendamentos.slice().sort((a,b) => a.inicio.localeCompare(b.inicio)).slice(0,6)} onCancel={cancelAppointment} />
          </section>
          <div className="two-columns">
            <section className="panel"><h2>Comece por aqui</h2><p>Cadastre profissionais e procedimentos antes de registrar consultas.</p><div className="quick-actions"><button onClick={() => setTab('profissionais')}>Cadastrar profissional</button><button onClick={() => setTab('procedimentos')}>Cadastrar procedimento</button></div></section>
            <section className="panel"><h2>Como funciona</h2><p>Ao criar um agendamento, o sistema calcula automaticamente o horário final pela duração do procedimento e impede sobreposição para o mesmo profissional.</p></section>
          </div>
        </section>}

        {tab === 'agenda' && <section className="panel">
          <h2>Novo agendamento</h2><p>O horário final é calculado automaticamente pelo sistema.</p>
          <form className="form-grid" onSubmit={e => submit(e, async () => {
            await api.post('/agendamentos', {
              pacienteNome: appointmentForm.pacienteNome,
              pacienteTelefone: appointmentForm.pacienteTelefone,
              convenio: appointmentForm.convenio,
              numeroCarteirinha: appointmentForm.convenio ? appointmentForm.numeroCarteirinha : null,
              inicio: appointmentForm.inicio,
              profissionalId: Number(appointmentForm.profissionalId),
              procedimentoId: Number(appointmentForm.procedimentoId)
            })
            setAppointmentForm(emptyAppointment)
          }, 'Agendamento criado com sucesso.')}>
            <label>Nome do paciente<input required maxLength={150} value={appointmentForm.pacienteNome} onChange={e => setAppointmentForm({...appointmentForm, pacienteNome:e.target.value})} /></label>
            <label>Telefone<input required type="tel" placeholder="(11) 91234-5678" minLength={14} maxLength={15} value={appointmentForm.pacienteTelefone} onChange={e => setAppointmentForm({...appointmentForm, pacienteTelefone:formatPhone(e.target.value)})} /></label>
            <div className="field">
              <span className="field-label">Convênio médico?</span>
              <div className="segmented" role="radiogroup">
                <button type="button" role="radio" aria-checked={!appointmentForm.convenio} className={!appointmentForm.convenio ? 'on' : ''} onClick={() => setAppointmentForm({...appointmentForm, convenio:false, numeroCarteirinha:''})}>Não</button>
                <button type="button" role="radio" aria-checked={appointmentForm.convenio} className={appointmentForm.convenio ? 'on' : ''} onClick={() => setAppointmentForm({...appointmentForm, convenio:true})}>Sim</button>
              </div>
            </div>
            {appointmentForm.convenio
              ? <label className="reveal">Número da carteirinha<input required maxLength={50} value={appointmentForm.numeroCarteirinha} onChange={e => setAppointmentForm({...appointmentForm, numeroCarteirinha:e.target.value})} /></label>
              : <div />}
            <label>Profissional<select required value={appointmentForm.profissionalId} onChange={e => setAppointmentForm({...appointmentForm, profissionalId:e.target.value, procedimentoId:''})}><option value="">Selecione</option>{profissionais.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} · {x.especialidade}</option>)}</select></label>
            <label>Procedimento<select required disabled={!appointmentForm.profissionalId} value={appointmentForm.procedimentoId} onChange={e => setAppointmentForm({...appointmentForm, procedimentoId:e.target.value})}>
              <option value="">{!appointmentForm.profissionalId ? 'Selecione o profissional primeiro' : procedimentosDoProfissional.length ? 'Selecione' : 'Nenhum procedimento vinculado'}</option>
              {procedimentosDoProfissional.map(x=><option key={x.id} value={x.id}>{x.nome} · {x.duracaoMinutos} min</option>)}
            </select>
            {appointmentForm.profissionalId && !procedimentosDoProfissional.length && <span className="hint">Vincule procedimentos em Procedimentos › Vínculos.</span>}
            </label>
            <label>Data e horário<input required type="datetime-local" value={appointmentForm.inicio} onChange={e => setAppointmentForm({...appointmentForm, inicio:e.target.value})} /></label>
            <div className="form-actions"><button className="primary" disabled={apiStatus !== 'ok'}>Salvar agendamento</button></div>
          </form>
          <div className="section-divider" /><h2>Agenda cadastrada</h2>
          <AppointmentTable items={agendamentos.slice().sort((a,b)=>a.inicio.localeCompare(b.inicio))} onCancel={cancelAppointment}/>
        </section>}

        {tab === 'calendario' && <section className="panel">
          <div className="panel-heading"><div><h2>Agenda semanal</h2><p>Visualize os agendamentos e clique em um horário livre para agendar.</p></div></div>
          <CalendarView profissionais={profissionais} agendamentos={agendamentos} onPickSlot={pickSlot} />
        </section>}

        {tab === 'profissionais' && <section className="panel">
          <h2>Novo profissional</h2>
          <form className="form-grid" onSubmit={e => submit(e, () => api.post('/profissionais', professionalForm), 'Profissional cadastrado.')}>
            <label>Nome<input required maxLength={150} value={professionalForm.nome} onChange={e=>setProfessionalForm({...professionalForm,nome:e.target.value})}/></label>
            <label>Especialidade<input maxLength={100} value={professionalForm.especialidade} onChange={e=>setProfessionalForm({...professionalForm,especialidade:e.target.value})}/></label>
            <div className="form-actions"><button className="primary">Cadastrar profissional</button></div>
          </form>
          <div className="section-divider"/><h2>Profissionais cadastrados</h2>
          {profissionais.length === 0 ? <Empty text="Nenhum profissional cadastrado."/> : profissionais.map(p=><div className="list-row" key={p.id}><span>{p.nome}<small>{p.especialidade || 'Especialidade não informada'}</small></span><span className={p.ativo?'status':'status inactive'}>{p.ativo?'Ativo':'Inativo'}</span></div>)}
        </section>}

        {tab === 'procedimentos' && <section className="panel">
          <div className="subtabs" role="tablist">
            <button role="tab" aria-selected={procTab==='cadastro'} className={procTab==='cadastro'?'on':''} onClick={()=>setProcTab('cadastro')}>Cadastro</button>
            <button role="tab" aria-selected={procTab==='vinculos'} className={procTab==='vinculos'?'on':''} onClick={()=>setProcTab('vinculos')}>Vínculos com profissionais</button>
          </div>

          {procTab === 'cadastro' && <>
          <h2>Novo procedimento</h2>
          <form className="form-grid" onSubmit={e => submit(e, () => api.post('/procedimentos', procedureForm), 'Procedimento cadastrado.')}>
            <label>Nome<input required maxLength={150} value={procedureForm.nome} onChange={e=>setProcedureForm({...procedureForm,nome:e.target.value})}/></label>
            <label>Duração (minutos)<input required type="number" min="5" max="1440" value={procedureForm.duracaoMinutos} onChange={e=>setProcedureForm({...procedureForm,duracaoMinutos:Number(e.target.value)})}/></label>
            <label className="full">Descrição<textarea maxLength={500} value={procedureForm.descricao} onChange={e=>setProcedureForm({...procedureForm,descricao:e.target.value})}/></label>
            <div className="form-actions"><button className="primary">Cadastrar procedimento</button></div>
          </form>
          <div className="section-divider"/><h2>Procedimentos cadastrados</h2>
          {procedimentos.length === 0 ? <Empty text="Nenhum procedimento cadastrado."/> : procedimentos.map(p=>{
            const nomes = vinculos.filter(v=>v.procedimentoId===p.id).map(v=>profissionais.find(x=>x.id===v.profissionalId)?.nome).filter(Boolean)
            return <div className="list-row" key={p.id}><span>{p.nome}<small>{p.descricao || 'Sem descrição'}{nomes.length ? ` · ${nomes.join(', ')}` : ' · sem profissional vinculado'}</small></span><strong>{p.duracaoMinutos} min</strong></div>
          })}
          </>}

          {procTab === 'vinculos' && <>
            <h2>Vincular procedimentos a um profissional</h2>
            <p>Somente os procedimentos marcados aparecerão no agendamento desse profissional.</p>
            <form className="form-grid" onSubmit={e => submit(e, () => api.put(`/profissionais/${linkProfId}/procedimentos`, linkSelection), 'Vínculos atualizados.')}>
              <label className="full">Profissional<select required value={linkProfId} onChange={e=>selectLinkProfessional(e.target.value)}><option value="">Selecione</option>{profissionais.map(x=><option key={x.id} value={x.id}>{x.nome}{x.especialidade ? ` · ${x.especialidade}` : ''}</option>)}</select></label>
              {linkProfId && <div className="full">
                {procedimentos.length === 0 ? <Empty text="Nenhum procedimento cadastrado."/> : <div className="check-grid">
                  {procedimentos.map(p => <label key={p.id} className={`check-card ${linkSelection.includes(p.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={linkSelection.includes(p.id)} onChange={()=>toggleLink(p.id)} />
                    <span><strong>{p.nome}</strong><small>{p.duracaoMinutos} min{p.ativo ? '' : ' · inativo'}</small></span>
                  </label>)}
                </div>}
              </div>}
              <div className="form-actions"><button className="primary" disabled={!linkProfId}>Salvar vínculos ({linkSelection.length})</button></div>
            </form>
          </>}
        </section>}

        {tab === 'mensagens' && <section className="panel">
          <h2>Novo modelo de mensagem</h2><p>Os campos entre chaves são marcadores para personalização futura.</p>
          <form className="form-grid" onSubmit={e => submit(e, () => api.post('/mensagens', messageForm), 'Modelo de mensagem salvo.')}>
            <label>Nome do modelo<input required maxLength={100} value={messageForm.nome} onChange={e=>setMessageForm({...messageForm,nome:e.target.value})}/></label>
            <label>Tipo<select value={messageForm.tipo} onChange={e=>setMessageForm({...messageForm,tipo:e.target.value})}><option value="Confirmacao">Confirmação</option><option value="Lembrete">Lembrete</option><option value="Cancelamento">Cancelamento</option></select></label>
            <label className="full">Conteúdo<textarea required maxLength={2000} rows={4} value={messageForm.conteudo} onChange={e=>setMessageForm({...messageForm,conteudo:e.target.value})}/></label>
            <div className="hint full">Marcadores disponíveis na proposta: {'{paciente}'}, {'{data}'}, {'{hora}'}, {'{procedimento}'}, {'{profissional}'}.</div>
            <div className="form-actions"><button className="primary">Salvar modelo</button></div>
          </form>
          <div className="section-divider"/><h2>Modelos cadastrados</h2>
          {mensagens.length === 0 ? <Empty text="Nenhum modelo de mensagem cadastrado."/> : mensagens.map(m=><div className="message-card" key={m.id}><div><strong>{m.nome}</strong><span className="tag">{m.tipo}</span></div><p>{m.conteudo}</p></div>)}
        </section>}
        <footer>Clínica Pró Saúde · MVP para validação local</footer>
      </section>
    </main>
  )

  async function cancelAppointment(id: number) {
    if (!window.confirm('Deseja cancelar este agendamento?')) return
    try { await api.patch(`/agendamentos/${id}/cancelar`); setSuccess('Agendamento cancelado.'); await loadData() }
    catch { setError('Não foi possível cancelar o agendamento.') }
  }
}

function AppointmentTable({items,onCancel}:{items:Agendamento[];onCancel:(id:number)=>void}) {
  if (!items.length) return <Empty text="Nenhum agendamento cadastrado ainda."/>
  return <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Telefone</th><th>Convênio</th><th>Profissional</th><th>Procedimento</th><th>Início</th><th>Fim</th><th>Status</th><th></th></tr></thead><tbody>
    {items.map(x=><tr key={x.id}><td>{x.pacienteNome}</td><td>{x.pacienteTelefone || '—'}</td><td>{x.convenio ? <span className="tag">Sim · {x.numeroCarteirinha}</span> : 'Não'}</td><td>{x.profissional?.nome ?? `#${x.profissionalId ?? ''}`}</td><td>{x.procedimento?.nome ?? `#${x.procedimentoId ?? ''}`}</td><td>{new Date(x.inicio).toLocaleString('pt-BR')}</td><td>{new Date(x.fim).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td><td><span className={x.status==='Cancelado'?'status inactive':'status'}>{x.status}</span></td><td>{x.status!=='Cancelado'&&<button className="text-button" onClick={()=>onCancel(x.id)}>Cancelar</button>}</td></tr>)}
  </tbody></table></div>
}

function Empty({text}:{text:string}) { return <div className="empty">{text}</div> }

export default App
