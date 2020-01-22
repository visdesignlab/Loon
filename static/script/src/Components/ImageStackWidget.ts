import * as d3 from 'd3';
import {SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {PointCollection} from '../DataModel/PointCollection';
import {PointND} from '../DataModel/PointND';
import {valueFilter} from '../DataModel/PointCollection';

export class ImageStackWidget extends BaseWidget<PointCollection> {
	
	constructor(container: HTMLElement, imgWidth: number, imgHeight: number, numImages: number, numColumns: number, imageStackUrl: string)
	{
		super(container);

	}
	
	private _imgWidth : number;
	public get imgWidth() : number {
		return this._imgWidth;
	}
	
	private _imgHeight : number;
	public get imgHeight() : number {
		return this._imgHeight;
	}
	
	private _numImages : number;
	public get numImages() : number {
		return this._numImages;
	}
	
	private _numColumns : number;
	public get numColumns() : number {
		return this._numColumns;
	}
	
	private _imageStackUrl : string;
	public get imageStackUrl() : string {
		return this._imageStackUrl;
	}


	
	

	public init(): void
	{
		// TODO
	}

	public OnDataChange()
	{
		// TODO
	}


	protected OnResize(): void
	{
		// TODO
	}

}