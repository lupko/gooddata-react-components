// (C) 2007-2018 GoodData Corporation
import { IKdApi, IKdEvent, IMiddleware, IMiddlwareInput, MiddlewareData } from './api';
import * as React from "react";

//
//
//

function sampleListener(event: IKdEvent) {

}

//
//
//

function sampleMiddlewareFunction(input: IMiddlwareInput): MiddlewareData {
}

const sampleMiddleware: IMiddleware = {
    onInit: sampleMiddlewareFunction,
    onUpdate: sampleMiddlewareFunction
};

//
//
//

interface IMyCustomProps {
    mandatoryProp: number
    optionalProp?: string
}

class MyCustomComponent extends React.Component<IMyCustomProps> {
    public render() {
        return (
            <></>
        );
    }
}

export function initialize(api: IKdApi): void {
    api.addListener(sampleListener);
    api.addMiddleware(sampleMiddleware);

    // add two new rows at the end of the layout
    api.layoutApi().addRow(-1, [{ size: 12, element: <p>Lorem ipsum</p>}]);
    api.layoutApi().addRow(-1, [{ size: 12, element: <MyCustomComponent mandatoryProp={1}/>}]);
}


