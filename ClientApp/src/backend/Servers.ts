export class Servers
{
    public static async getRestrictedCommands(): Promise<any>
    {
        let fetchUrl = '/api/RestrictedCommands/GetRestrictedCommands';
        return fetch(fetchUrl).then(response => response.json());
    }

    public static async getUserGuilds(token: string): Promise<IServer[]>
    {
        const result = await fetch(
            `/api/Servers/GetServerListForUser?token=${token}`
        );
        const text = await result.text();
        const servers = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        //TODO: make this better
        const serversTransformed: IServer[] = servers.map((srv: any) => 
        {
            return {
                serverId: srv.id,
                name: srv.name,
                timeoutSeconds: srv.timeout_seconds,
                timeoutRoleId: srv.timeout_role_id,
                iconUrl64: Servers.constructUrlsForServerIcon(srv.id, srv.icon),
                userCanManage: srv.canManageServer,
            }
        });
        return serversTransformed;
    }

    public static constructUrlsForServerIcon(id: string, hash: string): string
    {
        return `https://cdn.discordapp.com/icons/${id}/${hash}.${hash.substr(0, 2) === "a_" ? "gif" : "png"}?size=64`;
    }
}

export interface IServer
{
    serverId: string;
    timeoutSeconds?: number;
    timeoutRoleId?: number;
    iconUrl64?: string;
    name?: string;
    userCanManage: boolean;
}