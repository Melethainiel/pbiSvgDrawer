/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import {dataViewObjectsParser} from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

// tslint:disable-next-line:export-name
export class VisualSettings extends DataViewObjectsParser {
    public Color : ColorSetting = new ColorSetting();
    public Label : LabelSetting = new LabelSetting();
    public Schedule : ScheduleSettings = new ScheduleSettings();
}

export class ColorSetting {
    Basic: string = "#168980";
    Highlight: string = "#B59525";
    Colored: boolean = false;
}

export class ScheduleSettings{
    show: boolean = false;
    fontSize: number = 28;
    fontFamily: string = "Segoe UI";
    fontColor: string = "#252423";
    scheduleWidth: number = 100;
}

export class LabelSetting{
    show: boolean = false;
    fontSize: number = 12;
    fontFamily: string = "Segoe UI";
    fontColor: string = "#252423";
    textAlignment: string = "middle";
    public alignment(value : string): string {
        debugger
        switch (value){
            case "left" :
                return "end";
            case "center" :
                return "middle";
            case "right" :
                return "start";
        }
    }
}
