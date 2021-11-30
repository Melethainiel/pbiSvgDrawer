// tslint:disable-next-line:import-name
import { IForm } from "../interfaces/IForm";
import { IViewModel } from "../interfaces/IViewModel";
import { ViewBoxHandler } from "./ViewBoxHandler";

export class ViewModel implements IViewModel {
    Forms: IForm[];
    IsHighlighted: boolean;
    IsColored: boolean;
    ViewBoxHandler: ViewBoxHandler;

    constructor() {
        this.Forms = [];
    }

    public crop() {
        let coords = [].concat(...this.Forms.map(i => i.Coordinates.filter(j => j != null)));

        let xCoords = coords.map(i => i[0]);
        let yCoords = coords.map(i => i[1]);

        let xMin = Math.min(...xCoords);
        let xMax = Math.max(...xCoords);
        let yMin = Math.min(...yCoords);
        let yMax = Math.max(...yCoords);

        this.ViewBoxHandler.setView(xMin, xMax, yMin, yMax);

    }
}


