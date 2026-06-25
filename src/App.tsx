import {useEffect,useMemo,useRef,useState,type ReactNode}from'react';
import{AlertTriangle,ArrowLeft,ArrowRight,BookOpen,Check,ChevronRight,CloudSun,Download,Edit3,Plane,LayoutGrid,ListChecks,Plus,RotateCcw,Search,Settings2,ShieldAlert,Trash2,Upload,X}from'lucide-react';
import{pinyin}from'pinyin-pro';
import{bootstrapData,db}from'./db';
import{APP_UPDATED_AT,APP_VERSION,emptyBaseOutputs,fieldLabels,newSession,operatorLabels,phases}from'./data';
import{activeRules,aggregatePhaseItems,windComponents}from'./rules';
import type{AppBackup,ConditionGroup,DisplayItem,EnvironmentData,EnvironmentField,EnvironmentRule,FlightSession,FlowItem,PhaseOutput,Severity,TrainingSubject}from'./types';

const uid=(prefix='id')=>prefix+'-'+crypto.randomUUID();
const now=()=>new Date().toISOString();
const clone=<T,>(v:T):T=>structuredClone(v);
const severityLabel:Record<Severity,string>={info:'信息',caution:'注意',critical:'关键'};
const numericFields=new Set(['temperature','windDirection','windSpeed','gust','visibility','runwayHeading','fuelTons','zeroFuelWeightTons','crosswind','headwind']);

function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className={'modal '+(wide?'modal-wide':'')}><header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="关闭"><X/></button></header><div className="modal-body">{children}</div></section></div>
}
function Pill({children,tone='muted'}:{children:ReactNode;tone?:string}){return <span className={'pill '+tone}>{children}</span>}

function OutputEditor({outputs,phaseId,onChange}:{outputs:PhaseOutput[];phaseId:string;onChange:(o:PhaseOutput[])=>void}){
 const output=outputs.find(o=>o.phaseId===phaseId)??{phaseId,items:[]};
 const setItems=(items:FlowItem[])=>{const rest=outputs.filter(o=>o.phaseId!==phaseId);onChange(items.length?[...rest,{phaseId,items}]:rest)};
 const patchItem=(id:string,patch:Partial<FlowItem>)=>setItems(output.items.map(x=>x.id===id?{...x,...patch}:x));
 return <div className="output-editor">
  <div className="editor-toolbar"><strong>本阶段内容</strong><button className="small-btn" onClick={()=>setItems([...output.items,{id:uid('item'),text:'',kind:'check',severity:'info',order:output.items.length}])}><Plus/>添加项目</button></div>
  {!output.items.length&&<div className="empty-mini">此阶段暂无内容</div>}
  {output.items.map((item,i)=><div className="edit-item" key={item.id}>
    <span className="drag-index">{i+1}</span>
    <select value={item.kind} onChange={e=>patchItem(item.id,{kind:e.target.value as FlowItem['kind']})}><option value="check">易忘项目</option><option value="risk">风险提示</option></select>
    <select value={item.severity} onChange={e=>patchItem(item.id,{severity:e.target.value as Severity})}><option value="info">信息</option><option value="caution">注意</option><option value="critical">关键</option></select>
    <input value={item.text} placeholder="输入提示内容" onChange={e=>patchItem(item.id,{text:e.target.value})}/>
    <button className="icon-btn danger" onClick={()=>setItems(output.items.filter(x=>x.id!==item.id))}><Trash2/></button>
  </div>)}
 </div>
}

