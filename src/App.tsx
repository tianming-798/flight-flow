import {useEffect,useMemo,useRef,useState,type ReactNode}from'react';
import{AlertTriangle,ArrowLeft,ArrowRight,BookOpen,Check,ChevronRight,CloudSun,Download,Edit3,Plane,LayoutGrid,ListChecks,Plus,RotateCcw,Search,Settings2,ShieldAlert,Trash2,Upload,X}from'lucide-react';
import{pinyin}from'pinyin-pro';
import{bootstrapData,db}from'./db';
import{APP_UPDATED_AT,APP_VERSION,changelog,emptyBaseOutputs,f1GuidePhases,fieldLabels,newSession,operatorLabels,phases}from'./data';
import{activeRules,aggregatePhaseItems,windComponents}from'./rules';
import type{AppBackup,ConditionGroup,DisplayItem,EnvironmentData,EnvironmentField,EnvironmentRule,F1FlightInfo,FlightSession,FlowItem,PhaseOutput,Severity,TrainingSubject}from'./types';

const uid=(prefix='id')=>prefix+'-'+crypto.randomUUID();
const now=()=>new Date().toISOString();
const clone=<T,>(v:T):T=>structuredClone(v);
const severityLabel:Record<Severity,string>={info:'信息',caution:'注意',critical:'关键'};
const numericFields=new Set(['temperature','windDirection','windSpeed','gust','visibility','runwayHeading','fuelTons','zeroFuelWeightTons','crosswind','headwind']);
const airportNameByCode:Record<string,string>={TFU:'天府',CTU:'双流',YNT:'烟台'};
const aircraftTailTypeMap=Object.fromEntries([
 ...['6327','6326','6363','6383','6385','6555','6593','6595','6596','6597','6605','1816','1855','9919','6961','6973','6361','6362','6365','6382','6386','6556','6599','6603','6631','6632','6823','1876','1637','1639','1638','6665','6675','6711','6712','6701','6633'].map(t=>[t,'A321-213']),
 ...['301E','1067','305F','30AF','30C5','30D9','305H','305G','30AG','30C6'].map(t=>[t,'A321-271N']),
 ...['325M','325N','326D','327U','32A1','328N','32CD','325A','326X','327T','329V','326C','32CC','32C9','32A2'].map(t=>[t,'A321-251NX']),
 ...['32LE','32ME','32NE','32NF','32NC','32NV','32NW','32ND','32PH','32PL','32NU','32PJ','32PK','326U','327R','30FY','323Q','327S'].map(t=>[t,'A321-252NX']),
 ...['32NJ','32NX','32LD','32M1','32NG','32NH'].map(t=>[t,'A319-153N']),
 ...['6034','6035','6036','6037','6038','6044','6046','2364','6004','6014','6047','6223','6225','6226','6227','6228','6237','6238','6468','6478','6479'].map(t=>[t,'A319-115']),
 ...['8319'].map(t=>[t,'A319']),
 ...['6032','6033','2404','6048','6213','6216','6235','6236','6024'].map(t=>[t,'A319-131']),
 ...['6941','6967','9918','9923','9925','9926','6916','1852','6881','6767','6822','6847','1873','1687','1875','1686','304F','304E','1853','6915','6828','6793','6846'].map(t=>[t,'A320-214']),
 ...['8891','8890','1068','1050','301F','305K','305J','308N','309H','309S','30A6','30AH','30C1','30C2','30DE','30DA','30C7','30DC','30EJ','30EK','321L','322X','32FG','32FH','32FJ','32FK','307K','308S','309G','309F','309R','30A7','30C8','30DF','30FT','30FU','30FA','322G'].map(t=>[t,'A320-271N']),
 ...['328P','326W','324H','324T','321K','322K','324J','322W','325Y','326A','325Z','326V','32A3','32AQ','32AR'].map(t=>[t,'A320-251N']),
 ...['6745','6773','8493','8743','8582','6677','6731','6733','8337','8429','6882','6918','8491','8490','8338'].map(t=>[t,'A320-232']),
 ...['6848','6919','1879','1833','1877','6917','8799','8800','1878','6741','8583','6792','6742','6791','6825','6942','8492','6883','8585','6885','8595','8503','8502','8495'].map(t=>[t,'A321-232']),
 ...['6130','6132','6540','5925','5927','6505','6131','6070','6071','6072','6081','6541','6549','5918','5932'].map(t=>[t,'A330-200']),
 ...['6090','6091','6092','6093','6113','6117','6115'].map(t=>[t,'A330-200P2F']),
 ...['6503','5901','5906','8386','5919','8383','5978','6101','6102','6523','6530','6511','6512','6513','6525','5912','5913','5946','5947','5948','5956','5957','5958','8689','8385','8577','8579','5977'].map(t=>[t,'A330-300'])
]) as Record<string,string>;

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


