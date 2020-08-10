import { OptionSelect } from "./OptionSelect";
import { HtmlSelection, ButtonProps } from "../devlib/DevLibTypes";
import { AppData } from "../types";

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

    private _groupByContainer : HtmlSelection;
    public get groupByContainer() : HtmlSelection {
        return this._groupByContainer;
    }

    private _groupByOptionSelect : OptionSelect;
    public get groupByOptionSelect() : OptionSelect {
        return this._groupByOptionSelect;
    }

    public get currentSelectionIndex(): number
    {
        return this.groupByOptionSelect.currentSelectionIndex;
    }

    public constructor(container: HtmlSelection)
    {
        this._outerContainer = container;
        this._outerComponentId = 'groupByOuterContainer_' + GroupByWidget._componentCount;
        GroupByWidget._componentCount++;

        this._groupByContainer = this.outerContainer.append('div')
            .classed('groupByContainer', true)
            .attr('id', this.outerComponentId)
    
        this._groupByOptionSelect = new OptionSelect(this.outerComponentId, "Group by", 0);
    }

    public updateGroupByOptions(data: AppData<any>): void
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
        this.groupByOptionSelect.onDataChange(buttonPropsList, 0);
    }

    private onGroupSelection(): void
    {
        const customEvent: CustomEvent = new CustomEvent('groupByChanged', { detail:
        {
            groupIndex: this.currentSelectionIndex
        }});
        document.dispatchEvent(customEvent);
    }

}