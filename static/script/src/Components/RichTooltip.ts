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
        this.container.style.top = pageY + 'px';
        this.container.style.left = pageX + 'px';
        DevlibTSUtil.show(this.container);
        
    }

    public Hide(): void
    {
        DevlibTSUtil.hide(this.container);
        // this.container.innerHTML = '';
    }

}