function EnvironmentModal({value,onChange,onClose}:{value:EnvironmentData;onChange:(v:EnvironmentData)=>void;onClose:()=>void}){
 const set=(key:keyof EnvironmentData,raw:string,numeric=false)=>{const next={...value};if(raw==='')delete next[key];else (next as Record<string,unknown>)[key]=numeric?Number(raw):raw;onChange(next)};
 const clearEnvironment=()=>{const{aircraftType,fuelTons,zeroFuelWeightTons}=value;onChange({aircraftType,fuelTons,zeroFuelWeightTons})};
 const comp=windComponents(value);
 const mode=value.temperature===undefined?'未判定':value.temperature>30?'高温运行':value.temperature<=0?'冬季运行':'常规运行';
 const modeTone=mode==='高温运行'||mode==='冬季运行'?'caution':'active';
 return <Modal title="环境条件" onClose={onClose} wide><p className="hint">这里仅填写天气和跑道。字段均为选填；空字段不判断、不报错、不阻止推进。</p>
  <div className="mode-strip"><span>运行方式</span><Pill tone={modeTone}>{mode}</Pill><small>按气温自动判断：&gt;30℃ 高温；≤0℃ 冬季；其余常规。</small></div>
  <h3 className="form-section-title">天气</h3>
  <div className="form-grid">
   <label>机场<input value={value.airport??''} onChange={e=>set('airport',e.target.value)} placeholder="ZBAA"/></label>
   <label>气温 °C<input type="number" value={value.temperature??''} onChange={e=>set('temperature',e.target.value,true)} placeholder="31"/></label>
   <label>风向 °<input type="number" min="0" max="360" value={value.windDirection??''} onChange={e=>set('windDirection',e.target.value,true)} placeholder="180"/></label>
   <label>风速 kt<input type="number" min="0" value={value.windSpeed??''} onChange={e=>set('windSpeed',e.target.value,true)} placeholder="12"/></label>
   <label>阵风 kt<input type="number" min="0" value={value.gust??''} onChange={e=>set('gust',e.target.value,true)} placeholder="20"/></label>
   <label>能见度 m<input type="number" min="0" value={value.visibility??''} onChange={e=>set('visibility',e.target.value,true)} placeholder="400"/></label>
   <label>是否降水<select value={value.precipitation??''} onChange={e=>set('precipitation',e.target.value)}><option value="">未填写</option><option value="yes">有降水</option><option value="no">无降水</option></select></label>
   <label>需要除/防冰<select value={value.antiIceRequired??''} onChange={e=>set('antiIceRequired',e.target.value)}><option value="">未填写</option><option value="yes">需要</option><option value="no">不需要</option></select></label>
  </div>
  <h3 className="form-section-title">跑道</h3>
  <div className="form-grid">
   <label>跑道<input value={value.runway??''} onChange={e=>set('runway',e.target.value)} placeholder="18L"/></label>
   <label>跑道方向 °<input type="number" min="0" max="360" value={value.runwayHeading??''} onChange={e=>set('runwayHeading',e.target.value,true)} placeholder="180"/></label>
   <label>跑道代码<input value={value.runwayCode??''} onChange={e=>set('runwayCode',e.target.value)} placeholder="444"/></label>
   <label>刹车效应<select value={value.brakingAction??''} onChange={e=>set('brakingAction',e.target.value)}><option value="">未填写</option><option value="good">好</option><option value="medium">中</option><option value="poor">差</option></select></label>
  </div>
  {(comp.crosswind!==undefined||comp.headwind!==undefined)&&<div className="component-readout"><span>侧风 <strong>{comp.crosswind} kt</strong></span><span>{(comp.headwind??0)>=0?'顶风':'顺风'} <strong>{Math.abs(comp.headwind??0)} kt</strong></span></div>}
  <label className="full-label">备注<textarea value={value.notes??''} onChange={e=>set('notes',e.target.value)} placeholder="自由记录本次运行条件"/></label>
  <footer className="modal-actions"><button className="ghost-btn" onClick={clearEnvironment}>清空环境</button><button className="primary-btn" onClick={onClose}>完成</button></footer>
 </Modal>
}

function AircraftModal({value,onChange,onClose}:{value:EnvironmentData;onChange:(v:EnvironmentData)=>void;onClose:()=>void}){
 const set=(key:keyof EnvironmentData,raw:string,numeric=false)=>{const next={...value};if(raw==='')delete next[key];else (next as Record<string,unknown>)[key]=numeric?Number(raw):raw;onChange(next)};
 const clearAircraft=()=>{const next={...value};delete next.aircraftType;delete next.fuelTons;delete next.zeroFuelWeightTons;onChange(next)};
 const takeoffWeight=value.fuelTons!==undefined&&value.zeroFuelWeightTons!==undefined?Math.round((value.fuelTons+value.zeroFuelWeightTons)*10)/10:undefined;
 return <Modal title="飞机信息" onClose={onClose}><p className="hint">这里仅填写飞机和重量相关信息。后续大重量起飞、性能确认等风险提示会优先从这里取数据。</p>
  <div className="aircraft-summary"><Plane/><div><span>当前机型</span><b>{value.aircraftType||'未填写'}</b></div>{takeoffWeight!==undefined&&<Pill tone="info">预计起飞重量 {takeoffWeight} 吨</Pill>}</div>
  <div className="form-grid aircraft-form">
   <label>机型<input value={value.aircraftType??''} onChange={e=>set('aircraftType',e.target.value)} placeholder="A320"/></label>
   <label>油量 吨<input type="number" min="0" step="0.1" value={value.fuelTons??''} onChange={e=>set('fuelTons',e.target.value,true)} placeholder="8.5"/></label>
   <label>0 燃油重量 吨<input type="number" min="0" step="0.1" value={value.zeroFuelWeightTons??''} onChange={e=>set('zeroFuelWeightTons',e.target.value,true)} placeholder="56.0"/></label>
  </div>
  <div className="aircraft-note"><b>预留：</b>后面可以按“油量 + 0燃油重量”自动触发大重量起飞风险提示，阈值等你确定后再加。</div>
  <footer className="modal-actions"><button className="ghost-btn" onClick={clearAircraft}>清空飞机信息</button><button className="primary-btn" onClick={onClose}>完成</button></footer>
 </Modal>
}

