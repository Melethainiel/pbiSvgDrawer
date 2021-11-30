/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ''Software''), to deal
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
'use strict';

import 'core-js/stable';
import './../style/visual.less';
// tslint:disable-next-line:import-name
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { VisualSettings } from './settings';
import { pixelConverter } from 'powerbi-visuals-utils-typeutils';

import * as d3 from 'd3';
import { ViewModel } from './models/visualViewModel';
import { ViewBoxHandler } from './models/ViewBoxHandler';
import { Form } from './models/Form';
import { IForm } from './interfaces/IForm';
import { IViewModel } from './interfaces/IViewModel';


export class Visual implements IVisual {
    private settings: VisualSettings;
    private selectionManager: ISelectionManager;
    private viewModel: IViewModel;
    private svg: d3.Selection<SVGElement>;
    private wrapper: d3.Selection<HTMLElement>;
    private schedule: d3.Selection<HTMLElement>;
    private button: d3.Selection<HTMLElement>;
    private svgGroup: d3.Selection<SVGElement>;
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
                'display': 'grid',
                'grid-template-columns': 'auto 1fr auto',
                'grid-template-rows': 'auto 1fr auto'
            });

        this.button = this.wrapper
            .append('button')
            .on('click', () => {
                this.svgGroup.attr('transform', null)
                this.selectionManager.clear();
                this.generateForms();
            })
            .style({
                'position':'absolute',
                'right':'25px',
                'top':'15px',
                'padding':'2',
                'border':'0',
                'border-radius':'5px'
            })
            .append('svg')
            .attr({
                'viewBox':'0 0 24 24',
                'color' : 'black',
                'width':'24px',
                'height':'24px'
            })
            .append('path')
            .attr('d', 'M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z')


            /*<svg class="mud-icon-root mud-svg-icon mud-inherit-text mud-icon-size-medium" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
            <title>SettingsBackupRestore</title><!--!-->
            <path d="M0 0h24v24H0z" fill="none">            </path>
            <path d="M14 12c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-2-9c-4.97 0-9 4.03-9 9H0l4 4 4-4H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.51 0-2.91-.49-4.06-1.3l-1.42 1.44C8.04 20.3 9.94 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"></path>
            </svg>*/

        this.schedule = this.wrapper
            .append('div')
            .classed('schedule', true)
            .style({
                'white-space': 'pre'
            });

        this.svg = <d3.Selection<SVGElement>>(<unknown>this.wrapper
            .append('svg')
            .classed('view', true)
            .attr({
                'width': '100%',
                'height': '100%',
            })
            .style({
                'grid-area': '2 / 2 / 2 / 2'
            }));

        this.svgGroup = this.svg
            .append('g')
            .classed('svgGroup', true);

        this.formGroup = this.svgGroup
            .append('g')
            .classed('formGroup', true);

        this.textGroup = this.svgGroup
            .append('g')
            .classed('textGroup', true);


        let zoom = d3.behavior.zoom().on('zoom', () => {
            let zoomEvent = <d3.ZoomEvent>d3.event;
            this.svgGroup.attr('transform', `scale(${zoomEvent.scale}) translate(${zoomEvent.translate})`)
        });
        this.svg.call(zoom);
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.viewModel = this.getViewModel(options);
        let width = Math.floor(options.viewport.width);
        let height = Math.floor(options.viewport.height);

        let widthAvailable = this.settings.Schedule.show && (this.settings.Schedule.placement == 0 || this.settings.Schedule.placement == 1)
            ? width - this.settings.Schedule.scheduleWidth - 20
            : width;

        let heightAvailable = this.settings.Schedule.show && (this.settings.Schedule.placement == 2 || this.settings.Schedule.placement == 3)
            ? height - this.settings.Schedule.scheduleHeight - 20
            : height;

        this.viewModel.ViewBoxHandler = new ViewBoxHandler(widthAvailable, heightAvailable);
        this.wrapper.style({
            width: `${width}px`,
            height: `${height}px`
        });


        this.schedule.style({
            'overflow-y': 'auto',
            'overflow-x': 'clip',
            'grid-area': this.gridArea(this.settings.Schedule.placement),
            'display': this.gridDisplay(this.settings.Schedule.placement),
            'flex-wrap': this.gridFlexWrap(this.settings.Schedule.placement),
            'width': this.settings.Schedule.show ? this.gridWidth(this.settings.Schedule.placement) : null,
            'height': this.settings.Schedule.show ? this.gridHeight(this.settings.Schedule.placement) : null,
            'margin': this.settings.Schedule.show ? this.gridMargin(this.settings.Schedule.placement) : null,
        })

        this.generateForms();
        this.generateSchedule();

        this.viewModel.crop();
        this.formGroup.attr({
            'transform': `scale(${this.viewModel.ViewBoxHandler.Scale}) translate(${this.viewModel.ViewBoxHandler.TranslateX},${this.viewModel.ViewBoxHandler.TranslateY})`
        })

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
                    : '';
                form.Tooltip = [{
                    displayName: categoryColumns,
                    value: form.Id
                }]

                viewModel.Forms.push(form);
            }

            let t = parameterValues ? <string>parameterValues[i] : '#error';
            let isHighlighted = highlights
                ? !!highlights[i]
                : false;

            form.Highlighted = form.Highlighted || isHighlighted;

            form.Values.push({
                Value: t,
                Color: ''
            })
        }

        viewModel.Forms.forEach(element => {
            element.Color = this.host.colorPalette.getColor(element.ConcactValue).value;
        });

        viewModel.IsHighlighted = viewModel.Forms.filter(d => d.Highlighted).length > 0;

        return viewModel;
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


    private generateForms() {
        let forms = this.formGroup
            .selectAll('path')
            .data(this.viewModel.Forms);

        forms.enter()
            .append('path');

        forms
            .attr({
                d: d => d.Data,
                id: d => d.Id
            })
            .style({
                'fill': d => this.getColor(d),
                'fill-opacity': d => this.viewModel.IsHighlighted
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
                                : d => this.getColor(d)
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

    private generateSchedule() {

        this.schedule
            .selectAll('div')
            .remove();
        if (!this.settings.Schedule.show)
            return;

        let values = this.viewModel.Forms.filter((v, i, a) => a.findIndex(t => (t.ConcactValue === v.ConcactValue)) === i)


        let forms = this.schedule
            .selectAll('div')
            .data(values);

        let div = forms.enter()
            .append('div')
            .style({
                'margin': '10px 5px',
                'display': 'flex',
                'align-items': 'center'
            });


        div.append('svg')
            .attr({
                'width': '20px',
                'height': '20px',
                'viewvox': '0 0 20 20'
            })
            .style({
                'margin': '2px',
                'margin-right': '10px'
            })
            .append('circle')
            .attr({
                'cx': '10',
                'cy': '10',
                'r': '7',
                'fill': (i) => this.getColor(i),
                'stroke': 'black',
                'stroke-width': '1'

            });

        div.append('p')
            .text(i => i.ConcactValue2)
            .style({
                'font-size': `${pixelConverter.fromPointToPixel(this.settings.Schedule.fontSize)}px`,
                'font-family': this.settings.Schedule.fontFamily,
                'color': this.settings.Schedule.fontColor,
            });

        forms.exit().remove();

    }



    private getColor(data: IForm): string {
        if (this.viewModel.IsColored) {
            return data.Color
        }
        else if (this.viewModel.IsHighlighted) {
            return data.Highlighted
                ? this.settings.Color.Highlight
                : this.settings.Color.Basic
        }
        else {
            return this.settings.Color.Basic;
        }


    }

    public gridArea(placement: number): string {
        switch (placement) {
            case 0:
                return '2 / 1 / 2 / 1';
            case 1:
                return '2 / 3 / 2 / 3';
            case 2:
                return '1 / 1 / 1 / 3';
            case 3:
                return '3 / 1 / 3 / 3';
            default:
                break;
        }
    }

    public gridDisplay(placement: number): string {
        switch (placement) {
            case 0:
            case 1:
                return null;
            case 2:
            case 3:
                return 'flex';
            default:
                break;
        }
    }

    public gridFlexWrap(placement: number): string {
        switch (placement) {
            case 0:
            case 1:
                return null;
            case 2:
            case 3:
                return 'wrap';
            default:
                break;
        }
    }

    public gridWidth(placement: number): string {
        switch (placement) {
            case 0:
            case 1:
                return `${this.settings.Schedule.scheduleWidth}px`;
            case 2:
            case 3:
                return null;
            default:
                break;
        }
    }

    public gridHeight(placement: number): string {
        switch (placement) {
            case 0:
            case 1:
                return null;
            case 2:
            case 3:
                return `${this.settings.Schedule.scheduleHeight}px`;
            default:
                break;
        }
    }

    public gridMargin(placement: number): string {
        switch (placement) {
            case 0:
            case 1:
                return '0 10px';
            case 2:
            case 3:
                return '10px 0';
            default:
                break;
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