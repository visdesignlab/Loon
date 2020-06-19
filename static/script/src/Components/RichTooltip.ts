import * as d3 from 'd3';
import { DevlibTSUtil } from "../devlib/DevlibTSUtil";

export class RichTooltip
{

    constructor()
    {
        this._container = document.createElement('div');
        DevlibTSUtil.hide(this.container);
        document.body.appendChild(this.container);
        this.container.classList.add('richTooltip');
        this._showTimerRunning = false;
        this._hideTimerRunning = false;
        this.container.addEventListener('mouseleave', () =>
        {
            this.Hide();
        });
        this.container.addEventListener('mouseenter', () =>
        {
            if (this.hideTimer && this.hideTimerRunning)
            {
                this.hideTimer.stop();
                this._hideTimerRunning = false;
            }
        });
        this._hideTimerRunning = false;
        this._showTimerRunning = false;

        this._hideCallback = () => {
            DevlibTSUtil.hide(this.container);
             // shouldn't need this, but I was running into a problem where stop timer was getting stuck in a loop.
             // this appears to fix it.
            this.hideTimer.stop();
            this._hideTimerRunning = false;
        };

    }

    
    private _container : HTMLDivElement;
    public get container() : HTMLDivElement {
        return this._container;
    }

    
    private _showTimerRunning : boolean;
    public get showTimerRunning() : boolean {
        return this._showTimerRunning;
    }

    
    private _showTimer : d3.Timer;
    public get showTimer() : d3.Timer {
        return this._showTimer;
    }

    private _hideTimer : d3.Timer;
    public get hideTimer() : d3.Timer {
        return this._hideTimer;
    }

    private _hideTimerRunning : boolean;
    public get hideTimerRunning() : boolean {
        return this._hideTimerRunning;
    }

    
    private _hideCallback : (elapsed: number) => void;
    public get hideCallback() : (elapsed: number) => void {
        return this._hideCallback;
    }

    public Show(htmlString: string, pageX: number, pageY: number): void
    {
        const waitToShow = 350;
        const callbackFunc = () => this.drawTooltip(htmlString, pageX, pageY)
        if (this.showTimerRunning)
        {
            this.showTimer.restart(callbackFunc,  waitToShow);
        }
        else
        {
            this._showTimer = d3.timeout(callbackFunc, waitToShow);
        }
        this._showTimerRunning = true;
        if (this.hideTimerRunning)
        {
            this.hideTimer.stop();
            this._hideTimerRunning = false;
        }
    }

    private drawTooltip(htmlString: string, pageX: number, pageY: number): void
    {
        this._showTimerRunning = false;
        this.container.innerHTML = htmlString;

        // need to display as hidden to get width
        this.container.style.visibility = 'hidden';
        DevlibTSUtil.show(this.container);
        let boundRect = this.container.getBoundingClientRect();
        let containerRect = document.body.getBoundingClientRect();

        // Priority for placement is right, below, left, above
        const offset = 20; // space between label and position
        const edgeMargin = 10; // whitespace required between label and edge of document.
        const pad = offset  + edgeMargin;
        let spaceRight = containerRect.right - pageX;
        let spaceBelow = containerRect.bottom - pageY;
        let spaceLeft = containerRect.width - spaceRight;
        let spaceAbove = containerRect.height - spaceBelow;
        let w = boundRect.width;
        let h = boundRect.height;
        let w2 = w / 2.0;
        let h2 = h / 2.0;
        let [top, left]: [number, number] = [0, 0];
        if (spaceRight >= w + pad && spaceAbove >= h2 + edgeMargin && spaceBelow >= h2 + edgeMargin)
        {
            [top, left] = this.positionRight(pageX, pageY, boundRect, offset);
        }
        else if (spaceBelow >= h + pad && spaceRight >= h2 + edgeMargin && spaceLeft >= h2 + edgeMargin)
        {
            [top, left] = this.positionBelow(pageX, pageY, boundRect, offset);
        }
        else if (spaceLeft >= w + pad && spaceAbove >= h2 + edgeMargin && spaceBelow >= h2 + edgeMargin)
        {
            [top, left] = this.positionLeft(pageX, pageY, boundRect, offset);
        }
        else
        {
            [top, left] = this.positionAbove(pageX, pageY, boundRect, offset);
            // TODO This can still run into problems if the x and y are at corners, and this point get's reached.
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
        if (this.showTimerRunning)
        {
            this.showTimer.stop();
            this._showTimerRunning = false;
        }
        const waitToHide = 200;
        if (this.hideTimer && this.hideTimerRunning)
        {
            return
        }
        else
        {
            this._hideTimer = d3.timeout(this.hideCallback, waitToHide);
        }
        this._hideTimerRunning = true;
    }
}