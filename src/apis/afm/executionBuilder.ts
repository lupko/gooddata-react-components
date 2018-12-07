import { AFM } from '@gooddata/typings';

interface ExecutionBuilder extends ExecutionBuilderBase {
    withRows(): RowsStep
    withColumns(): ColumnsStep
}

interface AttributesAndMeasures<T> {
    attributes(...a: AttributeInput[]): T;
    measures(...m: MeasureInput[]): T
}

interface ExecutionBuilderBase {
    filters(...f: FilterInput[]): ExecutionBuilder;

    (): AFM.IExecution;
}

interface RowsStep extends AttributesAndMeasures<RowsStep>, ExecutionBuilderBase {
    withColumns(): ColumnsStep1
}

interface ColumnsStep1 extends AttributesAndMeasures<ColumnsStep1>, ExecutionBuilderBase {
    //
}

interface ColumnsStep extends AttributesAndMeasures<ColumnsStep>, ExecutionBuilderBase {
    withRows(): RowsStep
}


type AttributeInput = AttributeBuilder | AFM.IAttribute;
type MeasureInput = SimpleMeasureBuilder | ArithmeticMeasureBuilder | AFM.IMeasure;
type FilterInput = GlobalFilterStep | AFM.CompatibilityFilter;

interface AnyItemBuilder<T> {
    localIdentifier(id: string): T
    inRow(): T
    inColumn(): T
}

//
// measure builders
//

interface AnyMeasureBuilder<T> {
    filter(): MeasureFilterStep
    withPop(): PopMeasureBuilder
    alias(): T
    sortBy(idx: number): T
    (): AFM.IMeasure;
}

interface SimpleMeasureBuilder extends AnyMeasureBuilder<SimpleMeasureBuilder>, AnyItemBuilder<SimpleMeasureBuilder> {

}
function simpleMeasure(): SimpleMeasureBuilder {
    return null;
}

interface ArithmeticMeasureBuilder extends AnyMeasureBuilder<SimpleMeasureBuilder>, AnyItemBuilder<SimpleMeasureBuilder> {

}
function arithmeticMeasure(): ArithmeticMeasureBuilder {
    return null;
}

type PopMeasureBuilder = {

}

type MeasureFilterStep = {

}

//
//
//

interface AttributeBuilder extends AnyItemBuilder<AttributeBuilder> {
    filter(): AttributeBuilder
    alias(): AttributeBuilder
    sortBy(idx: number, value: string): AttributeBuilder
    (): AFM.IAttribute;
}
function attribute(): AttributeBuilder {
    return null;
}

//
//
//

type GlobalFilterStep = {
    (): AFM.CompatibilityFilter
}

function example(afm: ExecutionBuilder) {
    afm
        .withRows()
            .attributes(
                attribute()
                    .alias()
            )
        .withColumns()
            .measures(
                simpleMeasure()
                    .alias()
                    .sortBy(0),
                arithmeticMeasure()
            )
            .attributes(
                attribute()
                    .alias()
                    .inColumn()
                    .sortBy(0, 'my attr value')
            )
}
