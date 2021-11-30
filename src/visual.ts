/*
*  Power BI Visual CLI
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

import "core-js/stable";
import "./../style/visual.less";
// tslint:disable-next-line:import-name
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { VisualSettings } from "./settings";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import * as d3 from "d3";
import { ViewModel } from "./models/visualViewModel";
import { ViewBoxHandler } from "./models/ViewBoxHandler";
import { Form } from "./models/Form";
import { IForm } from "./interfaces/IForm";
import { IViewModel } from "./interfaces/IViewModel";


export class Visual implements IVisual {
    private settings: VisualSettings;
    private selectionManager: ISelectionManager;
    private svg: d3.Selection<SVGElement>;
    private wrapper: d3.Selection<HTMLElement>;
    private schedule: d3.Selection<HTMLElement>;
    private formGroup: d3.Selection<SVGElement>;
    private textGroup: d3.Selection<SVGElement>;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.createSkeleton(options);
        this.selectionManager = this.host.createSelectionManager();
    }

    private createSkeleton(options: VisualConstructorOptions) {
        this.wrapper = d3.select(options.element)
            .append('div')
            .classed('wrapper', true)
            .style({
                "display": "grid",
                "grid-template-columns": "auto 1fr auto",
                "grid-template-rows": "auto 1fr auto"
            });

        this.svg = <d3.Selection<SVGElement>>(<unknown>this.wrapper
            .append('svg')
            .classed('view', true)
            .attr({
                "width": "100%",
                "height": "100%",
            })
            .style({
                "grid-area": "2 / 2 / 2 / 2"
            }));

        this.schedule = this.wrapper
            .append('div')
            .classed('schedule', true)
            .style({
                "grid-area": "2 / 3 / 2 / 3"
            });

        this.formGroup = this.svg
            .append('g')
            .classed('formGroup', true);

        this.textGroup = this.svg
            .append('g')
            .classed('textGroup', true);
    }

    public update(options: VisualUpdateOptions) {

        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        let viewModel = this.getViewModel(options);
        let width = Math.floor(options.viewport.width);
        let height = Math.floor(options.viewport.height);

        let widthAvailable = this.settings.Schedule.show
            ? width - this.settings.Schedule.scheduleWidth
            : width;

        viewModel.ViewBoxHandler = new ViewBoxHandler(widthAvailable, height);
        this.wrapper.style({
            width: `${width}px`,
            height: `${height}px`
        });


        this.generateForms(viewModel);
        this.generateSchedule(viewModel);

        viewModel.crop();
        this.formGroup.attr({
            'transform': `scale(${viewModel.ViewBoxHandler.Scale}) translate(${viewModel.ViewBoxHandler.TranslateX},${viewModel.ViewBoxHandler.TranslateY})`
        })


    }

    private generateText(viewModel: IViewModel) {
        if (this.settings.Label.show) {
            let texts = this.textGroup
                .selectAll('text')
                .data(viewModel.Forms);

            texts.enter()
                .append('text');

            texts
                .attr({
                    'x': d => (d.Center[0] + viewModel.ViewBoxHandler.TranslateX) * viewModel.ViewBoxHandler.Scale,
                    'y': d => (d.Center[1] + viewModel.ViewBoxHandler.TranslateY) * viewModel.ViewBoxHandler.Scale
                })
                .style({
                    'font-size': pixelConverter.fromPointToPixel(this.settings.Label.fontSize),
                    'font-family': this.settings.Label.fontFamily,
                    'fill': this.settings.Label.fontColor,
                    'text-anchor': this.settings.Label.alignment(this.settings.Label.textAlignment)
                })
                .text(d => d.Label)

            texts.exit();
        } else {
            this.textGroup
                .selectAll('text')
                .remove()
        }
    }

    private generateForms(viewModel: IViewModel) {
        let forms = this.formGroup
            .selectAll('path')
            .data(viewModel.Forms);


        forms.enter()
            .append('path');

        forms
            .attr({
                d: d => d.Data,
                id: d => d.Id
            })
            .style({
                'fill': d => this.getColor(viewModel, d),
                'fill-opacity': d => viewModel.IsHighlighted
                    ? d.Highlighted
                        ? 1.0
                        : 0.5
                    : 1.0
            })
            .on('click', (d) => {
                this.selectionManager.select(d.Identity)
                    .then(ids => {
                        forms.style({
                            'fill-opacity': ids.length > 0
                                ? d => ids.indexOf(d.Identity) >= 0
                                    ? 1.0
                                    : 0.5
                                : 1.0,
                            'fill': ids.length > 0
                                ? d => ids.indexOf(d.Identity) >= 0
                                    ? this.settings.Color.Highlight
                                    : this.settings.Color.Basic
                                : this.settings.Color.Basic
                        })
                    })
            })
            .on('mouseover', (d) => {
                let mouse = d3.mouse(this.svg.node());
                this.host.tooltipService.show({
                    dataItems: d.Tooltip,
                    identities: [d.Identity],
                    coordinates: mouse,
                    isTouchEvent: false
                })
            })
            .on('mousemove', (d) => {
                let mouse = d3.mouse(this.svg.node());
                this.host.tooltipService.move({
                    dataItems: d.Tooltip,
                    identities: [d.Identity],
                    coordinates: mouse,
                    isTouchEvent: false
                })
            });

        forms.exit().remove();
    }

    private generateSchedule(viewModel: IViewModel) {

        this.schedule
            .style({
                "width": null
            })
            .selectAll('div')
            .remove();
        if (!this.settings.Schedule.show)
            return;

        let values = viewModel.Forms.map(i => i.ConcactValue).filter((v, i, a) => a.findIndex(t => (t === v)) === i)


        let forms = this.schedule
            .style({
                "width": `${this.settings.Schedule.scheduleWidth}px`,
            })
            .selectAll('div')
            .data(values);

        let p = forms.enter()
            .append('div')
            .text(i => i)
            .style({
                'font-size': `${pixelConverter.fromPointToPixel(this.settings.Schedule.fontSize)}px`,
                'font-family': this.settings.Schedule.fontFamily,
                'color': this.settings.Schedule.fontColor,
            });

        forms.exit().remove();

    }

    private getViewModel(options: VisualUpdateOptions): IViewModel {
        let viewModel = new ViewModel();
        viewModel.IsColored = this.settings.Color.Colored;

        let dv = options.dataViews;
        if (!dv
            || !dv[0]
            || !dv[0].categorical
            || !dv[0].metadata
            || !dv[0].categorical.categories
            || !dv[0].categorical.values
            || dv[0].categorical.categories.length < 2) {
            return viewModel
        }

        let path = dv[0].categorical.categories[0].values;
        let idCategories = dv[0].categorical.categories[1];
        let ids = idCategories.values;
        let parameters = dv[0].categorical.categories[2];
        let parameterValues = parameters ? parameters.values : undefined;

        let highlights = dv[0].categorical.values[0].highlights;
        let labels = dv[0].categorical.values[1];
        let labelValues = labels ? labels.values : undefined;

        let metadata = dv[0].metadata;
        let categoryColumns = metadata.columns.filter(c => c.roles['identifier'])[0].displayName;

        for (let i = 0, len = ids.length; i < len; i++) {

            let form = viewModel.Forms.find(j => j.Id == ids[i])
            if (!form) {
                form = Form.PARSE(<string>ids[i], <string>path[i]);

                form.Identity = this.host.createSelectionIdBuilder()
                    .withCategory(idCategories, i)
                    .createSelectionId();
                form.Label = labelValues
                    ? <string>labelValues[i]
                    : "";
                form.Tooltip = [{
                    displayName: categoryColumns,
                    value: form.Id
                }]

                viewModel.Forms.push(form);
            }

            let t = parameterValues ? <string>parameterValues[i] : "#error";
            let isHighlighted = highlights
                ? !!highlights[i]
                : false;

            form.Highlighted = form.Highlighted || isHighlighted;

            form.Values.push({
                Value: t,
                Color: ""
            })
        }

        viewModel.Forms.forEach(element => {
            element.Color = this.host.colorPalette.getColor(element.ConcactValue).value;
        });

        viewModel.IsHighlighted = viewModel.Forms.filter(d => d.Highlighted).length > 0;

        return viewModel;
    }

    private getColor(viewModel: IViewModel, data: IForm): string {
        debugger
        if (viewModel.IsColored) {
            return data.Color
        }
        else if (viewModel.IsHighlighted) {
            return data.Highlighted
                ? this.settings.Color.Highlight
                : this.settings.Color.Basic
        }
        else {
            return this.settings.Color.Basic;
        }


    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}