function BaseEditor({outputs,onSave,onClose}:{outputs:PhaseOutput[];onSave:(v:PhaseOutput[])=>void;onClose:()=>void}){
 const[draft,setDraft]=useState(clone(outputs));const[phaseId,setPhaseId]=useState(phases[0].id);
 return <Modal title="正常流程模板" onClose={onClose} wide><p className="hint">在这里逐步补充21个阶段的正常易忘项目和风险提示。</p><div className="split-editor"><nav>{phases.map((p,i)=><button className={phaseId===p.id?'active':''} onClick={()=>setPhaseId(p.id)} key={p.id}><span>{String(i+1).padStart(2,'0')}</span>{p.name}<em>{draft.find(x=>x.phaseId===p.id)?.items.length??0}</em></button>)}</nav><main><h3>{phases.find(p=>p.id===phaseId)?.name}</h3><OutputEditor outputs={draft} phaseId={phaseId} onChange={setDraft}/></main></div><footer className="modal-actions"><button className="ghost-btn" onClick={onClose}>取消</button><button className="primary-btn" onClick={()=>onSave(draft)}>保存模板</button></footer></Modal>
}

function RulesModal({rules,onSave,onClose}:{rules:EnvironmentRule[];onSave:(v:EnvironmentRule[])=>void;onClose:()=>void}){
 const[list,setList]=useState(clone(rules));const[selected,setSelected]=useState<string|null>(list[0]?.id??null);const rule=list.find(r=>r.id===selected);const[phaseId,setPhaseId]=useState(phases[3].id);
 const patch=(patch:Partial<EnvironmentRule>)=>setList(v=>v.map(r=>r.id===selected?{...r,...patch,updatedAt:now()}:r));
 const addRule=()=>{const r:EnvironmentRule={id:uid('rule'),name:'新环境规则',enabled:false,groups:[{id:uid('group'),conditions:[{id:uid('condition'),field:'temperature',operator:'gte',value:''}]}],outputs:[],updatedAt:now()};setList([...list,r]);setSelected(r.id)};
 const patchGroup=(groupId:string,group:ConditionGroup)=>patch({groups:rule!.groups.map(g=>g.id===groupId?group:g)});
 return <Modal title="环境规则" onClose={onClose} wide><div className="manager">
  <aside><button className="primary-btn fill" onClick={addRule}><Plus/>新建规则</button>{list.map(r=><button key={r.id} onClick={()=>setSelected(r.id)} className={'manager-row '+(selected===r.id?'active':'')}><span><i className={r.enabled?'dot on':'dot'}/>{r.name}</span><ChevronRight/></button>)}</aside>
  <main>{rule?<><div className="title-edit"><input value={rule.name} onChange={e=>patch({name:e.target.value})}/><label className="switch"><input type="checkbox" checked={rule.enabled} onChange={e=>patch({enabled:e.target.checked})}/><span/>启用</label><button className="icon-btn danger" onClick={()=>{setList(list.filter(r=>r.id!==rule.id));setSelected(list.find(r=>r.id!==rule.id)?.id??null)}}><Trash2/></button></div>
   <h3>触发条件</h3><p className="hint">组内全部满足（并且），不同组之间任一满足（或者）。空字段不会命中。</p>
   {rule.groups.map((g,gi)=><div className="condition-group" key={g.id}><b>{gi?'或者':'当'}</b>{g.conditions.map((c,ci)=><div className="condition-row" key={c.id}>
    {ci>0&&<span>并且</span>}<select value={c.field} onChange={e=>patchGroup(g.id,{...g,conditions:g.conditions.map(x=>x.id===c.id?{...x,field:e.target.value as EnvironmentField}:x)})}>{Object.entries(fieldLabels).filter(([k])=>k!=='notes').map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>
    <select value={c.operator} onChange={e=>patchGroup(g.id,{...g,conditions:g.conditions.map(x=>x.id===c.id?{...x,operator:e.target.value as never}:x)})}>{Object.entries(operatorLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>
    <input value={c.value} onChange={e=>patchGroup(g.id,{...g,conditions:g.conditions.map(x=>x.id===c.id?{...x,value:numericFields.has(c.field)&&e.target.value!==''?Number(e.target.value):e.target.value}:x)})}/>
    <button className="icon-btn danger" onClick={()=>patchGroup(g.id,{...g,conditions:g.conditions.filter(x=>x.id!==c.id)})}><X/></button>
   </div>)}<div className="inline-actions"><button className="small-btn" onClick={()=>patchGroup(g.id,{...g,conditions:[...g.conditions,{id:uid('condition'),field:'temperature',operator:'gte',value:''}]})}><Plus/>并且条件</button>{rule.groups.length>1&&<button className="text-danger" onClick={()=>patch({groups:rule.groups.filter(x=>x.id!==g.id)})}>删除此组</button>}</div></div>)}
   <button className="small-btn" onClick={()=>patch({groups:[...rule.groups,{id:uid('group'),conditions:[{id:uid('condition'),field:'temperature',operator:'gte',value:''}]}]})}><Plus/>或者条件组</button>
   <div className="phase-select-row"><h3>命中后加入</h3><select value={phaseId} onChange={e=>setPhaseId(e.target.value)}>{phases.map((p,i)=><option value={p.id} key={p.id}>{i+1}. {p.name}</option>)}</select></div>
   <OutputEditor outputs={rule.outputs} phaseId={phaseId} onChange={outputs=>patch({outputs})}/>
  </>:<div className="empty-state">新建一条环境规则开始配置</div>}</main>
 </div><footer className="modal-actions"><button className="ghost-btn" onClick={onClose}>取消</button><button className="primary-btn" onClick={()=>onSave(list)}>保存规则</button></footer></Modal>
}

function searchText(subject:TrainingSubject){const source=[subject.name,...subject.aliases,...subject.keywords].join(' ');return(source+' '+pinyin(source,{toneType:'none'})+' '+pinyin(source,{pattern:'first',toneType:'none'})).toLowerCase()}
function SubjectsModal({subjects,active,onActivate,onResolve,onSave,onClose}:{subjects:TrainingSubject[];active:FlightSession['activeSubjects'];onActivate:(id:string)=>void;onResolve:(id:string)=>void;onSave:(v:TrainingSubject[])=>void;onClose:()=>void}){
 const[list,setList]=useState(clone(subjects));const[q,setQ]=useState('');const[editId,setEditId]=useState<string|null>(null);const[phaseId,setPhaseId]=useState(phases[0].id);const edit=list.find(x=>x.id===editId);
 const results=useMemo(()=>{const s=q.trim().toLowerCase();return list.filter(x=>!s||searchText(x).includes(s)).sort((a,b)=>{if(!s)return a.name.localeCompare(b.name,'zh');const aa=searchText(a),bb=searchText(b);return Number(bb.startsWith(s))-Number(aa.startsWith(s))||a.name.localeCompare(b.name,'zh')})},[list,q]);
 const patch=(p:Partial<TrainingSubject>)=>setList(v=>v.map(x=>x.id===editId?{...x,...p,updatedAt:now()}:x));
 const create=()=>{const s:TrainingSubject={id:uid('subject'),name:'新科目',aliases:[],keywords:[],description:'',outputs:[],createdAt:now(),updatedAt:now()};setList([...list,s]);setEditId(s.id)};
 if(edit)return <Modal title="编辑模拟机科目" onClose={()=>setEditId(null)} wide><div className="subject-form"><label>科目名称<input value={edit.name} onChange={e=>patch({name:e.target.value})}/></label><label>别名（逗号分隔）<input value={edit.aliases.join(', ')} onChange={e=>patch({aliases:e.target.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean)})}/></label><label>关键词（逗号分隔）<input value={edit.keywords.join(', ')} onChange={e=>patch({keywords:e.target.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean)})}/></label><label className="full-label">说明<textarea value={edit.description} onChange={e=>patch({description:e.target.value})}/></label></div><div className="phase-select-row"><h3>按阶段配置内容</h3><select value={phaseId} onChange={e=>setPhaseId(e.target.value)}>{phases.map((p,i)=><option key={p.id} value={p.id}>{i+1}. {p.name}</option>)}</select></div><OutputEditor outputs={edit.outputs} phaseId={phaseId} onChange={outputs=>patch({outputs})}/><footer className="modal-actions"><button className="ghost-btn" onClick={()=>{setList(list.filter(x=>x.id!==edit.id));setEditId(null)}}><Trash2/>删除</button><button className="primary-btn" onClick={()=>setEditId(null)}>完成编辑</button></footer></Modal>;
 return <Modal title="模拟机科目中心" onClose={onClose} wide><div className="subject-head"><div className="search-box"><Search/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索中文、缩写、关键词或拼音首字母"/></div><button className="primary-btn" onClick={create}><Plus/>新建科目</button></div>
  {!!active.length&&<section className="active-subjects"><h3>当前训练</h3>{active.map(a=>{const s=list.find(x=>x.id===a.subjectId);return s&&<div className={'active-subject '+a.status} key={a.subjectId}><span><ShieldAlert/><b>{s.name}</b><Pill tone={a.status==='active'?'critical':'done'}>{a.status==='active'?'已激活':'已处置'}</Pill></span>{a.status==='active'&&<button className="small-btn" onClick={()=>onResolve(a.subjectId)}>标记已处置</button>}</div>})}</section>}
  <div className="subject-results">{results.map(s=>{const state=active.find(a=>a.subjectId===s.id);return <article key={s.id}><div><h3>{s.name}</h3>{s.description&&<p>{s.description}</p>}<small>{[...s.aliases,...s.keywords].join(' · ')||'暂无别名或关键词'}</small></div><div className="card-actions"><button className="icon-btn" onClick={()=>setEditId(s.id)}><Edit3/></button><button className="icon-btn" onClick={()=>{const copy={...clone(s),id:uid('subject'),name:s.name+' 副本',createdAt:now(),updatedAt:now()};setList([...list,copy]);setEditId(copy.id)}} aria-label="复制"><BookOpen/></button>{!state?<button className="primary-btn" onClick={()=>confirm('激活科目「'+s.name+'」？')&&onActivate(s.id)}>激活</button>:<Pill tone={state.status==='active'?'critical':'done'}>{state.status==='active'?'进行中':'已处置'}</Pill>}</div></article>})}</div>
  <footer className="modal-actions"><span className="save-note">科目修改在点击保存后写入本机</span><button className="primary-btn" onClick={()=>{onSave(list);onClose()}}>保存科目库</button></footer>
 </Modal>
}

function Overview({session,base,rules,subjects,onSelect}:{session:FlightSession;base:PhaseOutput[];rules:EnvironmentRule[];subjects:TrainingSubject[];onSelect:(i:number)=>void}){
 const matched=activeRules(rules,session.environment);const activeList=subjects.filter(s=>session.activeSubjects.some(a=>a.subjectId===s.id&&a.status==='active'));
 return <div className="overview"><div className="overview-summary"><div><span>航班进程</span><strong>{session.completedPhaseIds.length}<small>/21</small></strong></div><div className="progress-ring" style={{'--progress':(session.completedPhaseIds.length/21*360)+'deg'} as React.CSSProperties}/><p>当前阶段<br/><b>{phases[session.currentPhaseIndex].name}</b></p></div><div className="phase-grid">{phases.map((p,i)=>{const items=aggregatePhaseItems(p.id,base,matched,activeList),risks=items.filter(x=>x.kind==='risk'),done=session.completedPhaseIds.includes(p.id),current=i===session.currentPhaseIndex;return <button key={p.id} className={'phase-card '+(done?'done ':'')+(current?'current':'')} onClick={()=>onSelect(i)}><header><span>{String(i+1).padStart(2,'0')}</span>{done&&<Check/>}</header><h3>{p.name}</h3><footer><span>{items.filter(x=>x.kind==='check').length} 项</span>{risks.some(x=>x.severity==='critical')?<Pill tone="critical">关键</Pill>:risks.length?<Pill tone="caution">{risks.length} 风险</Pill>:<span className="quiet">无提示</span>}</footer></button>})}</div></div>
}

export default function App(){
 const[loading,setLoading]=useState(true),[session,setSession]=useState<FlightSession>(newSession()),[rules,setRules]=useState<EnvironmentRule[]>([]),[subjects,setSubjects]=useState<TrainingSubject[]>([]),[base,setBase]=useState<PhaseOutput[]>(emptyBaseOutputs),[view,setView]=useState<'current'|'overview'>('current'),[viewPhaseIndex,setViewPhaseIndex]=useState(0),[modal,setModal]=useState<string|null>(null),[showIncomplete,setShowIncomplete]=useState(false);const importRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{(async()=>{await bootstrapData();const saved=(await db.sessions.get('current'))!;setSession(saved);setViewPhaseIndex(saved.currentPhaseIndex);setRules(await db.rules.toArray());setSubjects(await db.subjects.toArray());setBase((await db.settings.get('baseOutputs'))?.value??emptyBaseOutputs);setLoading(false)})()},[]);
 const saveSession=async(next:FlightSession)=>{const v={...next,updatedAt:now()};setSession(v);await db.sessions.put(v)};
 const matched=useMemo(()=>activeRules(rules,session.environment),[rules,session.environment]);
 const activeSubjectRecords=useMemo(()=>subjects.filter(s=>session.activeSubjects.some(a=>a.subjectId===s.id&&a.status==='active')),[subjects,session.activeSubjects]);
 const phase=phases[Math.max(0,Math.min(20,viewPhaseIndex))],currentPhase=phases[session.currentPhaseIndex],viewingCurrent=viewPhaseIndex===session.currentPhaseIndex;
 const items=useMemo(()=>aggregatePhaseItems(phase.id,base,matched,activeSubjectRecords),[phase.id,base,matched,activeSubjectRecords]);
 const currentItems=useMemo(()=>aggregatePhaseItems(currentPhase.id,base,matched,activeSubjectRecords),[currentPhase.id,base,matched,activeSubjectRecords]);
 const riskItems=items.filter(x=>x.kind==='risk'),checkItems=items.filter(x=>x.kind==='check');
 const currentCheckItems=currentItems.filter(x=>x.kind==='check'),incomplete=currentCheckItems.filter(x=>!session.checked[x.checkKey]);
 const operationMode=session.environment.temperature===undefined?'未判定':session.environment.temperature>30?'高温运行':session.environment.temperature<=0?'冬季运行':'常规运行';
 const showOperationMode=operationMode==='常规运行'||operationMode==='未判定'||!matched.some(r=>r.name===operationMode);
 const previewPhase=(index:number)=>{setViewPhaseIndex(Math.max(0,Math.min(20,index)));setView('current')};
 const returnToCurrent=()=>previewPhase(session.currentPhaseIndex);
 const renderItem=(item:DisplayItem)=><article className={'flow-item '+item.kind+' '+item.severity+(session.checked[item.checkKey]?' checked':'')+(!viewingCurrent&&item.kind==='check'?' readonly':'')} key={item.checkKey} onClick={()=>viewingCurrent&&item.kind==='check'&&saveSession({...session,checked:{...session.checked,[item.checkKey]:!session.checked[item.checkKey]}})}>{item.kind==='check'?<button className="checkbox">{session.checked[item.checkKey]&&<Check/>}</button>:<div className="risk-icon">{item.severity==='critical'?<ShieldAlert/>:<AlertTriangle/>}</div>}<div><div className="item-meta"><span>{item.kind==='check'?'易忘项目':severityLabel[item.severity]+'风险'}</span>{item.sources.map(s=><Pill key={s} tone={s==='正常流程'?'muted':item.severity}>{s}</Pill>)}</div><p>{item.text||'未填写内容'}</p></div></article>;
 const go=(index:number,force=false)=>{if(index>session.currentPhaseIndex&&incomplete.length&&!force){setShowIncomplete(true);return}const nextIndex=Math.max(0,Math.min(20,index));const completed=new Set(session.completedPhaseIds);if(index>session.currentPhaseIndex)completed.add(currentPhase.id);saveSession({...session,currentPhaseIndex:nextIndex,completedPhaseIds:[...completed]});setViewPhaseIndex(nextIndex)};
 const exportData=async()=>{const data:AppBackup={version:1,exportedAt:now(),session,baseOutputs:base,rules,subjects};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='flight-flow-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)};
 const importData=async(file:File)=>{try{const data=JSON.parse(await file.text())as AppBackup;if(data.version!==1||!Array.isArray(data.rules)||!Array.isArray(data.subjects))throw new Error();const merge=confirm('按“确定”合并科目和规则；按“取消”将完全覆盖现有数据。');const nextRules=merge?[...new Map([...rules,...data.rules].map(x=>[x.id,x])).values()]:data.rules;const nextSubjects=merge?[...new Map([...subjects,...data.subjects].map(x=>[x.id,x])).values()]:data.subjects;await db.transaction('rw',[db.rules,db.subjects,db.sessions,db.settings],async()=>{await db.rules.clear();await db.rules.bulkPut(nextRules);await db.subjects.clear();await db.subjects.bulkPut(nextSubjects);await db.sessions.put(data.session);await db.settings.put({key:'baseOutputs',value:data.baseOutputs})});setRules(nextRules);setSubjects(nextSubjects);setSession(data.session);setBase(data.baseOutputs);alert('导入完成')}catch{alert('无法导入：文件格式或版本不正确')}};
 if(loading)return <div className="splash"><img src={import.meta.env.BASE_URL+'icon.svg'}/><h1>Flight Flow</h1><span>正在恢复进程…</span></div>;
 return <div className="app-shell">
  <aside className="rail"><div className="brand"><img src={import.meta.env.BASE_URL+'icon.svg'}/><div><b>FLIGHT FLOW</b><span>v{APP_VERSION} · {APP_UPDATED_AT}</span></div></div><nav>{phases.map((p,i)=><button title={p.name} key={p.id} className={(i===viewPhaseIndex?'active ':'')+(i===session.currentPhaseIndex?'current-exec ':'')+(session.completedPhaseIds.includes(p.id)?'done':'')} onClick={()=>previewPhase(i)}><span>{session.completedPhaseIds.includes(p.id)?<Check/>:String(i+1).padStart(2,'0')}</span><em>{p.name}</em></button>)}</nav></aside>
  <main className="workspace"><header className="topbar"><div className="segmented"><button className={view==='current'?'active':''} onClick={()=>setView('current')}><ListChecks/>当前阶段</button><button className={view==='overview'?'active':''} onClick={()=>setView('overview')}><LayoutGrid/>总览</button></div><div className="top-actions"><button onClick={()=>setModal('environment')}><CloudSun/>环境条件{matched.length>0&&<b>{matched.length}</b>}</button><button onClick={()=>setModal('aircraft')}><Plane/>飞机信息</button><button onClick={()=>setModal('subjects')}><ShieldAlert/>模拟机科目{session.activeSubjects.filter(x=>x.status==='active').length>0&&<b>{session.activeSubjects.filter(x=>x.status==='active').length}</b>}</button><button className="icon-btn" onClick={()=>setModal('settings')}><Settings2/></button></div></header>
   {view==='overview'?<Overview session={session} base={base} rules={rules} subjects={subjects} onSelect={previewPhase}/>:<div className="current-view">
    <section className="stage-hero"><div><span className="eyebrow">PHASE {String(viewPhaseIndex+1).padStart(2,'0')} / 21 · {phase.group}</span><h1>{phase.name}</h1><div className="status-row"><Pill tone={viewingCurrent?'active':'info'}>{viewingCurrent?'当前阶段':'查看阶段'}</Pill>{!viewingCurrent&&<Pill tone="active">当前执行：{currentPhase.name}</Pill>}{showOperationMode&&<Pill tone={operationMode==='常规运行'?'active':'caution'}>{operationMode}</Pill>}{matched.map(r=><Pill tone={r.outputs.some(o=>o.items.some(i=>i.severity==='critical'))?'critical':'caution'} key={r.id}>{r.name}</Pill>)}{activeSubjectRecords.map(s=><Pill tone="critical" key={s.id}>{s.name}</Pill>)}</div></div><div className="stage-progress"><span>{Math.round((session.currentPhaseIndex+1)/21*100)}%</span><div><i style={{width:(session.currentPhaseIndex+1)/21*100+'%'}}/></div></div></section>
    <section className="content-panel"><div className="panel-head"><div><h2>本阶段提示</h2><span>{checkItems.filter(x=>session.checked[x.checkKey]).length} / {checkItems.length} 已完成</span></div><button className="small-btn" onClick={()=>setModal('base')}><Edit3/>编辑正常流程</button></div>
     {!items.length?<div className="empty-state"><div><ListChecks/></div><h3>本阶段还没有提示</h3><p>可编辑正常流程，或通过环境规则和模拟机科目自动加入内容。</p><button className="primary-btn" onClick={()=>setModal('base')}><Plus/>添加第一项</button></div>:<div className="item-list separated-list">{riskItems.length>0&&<section className="item-section risk-section"><h3><ShieldAlert/>风险提示</h3>{riskItems.map(renderItem)}</section>}{checkItems.length>0&&<section className="item-section check-section"><h3><ListChecks/>易忘提醒</h3>{checkItems.map(renderItem)}</section>}</div>}
    </section>
    <footer className="stage-nav">{viewingCurrent?<button className="ghost-btn" disabled={session.currentPhaseIndex===0} onClick={()=>go(session.currentPhaseIndex-1)}><ArrowLeft/>上一阶段</button>:<button className="ghost-btn" onClick={returnToCurrent}>回到当前阶段</button>}{viewingCurrent?<button className="primary-btn next" onClick={()=>session.currentPhaseIndex===20?saveSession({...session,completedPhaseIds:[...new Set([...session.completedPhaseIds,currentPhase.id])] }):go(session.currentPhaseIndex+1)}>{session.currentPhaseIndex===20?'完成全部阶段':'完成并进入下一阶段'}{session.currentPhaseIndex<20&&<ArrowRight/>}</button>:<span className="preview-note">正在查看其它阶段，不会改变完成进度</span>}</footer>
   </div>}
  </main>
  {modal==='environment'&&<EnvironmentModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='aircraft'&&<AircraftModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='base'&&<BaseEditor outputs={base} onClose={()=>setModal(null)} onSave={async v=>{setBase(v);await db.settings.put({key:'baseOutputs',value:v});setModal(null)}}/>}
  {modal==='rules'&&<RulesModal rules={rules} onClose={()=>setModal(null)} onSave={async v=>{setRules(v);await db.rules.clear();await db.rules.bulkPut(v);setModal(null)}}/>}
  {modal==='subjects'&&<SubjectsModal subjects={subjects} active={session.activeSubjects} onClose={()=>setModal(null)} onActivate={id=>saveSession({...session,activeSubjects:[...session.activeSubjects,{subjectId:id,status:'active',activatedAt:now()}]})} onResolve={id=>saveSession({...session,activeSubjects:session.activeSubjects.map(a=>a.subjectId===id?{...a,status:'resolved',resolvedAt:now()}:a)})} onSave={async v=>{setSubjects(v);await db.subjects.clear();await db.subjects.bulkPut(v)}}/>}
  {modal==='settings'&&<Modal title="设置与数据" onClose={()=>setModal(null)}><div className="settings-list"><button onClick={()=>setModal('rules')}><CloudSun/><span><b>环境规则</b><small>{rules.length} 条规则 · {rules.filter(r=>r.enabled).length} 条启用</small></span><ChevronRight/></button><button onClick={exportData}><Download/><span><b>导出完整备份</b><small>进度、模板、规则与科目库</small></span><ChevronRight/></button><button onClick={()=>importRef.current?.click()}><Upload/><span><b>导入备份</b><small>支持合并或完全覆盖</small></span><ChevronRight/></button><button className="danger-row" onClick={()=>confirm('开始新航班？当前执行进度和勾选记录将被清空。')&&saveSession(newSession())}><RotateCcw/><span><b>新建航班</b><small>保留规则和科目库</small></span><ChevronRight/></button></div><input ref={importRef} hidden type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&importData(e.target.files[0])}/></Modal>}
  {showIncomplete&&<Modal title="还有未完成项目" onClose={()=>setShowIncomplete(false)}><div className="warning-callout"><AlertTriangle/><p>本阶段还有 <b>{incomplete.length}</b> 个易忘项目未勾选。你仍然可以继续。</p></div><ul className="incomplete-list">{incomplete.map(x=><li key={x.checkKey}><span>{x.text}</span><small>{x.sources.join(' · ')}</small></li>)}</ul><footer className="modal-actions"><button className="ghost-btn" onClick={()=>setShowIncomplete(false)}>返回检查</button><button className="danger-btn" onClick={()=>{setShowIncomplete(false);go(session.currentPhaseIndex+1,true)}}>确认继续<ArrowRight/></button></footer></Modal>}
 </div>
}
