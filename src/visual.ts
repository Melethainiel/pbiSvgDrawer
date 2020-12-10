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
import {VisualSettings} from "./settings";

import * as d3 from "d3";
import {IForm, IViewModel, Form, ViewModel} from "./visualViewModel";


export class Visual implements IVisual {
    private settings: VisualSettings;
    private selectionManager: ISelectionManager;
    private svg: d3.Selection<SVGElement>;
    private formGroup: d3.Selection<SVGElement>;
    private textGroup: d3.Selection<SVGElement>;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.svg = d3.select(options.element)
            .append('svg')
            .classed('view', true);
        this.formGroup = this.svg
            .append('g')
            .classed('formGroup', true);
        this.textGroup = this.svg
            .append('g')
            .classed('textGroup', true);

        this.selectionManager = this.host.createSelectionManager();
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        let viewModel = this.getViewModel(options);
        let width = options.viewport.width;
        let height = options.viewport.height;

        this.svg.attr({
            width: width,
            height: height,
        })

        viewModel.crop(width, height);

        this.formGroup.attr({
            'transform':`scale(${viewModel.Scale}) translate(${viewModel.TranslateX},${viewModel.TranslateY})`
        })
        this.generateForms(viewModel);
        // this.generateText(viewModel);


    }

    private generateText(viewModel: IViewModel) {
        let texts = this.textGroup
            .selectAll('text')
            .data(viewModel.Forms);

        texts.enter()
            .append('text');

        texts
            .attr({
                'x': d => (d.Center[0] + viewModel.TranslateX) * viewModel.Scale,
                'y': d =>( d.Center[1]+ viewModel.TranslateY) * viewModel.Scale
            })
            .style({
                'font-size': '15px'
            })
            .text(d => d.Id)

        texts.exit().remove();
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
                'fill': d => viewModel.Highlights
                    ? d.Highlighted
                        ? this.settings.Color.Highlight
                        : this.settings.Color.Basic
                    : this.settings.Color.Basic,
                'fill-opacity': d => viewModel.Highlights
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

    private getViewModel(options: VisualUpdateOptions): IViewModel {
        let viewModel = new ViewModel()

        let dv = options.dataViews;
        if (!dv
            || !dv[0]
            || !dv[0].categorical
            || !dv[0].metadata
            || !dv[0].categorical.categories
            || !dv[0].categorical.values
            || dv[0].categorical.categories.length != 2) {
            return viewModel
        }

        let data = dv[0].categorical.categories[0].values;
        let idCategories = dv[0].categorical.categories[1];
        let ids = idCategories.values;
        let highlights = dv[0].categorical.values[0].highlights;
        let metadata = dv[0].metadata;
        let categoryColumns = metadata.columns.filter(c => c.roles['identifier'])[0].displayName;

        for (let i = 0, len = ids.length; i < len; i++) {

            let form = Form.PARSE(<string>ids[i], <string>data[i]);

            form.Identity = this.host.createSelectionIdBuilder()
                .withCategory(idCategories, i)
                .createSelectionId();
            form.Highlighted = highlights
                ? !!highlights[i]
                : false;
            form.Tooltip = [{
                displayName: categoryColumns,
                value: form.Id
            }]

            viewModel.Forms.push(form);

        }
        viewModel.Highlights = viewModel.Forms.filter(d => d.Highlighted).length > 0;

        return viewModel;
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
        debugger
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}