import powerbi from "powerbi-visuals-api";
import { IValue } from "./IValue";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;


export interface IForm {
    Id: string;
    Data: string;
    Color: string;
    Identity: powerbi.visuals.ISelectionId;
    Highlighted: boolean;
    Tooltip: VisualTooltipDataItem[];
    Coordinates: number[][];
    Center: number[];
    Values: IValue[];
    Label: string;
    ConcactValue: string;
    ConcactValue2: string;
}
