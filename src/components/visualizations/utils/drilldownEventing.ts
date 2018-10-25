// (C) 2007-2018 GoodData Corporation
import get = require('lodash/get');
import debounce = require('lodash/debounce');
import * as invariant from 'invariant';
import * as CustomEvent from 'custom-event';
import { AFM } from '@gooddata/typings';
import * as Highcharts from 'highcharts';
import {
    IDrillableItem,
    IDrillEventIntersectionElement,
    IDrillItem,
    IDrillIntersection,
    isDrillableItemLocalId,
    IDrillPredicate,
    DrillItemSelector, DrillCompositeItem, DrillCompositionVariants, DrillComposedFromAll, DrillAlternatives
} from '../../../interfaces/DrillEvents';
import { VisElementType, VisType, VisualizationTypes } from '../../../constants/visualizationTypes';
import { isComboChart, isTreemap, isHeatmap } from './common';
import { OnFiredDrillEvent } from '../../../interfaces/Events';
import { TableRowForDrilling } from '../../../interfaces/Table';

export interface IHighchartsPointObject extends Highcharts.PointObject {
    drillContext: IDrillIntersection[];
    z?: number; // is missing in HCH's interface
    value?: number; // is missing in HCH's interface
}

export interface IHighchartsChartDrilldownEvent extends Highcharts.ChartDrilldownEvent {
    point?: IHighchartsPointObject;
    points?: IHighchartsPointObject[];
}

export interface ICellDrillEvent {
    columnIndex: number;
    rowIndex: number;
    row: TableRowForDrilling;
    intersection: IDrillIntersection[];
}

export interface IDrillConfig {
    afm: AFM.IAfm;
    onFiredDrillEvent: OnFiredDrillEvent;
}

export function isGroupHighchartsDrillEvent(event: IHighchartsChartDrilldownEvent) {
    return !!event.points;
}

function getDerivedMeasureMasterMeasureLocalIdentifier(measure: AFM.IMeasure): AFM.Identifier {
    const measureDefinition = get<string>(measure, ['definition', 'popMeasure'])
        || get<string>(measure, ['definition', 'previousPeriodMeasure']);
    return get<string>(measureDefinition, ['measureIdentifier']);
}

function findMeasureByIdentifier(afm: AFM.IAfm, localIdentifier: AFM.Identifier) {
    return (afm.measures || []).find((m: AFM.IMeasure) => m.localIdentifier === localIdentifier);
}

export function getMeasureUriOrIdentifier(afm: AFM.IAfm, localIdentifier: AFM.Identifier): IDrillableItem {
    let measure = findMeasureByIdentifier(afm, localIdentifier);
    if (measure) {
        const masterMeasureIdentifier = getDerivedMeasureMasterMeasureLocalIdentifier(measure);
        if (masterMeasureIdentifier) {
            measure = findMeasureByIdentifier(afm, masterMeasureIdentifier);
        }
        if (!measure) {
            return null;
        }
        return {
            uri: get<string>(measure, ['definition', 'measure', 'item', 'uri']),
            identifier: get<string>(measure, ['definition', 'measure', 'item', 'identifier'])
        };
    }
    return null;
}

function isHeaderDrillable(drillableItems: IDrillableItem[], header: IDrillableItem) {
    return drillableItems.some((drillableItem: IDrillableItem) =>
        // Check for defined values because undefined === undefined
        (drillableItem.identifier && header.identifier && drillableItem.identifier === header.identifier) ||
        (drillableItem.uri && header.uri && drillableItem.uri === header.uri)
    );
}

export function isDrillable(drillableItems: IDrillableItem[],
                            header: IDrillItem,
                            afm: AFM.IAfm) {
    // This works only for non adhoc metric & attributes
    // because adhoc metrics don't have uri & identifier
    const isDrillablePureHeader = isHeaderDrillable(drillableItems, header);

    const afmHeader = isDrillableItemLocalId(header) ? getMeasureUriOrIdentifier(afm, header.localIdentifier) : null;
    const isDrillableAdhocHeader = afmHeader && isHeaderDrillable(drillableItems, afmHeader);

    return !!(isDrillablePureHeader || isDrillableAdhocHeader);
}

export function getClickableElementNameByChartType(type: VisType): VisElementType {
    switch (type) {
        case VisualizationTypes.LINE:
        case VisualizationTypes.AREA:
        case VisualizationTypes.DUAL:
        case VisualizationTypes.SCATTER:
        case VisualizationTypes.BUBBLE:
            return 'point';
        case VisualizationTypes.COLUMN:
        case VisualizationTypes.BAR:
            return 'bar';
        case VisualizationTypes.PIE:
        case VisualizationTypes.TREEMAP:
        case VisualizationTypes.DONUT:
        case VisualizationTypes.FUNNEL:
            return 'slice';
        case VisualizationTypes.TABLE:
        case VisualizationTypes.HEATMAP:
            return 'cell';
        default:
            invariant(false, `Unknown visualization type: ${type}`);
            return null;
    }
}

function fireEvent(onFiredDrillEvent: OnFiredDrillEvent, data: any, target: EventTarget) {
    const returnValue = onFiredDrillEvent(data);

    // if user-specified onFiredDrillEvent fn returns false, do not fire default DOM event
    if (returnValue !== false) {
        const event = new CustomEvent('drill', {
            detail: data,
            bubbles: true
        });
        target.dispatchEvent(event);
    }
}

function normalizeIntersectionElements(intersection: IDrillIntersection[]): IDrillEventIntersectionElement[] {
    return intersection.map(({ id, title, value, name, uri, identifier }) => {
        return {
            id,
            title: title || value as string || name,
            header: {
                uri,
                identifier
            }
        };
    });
}

