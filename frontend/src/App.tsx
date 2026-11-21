import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api } from './services/api'

type Profissional = { id: number; nome: string; especialidade: string; ativo: boolean }
type Procedimento = { id: number; nome: string; descricao?: string; duracaoMinutos: number; ativo: boolean }
type ModeloMensagem = { id: number; nome: string; conteudo: string; tipo: string; ativo: boolean }
type Agendamento = {
  id: number; pacienteNome: string; inicio: string; fim: string; status: string
  profissional?: Profissional; procedimento?: Procedimento
  profissionalId?: number; procedimentoId?: number
}
type Tab = 'inicio' | 'agenda' | 'profissionais' | 'procedimentos' | 'mensagens'

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
  const [appointmentForm, setAppointmentForm] = useState({
    pacienteNome: '', inicio: '', profissionalId: '', procedimentoId: ''
  })

  const loadData = useCallback(async () => {
    try {
      const [p, pr, a, m] = await Promise.all([
        api.get<Profissional[]>('/profissionais'),
        api.get<Procedimento[]>('/procedimentos'),
        api.get<Agendamento[]>('/agendamentos'),
        api.get<ModeloMensagem[]>('/mensagens')
      ])
      setProfissionais(p.data)
      setProcedimentos(pr.data)
      setAgendamentos(a.data)
      setMensagens(m.data)
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
    { id: 'profissionais', label: 'Profissionais' }, { id: 'procedimentos', label: 'Procedimentos' },
    { id: 'mensagens', label: 'Mensagens' }
  ]

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
          <form className="form-grid" onSubmit={e => submit(e, () => api.post('/agendamentos', {
            pacienteNome: appointmentForm.pacienteNome,
            inicio: appointmentForm.inicio,
            profissionalId: Number(appointmentForm.profissionalId),
            procedimentoId: Number(appointmentForm.procedimentoId)
          }), 'Agendamento criado com sucesso.')}>
            <label>Nome do paciente<input required maxLength={150} value={appointmentForm.pacienteNome} onChange={e => setAppointmentForm({...appointmentForm, pacienteNome:e.target.value})} /></label>
            <label>Data e horário<input required type="datetime-local" value={appointmentForm.inicio} onChange={e => setAppointmentForm({...appointmentForm, inicio:e.target.value})} /></label>
            <label>Profissional<select required value={appointmentForm.profissionalId} onChange={e => setAppointmentForm({...appointmentForm, profissionalId:e.target.value})}><option value="">Selecione</option>{profissionais.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} · {x.especialidade}</option>)}</select></label>
            <label>Procedimento<select required value={appointmentForm.procedimentoId} onChange={e => setAppointmentForm({...appointmentForm, procedimentoId:e.target.value})}><option value="">Selecione</option>{procedimentos.filter(x=>x.ativo).map(x=><option key={x.id} value={x.id}>{x.nome} · {x.duracaoMinutos} min</option>)}</select></label>
            <div className="form-actions"><button className="primary" disabled={apiStatus !== 'ok'}>Salvar agendamento</button></div>
          </form>
          <div className="section-divider" /><h2>Agenda cadastrada</h2>
          <AppointmentTable items={agendamentos.slice().sort((a,b)=>a.inicio.localeCompare(b.inicio))} onCancel={cancelAppointment}/>
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
          <h2>Novo procedimento</h2>
          <form className="form-grid" onSubmit={e => submit(e, () => api.post('/procedimentos', procedureForm), 'Procedimento cadastrado.')}>
            <label>Nome<input required maxLength={150} value={procedureForm.nome} onChange={e=>setProcedureForm({...procedureForm,nome:e.target.value})}/></label>
            <label>Duração (minutos)<input required type="number" min="5" max="1440" value={procedureForm.duracaoMinutos} onChange={e=>setProcedureForm({...procedureForm,duracaoMinutos:Number(e.target.value)})}/></label>
            <label className="full">Descrição<textarea maxLength={500} value={procedureForm.descricao} onChange={e=>setProcedureForm({...procedureForm,descricao:e.target.value})}/></label>
            <div className="form-actions"><button className="primary">Cadastrar procedimento</button></div>
          </form>
          <div className="section-divider"/><h2>Procedimentos cadastrados</h2>
          {procedimentos.length === 0 ? <Empty text="Nenhum procedimento cadastrado."/> : procedimentos.map(p=><div className="list-row" key={p.id}><span>{p.nome}<small>{p.descricao || 'Sem descrição'}</small></span><strong>{p.duracaoMinutos} min</strong></div>)}
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
  return <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Profissional</th><th>Procedimento</th><th>Início</th><th>Fim</th><th>Status</th><th></th></tr></thead><tbody>
    {items.map(x=><tr key={x.id}><td>{x.pacienteNome}</td><td>{x.profissional?.nome ?? `#${x.profissionalId ?? ''}`}</td><td>{x.procedimento?.nome ?? `#${x.procedimentoId ?? ''}`}</td><td>{new Date(x.inicio).toLocaleString('pt-BR')}</td><td>{new Date(x.fim).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td><td><span className={x.status==='Cancelado'?'status inactive':'status'}>{x.status}</span></td><td>{x.status!=='Cancelado'&&<button className="text-button" onClick={()=>onCancel(x.id)}>Cancelar</button>}</td></tr>)}
  </tbody></table></div>
}

function Empty({text}:{text:string}) { return <div className="empty">{text}</div> }

export default App
