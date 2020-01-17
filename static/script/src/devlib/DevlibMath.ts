export class DevlibMath
{

	public static sumN(...numbers: number[]): number
	{
		return numbers.reduce( (a: number, b: number) => a + b );
	}

	public static sum(arr: number[]): number
	{
		return DevlibMath.sumN(...arr);
	}

	public static averageN(...numbers: number[]): number
	{
		const sum = DevlibMath.sum(numbers);
		return sum / numbers.length;
	}

	public static average(arr: number[]): number
	{
		return DevlibMath.averageN(...arr);
	}

	public static meanSquaredError(numbers: number[], v: number): number
	{
		const squaredErrors: number[] = numbers.map( (a: number) => Math.pow(a - v,  2) );
		return DevlibMath.average(squaredErrors);
	}

	public static varianceN(...numbers: number[]): number
	{
		let avg = DevlibMath.average(numbers);
		return DevlibMath.meanSquaredError(numbers, avg);
	}

	public static variance(numbers: number[]): number
	{
		return DevlibMath.varianceN(...numbers);
	}

	// returns a number in the range [min, max] inclusive on both ends.
	public static randomInt(min: number, max: number): number
	{
		return Math.floor(Math.random() * (max + 1));
	}

	private static nChooseTwo(n: number): number
	{
		return n * (n-1) / 2.0
	}

	public static isNumber(text: string): boolean
	{
		if (text === "")
		{
			return false;
		}
		return !isNaN(Number(text))
	}

}