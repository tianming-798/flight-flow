import type{EnvironmentRule,FlightPhase,FlightSession,PhaseOutput,TrainingSubject}from'./types';
export const APP_VERSION='0.2.0';
export const APP_UPDATED_AT='2026-06-25 01:10';
export const phases:FlightPhase[]=[
['external-safety','外部安全检查','外部安全','地面准备'],['cockpit-initial','驾驶舱初始准备','初始准备','地面准备'],['walkaround','外部绕机检查','绕机检查','地面准备'],['cockpit-preparation','驾驶舱准备','驾驶舱准备','地面准备'],['before-start','推出或起动前','起动前','地面准备'],['engine-start','发动机起动','发动机起动','地面准备'],['after-start','起动后','起动后','地面准备'],['taxi','滑行','滑行','地面准备'],['before-takeoff','起飞前','起飞前','起飞'],['takeoff','起飞','起飞','起飞'],['after-takeoff','起飞后','起飞后','起飞'],['climb','爬升','爬升','航路'],['cruise','巡航','巡航','航路'],['descent-preparation','下降准备','下降准备','航路'],['descent','下降','下降','航路'],['approach','进近','进近','进近着陆'],['landing','着陆','着陆','进近着陆'],['go-around','复飞','复飞','进近着陆'],['after-landing','着陆后','着陆后','停机'],['parking','停机','停机','停机'],['securing-aircraft','安全离机','安全离机','停机']].map(([id,name,shortName,group])=>({id,name,shortName,group}as FlightPhase));
export const emptyBaseOutputs:PhaseOutput[]=phases.map(p=>({phaseId:p.id,items:[]}));
const now=()=>new Date().toISOString();
export function newSession():FlightSession{return{id:'current',currentPhaseIndex:0,completedPhaseIds:[],checked:{},environment:{},activeSubjects:[],createdAt:now(),updatedAt:now()}}
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
export const defaultSubjects:TrainingSubject[]=[{id:'subject-dual-fmgc',name:'双 FMGC 失效',aliases:['双飞管失效'],keywords:['FMGC','飞行管理'],description:'',outputs:[],createdAt:now(),updatedAt:now()},{id:'subject-lgciu1-ground',name:'地面 LGCIU 1 失效',aliases:['LGCIU1'],keywords:['起落架控制接口组件','地面'],description:'',outputs:[],createdAt:now(),updatedAt:now()}];
export const fieldLabels:Record<string,string>={airport:'机场',aircraftType:'机型',fuelTons:'油量（吨）',zeroFuelWeightTons:'0燃油重量（吨）',temperature:'气温',windDirection:'风向',windSpeed:'风速',gust:'阵风',visibility:'能见度',precipitation:'是否降水',antiIceRequired:'需要除/防冰',runway:'跑道',runwayHeading:'跑道方向',runwayCode:'跑道代码',runwayState:'跑道状态',brakingAction:'刹车效应',notes:'备注',crosswind:'侧风分量',headwind:'顶风分量'};
export const operatorLabels:Record<string,string>={gt:'大于',gte:'大于或等于',lt:'小于',lte:'小于或等于',eq:'等于',neq:'不等于',contains:'包含'};
