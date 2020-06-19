import { DevlibTSUtil } from "../devlib/DevlibTSUtil";

export class RichTooltip
{

    constructor()
    {
        // this._uniqueId = "RichTooltip_" + RichTooltip._componentCount;
        // RichTooltip._componentCount++;
        this._container = document.createElement('div');
        DevlibTSUtil.hide(this.container);
        document.body.appendChild(this.container);
        this.container.classList.add('richTooltip')
        // this.container.classList.add('noDisp');
    }

    
    private _container : HTMLDivElement;
    public get container() : HTMLDivElement {
        return this._container;
    }

    // private _uniqueId : string;
    // public get uniqueId() : string {
    //     return this._uniqueId;
    // }

    // TODO timer
    
	private static _componentCount: number = 0;

    public Show(htmlString: string, pageX: number, pageY: number): void
    {
        this.container.innerHTML = htmlString;

        // need to display as hidden to get width
        this.container.style.visibility = 'hidden';
        DevlibTSUtil.show(this.container);
        let boundRect = this.container.getBoundingClientRect();
        let containerRect = document.body.getBoundingClientRect();

        // Priority for placement is right, below, left, above

        const offset = 16; // space between label and position
        const edgeMargin = 10; // whitespace required between label and edge of document.
        let spaceRight = containerRect.right - pageX;
        let spaceBelow = containerRect.bottom - pageY;
        let spaceLeft = containerRect.width - spaceRight;
        let [top, left]: [number, number] = [0, 0];
        if (spaceRight > boundRect.width + offset + edgeMargin)
        {
            [top, left] = this.positionRight(pageX, pageY, boundRect, offset);
        }
        else if (spaceBelow > boundRect.height  + offset + edgeMargin)
        {
            [top, left] = this.positionBelow(pageX, pageY, boundRect, offset);
        }
        else if (spaceLeft > boundRect.width + offset + edgeMargin)
        {
            [top, left] = this.positionLeft(pageX, pageY, boundRect, offset);
        }
        else
        {
            let [top, left] = this.positionAbove(pageX, pageY, boundRect, offset);
        }
        this.container.style.top = top + 'px';
        this.container.style.left = left + 'px';
        this.container.style.visibility = 'visible';
        
    }

    private positionRight(pageX: number, pageY: number, boundRect: DOMRect, offset: number): [number, number]
    {
        let top = pageY - boundRect.height / 2.0;
        let left = pageX + offset;
        return [top, left];
    }
    private positionBelow(pageX: number, pageY: number, boundRect: DOMRect, offset: number): [number, number]
    {
        let top = pageY + offset;
        let left = pageX - boundRect.width / 2.0;
        return [top, left];
    }
    private positionLeft(pageX: number, pageY: number, boundRect: DOMRect, offset: number): [number, number]
    {
        let top = pageY - boundRect.height / 2.0;
        let left = pageX - offset - boundRect.width;
        return [top, left];
    }
    private positionAbove(pageX: number, pageY: number, boundRect: DOMRect, offset: number): [number, number]
    {
        let top = pageY - offset - boundRect.height;
        let left = pageX - boundRect.width / 2.0;
        return [top, left];
    }

    public Hide(): void
    {
        DevlibTSUtil.hide(this.container);
        // this.container.innerHTML = '';
    }

}