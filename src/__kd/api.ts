// (C) 2007-2018 GoodData Corporation
import { SDK } from '@gooddata/gooddata-js';
import { VisualizationInput } from '@gooddata/typings';

export interface IKdContext {
    projectId: string;
    clientId?: string;
    userId: string;
    api: IKdApi;
}

export interface IKdApi {
    /**
     * Allows registration of listeners to KD events.
     * @param listener
     */
    addListener(listener: EventListener): void;

    /**
     * Allows registration of props interceptors.
     *
     * @param pi
     */
    addPropsInterceptors(pi: IPropsInterceptors): void;

    /**
     * Returns a ready-to-use instance of gooddata.js
     */
    sdk(): SDK;

    /**
     * Returns an API to manipulate dashboard layout.
     */
    layoutApi(): ILayoutApi;

    /**
     * Returns an API to manipulate filters on the dashboard.
     */
    filtersApi(): IFiltersApi;

    /**
     * Register a function to call before the plugin gets unloaded.
     * @param fun
     */
    onDispose(fun: (context: IKdContext) => void): void;
}

//
//
//

export interface IKdElement {
    identifier: string;
    type: string;

    /**
     * Actions tell element to do something. If an action is not supported by the element, nothing happens.
     * Action is processed asynchronously.
     *
     * @param action
     */
    submit(action: IKdAction): Promise<void>;
}

export interface IKdFilterProps {
    visible: boolean;
    filterDefinition: VisualizationInput.IFilter;
}
export interface IKdFilter extends IKdElement {
    props: IKdFilterProps;
}

export interface IKdVisProps {
    visible: boolean;
    buckets: any;
    properties: any;
}
export interface IKdVis extends IKdElement {
    props: IKdVisProps;
}

export interface IKdKpiProps {
    visible: boolean;
}
export interface IKdKpi extends IKdElement {
    props: IKdKpiProps;
}

//
//
//

/**
 * Props interceptors allow programmers to register functions to manipulate filter, KPI and visualization
 * component props at defined points their lifecycle. These functions are synchronous part of the component
 * lifecycle pipeline; they are always run _before_ props are sent to the React component.
 *
 * The function naming convention is as follows: on[ElementType][lifecycleStage]
 *
 * The lifecycleStages are:
 *
 * - init: before first render
 * - update: each re-render
 * - dataLoaded: new data is available for the component
 */
export interface IPropsInterceptors {
    onFilterInit?(context: IKdContext, element: IKdFilter): IKdFilter;
    onFilterUpdate?(context: IKdContext, previous: IKdFilter, next: IKdFilter): IKdFilter;
    onKpiInit?(context: IKdContext, element: IKdKpi): IKdKpi;
    onKpiUpdate?(context: IKdContext, element: IKdKpi): IKdKpi;
    onKpiDataLoaded?(context: IKdContext, element: IKdKpi, data: any): IKdKpi;
    onVisInit?(context: IKdContext, element: IKdVis): IKdKpi;
    onVisUpdate?(context: IKdContext, element: IKdVis): IKdKpi;
    onVisDataLoaded?(context: IKdContext, element: IKdVis, data: any): IKdKpi;
}


//
//
//

/**
 * Allows programmatic manipulation of dashboard layout
 */
export interface ILayoutApi {
    addRow(order: number, row: ILayoutRow): void;
    addColumn(rowIndex: number, colIndex: number, col: ILayoutCol): void;
    removeRow(index: number): void;
    removeColumn(rowIndex: number, colIndex: number): void;
}

export interface ILayoutRow {
    [idx: number]: ILayoutCol;
}

export interface ILayoutCol {
    size: number;
    element: JSX.Element;
}

//
//
//

export interface IFiltersApi {

}

//
// Events
//

export interface IEvent {
    eventType: string;
}

export interface IKdEvent extends IEvent {
    context: IKdContext;
    element?: IKdElement;
    body: KdEvents;
}

export interface IKdElementInitialized {}
export interface IKdElementRendered {}
export interface IKdRendered {}

export type KdEvents = IKdElementInitialized | IKdElementRendered | IKdRendered;


export type EventListener = (event: IKdEvent) => void;
//
// Actions
//

export interface IKdAction {
    type: string
}

export interface IKdVisAction extends IKdAction {
    body: BucketActions | PropertiesActions | DrillActions;
}

export interface IAddFilterAction {}
export interface IModifyFilterAction {}
export interface IAddMetricAction {}
export interface IRemoveMetricAction {}
export interface IAddAttributeAction {}
export interface IRemoveAttributeAction {}
export type BucketActions = IAddFilterAction | IModifyFilterAction | IAddMetricAction | IRemoveMetricAction | IAddAttributeAction | IRemoveAttributeAction;

export interface IAddProperty {}
export interface IRemoveProperty {}
export interface IUpdateProperty {}
export type PropertiesActions = IAddProperty | IRemoveProperty | IUpdateProperty;

export interface IAddDrill {}
export interface IRemoveDrill {}
export type DrillActions = IAddDrill | IRemoveDrill;
