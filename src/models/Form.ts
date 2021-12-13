import powerbi from "powerbi-visuals-api";
import { IForm } from "../interfaces/IForm";
import { IValue } from "../interfaces/IValue";


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

    get ConcactValue(): string {
        this.Ct = this._values.map(i => i.Value).join(",").toString();
        return this.Ct;
    }
    get ConcactValue2(): string {
        let t = this._values.map(i => i.Value).join("\r\n");
        return t;
    }

    get Center(): number[] {
        let coords = this._Coordinates.filter(j => j != null);

        let xCoords = coords.map(i => i[0]);
        let yCoords = coords.map(i => i[1]);

        let x = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
        let y = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
        return [x, y];

    }

    get Values(): IValue[] {
        return this._values;
    }

    private _Data: string;
    private _Id: string;
    private _values: IValue[];
    private _Coordinates: number[][];

    Color: string;
    Highlighted: boolean;
    Label: string;
    Identity: powerbi.visuals.ISelectionId;
    Tooltip: powerbi.extensibility.VisualTooltipDataItem[];
    Ct: string;

    public static PARSE(id: string, value: string): Form {

        let form = new Form();

        form._Id = id;
        form._Data = value;
        form._values = [];
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
