import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevlibTypes';
import { ImageStackWidget } from './ImageStackWidget';

export class ImageTrackWidget
{
    constructor(container: HTMLElement, parent: ImageStackWidget)
    {
        this._container = container;
        this._parentWidget = parent;
    }

    private _container : HTMLElement;
    public get container() : HTMLElement {
        return this._container;
    }

    private _parentWidget : ImageStackWidget;
    public get parentWidget() : ImageStackWidget {
        return this._parentWidget;
    }    

	private _selectedImageCanvas : HtmlSelection;
	public get selectedImageCanvas() : HtmlSelection {
		return this._selectedImageCanvas;
	}

	private _canvasContext : CanvasRenderingContext2D;
	public get canvasContext() : CanvasRenderingContext2D {
		return this._canvasContext;
	}

    public init(): void
    {
        console.log('init image track widget');
    }

    public draw(): void
    {
        console.log('draw image track widget');
    }

}