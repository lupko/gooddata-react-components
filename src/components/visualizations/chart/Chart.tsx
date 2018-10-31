// (C) 2007-2018 GoodData Corporation
import isEqual = require('lodash/isEqual');
import noop = require('lodash/noop');
import * as React from 'react';
import { VisualizationObject } from '@gooddata/typings';
import { initChartPlugins } from './highcharts/chartPlugins';
import { VisType } from '../../../constants/visualizationTypes';
import { IDataLabelsConfig } from '../../../interfaces/Config';
import { ISeparators } from '@gooddata/numberjs';

// Have only one entrypoint to highcharts and drill module
// tslint:disable-next-line
export const HighchartsMore = require('highcharts/highcharts-more');
export const Highcharts = require('highcharts/highcharts'); // tslint:disable-line
const drillmodule = require('highcharts/modules/drilldown'); // tslint:disable-line
const treemapModule = require('highcharts/modules/treemap'); // tslint:disable-line
const funnelModule = require('highcharts/modules/funnel'); // tslint:disable-line
const heatmap = require('highcharts/modules/heatmap'); // tslint:disable-line
const patternFill = require('highcharts-pattern-fill'); // tslint:disable-line

drillmodule(Highcharts);
treemapModule(Highcharts);
funnelModule(Highcharts);
heatmap(Highcharts);
HighchartsMore(Highcharts);
patternFill(Highcharts);
initChartPlugins(Highcharts);

export interface ILegendConfig {
    enabled?: boolean;
    position?: 'top' | 'left' | 'right' | 'bottom';
    responsive?: boolean;
}

export interface IChartLimits {
    series?: number;
    categories?: number;
    dataPoints?: number;
}

export interface IChartConfig {
    colors?: string[];
    colorAssignment?: ColorAssignment[]
    type?: VisType;
    legend?: ILegendConfig;
    legendLayout?: string;
    limits?: IChartLimits;
    stacking?: boolean;
    grid?: any;
    mdObject?: VisualizationObject.IVisualizationObjectContent;
    yFormat?: string;
    yLabel?: string;
    xLabel?: string;
    xFormat?: string;
    chart?: any;
    xaxis?: IAxisConfig;
    yaxis?: IAxisConfig;
    separators?: ISeparators;
    dataLabels?: IDataLabelsConfig;
}

export interface IAxisConfig {
    visible?: boolean;
    labelsEnabled?: boolean;
    rotation?: string;
    min?: string;
    max?: string;
}

export interface IChartProps {
    config: IChartConfig;
    domProps: any;
    callback(): void;
}

export default class Chart extends React.Component<IChartProps> {
    public static defaultProps: Partial<IChartProps> = {
        callback: noop,
        domProps: {}
    };

    private chart: Highcharts.ChartObject;
    private chartRef: HTMLElement;

    public constructor(props: IChartProps) {
        super(props);
        this.setChartRef = this.setChartRef.bind(this);
    }

    public componentDidMount() {
        this.createChart(this.props.config);
    }

    public shouldComponentUpdate(nextProps: IChartProps) {
        if (isEqual(this.props.config, nextProps.config)) {
            return false;
        }

        return true;
    }

    public componentDidUpdate() {
        this.createChart(this.props.config);
    }

    public componentWillUnmount() {
        this.chart.destroy();
    }

    public setChartRef(ref: HTMLElement) {
        this.chartRef = ref;
    }

    public getChart(): Highcharts.ChartObject {
        if (!this.chart) {
            throw new Error('getChart() should not be called before the component is mounted');
        }

        return this.chart;
    }

    public createChart(config: IChartConfig) {
        const chartConfig = config.chart;
        this.chart = new Highcharts.Chart(
            {
                ...config,
                chart: {
                    ...chartConfig,
                    renderTo: this.chartRef
                }
            },
            this.props.callback
        );
    }

    public render() {
        return (
            <div
                {...this.props.domProps}
                ref={this.setChartRef}
            />
        );
    }
}

/**
 * Developer can provide predicate as a function or as a concrete selector.
 *
 * Predicate function provides ultimate flexibility and gives power to the developer to do basically anything
 * they want.
 *
 * The color assignment selectors are essentially a declaratively provided predicates.
 *
 * For developer convenience, she can provide either selectors or predicates. The first thing SDK does is to unify
 * this and the coloring algorithm then continues with predicates only
 */
export type ColorAssignment = {
    predicate: ColorAssignmentSelector | ColorAssignmentPredicate,
    color: string // my_red, rgb(1, 2, 3)
}

// item type would not be 'any' in the end.. it needs to be an existing type playing role in the colors of items/series
export type ColorAssignmentPredicate = (item: any) => boolean
export type ColorAssignmentSelector = AttributeValueSelector | AttributeElementSelector | MetricSelector | AndSelector;

/**
 * Selector matching particular attribute value. Optionally provide display form so that the matching
 * is more exact.
 */
export type AttributeValueSelector = {
    attributeValue: {
        displayFormId?: string
        value: string
    }
}

/**
 * Selector matching exact attribute element. This is essential to assign color to entities, disregarding
 * display forms or any other quirks.
 */
export type AttributeElementSelector = {
    attributeElement: {
        uri: string
    }
}

/**
 * Selector matching particular metric
 */
export type MetricSelector = {
    metric: {
        uri: string
    }
}

/**
 * Composite selector - item must match all selectors
 */
export type AndSelector = {
    and: ColorAssignmentSelector[]
}

function isAttributeValueSelector(sel: any): sel is AttributeValueSelector {
    return (sel as AttributeValueSelector).attributeValue !== undefined;
}


function isAttributeElementSelector(sel: any): sel is AttributeElementSelector {
    return (sel as AttributeElementSelector).attributeElement !== undefined;
}

function isMetricSelector(sel: any): sel is MetricSelector {
    return (sel as MetricSelector).metric !== undefined;
}

function isAndSelector(sel: any): sel is AndSelector {
    return (sel as AndSelector).and !== undefined;
}

/**
 * Creates predicate from selector.
 *
 * @param {ColorAssignmentSelector} sel
 * @returns {ColorAssignmentPredicate}
 */
export function createPredicateFromSelector(sel: ColorAssignmentSelector): ColorAssignmentPredicate {
    if (isAttributeValueSelector(sel)) {
        return (item: any): boolean => {
            return false;
        }
    } else if (isAttributeElementSelector(sel)) {
        return (item: any): boolean => {
            return false;
        }
    } else if (isMetricSelector(sel)) {
        return (item: any): boolean => {
            return false;
        }
    } else if (isAndSelector(sel)) {
        return (item: any): boolean => {
            return sel.and.map((p) => createPredicateFromSelector(p)).every((p) => p(item));
        }
    }

    // bang
}
