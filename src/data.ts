import type{EnvironmentRule,FlightPhase,FlightSession,FlowItem,PhaseOutput,TrainingSubject}from'./types';
export const APP_VERSION='0.3.3';
export const APP_UPDATED_AT='2026-07-18 21:20';
export const changelog=[
 {version:'0.3.3',date:'2026-07-18 21:20',items:['F1 复制给机长的信息删除起飞机场。','起飞时间和准备时间改为“今天/明天 HH:mm”格式，更适合直接发消息。']},
 {version:'0.3.2',date:'2026-07-18 21:05',items:['F1 航班信息起飞时间改为 iPad 更容易输入的日期可选 + 起飞时刻格式。','删除单独复制起飞时间/准备时间按钮，仅保留复制给机长的汇总消息。','F1 跟班新增时间计算器，可计算两个时长相加结果。']},
 {version:'0.3.1',date:'2026-07-18 20:40',items:['F1 跟班新增航班信息输入，可按天府/双流、起飞时间和航线类型自动计算准备时间。','天府 12:00 以前起飞自动提示前一天 21:00 前签到，并提供可复制的起飞/准备时间消息。','按最新口径清理 F1 跟班各阶段固定项目。']},
 {version:'0.2.3',date:'2026-06-25 17:00',items:['新增设置里的版本更新记录，可查看每版改动内容。']},
 {version:'0.2.2',date:'2026-06-25 16:45',items:['修复高温运行标签重复显示。','左侧阶段列表改为仅预览，不再提前标记阶段完成。','新增“回到当前阶段”按钮。']},
 {version:'0.2.1',date:'2026-06-25 16:25',items:['环境条件和飞机信息拆成两个独立页面。','飞机信息页新增预计起飞重量预览。']},
 {version:'0.2.0',date:'2026-06-25 01:10',items:['新增高温、冬季、降水、跑道代码444、低能见度、除/防冰等环境规则。','阶段内风险提示和易忘提醒拆分上下显示。','新增版本号和更新时间显示。']},
 {version:'0.1.0',date:'2026-06-24',items:['创建 iPad 飞行阶段 PWA 首版。','实现21个飞行阶段、总览/当前阶段、环境规则、模拟机科目、JSON备份与离线运行。']}
];
export const phases:FlightPhase[]=[
['external-safety','外部安全检查','外部安全','地面准备'],['cockpit-initial','驾驶舱初始准备','初始准备','地面准备'],['walkaround','外部绕机检查','绕机检查','地面准备'],['cockpit-preparation','驾驶舱准备','驾驶舱准备','地面准备'],['before-start','推出或起动前','起动前','地面准备'],['engine-start','发动机起动','发动机起动','地面准备'],['after-start','起动后','起动后','地面准备'],['taxi','滑行','滑行','地面准备'],['before-takeoff','起飞前','起飞前','起飞'],['takeoff','起飞','起飞','起飞'],['after-takeoff','起飞后','起飞后','起飞'],['climb','爬升','爬升','航路'],['cruise','巡航','巡航','航路'],['descent-preparation','下降准备','下降准备','航路'],['descent','下降','下降','航路'],['approach','进近','进近','进近着陆'],['landing','着陆','着陆','进近着陆'],['go-around','复飞','复飞','进近着陆'],['after-landing','着陆后','着陆后','停机'],['parking','停机','停机','停机'],['securing-aircraft','安全离机','安全离机','停机']].map(([id,name,shortName,group])=>({id,name,shortName,group}as FlightPhase));
export const emptyBaseOutputs:PhaseOutput[]=phases.map(p=>({phaseId:p.id,items:[]}));
const now=()=>new Date().toISOString();
export function newSession():FlightSession{return{id:'current',currentPhaseIndex:0,completedPhaseIds:[],checked:{},environment:{},f1FlightInfo:{routeType:'domestic'},activeSubjects:[],createdAt:now(),updatedAt:now()}}
export const defaultRules:EnvironmentRule[]=[
 {id:'rule-high-temperature',name:'高温运行',enabled:true,groups:[{id:'group-high-temp',conditions:[{id:'cond-high-temp',field:'temperature',operator:'gt',value:30}]}],outputs:[{phaseId:'cockpit-preparation',items:[{id:'high-temp-flap1-yellow-blue-pump',text:'黄+蓝超压泵放襟翼 1',kind:'check',severity:'caution',order:10}]}],updatedAt:now()},
 {id:'rule-winter-template',name:'冬季运行（模板）',enabled:false,groups:[{id:'group-winter-temp',conditions:[{id:'cond-winter-temp',field:'temperature',operator:'lte',value:0}]}],outputs:[],updatedAt:now()},
 {id:'rule-precipitation',name:'降水运行',enabled:true,groups:[{id:'group-precipitation',conditions:[{id:'cond-precipitation',field:'precipitation',operator:'eq',value:'yes'}]}],outputs:[
  {phaseId:'cockpit-initial',items:[{id:'rain-extract-fan-override',text:'排风扇超控',kind:'check',severity:'caution',order:10}]},
  {phaseId:'cockpit-preparation',items:[{id:'rain-wiper-risk-cockpit-prep',text:'有降水：准备滑行前关注雨刷使用，避免进入降水区域后才处理',kind:'risk',severity:'caution',order:10}]},
  {phaseId:'before-start',items:[{id:'rain-wiper-risk-before-start',text:'有降水：推出或起动前确认雨刷按需使用',kind:'risk',severity:'caution',order:10}]},
  {phaseId:'engine-start',items:[{id:'rain-wiper-risk-engine-start',text:'有降水：发动机起动期间按需开雨刷',kind:'risk',severity:'caution',order:10}]},
  {phaseId:'after-start',items:[{id:'rain-wiper-risk-after-start',text:'有降水：起动后按需开雨刷',kind:'risk',severity:'caution',order:10}]},
  {phaseId:'taxi',items:[{id:'rain-wiper-risk-taxi',text:'有降水：滑行按需开雨刷',kind:'risk',severity:'caution',order:10},{id:'rain-turn-speed-below-7kt',text:'湿滑转弯速度低于 7 kt',kind:'risk',severity:'caution',order:11}]},
  {phaseId:'before-takeoff',items:[{id:'rain-wiper-fast-enter-runway',text:'进跑道前雨刷开到 FAST',kind:'check',severity:'caution',order:10}]},
  {phaseId:'after-takeoff',items:[{id:'rain-wiper-off-after-takeoff',text:'关雨刷',kind:'check',severity:'caution',order:10},{id:'rain-extract-fan-override-off',text:'排风扇解除超控',kind:'check',severity:'caution',order:11}]},
  {phaseId:'approach',items:[{id:'rain-final-wiper-fast',text:'五边雨刷开 FAST',kind:'check',severity:'caution',order:10}]},
  {phaseId:'after-landing',items:[{id:'rain-wiper-slow-after-landing',text:'着陆后雨刷 SLOW',kind:'check',severity:'caution',order:10}]},
  {phaseId:'parking',items:[{id:'rain-wiper-off-stand',text:'进机位关雨刷',kind:'check',severity:'caution',order:10}]}
 ],updatedAt:now()},
 {id:'rule-runway-code-444',name:'跑道代码 444',enabled:true,groups:[{id:'group-rwy-code-444',conditions:[{id:'cond-rwy-code-444',field:'runwayCode',operator:'eq',value:'444'}]}],outputs:[{phaseId:'takeoff',items:[{id:'rwy444-toga-takeoff',text:'跑道代码 444：油门 TOGA',kind:'risk',severity:'critical',order:5}]}],updatedAt:now()},
 {id:'rule-low-visibility',name:'低能见度',enabled:true,groups:[{id:'group-low-vis',conditions:[{id:'cond-low-vis',field:'visibility',operator:'lte',value:400}]}],outputs:[{phaseId:'cockpit-preparation',items:[{id:'low-vis-ls-button-on',text:'LS 按钮开',kind:'check',severity:'caution',order:12}]}],updatedAt:now()},
 {id:'rule-low-vis-crosswind-limit',name:'低能见度 + 侧风限制',enabled:true,groups:[{id:'group-low-vis-crosswind',conditions:[{id:'cond-low-vis-crosswind-vis',field:'visibility',operator:'lte',value:400},{id:'cond-low-vis-crosswind',field:'crosswind',operator:'gt',value:15}]}],outputs:[{phaseId:'before-takeoff',items:[{id:'low-vis-crosswind-no-takeoff-before',text:'低能见度且侧风大于 15 kt：不能起飞',kind:'risk',severity:'critical',order:0}]},{phaseId:'takeoff',items:[{id:'low-vis-crosswind-no-takeoff',text:'低能见度且侧风大于 15 kt：不能起飞',kind:'risk',severity:'critical',order:0}]}],updatedAt:now()},
 {id:'rule-anti-ice-required',name:'需要除/防冰',enabled:true,groups:[{id:'group-anti-ice-required',conditions:[{id:'cond-anti-ice-required',field:'antiIceRequired',operator:'eq',value:'yes'}]}],outputs:[{phaseId:'after-start',items:[{id:'anti-ice-delay-flap-until-runway',text:'延迟放襟翼直到进跑道',kind:'check',severity:'caution',order:10}]},{phaseId:'taxi',items:[{id:'anti-ice-shedding-procedure',text:'执行卸冰程序',kind:'check',severity:'caution',order:10}]},{phaseId:'after-landing',items:[{id:'anti-ice-delay-flap-retract-until-stand',text:'延迟收襟翼直到机位上',kind:'check',severity:'caution',order:10}]}],updatedAt:now()}
];

