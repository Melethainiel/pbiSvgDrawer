// import * as React from "react";
// import {VisualViewModel} from "./visualViewModel";
//
// export class Viewer extends React.Component<{}, VisualViewModel> {
//     render() {
//         if (this.state == null)
//             return (<p>No data</p>)
//
//         let viewModel = this.state;
//         let items = [];
//         debugger
//         for (let i = 0; i < viewModel.Paths.length; i++) {
//             items.push(this.createItem(viewModel.Paths[i], viewModel.Ids[i]))
//         }
//         let test = (
//             <div className="viewer">
//
//                 <svg viewBox="0 0 45460 15659" width="200">
//                     <g>
//                         {items}
//                     </g>
//                 </svg>
//             </div>
//         )
//         debugger
//         return test
//     }
//
//     private createItem(input: string, id : string) {
//         let data = input.split(';');
//         switch (data[0]) {
//             case "polygon":
//                 return this.createPolygon(data, id);
//                 break;
//             default:
//                 break;
//         }
//     }
//
//     private createPolygon(data : string[], id : string){
//         let polygon = React.createElement('polygon');
//         polygon.props.points = data[1];
//         polygon.props.id = id;
//         return polygon;
//     }
//
//     private static updateCallback: (data: object) => void = null;
//
//     public static UPDATE(newState: IVisualViewModel) {
//         if (typeof Viewer.updateCallback === 'function') {
//             Viewer.updateCallback(newState);
//         }
//     }
//
//     public componentWillMount() {
//         Viewer.updateCallback = (newState: IVisualViewModel): void => {
//             this.setState(newState);
//         };
//     }
//
//     public componentWillUnmount() {
//         Viewer.updateCallback = null;
//     }
// }
//
// export default Viewer;