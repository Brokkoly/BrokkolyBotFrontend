export class Helpers
{
    public static nodispIf(condition: boolean)
    {
        return (condition ? "nodisp" : "");
    }
    public static stringIf(s: string, condition: boolean)
    {
        return condition ? s : ""
    }
}