export const f1GuidePhases:{id:string;name:string;items:FlowItem[]}[]=[
 {id:'online-prep',name:'网上准备',items:[
  {id:'online-message',kind:'check',severity:'info',order:1,text:'提前一天给机长发消息，确认任务、起飞时间、准备时间和集合要求。'},
  {id:'online-risk-time',kind:'risk',severity:'caution',order:2,text:'早班、异地、基地公寓和调度签到时间容易混淆，务必按当天航班信息核对。'}
 ]},
 {id:'briefing-room',name:'准备室',items:[
  {id:'brief-screen',kind:'check',severity:'info',order:1,text:'到准备室看屏幕，确认自己的准备桌，打开对应电脑。'},
  {id:'brief-login',kind:'check',severity:'info',order:2,text:'在桌面系统登录，完成签到，查看飞行计划、飞行前自查、签派放行/任务书。'},
  {id:'brief-plan-download',kind:'check',severity:'info',order:3,text:'起飞前约 3 小时可下载飞行计划，提前看航路、油量、天气和特殊信息。'},
  {id:'brief-fuel',kind:'check',severity:'caution',order:4,text:'核对油量，并在手机和 iPad 上记录。'},
  {id:'brief-risk-seat',kind:'risk',severity:'caution',order:5,text:'F1 阶段跟随机长/教员安排，座位、任务和观察重点以现场分工为准。'}
 ]},
 {id:'crew-bus',name:'机组车去机场',items:[
  {id:'bus-workbench',kind:'check',severity:'info',order:1,text:'机组车上打开 3.0 工作台，进入审批/协同单等页面，关注机组协同单。'},
  {id:'bus-standby',kind:'check',severity:'info',order:2,text:'驻外或特殊任务按要求准备工作单，必要时在车上完成。'},
  {id:'bus-captain-first',kind:'risk',severity:'caution',order:3,text:'协同单通常等机长先选/划到底后再填写，避免抢填或填错。'}
 ]},
 {id:'on-board',name:'上飞机',items:[
  {id:'board-equipment',kind:'check',severity:'caution',order:1,text:'检查起落架销子堵盖、应急设备、排雨剂量、滑油量/剩油、纸质 OEB、48 小时内 DDL。'},
  {id:'board-recorder',kind:'check',severity:'caution',order:2,text:'插录音笔，耳机线两个插头都要插，简令前要先开录音。'},
  {id:'board-walkaround',kind:'check',severity:'info',order:3,text:'跟随机组做绕机检查，拿油单，核实飞机注册号和航班号，并签字上传 EFB 和任务书。'},
  {id:'board-paper',kind:'check',severity:'info',order:4,text:'填写通讯记录本、监控飞机/观察记录相关内容。'},
  {id:'board-loadsheet',kind:'check',severity:'caution',order:5,text:'飞行中照舱单把人数、商载、起飞重量等填好；落地看时间单，记录剩油。'},
  {id:'board-flb-tlb',kind:'check',severity:'caution',order:6,text:'先完成任务书，再填写 FLB；TLB 通常填 NIL。任务书填错可回来重新打印。'},
  {id:'board-mcdu',kind:'check',severity:'info',order:7,text:'观察 MCDU 输入顺序：INIT、F-PLN、RAD NAV、性能等；记录 ABCD/E 插入点逻辑。'},
  {id:'board-risk-paper',kind:'risk',severity:'caution',order:8,text:'纸质资料、油单、任务书、FLB/TLB、通讯记录本容易漏填或填错，建议按固定顺序检查。'}
 ]},
 {id:'in-flight',name:'飞行中',items:[
  {id:'flight-observe',kind:'check',severity:'info',order:1,text:'观察标准喊话、频率转换、滑行路线、跑道进离场路线、MCDU/FCU/监控分工。'},
  {id:'flight-route',kind:'check',severity:'info',order:2,text:'起飞后听指令熟悉航路走向和指挥习惯，进入巡航后看具体情况学习。'},
  {id:'flight-record',kind:'check',severity:'caution',order:3,text:'写通讯记录本、监控飞机；巡航不颠簸时根据油单/舱单填写飞行时间本。'},
  {id:'flight-qnh',kind:'check',severity:'caution',order:4,text:'下降 10000 ft 以下且调 QNH 后，记得做进近检查单。'},
  {id:'flight-approach',kind:'check',severity:'info',order:5,text:'观察进近图、进场路线选择、跑道选择，提前预估滑行路线。'},
  {id:'flight-risk-overload',kind:'risk',severity:'caution',order:6,text:'F1 阶段信息量大，不要追求一次全记住；优先记录流程、口令、频率、时间和容易漏的纸面工作。'}
 ]},
 {id:'after-landing-f1',name:'下飞机',items:[
  {id:'after-monitor',kind:'check',severity:'caution',order:1,text:'监控好下机数据、落地时间、剩油等，按需完成记录。'},
  {id:'after-paper',kind:'check',severity:'info',order:2,text:'落地后完成飞行路线/飞行图上检查，监控大哥二哥滑行路线。'},
  {id:'after-oil',kind:'check',severity:'caution',order:3,text:'根据 iPad 油量判断是否下去拿油单；若不需要，继续完成记录本和电子任务书。'},
  {id:'after-recorder',kind:'check',severity:'caution',order:4,text:'过站落地后保存录音笔；下机前确认录音笔已拔、资料已带走。'},
  {id:'after-upload',kind:'check',severity:'info',order:5,text:'上传电子油单、签过字的舱单，按需拍照留存。'},
  {id:'after-risk-forget',kind:'risk',severity:'caution',order:6,text:'下机阶段最容易漏录音笔、纸质资料、油单/舱单照片和电子上传。'}
 ]},
 {id:'debrief',name:'航后讲评',items:[
  {id:'debrief-route',kind:'check',severity:'info',order:1,text:'复盘航路、滑行路线、频率、标准喊话和当天观察到的程序差异。'},
  {id:'debrief-question',kind:'check',severity:'info',order:2,text:'把不懂的缩写、纸面流程、MCDU 输入、监控口令整理成问题，找机会问教员/机长。'},
  {id:'debrief-archive',kind:'check',severity:'caution',order:3,text:'整理录音、照片、通讯记录本、时间单和个人笔记，形成下次跟班前可复习的材料。'},
  {id:'debrief-next',kind:'check',severity:'info',order:4,text:'根据本次遗漏更新自己的 F1 跟班流程清单。'}
 ]}
];
export const defaultSubjects:TrainingSubject[]=[{id:'subject-dual-fmgc',name:'双 FMGC 失效',aliases:['双飞管失效'],keywords:['FMGC','飞行管理'],description:'',outputs:[],createdAt:now(),updatedAt:now()},{id:'subject-lgciu1-ground',name:'地面 LGCIU 1 失效',aliases:['LGCIU1'],keywords:['起落架控制接口组件','地面'],description:'',outputs:[],createdAt:now(),updatedAt:now()}];
export const fieldLabels:Record<string,string>={airport:'机场',aircraftType:'机型',fuelTons:'油量（吨）',zeroFuelWeightTons:'0燃油重量（吨）',temperature:'气温',windDirection:'风向',windSpeed:'风速',gust:'阵风',visibility:'能见度',precipitation:'是否降水',antiIceRequired:'需要除/防冰',runway:'跑道',runwayHeading:'跑道方向',runwayCode:'跑道代码',runwayState:'跑道状态',brakingAction:'刹车效应',notes:'备注',crosswind:'侧风分量',headwind:'顶风分量'};
export const operatorLabels:Record<string,string>={gt:'大于',gte:'大于或等于',lt:'小于',lte:'小于或等于',eq:'等于',neq:'不等于',contains:'包含'};
