export class DevlibAlgo {
	
	public static BinarySearchIndex<T>(list: T[], compareFunction: (element: T) => number): number | [number | undefined, number | undefined]
	{
		if (list.length === 0)
		{
			return [undefined, undefined];
		}
		let firstElement: T = list[0];
		let compareResult = compareFunction(firstElement);
		if (compareResult > 0)
		{
			return [undefined, 0];
		}
		let lastElement: T = list[list.length - 1];
		compareResult = compareFunction(lastElement);
		if (compareResult < 0)
		{
			return [list.length - 1, undefined];
		}
		return DevlibAlgo.BinarySearchRecurse(list, compareFunction, 0, list.length - 1);
	}

	public static BinarySearchRecurse<T>(list: T[], compareFunction: (element: T) => number, idx1: number, idx2: number): number | [number, number]
	{
		if (Math.abs(idx1 - idx2) === 1)
		{
			return [idx1, idx2];
		}
		// if (idx1 === idx2)
		// {
		// 	return [undefined, undefined]
		// }
		let midIndex = Math.floor((idx1 + idx2) / 2);
		let element: T = list[midIndex];
		let compareResult = compareFunction(element);
		if (compareResult === 0)
		{
			return midIndex;
		}
		else if (compareResult > 0)
		{
			return DevlibAlgo.BinarySearchRecurse(list, compareFunction, idx1, midIndex);			
		}
		else if (compareResult < 0)
		{
			return DevlibAlgo.BinarySearchRecurse(list, compareFunction, midIndex, idx2);
		}
	}


	public static compareProperty<objType>(num: number, propertyAccessor: (objType: any) => number,): (obj: objType) => number
	{
		return (a: objType) =>
		{
			const aVal = propertyAccessor(a);
			return DevlibAlgo.compareValues(aVal, num);
		}
	}

	public static sortOnProperty<objType>(propertyAccessor: (objType: objType) => number, ascend = true): (a: objType, b: objType) => number
	{
		return (a: objType, b: objType) =>
		{
			const aVal = propertyAccessor(a);
			const bVal = propertyAccessor(b);
			if (ascend)
			{
				return DevlibAlgo.compareValues(aVal, bVal);
			}
			else
			{
				return DevlibAlgo.compareValues(bVal, aVal);				
			}
		}
	}

	private static compareValues(a: number, b: number): number
	{
			let diff = a - b;
			if (Math.abs(diff) > 0)
			{
				diff /= Math.abs(diff);
			}
			return diff;
	}

}