function F1GuideModal({session,onChange,onClose}:{session:FlightSession;onChange:(next:FlightSession)=>void;onClose:()=>void}){
 const checked=session.checked,info:F1FlightInfo={routeType:'domestic',...(session.f1FlightInfo??{})};
 const[phaseId,setPhaseId]=useState(f1GuidePhases[0].id),[durationA,setDurationA]=useState(''),[durationB,setDurationB]=useState('');
 const parseFlightText=(raw:string)=>{const text=raw||'',lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const flt=text.match(/航班号\[FLT\]\s*([A-Z0-9/]+)/)?.[1]??'',arn=(text.match(/机号\[ARN\]\s*(B-[A-Z0-9]+)/i)?.[1]??'').toUpperCase();const std=text.match(/起飞时间\[STD\]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);const crew=lines.filter(l=>/^[\u4e00-\u9fa5]{2,4}(?:\s+\[[A-Z]+\])?\s+[AF]\d/.test(l)).map(l=>l.match(/^([\u4e00-\u9fa5]{2,4})/)?.[1]??'').filter(Boolean);const segs=[...text.matchAll(/[A-Z]{2}\d+\s+([A-Z]{3})-([A-Z]{3})/g)];const routeCodes=segs.reduce<string[]>((arr,m)=>{const a=m[1],b=m[2];if(arr.at(-1)!==a)arr.push(a);arr.push(b);return arr},[]);const route=routeCodes.length?routeCodes.map(c=>airportNameByCode[c]??c).join('-'):(text.match(/航线\[AIRLINE\]\s*([^\n]+)/)?.[1]??'').trim();const tail=arn.replace('B-',''),model=aircraftTailTypeMap[tail]??'——';return{flt,arn,stdDate:std?.[1]??'',stdClock:std?.[2]??'',crew,route,model}};
 const parsed=parseFlightText(info.rawFlightText??'');
 const legacyDeparture=info.departureTime&&info.departureTime.includes('T')?info.departureTime.split('T'):null;
 const departureDate=parsed.stdDate||(info.departureDate??legacyDeparture?.[0]??''),departureClock=parsed.stdClock||(info.departureClock??legacyDeparture?.[1]?.slice(0,5)??'');
 const departure=departureClock?new Date(`${departureDate||new Date().toISOString().slice(0,10)}T${departureClock}`):null;
 const parsedAirport=parsed.route.startsWith('天府')?'TFU':parsed.route.startsWith('双流')?'CTU':undefined;
 const effectiveAirport=parsedAirport??info.departureAirport,airportName=effectiveAirport==='TFU'?'天府':effectiveAirport==='CTU'?'双流':'未选择';
 const prepMinutes=effectiveAirport==='TFU'?(info.routeType==='international'?130:110):effectiveAirport==='CTU'?100:undefined;
 const prepTime=departure&&prepMinutes!==undefined?new Date(departure.getTime()-prepMinutes*60000):null;
 const isTfuEarly=info.departureAirport==='TFU'&&departure!==null&&departure.getHours()<12;
 const formatWechatTime=(d:Date|null)=>{if(!d)return'——';const today=new Date(),tomorrow=new Date();tomorrow.setDate(today.getDate()+1);const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();const day=sameDay(d,today)?'今天':sameDay(d,tomorrow)?'明天':d.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}).replace(/\//g,'-');const h=d.getHours(),part=h<12?'上午':h<18?'下午':'晚上';return `${day}${part}${d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}`};
 const parseDuration=(text:string)=>{const s=text.trim();if(!s)return 0;const safe=(n:number)=>Number.isFinite(n)&&n>0?n:0;const dot=s.match(/^(\d+)\s*[.．]\s*(\d{1,2})$/);if(dot)return safe(Number(dot[1]))*60+safe(Number(dot[2]));const colon=s.match(/^(\d+)\s*[:：]\s*(\d{1,2})$/);if(colon)return safe(Number(colon[1]))*60+safe(Number(colon[2]));const hour=Number(s.match(/(\d+(?:\.\d+)?)\s*(?:小时|时|h|H)/)?.[1]??0),minute=Number(s.match(/(\d+)\s*(?:分钟|分|m|M)/)?.[1]??0);if(hour||minute)return Math.round(safe(hour)*60+safe(minute));return safe(Number(s))};
 const durationTotal=parseDuration(durationA)+parseDuration(durationB);
 const formatDuration=(mins:number)=>Number.isFinite(mins)?`${Math.floor(mins/60)}小时${mins%60}分钟`:'0小时0分钟';
 const copy=(text:string)=>navigator.clipboard?.writeText(text);
 const patchInfo=(patch:Partial<F1FlightInfo>)=>onChange({...session,f1FlightInfo:{...info,...patch}});
 const dynamicItems:FlowItem[]=isTfuEarly?[{id:'tfu-before-noon-checkin',kind:'check',severity:'caution',order:0,text:'天府所执行航班起飞时间在 12:00 以前，需在前一天 21:00 前完成签到。'}]:[];
 const enrichedPhases=f1GuidePhases.map(p=>p.id==='online-prep'?{...p,items:[...dynamicItems,...p.items]}:p);
 const phase=enrichedPhases.find(p=>p.id===phaseId)??enrichedPhases[0],risks=phase.items.filter(i=>i.kind==='risk'),checks=phase.items.filter(i=>i.kind==='check');
 const done=checks.filter(i=>checked['f1:'+phase.id+':'+i.id]).length,total=enrichedPhases.reduce((sum,p)=>sum+p.items.filter(i=>i.kind==='check').length,0),allDone=enrichedPhases.reduce((sum,p)=>sum+p.items.filter(i=>i.kind==='check'&&checked['f1:'+p.id+':'+i.id]).length,0);
 const buildCrewMessage=(name:string,role:'captain'|'second')=>{const last=name?name.slice(-1):'——',day=departure?formatWechatTime(departure).replace(/(上午|下午|晚上).*/,''):'明天',me=parsed.crew.at(-1)??'——';return `${last}哥您好：我是${day}的二大队二中队F1学员${me}，满足90天3次起落\n飞行经历时间：——\n${day}的航班计划：${parsed.route||'——'}\n机型：${parsed.model} 机号：${parsed.arn||'——'}\n航班号：${parsed.flt||'——'}\n准备时间：${formatWechatTime(prepTime)}\n起飞时间：${formatWechatTime(departure)}\n航班信息：飞机有一条保留：——；有一条 OEB：——\n\n我已完成全部网上航前准备，${day}是我第——次参与航班运行，运行经验较少，还望${last}哥多多包涵。一切听${role==='captain'?'您':'您和机长'}指挥，绝不擅自行动！有不会的地方还麻烦${last}哥多赐教，谢谢${last}哥~${day}见！`};
 const captainMessage=buildCrewMessage(parsed.crew[0]??'', 'captain'),secondMessage=buildCrewMessage(parsed.crew[1]??'', 'second');
 const renderGuideItem=(item:FlowItem)=><article className={'flow-item '+item.kind+' '+item.severity+(checked['f1:'+phase.id+':'+item.id]?' checked':'')} key={item.id} onClick={()=>item.kind==='check'&&onChange({...session,checked:{...checked,['f1:'+phase.id+':'+item.id]:!checked['f1:'+phase.id+':'+item.id]}})}>{item.kind==='check'?<button className="checkbox">{checked['f1:'+phase.id+':'+item.id]&&<Check/>}</button>:<div className="risk-icon">{item.severity==='critical'?<ShieldAlert/>:<AlertTriangle/>}</div>}<div><div className="item-meta"><span>{item.kind==='check'?'易忘项目':severityLabel[item.severity]+'风险'}</span><Pill tone={item.kind==='risk'?item.severity:'info'}>{item.id.startsWith('tfu-')?'航班信息':phase.name}</Pill></div><p>{item.text}</p></div></article>;
 return <Modal title="F1 跟班流程" onClose={onClose} wide><p className="hint">先填起飞机场和起飞时间，系统会自动算准备时间；F1 流程独立于21个运行阶段。</p>
  <section className="f1-flight-card"><div className="form-grid">
   <label>起飞机场<select value={info.departureAirport??''} onChange={e=>patchInfo({departureAirport:(e.target.value as F1FlightInfo['departureAirport'])||undefined})}><option value="">未选择</option><option value="TFU">天府</option><option value="CTU">双流</option></select></label>
   <label>航线类型<select value={info.routeType??'domestic'} onChange={e=>patchInfo({routeType:e.target.value as F1FlightInfo['routeType']})}><option value="domestic">国内</option><option value="international">国际</option></select></label>
   <label>日期（可不填）<input type="date" value={departureDate} onChange={e=>patchInfo({departureDate:e.target.value||undefined,departureTime:undefined})}/></label>
   <label>起飞时刻<input type="time" value={departureClock} onChange={e=>patchInfo({departureClock:e.target.value||undefined,departureTime:undefined})}/></label>
  </div>{isTfuEarly&&<div className="warning-callout"><AlertTriangle/><p>天府 12:00 以前起飞：前一天 21:00 前完成签到。这个提醒也会出现在「网上准备」里。</p></div>}</section>
  <section className="f1-paste-card"><h3>粘贴航班信息生成微信模板</h3><p>把“航班号[FLT]、机型[ACT]、机号[ARN]、起飞时间[STD]、航线/航段、机组人员”那段直接粘贴进来。</p><textarea value={info.rawFlightText??''} onChange={e=>patchInfo({rawFlightText:e.target.value})} placeholder="粘贴航班信息..."/><div className="f1-parse-preview"><span>机长：{parsed.crew[0]??'——'}</span><span>二哥：{parsed.crew[1]??'——'}</span><span>我：{parsed.crew[2]??'——'}</span><span>机型：{parsed.model}</span><span>机号：{parsed.arn||'——'}</span><span>航班：{parsed.flt||'——'}</span><span>航线：{parsed.route||'——'}</span></div><div className="crew-copy-grid"><div><h4>给机长</h4><textarea readOnly value={captainMessage}/><button className="primary-btn" onClick={()=>copy(captainMessage)}>复制给{parsed.crew[0]?.slice(-1)??'机长'}哥</button></div><div><h4>给二哥</h4><textarea readOnly value={secondMessage}/><button className="primary-btn" onClick={()=>copy(secondMessage)}>复制给{parsed.crew[1]?.slice(-1)??'二'}哥</button></div></div></section>
  <section className="f1-calculator"><h3>时间计算器</h3><p>可以输入“1小时20分钟”“1:20”“1.20”“80”等格式，其中 1.20 表示 1小时20分钟。</p><div><input value={durationA} onChange={e=>setDurationA(e.target.value)} placeholder="例如 1.20"/><span>+</span><input value={durationB} onChange={e=>setDurationB(e.target.value)} placeholder="例如 1:54"/><strong>= {formatDuration(durationTotal)}</strong></div></section>
  <div className="f1-summary"><div><span>总进度</span><b>{allDone}<small>/{total}</small></b></div><div><span>当前小阶段</span><b>{phase.name}</b><small>{done}/{checks.length} 项</small></div></div><div className="split-editor f1-guide"><nav>{enrichedPhases.map((p,i)=>{const pc=p.items.filter(x=>x.kind==='check'),pd=pc.filter(x=>checked['f1:'+p.id+':'+x.id]).length;return <button className={phase.id===p.id?'active':''} onClick={()=>setPhaseId(p.id)} key={p.id}><span>{String(i+1).padStart(2,'0')}</span>{p.name}<em>{pd}/{pc.length}</em></button>})}</nav><main><h3>{phase.name}</h3><div className="item-list separated-list">{risks.length>0&&<section className="item-section risk-section"><h3><ShieldAlert/>风险提示</h3>{risks.map(renderGuideItem)}</section>}{checks.length>0&&<section className="item-section check-section"><h3><ListChecks/>易忘提醒</h3>{checks.map(renderGuideItem)}</section>}</div></main></div></Modal>
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

function ChangelogModal({onClose}:{onClose:()=>void}){
 return <Modal title="版本更新记录" onClose={onClose}><div className="changelog-head"><b>当前版本 v{APP_VERSION}</b><span>{APP_UPDATED_AT}</span></div><div className="changelog-list">{changelog.map(v=><article key={v.version}><header><b>v{v.version}</b><span>{v.date}</span></header><ul>{v.items.map(item=><li key={item}>{item}</li>)}</ul></article>)}</div></Modal>
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
  <main className="workspace"><header className="topbar"><div className="segmented"><button className={view==='current'?'active':''} onClick={()=>setView('current')}><ListChecks/>当前阶段</button><button className={view==='overview'?'active':''} onClick={()=>setView('overview')}><LayoutGrid/>总览</button></div><div className="top-actions"><button onClick={()=>setModal('f1guide')}><BookOpen/>F1跟班</button><button onClick={()=>setModal('environment')}><CloudSun/>环境条件{matched.length>0&&<b>{matched.length}</b>}</button><button onClick={()=>setModal('aircraft')}><Plane/>飞机信息</button><button onClick={()=>setModal('subjects')}><ShieldAlert/>模拟机科目{session.activeSubjects.filter(x=>x.status==='active').length>0&&<b>{session.activeSubjects.filter(x=>x.status==='active').length}</b>}</button><button className="icon-btn" onClick={()=>setModal('settings')}><Settings2/></button></div></header>
   {view==='overview'?<Overview session={session} base={base} rules={rules} subjects={subjects} onSelect={previewPhase}/>:<div className="current-view">
    <section className="stage-hero"><div><span className="eyebrow">PHASE {String(viewPhaseIndex+1).padStart(2,'0')} / 21 · {phase.group}</span><h1>{phase.name}</h1><div className="status-row"><Pill tone={viewingCurrent?'active':'info'}>{viewingCurrent?'当前阶段':'查看阶段'}</Pill>{!viewingCurrent&&<Pill tone="active">当前执行：{currentPhase.name}</Pill>}{showOperationMode&&<Pill tone={operationMode==='常规运行'?'active':'caution'}>{operationMode}</Pill>}{matched.map(r=><Pill tone={r.outputs.some(o=>o.items.some(i=>i.severity==='critical'))?'critical':'caution'} key={r.id}>{r.name}</Pill>)}{activeSubjectRecords.map(s=><Pill tone="critical" key={s.id}>{s.name}</Pill>)}</div></div><div className="stage-progress"><span>{Math.round((session.currentPhaseIndex+1)/21*100)}%</span><div><i style={{width:(session.currentPhaseIndex+1)/21*100+'%'}}/></div></div></section>
    <section className="content-panel"><div className="panel-head"><div><h2>本阶段提示</h2><span>{checkItems.filter(x=>session.checked[x.checkKey]).length} / {checkItems.length} 已完成</span></div><button className="small-btn" onClick={()=>setModal('base')}><Edit3/>编辑正常流程</button></div>
     {!items.length?<div className="empty-state"><div><ListChecks/></div><h3>本阶段还没有提示</h3><p>可编辑正常流程，或通过环境规则和模拟机科目自动加入内容。</p><button className="primary-btn" onClick={()=>setModal('base')}><Plus/>添加第一项</button></div>:<div className="item-list separated-list">{riskItems.length>0&&<section className="item-section risk-section"><h3><ShieldAlert/>风险提示</h3>{riskItems.map(renderItem)}</section>}{checkItems.length>0&&<section className="item-section check-section"><h3><ListChecks/>易忘提醒</h3>{checkItems.map(renderItem)}</section>}</div>}
    </section>
    <footer className="stage-nav">{viewingCurrent?<button className="ghost-btn" disabled={session.currentPhaseIndex===0} onClick={()=>go(session.currentPhaseIndex-1)}><ArrowLeft/>上一阶段</button>:<button className="ghost-btn" onClick={returnToCurrent}>回到当前阶段</button>}{viewingCurrent?<button className="primary-btn next" onClick={()=>session.currentPhaseIndex===20?saveSession({...session,completedPhaseIds:[...new Set([...session.completedPhaseIds,currentPhase.id])] }):go(session.currentPhaseIndex+1)}>{session.currentPhaseIndex===20?'完成全部阶段':'完成并进入下一阶段'}{session.currentPhaseIndex<20&&<ArrowRight/>}</button>:<span className="preview-note">正在查看其它阶段，不会改变完成进度</span>}</footer>
   </div>}
  </main>
  {modal==='f1guide'&&<F1GuideModal session={session} onChange={saveSession} onClose={()=>setModal(null)}/>}
  {modal==='environment'&&<EnvironmentModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='aircraft'&&<AircraftModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='base'&&<BaseEditor outputs={base} onClose={()=>setModal(null)} onSave={async v=>{setBase(v);await db.settings.put({key:'baseOutputs',value:v});setModal(null)}}/>}
  {modal==='rules'&&<RulesModal rules={rules} onClose={()=>setModal(null)} onSave={async v=>{setRules(v);await db.rules.clear();await db.rules.bulkPut(v);setModal(null)}}/>}
  {modal==='subjects'&&<SubjectsModal subjects={subjects} active={session.activeSubjects} onClose={()=>setModal(null)} onActivate={id=>saveSession({...session,activeSubjects:[...session.activeSubjects,{subjectId:id,status:'active',activatedAt:now()}]})} onResolve={id=>saveSession({...session,activeSubjects:session.activeSubjects.map(a=>a.subjectId===id?{...a,status:'resolved',resolvedAt:now()}:a)})} onSave={async v=>{setSubjects(v);await db.subjects.clear();await db.subjects.bulkPut(v)}}/>}
  {modal==='changelog'&&<ChangelogModal onClose={()=>setModal(null)}/>}
  {modal==='settings'&&<Modal title="设置与数据" onClose={()=>setModal(null)}><div className="settings-list"><button onClick={()=>setModal('rules')}><CloudSun/><span><b>环境规则</b><small>{rules.length} 条规则 · {rules.filter(r=>r.enabled).length} 条启用</small></span><ChevronRight/></button><button onClick={()=>setModal('changelog')}><BookOpen/><span><b>版本更新记录</b><small>当前 v{APP_VERSION} · 查看每版改动</small></span><ChevronRight/></button><button onClick={exportData}><Download/><span><b>导出完整备份</b><small>进度、模板、规则与科目库</small></span><ChevronRight/></button><button onClick={()=>importRef.current?.click()}><Upload/><span><b>导入备份</b><small>支持合并或完全覆盖</small></span><ChevronRight/></button><button className="danger-row" onClick={()=>confirm('开始新航班？当前执行进度和勾选记录将被清空。')&&saveSession(newSession())}><RotateCcw/><span><b>新建航班</b><small>保留规则和科目库</small></span><ChevronRight/></button></div><input ref={importRef} hidden type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&importData(e.target.files[0])}/></Modal>}
  {showIncomplete&&<Modal title="还有未完成项目" onClose={()=>setShowIncomplete(false)}><div className="warning-callout"><AlertTriangle/><p>本阶段还有 <b>{incomplete.length}</b> 个易忘项目未勾选。你仍然可以继续。</p></div><ul className="incomplete-list">{incomplete.map(x=><li key={x.checkKey}><span>{x.text}</span><small>{x.sources.join(' · ')}</small></li>)}</ul><footer className="modal-actions"><button className="ghost-btn" onClick={()=>setShowIncomplete(false)}>返回检查</button><button className="danger-btn" onClick={()=>{setShowIncomplete(false);go(session.currentPhaseIndex+1,true)}}>确认继续<ArrowRight/></button></footer></Modal>}
 </div>
}
