
export function array_unique_indexOf<T extends any[]>(array: T)
{
	return array.filter(function (el, index, arr)
	{
		return index === arr.indexOf(el);
	}) as T;
}
