// (C) 2007-2018 GoodData Corporation
import { SDK } from '@gooddata/gooddata-js';

export interface IKdApi {
    /**
     * Allows registration of listeners to KD events.
     * @param listener
     */
    addListener(listener: EventListener): void;

    /**
     * Allows registration of middleware.
     *
     * @param m
     */
    addMiddleware(m: IMiddleware): void;

    onDispose(fun: () => void): void;

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
}

//
//
//

export interface IKdContext {
    projectId: string;
    clientId?: string;
    userId: string;
    api: IKdApi;
}

export interface IKdElement {
    identifier: string;

    submit(action: IKdAction): void;
}

export interface IKdFilter extends IKdElement {

}

export interface IVisData {
    buckets: any; // TODO concrete types
    properties: any; // TODO concrete types
}

export type MiddlewareData = IVisData;

export interface IMiddlwareInput {
    context: IKdContext;
    element: IKdElement;
    data: MiddlewareData;
}

export interface IMiddleware {
    // Called _before_ initial render
    onInit?: (input: IMiddlwareInput) => MiddlewareData;
    // Called on each render after the initial
    onUpdate?: (input: IMiddlwareInput) => MiddlewareData;
}

export interface IKdVis extends IKdElement {
    getBuckets(): any;
    getProperties(): any;
}

export interface IKdHeader extends IKdElement {
    getText(): string;
}

export interface IKdComponent extends IKdElement {

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
    payload: KdEvents;
}

export interface IKdElementInitialized {}
export interface IKdElementRendered {}
export interface IKdRendered {}

export type KdEvents = IKdElementInitialized | IKdElementInitialized | IKdRendered;


export type EventListener = (event: IKdEvent) => void;
//
// Actions
//

export interface IKdAction {
    type: string
}

export interface IKdVisAction extends IKdAction {
    payload: BucketActions | PropertiesActions;
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
