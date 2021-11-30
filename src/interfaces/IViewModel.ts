import { ViewBoxHandler } from "../models/ViewBoxHandler";
import { IForm } from "./IForm";


export interface IViewModel {
    Forms: IForm[];
    IsHighlighted: boolean;
    IsColored: boolean;
    ViewBoxHandler: ViewBoxHandler;

    crop(): void;
}
