import * as d3 from 'd3';
import { OptionSelect } from "./OptionSelect";
import { HtmlSelection, ButtonProps } from "../devlib/DevLibTypes";
import { AppData, Facet } from "../types";
import { DevlibTSUtil } from "../devlib/DevlibTSUtil";
import { CurveList } from '../DataModel/CurveList';

export class GroupByWidget
{

	private static _componentCount: number = 0;

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

    private _data : AppData<any>;
    public get data() : AppData<any> {
        return this._data;
    }
    public set data(v : AppData<any>) {
        this._data = v;
    }

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

        this._innerComponentId = 'groupByInnerContainer_' + GroupByWidget._componentCount + '_';
        GroupByWidget._componentCount++;

        this._groupByInnerConainerIdList = [];
        this.addComponentId();
        this.drawLines([0]);
        this.addGroupByLine(); // draw two lines by default
    }

    private drawLines(previousSelections: number[]): void
    {
        this._groupByOuterContainerList = this.mainContainer.selectAll<HTMLElement, any>('.groupByElementContainer')
            .data(this.groupByInnerConainerIdList)
            .join('div')
            .classed('groupByElementContainer', true);
            
        this.groupByOuterContainerList.html(null);

        this.groupByOuterContainerList.append('div')
            .classed('groupByContainer', true)
            .classed('smallText', true)
            .attr('id', d => d);

        const self = this;

        this.groupByOuterContainerList
            .each(function(d, i)
            {
                let iconKey: string;
                let callback: (ev: MouseEvent) => void;
                if (i === 0)
                {
                    iconKey = 'plus';
                    callback = () => self.addGroupByLine();
                }
                else
                {
                    iconKey = 'minus'
                    callback = () => self.removeGroupByLine(i);
                }
                let iconButton = DevlibTSUtil.getIconButton(iconKey, callback);
                iconButton.classList.add('compact');
                d3.select(this).node().appendChild(iconButton);
            });

        this._groupByOptionSelectList = [];
        for (let i = 0; i < this.groupByInnerConainerIdList.length; i++)
        {
            let containerId: string = this.groupByInnerConainerIdList[i];
            
            let selection: number;
            if (i < previousSelections.length)
            {
                selection = previousSelections[i];
            }
            else
            {
                selection = this.getFirstUnselectedOption(previousSelections);
            }
            let label: string;
            if (i === 0)
            {
                label = "Group by";
            }
            else
            {
                label = 'and';
            }
            let optionSelect = new OptionSelect(containerId, label, selection)
            this.groupByOptionSelectList.push(optionSelect);
        }
        if (this.data)
        {
            this.updateGroupByOptions(this.data);
        }
    }

    private getFirstUnselectedOption(selections: number[]): number
    {
        let maxIndex: number;
        if (this.data)
        {
            maxIndex = this.data.GetFacetOptions().length;
        }
        else
        {
            maxIndex = 0;
        }
        let candidate = 0;
        while (selections.includes(candidate) && candidate <= maxIndex)
        {
            candidate++;
        }

        return candidate;
    }

    private addGroupByLine(): void
    {
        const previousSelections = this.currentSelectionIndexList;
        const added = this.addComponentId();
        if (!added)
        {
            return;
        }
        this.drawLines(previousSelections);
    }

    private addComponentId(): boolean
    {
        const numberOfExistingLines = this.groupByInnerConainerIdList.length;
        if (this.data)
        {
            let facetOptions = this.data.GetFacetOptions();
            if (facetOptions.length === numberOfExistingLines)
            {
                return false;
            }
        }

        const newId = this.innerComponentId + numberOfExistingLines;
        this.groupByInnerConainerIdList.push(newId);
        return true;
    }

    private removeGroupByLine(lineIndex: number): void
    {
        const previousSelections = this.currentSelectionIndexList;
        previousSelections.splice(lineIndex, 1);
        if (this.groupByInnerConainerIdList.length > 1)
        {
            this.groupByInnerConainerIdList.pop();
        }
        this.drawLines(previousSelections);
    }

    public updateGroupByOptions(data: AppData<any>, skipEventTrigger: boolean = false): void
    {
        this._data = data;
        let facetOptions = data.GetFacetOptions();
        for (let i = 0; i < this.groupByOptionSelectList.length; i++)
        {
            let buttonPropsList: ButtonProps[] = [];
            for (let facetOption of facetOptions)
            {
                let buttonProps: ButtonProps = {
                    displayName: facetOption.name,
                    callback: () => this.onGroupSelection()
                }
                buttonPropsList.push(buttonProps);
            }
            this.groupByOptionSelectList[i].onDataChange(buttonPropsList);
        }
        if (!skipEventTrigger)
        {   
            this.onGroupSelection();
        }
    }

    private onGroupSelection(): void
    {
        const flatFacetList = this.getFlatFacetList();
        const colorLookup = this.getColorLookup();
        const customEvent: CustomEvent = new CustomEvent('groupByChanged', { detail:
        {
            groupIndex: this.currentSelectionIndexList,
            flatFacetList: flatFacetList,
            colorLookup: colorLookup
        }});
        document.dispatchEvent(customEvent);
    }

    public getFlatFacetList(): Facet[]
    {
        let flatFacetList: Facet[] = [{name: [], data: this.data}];
        let nestedFacetList: Facet[][] = []; // only get the last two layers of the faceting
        for (let i = 0; i < this.currentSelectionIndexList.length; i++)
        {
            let index = this.currentSelectionIndexList[i];
            let nextList = [];
            for (let {name: nameSoFar, data: data} of flatFacetList)
            {
                let facetOptions = data.GetFacetOptions();
                let currentOption = facetOptions[index];
                let subFacets: Facet[] = currentOption.GetFacets();
                subFacets = subFacets.map(facet =>
                {
                    let newName = nameSoFar.map(x => x);
                    newName.push(...facet.name)
                    return {
                        name: newName,
                        data: facet.data
                    }
                });
                nextList.push(...subFacets);
            }
            flatFacetList = nextList;
        }

        return flatFacetList;
    }

    private getColorLookup(): Map<string, string>
	{
        const colorLookup = new Map<string, string>();
        if (!(this.data as CurveList).defaultFacetAxisTicks)
        {
            return colorLookup;
        }
        const {
            yAxisTicks: condition1Labels,
            xAxisTicks: condition2Labels
        } = (this.data as CurveList).defaultFacetAxisTicks;

        const firstFacetIndex = this.currentSelectionIndexList[0];
        const labels: string[] = firstFacetIndex === 1 ? condition2Labels : condition1Labels;
        const controlNames = GroupByWidget.getControlNames();
        const controlColor = GroupByWidget.getControlColor();
        const {scheme: colorScheme, skipIndices: skipColors} = GroupByWidget.getColorScheme();
        let colorIndex = 0;
        for (let label of labels)
        {
            while (skipColors.has(colorIndex))
            {
                colorIndex++;
                colorIndex = colorIndex % colorScheme.length;
            }
            const color = controlNames.has(label) ? controlColor : colorScheme[colorIndex++];
            colorLookup.set(label, color);
        }
        return colorLookup;
	}

    private static getControlNames(): Set<string>
    {
        return new Set<string>([
            'DMSO',
            'Ethanol',
            '0.0 um'
        ])
    }

    private static getControlColor(): string
    {
        return 'grey';
    }
    private static getColorScheme(): {scheme: readonly string[], skipIndices: Set<number>}
    {
        return {scheme: d3.schemeSet1, skipIndices: new Set<number>([5, 8])};
    }

    public static getColor(labels: string[], colorLookup: Map<string, string>): string
	{
		for (let key of labels)
		{
			if (colorLookup.has(key))
			{
				return colorLookup.get(key);
			}
		}
		return 'grey';
	}
}