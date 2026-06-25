export type Severity='info'|'caution'|'critical';
export type ItemKind='check'|'risk';
export interface FlowItem{id:string;text:string;kind:ItemKind;severity:Severity;order:number}
export interface PhaseOutput{phaseId:string;items:FlowItem[]}
export interface FlightPhase{id:string;name:string;shortName:string;group:'地面准备'|'起飞'|'航路'|'进近着陆'|'停机'}
export interface EnvironmentData{airport?:string;aircraftType?:string;fuelTons?:number;zeroFuelWeightTons?:number;temperature?:number;windDirection?:number;windSpeed?:number;gust?:number;visibility?:number;precipitation?:'yes'|'no';antiIceRequired?:'yes'|'no';runway?:string;runwayHeading?:number;runwayCode?:string;runwayState?:'dry'|'wet'|'contaminated';brakingAction?:'good'|'medium'|'poor';notes?:string}
export type EnvironmentField=keyof EnvironmentData|'crosswind'|'headwind';
export type ConditionOperator='gt'|'gte'|'lt'|'lte'|'eq'|'neq'|'contains';
export interface RuleCondition{id:string;field:EnvironmentField;operator:ConditionOperator;value:string|number}
export interface ConditionGroup{id:string;conditions:RuleCondition[]}
export interface EnvironmentRule{id:string;name:string;enabled:boolean;groups:ConditionGroup[];outputs:PhaseOutput[];updatedAt:string}
export interface TrainingSubject{id:string;name:string;aliases:string[];keywords:string[];description:string;outputs:PhaseOutput[];createdAt:string;updatedAt:string}
export interface ActiveSubject{subjectId:string;status:'active'|'resolved';activatedAt:string;resolvedAt?:string}
export interface FlightSession{id:'current';currentPhaseIndex:number;completedPhaseIds:string[];checked:Record<string,boolean>;environment:EnvironmentData;activeSubjects:ActiveSubject[];createdAt:string;updatedAt:string}
export interface AppBackup{version:1;exportedAt:string;session:FlightSession;baseOutputs:PhaseOutput[];rules:EnvironmentRule[];subjects:TrainingSubject[]}
export interface DisplayItem extends FlowItem{checkKey:string;sources:string[]}
