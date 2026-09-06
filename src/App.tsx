import {useEffect,useMemo,useRef,useState,type ReactNode}from'react';
import{AlertTriangle,ArrowLeft,ArrowRight,BookOpen,Calculator,Check,ChevronRight,Clock3,CloudSun,Download,Edit3,Home,Plane,LayoutGrid,ListChecks,Plus,RotateCcw,Search,Settings2,ShieldAlert,Sparkles,Trash2,Upload,X}from'lucide-react';
import{pinyin}from'pinyin-pro';
import{bootstrapData,db}from'./db';
import{APP_UPDATED_AT,APP_VERSION,changelog,emptyBaseOutputs,f1GuidePhases,fieldLabels,newSession,operatorLabels,phases}from'./data';
import{activeRules,aggregatePhaseItems,windComponents}from'./rules';
import type{AppBackup,ConditionGroup,DisplayItem,EnvironmentData,EnvironmentField,EnvironmentRule,F1FlightInfo,FlightSession,FlowItem,PhaseOutput,Severity,TrainingSubject}from'./types';
import ContractTimeCalculator from'./ContractTimeCalculator';

const uid=(prefix='id')=>prefix+'-'+crypto.randomUUID();
const now=()=>new Date().toISOString();
const clone=<T,>(v:T):T=>structuredClone(v);
const severityLabel:Record<Severity,string>={info:'信息',caution:'注意',critical:'关键'};
const numericFields=new Set(['temperature','windDirection','windSpeed','gust','visibility','runwayHeading','fuelTons','zeroFuelWeightTons','crosswind','headwind']);
const airportNameByCode:Record<string,string>={
 PEK:'北京',PKX:'北京',SHA:'上海',PVG:'上海',CAN:'广州',SZX:'深圳',CTU:'双流',TFU:'天府',CKG:'重庆',KMG:'昆明',XIY:'西安',HGH:'杭州',NKG:'南京',WUH:'武汉',CSX:'长沙',CGO:'郑州',TAO:'青岛',XMN:'厦门',FOC:'福州',TSN:'天津',DLC:'大连',SHE:'沈阳',HRB:'哈尔滨',CGQ:'长春',TNA:'济南',NGB:'宁波',WNZ:'温州',WUX:'无锡',HFE:'合肥',KHN:'南昌',TYN:'太原',SJW:'石家庄',HET:'呼和浩特',URC:'乌鲁木齐',LHW:'兰州',XNN:'西宁',INC:'银川',LXA:'拉萨',KWE:'贵阳',NNG:'南宁',HAK:'海口',SYX:'三亚',ZUH:'珠海',SWA:'揭阳',YIH:'宜昌',ENH:'恩施',YCU:'运城',DAT:'大同',CIH:'长治',DOY:'东营',WEH:'威海',YNT:'烟台',WEF:'潍坊',LYI:'临沂',JNG:'济宁',RIZ:'日照',HZA:'菏泽',NTG:'南通',YNZ:'盐城',LYG:'连云港',XUZ:'徐州',CZX:'常州',YTY:'扬州',JUZ:'衢州',HYN:'台州',HSN:'舟山',YIW:'义乌',TXN:'黄山',AQG:'安庆',FUG:'阜阳',JUH:'池州',JGS:'井冈山',JDZ:'景德镇',JIU:'九江',KOW:'赣州',LYA:'洛阳',NNY:'南阳',XFN:'襄阳',ZHA:'湛江',BHY:'北海',LZH:'柳州',KWL:'桂林',WUZ:'梧州',AEB:'百色',MIG:'绵阳',LZO:'泸州',YBP:'宜宾',DAX:'达州',NAO:'南充',KGT:'康定',DCY:'稻城',PZI:'攀枝花',GYS:'广元',LJG:'丽江',DLU:'大理',JHG:'西双版纳',BSD:'保山',DIG:'迪庆',SYM:'普洱',TCZ:'腾冲',LNJ:'临沧',ACX:'兴义',TEN:'铜仁',AVA:'安顺',BFJ:'毕节',DZH:'达州',KWJ:'贵阳',BAV:'包头',CIF:'赤峰',HLH:'乌兰浩特',HLD:'海拉尔',NZH:'满洲里',TGO:'通辽',WUA:'乌海',ERL:'二连浩特',DSN:'鄂尔多斯',AOG:'鞍山',DDG:'丹东',JNZ:'锦州',CHG:'朝阳',CNI:'长海',TNH:'通化',JIL:'吉林',YNJ:'延吉',MDG:'牡丹江',JMU:'佳木斯',HEK:'黑河',JXA:'鸡西',NDG:'齐齐哈尔',OHE:'漠河',DQA:'大庆',JGD:'加格达奇',FYJ:'抚远',KRY:'克拉玛依',KRL:'库尔勒',AKU:'阿克苏',KHG:'喀什',HTN:'和田',YIN:'伊宁',TCG:'塔城',AAT:'阿勒泰',FYN:'富蕴',HMI:'哈密',IQM:'且末',QSZ:'莎车',TLQ:'吐鲁番',NLT:'那拉提',BPL:'博乐',LZY:'林芝',BPX:'昌都',NGQ:'阿里',RKZ:'日喀则',GOQ:'格尔木',DNH:'敦煌',JGN:'嘉峪关',IQN:'庆阳',THQ:'天水',GXH:'夏河',UYN:'榆林',ENY:'延安',HZG:'汉中',AKA:'安康',HDG:'邯郸',BPE:'秦皇岛',TVS:'唐山',WNH:'文山',LLV:'吕梁',WUT:'忻州',NZL:'扎兰屯',BAR:'琼海',HIA:'淮安',SQJ:'三明',JJN:'泉州',WUS:'武夷山',LCX:'龙岩',AHA:'琼海',HJJ:'怀化',LLF:'永州',DYG:'张家界',CGD:'常德',HNY:'衡阳',JZH:'九寨沟',LPF:'六盘水',ZYI:'遵义',KJH:'凯里',HCJ:'河池',BZX:'巴中',LUM:'芒市',MXZ:'梅州',HPG:'神农架',SHS:'荆州',WDS:'十堰',YUS:'玉树',GMQ:'果洛',HBQ:'祁连',AHJ:'红原',CDE:'承德',HUZ:'惠州',HKG:'香港',MFM:'澳门',TPE:'台北',TSA:'台北',KHH:'高雄'
};
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

