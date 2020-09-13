
export class Servers
{
    public static async getRestrictedCommands(): Promise<any>
    {
        let fetchUrl = '/api/RestrictedCommands/GetRestrictedCommands';
        return fetch(fetchUrl).then(response=>response.json());
    }
}