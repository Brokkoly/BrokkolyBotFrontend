import { IError } from "./Error";

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
                botManagerRoleId: srv.botManagerRoleId,
            }
        });
        return serversTransformed;
    }

    public static async getGuildRoles(token: string, serverId: string): Promise<IRole[]>
    {
        const result = await fetch(
            `/api/Discord/GetRolesForServer?token=${token}&serverId=${serverId}`
        );
        const text = await result.text();
        const roles = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        //TODO: make this better
        const rolesTransformed: IRole[] = roles.map((rle: any) => 
        {
            return {
                id: rle.id,
                name: rle.name,
                color: rle.color,
                position: rle.postition,
            }
        });
        return rolesTransformed;
    }
    public static async getUserRolesInGuild(token: string, serverId: string): Promise<IRole[]>
    {
        //TODO: is this necessary? maybe only to make sure the user doesn't remove their own permissions?
        const result = await fetch(
            `/api/Discord/GetRolesForUser?token=${token}&serverId=${serverId}`
        );
        const text = await result.text();
        const roles = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        //TODO: make this better
        const rolesTransformed: IRole[] = roles.map((rle: any) => 
        {
            return {
                id: rle.id,
                name: rle.name,
                color: rle.color,
                position: rle.postition,
            }
        });
        return rolesTransformed;
    }


    public static constructUrlsForServerIcon(id: string, hash: string): string
    {
        return `https://cdn.discordapp.com/icons/${id}/${hash}.${hash.substr(0, 2) === "a_" ? "gif" : "png"}?size=64`;
    }
    public static checkTimeoutValidity(seconds: number): IError | undefined
    {
        return undefined;
    }
}

export interface IServer
{
    serverId: string;
    timeoutSeconds: number;
    timeoutRoleId?: number;
    iconUrl64?: string;
    name?: string;
    botManagerRoleId?: string;
    userCanManage: boolean;
    roles: IRole[];
}
export interface IRole
{
    id: string;
    name: string;
    color: number;
    position: number;
}