function composeDrillContextGroup({ points }: IHighchartsChartDrilldownEvent, chartType: VisType) {
    return {
        type: chartType,
        element: 'label',
        points: points.map((p: IHighchartsPointObject) => {
            return {
                x: p.x,
                y: p.y,
                intersection: normalizeIntersectionElements(p.drillContext)
            };
        })
    };
}

function composeDrillContextPoint({ point }: IHighchartsChartDrilldownEvent, chartType: VisType) {
    const zProp = isNaN(point.z) ? {} : { z: point.z };
    const valueProp = (isTreemap(chartType) || isHeatmap(chartType)) ? { value: point.value } : {};
    const xyProp = isTreemap(chartType) ? {} : {
        x: point.x,
        y: point.y
    };
    return {
        type: chartType,
        element: getClickableElementNameByChartType(chartType),
        ...xyProp,
        ...zProp,
        ...valueProp,
        intersection: normalizeIntersectionElements(point.drillContext)
    };
}

const chartClickDebounced = debounce((drillConfig: IDrillConfig, event: IHighchartsChartDrilldownEvent,
                                      target: EventTarget, chartType: VisType) => {
    const { afm, onFiredDrillEvent } = drillConfig;

    let usedChartType = chartType;
    if (isComboChart(chartType)) {
        usedChartType = get(event, ['point', 'series', 'options', 'type'], chartType);
    }

    const data = {
        executionContext: afm,
        drillContext: isGroupHighchartsDrillEvent(event) ?
            composeDrillContextGroup(event, usedChartType) : composeDrillContextPoint(event, usedChartType)
    };

    fireEvent(onFiredDrillEvent, data, target);
});

export function chartClick(drillConfig: IDrillConfig,
                           event: IHighchartsChartDrilldownEvent,
                           target: EventTarget,
                           chartType: VisType) {
    chartClickDebounced(drillConfig, event, target, chartType);
}

export function cellClick(drillConfig: IDrillConfig, event: ICellDrillEvent, target: EventTarget) {
    const { afm, onFiredDrillEvent } = drillConfig;
    const { columnIndex, rowIndex, row, intersection } = event;
    const data = {
        executionContext: afm,
        drillContext: {
            type: VisualizationTypes.TABLE,
            element: getClickableElementNameByChartType(VisualizationTypes.TABLE),
            columnIndex,
            rowIndex,
            row,
            intersection: normalizeIntersectionElements(intersection)
        }
    };

    fireEvent(onFiredDrillEvent, data, target);
}


function _andPredicate(predicates: ReadonlyArray<IDrillPredicate>): IDrillPredicate {
    return {
        evaluate: (context: AFM.IAfm, drillItem: IDrillItem): boolean => {
            return predicates.every((predicate) => predicate.evaluate(context, drillItem));
        }
    }
}

function _orPredicate(predicates: ReadonlyArray<IDrillPredicate>): IDrillPredicate {
    return {
        evaluate: (context: AFM.IAfm, drillItem: IDrillItem): boolean => {
            return predicates.some((predicate) => predicate.evaluate(context, drillItem));
        }
    }
}

function _isIdentifierOrUriMatch(expected: IDrillableItem, got: IDrillableItem): boolean {
    return got !== null && (
                (expected.identifier && got.identifier && expected.identifier === got.identifier) ||
                (expected.uri && got.uri && expected.uri === got.uri)
    );
}

function _exactMatch(expected: IDrillableItem): IDrillPredicate {
    return {
        evaluate: (context: AFM.IAfm, drillItem: IDrillItem): boolean => {
            // based on isDrillable()

            return  _isIdentifierOrUriMatch(expected, drillItem) ||
                    (isDrillableItemLocalId(drillItem) &&
                        _isIdentifierOrUriMatch(expected, getMeasureUriOrIdentifier(context, drillItem.localIdentifier)));
        }
    }
}

function _compositionMatch(_expected: IDrillableItem): IDrillPredicate {
    return {
        evaluate: (_context: AFM.IAfm, _drillItem: IDrillItem): boolean => {
            // TODO matching composites (e.g. arithmetic measures)
            return false;
        }
    }
}


function isDrillAlternatives(drill: any): drill is DrillAlternatives {
    return (drill as DrillAlternatives).alternatives !== undefined;
}

function isDrillItemSelector(drill: any): drill is DrillItemSelector {
    return (drill as DrillItemSelector).item !== undefined;
}

function isDrillComposedItem(drill: any): drill is DrillCompositeItem {
    return (drill as DrillCompositeItem).composite !== undefined;
}

function isDrillCompositionVariants(drill: any): drill is DrillCompositionVariants {
    return (drill as DrillCompositionVariants).variants !== undefined;
}

function isDrillComposedFromAll(drill: any): drill is DrillComposedFromAll {
    return (drill as DrillComposedFromAll).fromAll !== undefined;
}

export function createPredicateFromDefinition(definition: any, composedItem?: boolean): IDrillPredicate {
    if (isDrillAlternatives(definition)) {
        return _orPredicate(definition.alternatives.map((def) => createPredicateFromDefinition(def)));
    } else if (isDrillItemSelector(definition)) {
        return !!composedItem ? _exactMatch(definition.item) : _compositionMatch(definition.item)
    } else if (isDrillComposedItem(definition)) {
        return createPredicateFromDefinition(definition.composite, true);
    } else if (isDrillCompositionVariants(definition)) {
        return _orPredicate(definition.variants.map((def) => createPredicateFromDefinition(def, true)));
    } else if (isDrillComposedFromAll(definition)) {
        return _andPredicate(definition.fromAll.map((def) => createPredicateFromDefinition(def, true)))
    }
}

