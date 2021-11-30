
export class ViewBoxHandler {

    constructor(width: number, heigth: number) {
        this._height = heigth;
        this._width = width;
    }

    private _xMin: number;
    private _yMin: number;
    private _xMax: number;
    private _yMax: number;
    private _width: number;
    private _height: number;
    private _globalTranslateX: number = 1;



    setView(xMin: number, xMax: number, yMin: number, yMax: number): void {
        this._xMin = xMin;
        this._yMin = yMin;
        this._xMax = xMax;
        this._yMax = yMax;
    }

    get Scale(): number {
        return Math.min(this._width / (this._xMax - this._xMin), this._height / (this._yMax - this._yMin));
    }

    get TranslateX(): number {
        return - this._xMin + (this._width / this.Scale - (this._xMax - this._xMin)) / 2;
    }

    get TranslateY(): number {
        return - this._yMin + (this._height / this.Scale - (this._yMax - this._yMin)) / 2;
    }

}
