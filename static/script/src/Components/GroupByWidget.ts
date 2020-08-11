import * as d3 from 'd3';
import { OptionSelect } from "./OptionSelect";
import { HtmlSelection, ButtonProps } from "../devlib/DevLibTypes";
import { AppData } from "../types";
import { DevlibTSUtil } from "../devlib/DevlibTSUtil";

export class GroupByWidget
{

	private static _componentCount: number = 0;

    private _outerComponentId : string;
    public get outerComponentId() : string {
        return this._outerComponentId;
    }    

    private _outerContainer : HtmlSelection;
    public get outerContainer() : HtmlSelection {
        return this._outerContainer;
    }
    
    private _innerComponentId : string;
    public get innerComponentId() : string {
        return this._innerComponentId;
    }

    private _mainContainer : HtmlSelection;
    public get mainContainer() : HtmlSelection {
        return this._mainContainer;
    }    

    private _groupByOuterContainerList : HtmlSelection;
    public get groupByOuterContainerList() : HtmlSelection {
        return this._groupByOuterContainerList;
    }
    
    // private _groupByOuterConainerIdList : string[];
    // public get groupByOuterConainerIdList() : string[] {
    //     return this._groupByOuterConainerIdList;
    // }    

    private _groupByInnerConainerIdList : string[];
    public get groupByInnerConainerIdList() : string[] {
        return this._groupByInnerConainerIdList;
    }    

    private _groupByOptionSelectList : OptionSelect[];
    public get groupByOptionSelectList() : OptionSelect[] {
        return this._groupByOptionSelectList;
    }

    public get currentSelectionIndexList(): number[]
    {
        return this.groupByOptionSelectList.map(optionSelect => optionSelect.currentSelectionIndex);
    }

    public constructor(container: HtmlSelection)
    {
        this._outerContainer = container;
        this._mainContainer = this.outerContainer.append('div')
            .classed('groupByMainContainer', true);

        this._outerComponentId = 'groupByOuterContainer_' + GroupByWidget._componentCount + '_';
        this._innerComponentId = 'groupByInnerContainer_' + GroupByWidget._componentCount + '_';
        GroupByWidget._componentCount++;

        this._groupByInnerConainerIdList = [];
        this.groupByInnerConainerIdList.push(this.innerComponentId + '0');
        this.groupByInnerConainerIdList.push(this.innerComponentId + '1');
        this.groupByInnerConainerIdList.push(this.innerComponentId + '2');
        
        this._groupByOuterContainerList = this.mainContainer.selectAll<HTMLElement, any>('.groupByElementContainer')
            .data(this.groupByInnerConainerIdList)
            .join('div')
            .classed('groupByElementContainer', true);
            
        this.groupByOuterContainerList.html(null);

        this.groupByOuterContainerList.append('div')
            .classed('groupByContainer', true)
            .attr('id', d => d);


        this.groupByOuterContainerList
            .each(function(d, i)
            {
                let iconKey: string;
                if (i === 0)
                {
                    iconKey = 'plus';
                }
                else
                {
                    iconKey = 'minus'
                }
                let iconButton = DevlibTSUtil.getIconButton(iconKey, () => alert('yah!'));
                d3.select(this).node().appendChild(iconButton);
            });
            // .text((d, i) => i === 0 ? '+' : '-');

        this._groupByOptionSelectList = [];
        for (let i = 0; i < this.groupByInnerConainerIdList.length; i++)
        {
            let containerId: string = this.groupByInnerConainerIdList[i];
            let label: string;
            if (i === 0)
            {
                label = "Group by";
            }
            else
            {
                label = 'and';
            }
            let optionSelect = new OptionSelect(containerId, label, i)
            this.groupByOptionSelectList.push(optionSelect);
        }
    
    }

    public updateGroupByOptions(data: AppData<any>): void
    {
        for (let i = 0; i < this.groupByOptionSelectList.length; i++)
        {

            let buttonPropsList: ButtonProps[] = [];
            let facetOptions = data.GetFacetOptions();
            for (let i = 0; i < facetOptions.length; i++)
            {
                let facetOption = facetOptions[i];
                let buttonProps: ButtonProps = {
                    displayName: facetOption.name,
                    callback: () => this.onGroupSelection()
                }
                buttonPropsList.push(buttonProps);
            }
            this.groupByOptionSelectList[i].onDataChange(buttonPropsList, i);
        }
    }

    private onGroupSelection(): void
    {
        const customEvent: CustomEvent = new CustomEvent('groupByChanged', { detail:
        {
            groupIndex: this.currentSelectionIndexList
        }});
        document.dispatchEvent(customEvent);
    }

}