import { reducerFunc } from './reducers/types'
import { eventDefParserFunc, EventDef } from './structs/event'
import { eventDragMutationMassager } from './interactions/EventDragging'
import { eventDefMutationApplier } from './structs/event-mutation'
import Calendar, { dateClickApiTransformer, dateSelectionApiTransformer } from './Calendar'
import { dateSelectionJoinTransformer } from './interactions/DateSelecting'
import { ViewConfigInputHash } from './structs/view-config'
import { assignTo } from './util/object'
import { ViewSpecTransformer, ViewSpec } from './structs/view-spec'
import { ViewProps } from './View'
import { CalendarComponentProps } from './CalendarComponent'
import Splitter from './component/event-splitting'
import { Constraint } from './validation'

// TODO: easier way to add new hooks? need to update a million things

export interface PluginDefInput {
  deps?: PluginDef[]
  reducers?: reducerFunc[]
  eventDefParsers?: eventDefParserFunc[]
  eventDragMutationMassagers?: eventDragMutationMassager[]
  eventDefMutationAppliers?: eventDefMutationApplier[]
  dateSelectionTransformers?: dateSelectionJoinTransformer[]
  dateClickApiTransformers?: dateClickApiTransformer[]
  dateSelectionApiTransformers?: dateSelectionApiTransformer[]
  viewConfigs?: ViewConfigInputHash
  viewSpecTransformers?: ViewSpecTransformer[]
  viewPropsTransformers?: ViewPropsTransformerClass[]
  validationSplitter?: ValidationSplitterMeta
}

export interface PluginHooks {
  reducers: reducerFunc[]
  eventDefParsers: eventDefParserFunc[]
  eventDragMutationMassagers: eventDragMutationMassager[]
  eventDefMutationAppliers: eventDefMutationApplier[]
  dateSelectionTransformers: dateSelectionJoinTransformer[]
  dateClickApiTransformers: dateClickApiTransformer[]
  dateSelectionApiTransformers: dateSelectionApiTransformer[]
  viewConfigs: ViewConfigInputHash // TODO: parse before gets to this step?
  viewSpecTransformers: ViewSpecTransformer[]
  viewPropsTransformers: ViewPropsTransformerClass[]
  validationSplitter: ValidationSplitterMeta | null
}

export interface PluginDef extends PluginHooks {
  id: string
  deps: PluginDef[]
}


export interface ValidationSplitterMeta {
  splitterClass: new() => Splitter
  getDateSpanPropsForKey: (key: string) => any
  constraintAllowsKey: (constraint: Constraint, key: string) => boolean
  eventAllowsKey: (subjectDef: EventDef, calendar: Calendar, currentSegmentKey: string) => boolean
}

export type ViewPropsTransformerClass = new() => ViewPropsTransformer

export interface ViewPropsTransformer {
  transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps): any
}


let uid = 0

export function createPlugin(input: PluginDefInput): PluginDef {
  return {
    id: String(uid++),
    deps: input.deps || [],
    reducers: input.reducers || [],
    eventDefParsers: input.eventDefParsers || [],
    eventDragMutationMassagers: input.eventDragMutationMassagers || [],
    eventDefMutationAppliers: input.eventDefMutationAppliers || [],
    dateSelectionTransformers: input.dateSelectionTransformers || [],
    dateClickApiTransformers: input.dateClickApiTransformers || [],
    dateSelectionApiTransformers: input.dateSelectionApiTransformers || [],
    viewConfigs: input.viewConfigs || {},
    viewSpecTransformers: input.viewSpecTransformers || [],
    viewPropsTransformers: input.viewPropsTransformers || [],
    validationSplitter: input.validationSplitter || null
  }
}

export class PluginSystem {

  hooks: PluginHooks
  addedHash: { [pluginId: string]: true }

  constructor() {
    this.hooks = {
      reducers: [],
      eventDefParsers: [],
      eventDragMutationMassagers: [],
      eventDefMutationAppliers: [],
      dateSelectionTransformers: [],
      dateClickApiTransformers: [],
      dateSelectionApiTransformers: [],
      viewConfigs: {},
      viewSpecTransformers: [],
      viewPropsTransformers: [],
      validationSplitter: null
    }
    this.addedHash = {}
  }

  add(plugin: PluginDef) {
    if (!this.addedHash[plugin.id]) {
      this.addedHash[plugin.id] = true

      for (let dep of plugin.deps) {
        this.add(dep)
      }

      this.hooks = combineHooks(this.hooks, plugin)
    }
  }

}

function combineHooks(hooks0: PluginHooks, hooks1: PluginHooks): PluginHooks {
  return {
    reducers: hooks0.reducers.concat(hooks1.reducers),
    eventDefParsers: hooks0.eventDefParsers.concat(hooks1.eventDefParsers),
    eventDragMutationMassagers: hooks0.eventDragMutationMassagers.concat(hooks1.eventDragMutationMassagers),
    eventDefMutationAppliers: hooks0.eventDefMutationAppliers.concat(hooks1.eventDefMutationAppliers),
    dateSelectionTransformers: hooks0.dateSelectionTransformers.concat(hooks1.dateSelectionTransformers),
    dateClickApiTransformers: hooks0.dateClickApiTransformers.concat(hooks1.dateClickApiTransformers),
    dateSelectionApiTransformers: hooks0.dateSelectionApiTransformers.concat(hooks1.dateSelectionApiTransformers),
    viewConfigs: assignTo({}, hooks0.viewConfigs, hooks1.viewConfigs),
    viewSpecTransformers: hooks0.viewSpecTransformers.concat(hooks1.viewSpecTransformers),
    viewPropsTransformers: hooks0.viewPropsTransformers.concat(hooks1.viewPropsTransformers),
    validationSplitter: hooks1.validationSplitter || hooks0.validationSplitter
  }
}
