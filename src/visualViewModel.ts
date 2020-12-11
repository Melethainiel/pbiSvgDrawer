// tslint:disable-next-line:import-name
import powerbi from "powerbi-visuals-api";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface IViewModel {
    Forms: IForm[];
    Highlights: boolean;
    Scale: number;
    TranslateX: number;
    TranslateY: number;

    crop(width: number, height: number);
}

export interface IForm {
    Id: string
    Data: string
    Color: string
    Identity: powerbi.visuals.ISelectionId
    Highlighted: boolean;
    Tooltip: VisualTooltipDataItem[];
    Coordinates: number[][];
    Center: number[];
    Label: string;

}

export class ViewModel implements IViewModel {
    Forms: IForm[];
    Highlights: boolean;
    Scale: number;
    TranslateX: number;
    TranslateY: number;

    constructor() {
        this.Forms = [];

    }

    public crop(width: number, height: number) {
        let coords = [].concat(...this.Forms.map(i => i.Coordinates.filter(j => j != null)));

        let xCoords = coords.map(i => i[0]);
        let yCoords = coords.map(i => i[1]);

        let xMin = Math.min(...xCoords);
        let xMax = Math.max(...xCoords);
        let yMin = Math.min(...yCoords);
        let yMax = Math.max(...yCoords);

        this.Scale = Math.min(width / (xMax - xMin), height / (yMax - yMin))
        this.TranslateX = -xMin + (width / this.Scale - (xMax - xMin)) / 2
        this.TranslateY = -yMin + (height / this.Scale - (yMax - yMin)) / 2
    }
}

export class Form implements IForm {

    get Id(): string {
        return this._Id;
    }

    get Data(): string {
        return this._Data;
    }

    get Coordinates(): number[][] {
        return this._Coordinates;
    }

    get Center(): number[] {
        let coords = this._Coordinates.filter(j => j != null);

        let xCoords = coords.map(i => i[0]);
        let yCoords = coords.map(i => i[1]);

        let x = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
        let y = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
        return [x, y];

    }


    private _Data: string
    private _Id: string;
    private _Coordinates: number[][];

    Color: string;
    Highlighted: boolean;
    Label: string;
    Identity: powerbi.visuals.ISelectionId;
    Tooltip: powerbi.extensibility.VisualTooltipDataItem[];

    public static PARSE(id: string, value: string): Form {

        let form = new Form();

        form._Id = id;
        form._Data = value;

        form._Coordinates = form.Data
            .split(' ')
            .map(i => {
                let j = i.split(',');
                if (j.length == 2)
                    return [Number(j[0]), Number(j[1])];
                else
                    return null;
            });


        return form;

    }

}