const defaultCrewTemplates={
 captain:'{称呼}您好：我是{日期}的二大队二中队F1学员{我}，满足90天3次起落\n飞行经历时间：——\n{日期}的航班计划：{航线}\n机型：{机型} 机号：{机号}\n航班号：{航班号}\n准备时间：{准备时间}\n起飞时间：{起飞时间}\n航班信息：飞机有一条保留：——；有一条 OEB：——\n\n我已完成全部网上航前准备，{日期}是我第——次参与航班运行，运行经验较少，还望{称呼}多多包涵。一切听您指挥，绝不擅自行动！有不会的地方还麻烦{称呼}多赐教，谢谢{称呼}~{日期}见！',
 second:'{称呼}您好：我是{日期}的二大队二中队F1学员{我}，满足90天3次起落\n飞行经历时间：——\n{日期}的航班计划：{航线}\n机型：{机型} 机号：{机号}\n航班号：{航班号}\n准备时间：{准备时间}\n起飞时间：{起飞时间}\n航班信息：飞机有一条保留：——；有一条 OEB：——\n\n我已完成全部网上航前准备，{日期}是我第——次参与航班运行，运行经验较少，还望{称呼}多多包涵。一切听您和机长指挥，绝不擅自行动！有不会的地方还麻烦{称呼}多赐教，谢谢{称呼}~{日期}见！'
};
type CrewTemplates=typeof defaultCrewTemplates;

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
 const[phaseId,setPhaseId]=useState(f1GuidePhases[0].id),[durationA,setDurationA]=useState(''),[durationB,setDurationB]=useState(''),[editingTemplates,setEditingTemplates]=useState(false),[copyState,setCopyState]=useState('');
 const[crewTemplates,setCrewTemplates]=useState<CrewTemplates>(()=>{try{return{...defaultCrewTemplates,...JSON.parse(localStorage.getItem('flight-flow-crew-templates')||'{}')}}catch{return defaultCrewTemplates}});
 const parseFlightText=(raw:string)=>{const text=raw||'',lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const flt=text.match(/航班号\[FLT\]\s*([A-Z0-9/]+)/)?.[1]??'',arn=(text.match(/机号\[ARN\]\s*(B-[A-Z0-9]+)/i)?.[1]??'').toUpperCase();const std=text.match(/起飞时间\[STD\]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);const crewBlock=(text.match(/机组人员([\s\S]*?)(?:机型\[ACT\]|机号\[ARN\]|起飞时间\[STD\]|$)/)?.[1]??text);const crew=crewBlock.split(/\r?\n/).map(x=>x.trim()).map(l=>l.match(/^([\u4e00-\u9fa5]{2,4})(?:\s|$)/)?.[1]??'').filter(Boolean);const segs=[...text.matchAll(/[A-Z]{2}\d+\s+([A-Z]{3})-([A-Z]{3})/g)];const routeCodes=segs.reduce<string[]>((arr,m)=>{const a=m[1],b=m[2];if(arr.at(-1)!==a)arr.push(a);arr.push(b);return arr},[]);const route=routeCodes.length?routeCodes.map(c=>airportNameByCode[c]??c).join('-'):(text.match(/航线\[AIRLINE\]\s*([^\n]+)/)?.[1]??'').trim();const tail=arn.replace('B-',''),model=aircraftTailTypeMap[tail]??'——';return{flt,arn,stdDate:std?.[1]??'',stdClock:std?.[2]??'',crew,route,model}};
 const parsed=parseFlightText(info.rawFlightText??'');
 const legacyDeparture=info.departureTime&&info.departureTime.includes('T')?info.departureTime.split('T'):null;
 const departureDate=parsed.stdDate||(info.departureDate??legacyDeparture?.[0]??''),departureClock=parsed.stdClock||(info.departureClock??legacyDeparture?.[1]?.slice(0,5)??'');
 const departure=departureClock?new Date(`${departureDate||new Date().toISOString().slice(0,10)}T${departureClock}`):null;
 const parsedAirport=parsed.route.startsWith('天府')?'TFU':parsed.route.startsWith('双流')?'CTU':undefined;
 const effectiveAirport=parsedAirport??info.departureAirport,airportName=effectiveAirport==='TFU'?'天府':effectiveAirport==='CTU'?'双流':'未选择';
 const prepMinutes=effectiveAirport==='TFU'?(info.routeType==='international'?130:110):effectiveAirport==='CTU'?100:undefined;
 const prepTime=departure&&prepMinutes!==undefined?new Date(departure.getTime()-prepMinutes*60000):null;
 const isTfuEarly=effectiveAirport==='TFU'&&departure!==null&&departure.getHours()<12;
 const formatWechatTime=(d:Date|null)=>{if(!d)return'——';const today=new Date(),tomorrow=new Date();tomorrow.setDate(today.getDate()+1);const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();const day=sameDay(d,today)?'今天':sameDay(d,tomorrow)?'明天':d.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}).replace(/\//g,'-');const h=d.getHours(),part=h<12?'上午':h<18?'下午':'晚上';return `${day}${part}${d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}`};
 const parseDuration=(text:string)=>{const s=text.trim();if(!s)return 0;const safe=(n:number)=>Number.isFinite(n)&&n>0?n:0;const dot=s.match(/^(\d+)\s*[.．]\s*(\d{1,2})$/);if(dot)return safe(Number(dot[1]))*60+safe(Number(dot[2]));const colon=s.match(/^(\d+)\s*[:：]\s*(\d{1,2})$/);if(colon)return safe(Number(colon[1]))*60+safe(Number(colon[2]));const hour=Number(s.match(/(\d+(?:\.\d+)?)\s*(?:小时|时|h|H)/)?.[1]??0),minute=Number(s.match(/(\d+)\s*(?:分钟|分|m|M)/)?.[1]??0);if(hour||minute)return Math.round(safe(hour)*60+safe(minute));return safe(Number(s))};
 const durationTotal=parseDuration(durationA)+parseDuration(durationB);
 const formatDuration=(mins:number)=>Number.isFinite(mins)?`${Math.floor(mins/60)}小时${mins%60}分钟`:'0小时0分钟';
 const copy=async(text:string,label:string)=>{try{await navigator.clipboard.writeText(text);setCopyState(label+'已复制');setTimeout(()=>setCopyState(''),1800)}catch{setCopyState('复制失败，请长按消息手动复制')}};
 const patchInfo=(patch:Partial<F1FlightInfo>)=>onChange({...session,f1FlightInfo:{...info,...patch}});
 const dynamicItems:FlowItem[]=isTfuEarly?[{id:'tfu-before-noon-checkin',kind:'check',severity:'caution',order:0,text:'天府所执行航班起飞时间在 12:00 以前，需在前一天 21:00 前完成签到。'}]:[];
 const enrichedPhases=f1GuidePhases.map(p=>p.id==='online-prep'?{...p,items:[...dynamicItems,...p.items]}:p);
 const phase=enrichedPhases.find(p=>p.id===phaseId)??enrichedPhases[0],risks=phase.items.filter(i=>i.kind==='risk'),checks=phase.items.filter(i=>i.kind==='check');
 const done=checks.filter(i=>checked['f1:'+phase.id+':'+i.id]).length,total=enrichedPhases.reduce((sum,p)=>sum+p.items.filter(i=>i.kind==='check').length,0),allDone=enrichedPhases.reduce((sum,p)=>sum+p.items.filter(i=>i.kind==='check'&&checked['f1:'+p.id+':'+i.id]).length,0);
 const buildCrewMessage=(name:string,template:string)=>{const last=name?name.slice(-1):'——',day=departure?formatWechatTime(departure).replace(/(上午|下午|晚上).*/,''):'明天';const values:Record<string,string>={'称呼':last+'哥','姓名':name||'——','我':parsed.crew.at(-1)??'——','日期':day,'航线':parsed.route||'——','机型':parsed.model,'机号':parsed.arn||'——','航班号':parsed.flt||'——','准备时间':formatWechatTime(prepTime),'起飞时间':formatWechatTime(departure)};return template.replace(/\{([^{}]+)\}/g,(all,key)=>values[key]??all)};
 const captainMessage=buildCrewMessage(parsed.crew[0]??'',crewTemplates.captain),secondMessage=buildCrewMessage(parsed.crew[1]??'',crewTemplates.second);
 const saveTemplates=()=>{localStorage.setItem('flight-flow-crew-templates',JSON.stringify(crewTemplates));setEditingTemplates(false);setCopyState('模板已保存在此设备');setTimeout(()=>setCopyState(''),1800)};
 const renderGuideItem=(item:FlowItem)=><article className={'flow-item '+item.kind+' '+item.severity+(checked['f1:'+phase.id+':'+item.id]?' checked':'')} key={item.id} onClick={()=>item.kind==='check'&&onChange({...session,checked:{...checked,['f1:'+phase.id+':'+item.id]:!checked['f1:'+phase.id+':'+item.id]}})}>{item.kind==='check'?<button className="checkbox">{checked['f1:'+phase.id+':'+item.id]&&<Check/>}</button>:<div className="risk-icon">{item.severity==='critical'?<ShieldAlert/>:<AlertTriangle/>}</div>}<div><div className="item-meta"><span>{item.kind==='check'?'易忘项目':severityLabel[item.severity]+'风险'}</span><Pill tone={item.kind==='risk'?item.severity:'info'}>{item.id.startsWith('tfu-')?'航班信息':phase.name}</Pill></div><p>{item.text}</p></div></article>;
 return <Modal title="F1 跟班流程" onClose={onClose} wide><p className="hint">先填起飞机场和起飞时间，系统会自动算准备时间；F1 流程独立于21个运行阶段。</p>
  <section className="f1-flight-card"><div className="form-grid">
   <label>起飞机场<select value={info.departureAirport??''} onChange={e=>patchInfo({departureAirport:(e.target.value as F1FlightInfo['departureAirport'])||undefined})}><option value="">未选择</option><option value="TFU">天府</option><option value="CTU">双流</option></select></label>
   <label>航线类型<select value={info.routeType??'domestic'} onChange={e=>patchInfo({routeType:e.target.value as F1FlightInfo['routeType']})}><option value="domestic">国内</option><option value="international">国际</option></select></label>
   <label>日期（可不填）<input type="date" value={departureDate} onChange={e=>patchInfo({departureDate:e.target.value||undefined,departureTime:undefined})}/></label>
   <label>起飞时刻<input type="time" value={departureClock} onChange={e=>patchInfo({departureClock:e.target.value||undefined,departureTime:undefined})}/></label>
  </div>{isTfuEarly&&<div className="warning-callout"><AlertTriangle/><p>天府 12:00 以前起飞：前一天 21:00 前完成签到。这个提醒也会出现在「网上准备」里。</p></div>}</section>
  <section className="f1-paste-card"><div className="card-title-row"><div><h3>微信消息生成器</h3><p>粘贴航班信息后自动填入你的模板。</p></div><button className="small-btn" onClick={()=>setEditingTemplates(v=>!v)}><Edit3/>{editingTemplates?'查看效果':'编辑模板'}</button></div><textarea value={info.rawFlightText??''} onChange={e=>patchInfo({rawFlightText:e.target.value})} placeholder="粘贴航班号、机号、起飞时间、航段和机组人员..."/><div className="f1-parse-preview"><span>机长：{parsed.crew[0]??'——'}</span><span>二哥：{parsed.crew[1]??'——'}</span><span>我：{parsed.crew.at(-1)??'——'}</span><span>机型：{parsed.model}</span><span>机号：{parsed.arn||'——'}</span><span>航班：{parsed.flt||'——'}</span><span>航线：{parsed.route||'——'}</span></div>{editingTemplates?<div className="template-editor"><p className="template-help">可用变量：{['称呼','姓名','我','日期','航线','机型','机号','航班号','准备时间','起飞时间'].map(x=><code key={x}>{'{'+x+'}'}</code>)}</p><label>给机长的模板<textarea value={crewTemplates.captain} onChange={e=>setCrewTemplates({...crewTemplates,captain:e.target.value})}/></label><label>给二哥的模板<textarea value={crewTemplates.second} onChange={e=>setCrewTemplates({...crewTemplates,second:e.target.value})}/></label><div className="template-actions"><button className="ghost-btn" onClick={()=>setCrewTemplates(defaultCrewTemplates)}>恢复默认</button><button className="primary-btn" onClick={saveTemplates}>保存模板</button></div></div>:<div className="crew-copy-grid"><div><h4>给机长</h4><textarea readOnly value={captainMessage}/><button className="primary-btn" onClick={()=>copy(captainMessage,`给${parsed.crew[0]?.slice(-1)??'机长'}哥的消息`)}>复制给{parsed.crew[0]?.slice(-1)??'机长'}哥</button></div><div><h4>给二哥</h4><textarea readOnly value={secondMessage}/><button className="primary-btn" onClick={()=>copy(secondMessage,`给${parsed.crew[1]?.slice(-1)??'二'}哥的消息`)}>复制给{parsed.crew[1]?.slice(-1)??'二'}哥</button></div></div>}{copyState&&<div className="copy-toast">{copyState}</div>}</section>
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
 return <Modal title="飞行进程运行规则" onClose={onClose} wide><div className="manager">
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

function DutyCalculatorModal({onClose}:{onClose:()=>void}){
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const[crewType,setCrewType]=useState<'normal'|'extended'>('normal'),[reportDate,setReportDate]=useState(today),[reportTime,setReportTime]=useState(''),[rests,setRests]=useState<{id:string;start:string;end:string}[]>([]);
 const toMin=(time:string)=>{const s=time.trim();let h=NaN,m=NaN;if(/^\d{1,2}:\d{1,2}$/.test(s)){[h,m]=s.split(':').map(Number)}else if(/^\d{3,4}$/.test(s)){h=Number(s.slice(0,-2));m=Number(s.slice(-2))}return h>=0&&h<24&&m>=0&&m<60?h*60+m:null};
 const reportMin=toMin(reportTime);
 const dutyHours=crewType==='extended'?16:reportMin==null?0:reportMin<300?12:reportMin<720?14:13;
 const slot=crewType==='extended'?'扩编机组通用':reportMin==null?'未选择':reportMin<300?'00:00 – 04:59':reportMin<720?'05:00 – 11:59':reportMin<1200?'12:00 – 19:59':'20:00 – 23:59';
 const fmtDur=(mins:number)=>mins<60?`${mins} 分`:`${Math.floor(mins/60)}h ${mins%60}m`.replace(' 0m','');
 const restDuration=(r:{start:string;end:string})=>{const s=toMin(r.start),rawEnd=toMin(r.end);if(s==null||rawEnd==null)return 0;let e=rawEnd;if(e<s)e+=1440;return Math.max(0,e-s)};
 const restMinutes=rests.reduce((sum,r)=>sum+restDuration(r),0),totalMinutes=dutyHours*60+restMinutes,rawDeadline=(reportMin??0)+totalMinutes,daysLater=Math.floor(rawDeadline/1440),deadlineMinutes=rawDeadline%1440;
 const deadlineTime=reportMin!=null?`${String(Math.floor(deadlineMinutes/60)).padStart(2,'0')}:${String(deadlineMinutes%60).padStart(2,'0')}`:'--:--';
 const deadlineDate=()=>{if(reportMin==null)return'请先输入报到时间';if(!reportDate)return daysLater?`次日+${daysLater}`:'当日';const d=new Date(`${reportDate}T00:00`);d.setDate(d.getDate()+daysLater);const weekday=['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];return `${d.getMonth()+1}月${d.getDate()}日 ${weekday}${daysLater?`（次日+${daysLater}）`:'（当日）'}`};
 const patchRest=(id:string,patch:Partial<{start:string;end:string}>)=>setRests(prev=>prev.map(r=>r.id===id?{...r,...patch}:r));
 return <Modal title="机组值勤期计算器" onClose={onClose} wide><p className="hint">用于快速估算备降、等待、休息顺延后的值勤截止时刻。计算规则沿用你给的原网页。</p>
  <section className="duty-hero"><div><span>值勤截止时刻</span><b>{deadlineTime}</b><small>{deadlineDate()}</small></div><div><span>值勤期长度</span><b>{dutyHours?`${dutyHours} 小时`:'--'}</b></div><div><span>累计休息</span><b>{fmtDur(restMinutes)}</b></div></section>
  <div className="duty-grid"><section className="duty-card"><h3>机组类型</h3><div className="duty-toggle"><button className={crewType==='normal'?'active':''} onClick={()=>setCrewType('normal')}>非扩编机组</button><button className={crewType==='extended'?'active':''} onClick={()=>setCrewType('extended')}>扩编机组</button></div></section><section className="duty-card"><h3>航班准备开始</h3><div className="form-grid"><label>日期<input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)}/></label><label>报到时间<input type="text" inputMode="numeric" placeholder="例如 05:30 / 530" value={reportTime} onChange={e=>setReportTime(e.target.value)}/></label></div>{reportMin!=null&&<div className="duty-note">✓ 报到时间 {reportTime} 属「{slot}」档，值勤期 {dutyHours} 小时</div>}</section></div>
  <section className="duty-card"><div className="duty-card-head"><h3>中途休息记录</h3><button className="small-btn" onClick={()=>setRests(prev=>[...prev,{id:uid('rest'),start:'',end:''}])}><Plus/>添加休息</button></div>{!rests.length&&<div className="empty-mini">暂无休息记录。添加后该时长不计入值勤期，并顺延截止时刻。</div>}{rests.map((r,i)=><div className="duty-rest-row" key={r.id}><span>{i+1}</span><input type="text" inputMode="numeric" placeholder="开始 1200" value={r.start} onChange={e=>patchRest(r.id,{start:e.target.value})}/><input type="text" inputMode="numeric" placeholder="结束 1320" value={r.end} onChange={e=>patchRest(r.id,{end:e.target.value})}/><b>{toMin(r.start)!=null&&toMin(r.end)!=null?fmtDur(restDuration(r)):'--'}</b><button className="icon-btn danger" onClick={()=>setRests(prev=>prev.filter(x=>x.id!==r.id))}><Trash2/></button></div>)}</section>
  <section className="duty-card"><h3>规则参考</h3><div className="duty-rules"><table><thead><tr><th>非扩编报到时间</th><th>最大飞行值勤期</th></tr></thead><tbody><tr><td>00:00 – 04:59</td><td>12 小时</td></tr><tr><td>05:00 – 11:59</td><td>14 小时</td></tr><tr><td>12:00 – 19:59</td><td>13 小时</td></tr><tr><td>20:00 – 23:59</td><td>13 小时</td></tr></tbody></table><table><thead><tr><th>扩编机组</th><th>最大飞行值勤期</th></tr></thead><tbody><tr><td>3名驾驶员</td><td>16 小时</td></tr></tbody></table></div></section>
 </Modal>
}

function Overview({session,base,rules,subjects,onSelect}:{session:FlightSession;base:PhaseOutput[];rules:EnvironmentRule[];subjects:TrainingSubject[];onSelect:(i:number)=>void}){
 const matched=activeRules(rules,session.environment);const activeList=subjects.filter(s=>session.activeSubjects.some(a=>a.subjectId===s.id&&a.status==='active'));
 return <div className="overview"><div className="overview-summary"><div><span>航班进程</span><strong>{session.completedPhaseIds.length}<small>/21</small></strong></div><div className="progress-ring" style={{'--progress':(session.completedPhaseIds.length/21*360)+'deg'} as React.CSSProperties}/><p>当前阶段<br/><b>{phases[session.currentPhaseIndex].name}</b></p></div><div className="phase-grid">{phases.map((p,i)=>{const items=aggregatePhaseItems(p.id,base,matched,activeList),risks=items.filter(x=>x.kind==='risk'),done=session.completedPhaseIds.includes(p.id),current=i===session.currentPhaseIndex;return <button key={p.id} className={'phase-card '+(done?'done ':'')+(current?'current':'')} onClick={()=>onSelect(i)}><header><span>{String(i+1).padStart(2,'0')}</span>{done&&<Check/>}</header><h3>{p.name}</h3><footer><span>{items.filter(x=>x.kind==='check').length} 项</span>{risks.some(x=>x.severity==='critical')?<Pill tone="critical">关键</Pill>:risks.length?<Pill tone="caution">{risks.length} 风险</Pill>:<span className="quiet">无提示</span>}</footer></button>})}</div></div>
}

export default function App(){
 const[loading,setLoading]=useState(true),[session,setSession]=useState<FlightSession>(newSession()),[rules,setRules]=useState<EnvironmentRule[]>([]),[subjects,setSubjects]=useState<TrainingSubject[]>([]),[base,setBase]=useState<PhaseOutput[]>(emptyBaseOutputs),[screen,setScreen]=useState<'home'|'flow'>('home'),[view,setView]=useState<'current'|'overview'>('current'),[viewPhaseIndex,setViewPhaseIndex]=useState(0),[modal,setModal]=useState<string|null>(null),[showIncomplete,setShowIncomplete]=useState(false);const importRef=useRef<HTMLInputElement>(null);
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
 const exportData=async()=>{let crewTemplates:CrewTemplates|undefined;try{crewTemplates=JSON.parse(localStorage.getItem('flight-flow-crew-templates')||'null')??undefined}catch{}const data:AppBackup={version:1,exportedAt:now(),session,baseOutputs:base,rules,subjects,crewTemplates};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='flight-flow-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)};
 const importData=async(file:File)=>{try{const data=JSON.parse(await file.text())as AppBackup;if(data.version!==1||!Array.isArray(data.rules)||!Array.isArray(data.subjects))throw new Error();const merge=confirm('按“确定”合并科目和规则；按“取消”将完全覆盖现有数据。');const nextRules=merge?[...new Map([...rules,...data.rules].map(x=>[x.id,x])).values()]:data.rules;const nextSubjects=merge?[...new Map([...subjects,...data.subjects].map(x=>[x.id,x])).values()]:data.subjects;await db.transaction('rw',[db.rules,db.subjects,db.sessions,db.settings],async()=>{await db.rules.clear();await db.rules.bulkPut(nextRules);await db.subjects.clear();await db.subjects.bulkPut(nextSubjects);await db.sessions.put(data.session);await db.settings.put({key:'baseOutputs',value:data.baseOutputs})});if(data.crewTemplates)localStorage.setItem('flight-flow-crew-templates',JSON.stringify(data.crewTemplates));setRules(nextRules);setSubjects(nextSubjects);setSession(data.session);setBase(data.baseOutputs);alert('导入完成')}catch{alert('无法导入：文件格式或版本不正确')}};
 if(loading)return <div className="splash"><img src={import.meta.env.BASE_URL+'icon.svg'}/><h1>飞行工具箱</h1><span>正在恢复工具箱…</span></div>;
 if(screen==='home')return <div className="toolkit-home">
  <header className="home-nav"><div className="home-brand"><img src={import.meta.env.BASE_URL+'icon.svg'}/><div><b>飞行工具箱</b><span>Flight Kit</span></div></div><button className="home-settings" onClick={()=>setModal('settings')}><Settings2/>设置</button></header>
  <main className="home-content"><section className="home-hero"><span className="home-eyebrow"><Sparkles/> ALL YOUR FLIGHT TOOLS</span><h1>今天要用哪个工具？</h1><p>每个功能都是独立工具，需要时打开，用完即走。</p></section><section className="tool-grid compact-grid">
   <button className="tool-tile tile-f1" onClick={()=>setModal('f1guide')}><div className="tile-icon"><BookOpen/></div><span>跟班助手</span><h2>F1 跟班</h2><p>航班解析、消息模板与跟班流程</p><footer><b>打开工具</b><ChevronRight/></footer></button>
   <button className="tool-tile tile-contract" onClick={()=>setModal('contract')}><div className="tile-icon"><Clock3/></div><span>时间工具</span><h2>承包时间</h2><p>分步录入航段、比例折算与收入估算</p><footer><b>打开计算器</b><ChevronRight/></footer></button>
   <button className="tool-tile tile-duty" onClick={()=>setModal('duty')}><div className="tile-icon"><Calculator/></div><span>时间工具</span><h2>值勤计算</h2><p>值勤期限与中途休息顺延</p><footer><b>打开计算器</b><ChevronRight/></footer></button>
   <button className="tool-tile tile-flow" onClick={()=>setScreen('flow')}><div className="tile-icon"><ListChecks/></div><span>核心工作区</span><h2>飞行进程</h2><p>包含 21 个运行阶段、环境与飞机、模拟机科目</p><footer><b>{session.completedPhaseIds.length}/21 已完成</b><span className="tile-note">测试阶段</span><ChevronRight/></footer></button>
  </section></main>
  {modal==='f1guide'&&<F1GuideModal session={session} onChange={saveSession} onClose={()=>setModal(null)}/>} {modal==='contract'&&<Modal title="承包时间" onClose={()=>setModal(null)} wide><ContractTimeCalculator/></Modal>} {modal==='duty'&&<DutyCalculatorModal onClose={()=>setModal(null)}/>} {modal==='changelog'&&<ChangelogModal onClose={()=>setModal(null)}/>} {modal==='settings'&&<Modal title="设置与数据" onClose={()=>setModal(null)}><div className="settings-list"><button onClick={()=>setModal('changelog')}><BookOpen/><span><b>版本更新记录</b><small>当前 v{APP_VERSION}</small></span><ChevronRight/></button><button onClick={exportData}><Download/><span><b>导出完整备份</b><small>进度、模板、规则与科目库</small></span><ChevronRight/></button><button onClick={()=>importRef.current?.click()}><Upload/><span><b>导入备份</b><small>支持合并或完全覆盖</small></span><ChevronRight/></button></div><input ref={importRef} hidden type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&importData(e.target.files[0])}/></Modal>}
 </div>;
 return <div className="app-shell">
  <aside className="rail"><div className="brand"><img src={import.meta.env.BASE_URL+'icon.svg'}/><div><b>飞行工具箱</b><span>v{APP_VERSION} · 测试阶段</span></div></div><nav>{phases.map((p,i)=><button title={p.name} key={p.id} className={(i===viewPhaseIndex?'active ':'')+(i===session.currentPhaseIndex?'current-exec ':'')+(session.completedPhaseIds.includes(p.id)?'done':'')} onClick={()=>previewPhase(i)}><span>{session.completedPhaseIds.includes(p.id)?<Check/>:String(i+1).padStart(2,'0')}</span><em>{p.name}</em></button>)}</nav></aside>
  <main className="workspace"><header className="topbar"><div className="flow-nav"><button className="back-home" onClick={()=>setScreen('home')}><Home/>工具箱</button><div className="segmented"><button className={view==='current'?'active':''} onClick={()=>setView('current')}><ListChecks/>当前阶段</button><button className={view==='overview'?'active':''} onClick={()=>setView('overview')}><LayoutGrid/>总览</button></div></div><div className="top-actions"><button onClick={()=>setModal('environment')}><CloudSun/>环境条件{matched.length>0&&<b>{matched.length}</b>}</button><button onClick={()=>setModal('aircraft')}><Plane/>飞机信息</button><button onClick={()=>setModal('subjects')}><ShieldAlert/>模拟机科目{session.activeSubjects.filter(x=>x.status==='active').length>0&&<b>{session.activeSubjects.filter(x=>x.status==='active').length}</b>}</button><button onClick={()=>setModal('rules')}><Settings2/>运行规则</button><button className="icon-btn" onClick={()=>setModal('settings')} aria-label="设置"><Settings2/></button></div></header>
   {view==='overview'?<Overview session={session} base={base} rules={rules} subjects={subjects} onSelect={previewPhase}/>:<div className="current-view">
    <section className="stage-hero"><div><span className="eyebrow">PHASE {String(viewPhaseIndex+1).padStart(2,'0')} / 21 · {phase.group}</span><h1>{phase.name}</h1><div className="status-row"><Pill tone={viewingCurrent?'active':'info'}>{viewingCurrent?'当前阶段':'查看阶段'}</Pill>{!viewingCurrent&&<Pill tone="active">当前执行：{currentPhase.name}</Pill>}{showOperationMode&&<Pill tone={operationMode==='常规运行'?'active':'caution'}>{operationMode}</Pill>}{matched.map(r=><Pill tone={r.outputs.some(o=>o.items.some(i=>i.severity==='critical'))?'critical':'caution'} key={r.id}>{r.name}</Pill>)}{activeSubjectRecords.map(s=><Pill tone="critical" key={s.id}>{s.name}</Pill>)}</div></div><div className="stage-progress"><span>{Math.round((session.currentPhaseIndex+1)/21*100)}%</span><div><i style={{width:(session.currentPhaseIndex+1)/21*100+'%'}}/></div></div></section>
    <section className="content-panel"><div className="panel-head"><div><h2>本阶段提示</h2><span>{checkItems.filter(x=>session.checked[x.checkKey]).length} / {checkItems.length} 已完成</span></div><button className="small-btn" onClick={()=>setModal('base')}><Edit3/>编辑正常流程</button></div>
     {!items.length?<div className="empty-state"><div><ListChecks/></div><h3>本阶段还没有提示</h3><p>可编辑正常流程，或通过环境规则和模拟机科目自动加入内容。</p><button className="primary-btn" onClick={()=>setModal('base')}><Plus/>添加第一项</button></div>:<div className="item-list separated-list">{riskItems.length>0&&<section className="item-section risk-section"><h3><ShieldAlert/>风险提示</h3>{riskItems.map(renderItem)}</section>}{checkItems.length>0&&<section className="item-section check-section"><h3><ListChecks/>易忘提醒</h3>{checkItems.map(renderItem)}</section>}</div>}
    </section>
    <footer className="stage-nav">{viewingCurrent?<button className="ghost-btn" disabled={session.currentPhaseIndex===0} onClick={()=>go(session.currentPhaseIndex-1)}><ArrowLeft/>上一阶段</button>:<button className="ghost-btn" onClick={returnToCurrent}>回到当前阶段</button>}{viewingCurrent?<button className="primary-btn next" onClick={()=>session.currentPhaseIndex===20?saveSession({...session,completedPhaseIds:[...new Set([...session.completedPhaseIds,currentPhase.id])] }):go(session.currentPhaseIndex+1)}>{session.currentPhaseIndex===20?'完成全部阶段':'完成并进入下一阶段'}{session.currentPhaseIndex<20&&<ArrowRight/>}</button>:<span className="preview-note">正在查看其它阶段，不会改变完成进度</span>}</footer>
   </div>}
  </main>
  {modal==='f1guide'&&<F1GuideModal session={session} onChange={saveSession} onClose={()=>setModal(null)}/>}
  {modal==='duty'&&<DutyCalculatorModal onClose={()=>setModal(null)}/>}
  {modal==='environment'&&<EnvironmentModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='aircraft'&&<AircraftModal value={session.environment} onChange={environment=>saveSession({...session,environment})} onClose={()=>setModal(null)}/>}
  {modal==='base'&&<BaseEditor outputs={base} onClose={()=>setModal(null)} onSave={async v=>{setBase(v);await db.settings.put({key:'baseOutputs',value:v});setModal(null)}}/>}
  {modal==='rules'&&<RulesModal rules={rules} onClose={()=>setModal(null)} onSave={async v=>{setRules(v);await db.rules.clear();await db.rules.bulkPut(v);setModal(null)}}/>}
  {modal==='subjects'&&<SubjectsModal subjects={subjects} active={session.activeSubjects} onClose={()=>setModal(null)} onActivate={id=>saveSession({...session,activeSubjects:[...session.activeSubjects,{subjectId:id,status:'active',activatedAt:now()}]})} onResolve={id=>saveSession({...session,activeSubjects:session.activeSubjects.map(a=>a.subjectId===id?{...a,status:'resolved',resolvedAt:now()}:a)})} onSave={async v=>{setSubjects(v);await db.subjects.clear();await db.subjects.bulkPut(v)}}/>}
  {modal==='changelog'&&<ChangelogModal onClose={()=>setModal(null)}/>}
  {modal==='settings'&&<Modal title="设置与数据" onClose={()=>setModal(null)}><div className="settings-list"><button onClick={()=>setModal('changelog')}><BookOpen/><span><b>版本更新记录</b><small>当前 v{APP_VERSION} · 查看每版改动</small></span><ChevronRight/></button><button onClick={exportData}><Download/><span><b>导出完整备份</b><small>进度、模板、规则与科目库</small></span><ChevronRight/></button><button onClick={()=>importRef.current?.click()}><Upload/><span><b>导入备份</b><small>支持合并或完全覆盖</small></span><ChevronRight/></button><button className="danger-row" onClick={()=>confirm('开始新航班？当前执行进度和勾选记录将被清空。')&&saveSession(newSession())}><RotateCcw/><span><b>新建航班</b><small>保留规则和科目库</small></span><ChevronRight/></button></div><input ref={importRef} hidden type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&importData(e.target.files[0])}/></Modal>}
  {showIncomplete&&<Modal title="还有未完成项目" onClose={()=>setShowIncomplete(false)}><div className="warning-callout"><AlertTriangle/><p>本阶段还有 <b>{incomplete.length}</b> 个易忘项目未勾选。你仍然可以继续。</p></div><ul className="incomplete-list">{incomplete.map(x=><li key={x.checkKey}><span>{x.text}</span><small>{x.sources.join(' · ')}</small></li>)}</ul><footer className="modal-actions"><button className="ghost-btn" onClick={()=>setShowIncomplete(false)}>返回检查</button><button className="danger-btn" onClick={()=>{setShowIncomplete(false);go(session.currentPhaseIndex+1,true)}}>确认继续<ArrowRight/></button></footer></Modal>}
 </div>
}
