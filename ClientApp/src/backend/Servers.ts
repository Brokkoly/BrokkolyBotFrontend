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
        //TODO: Response checking. Let the user know if there is an error.
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
        //TODO: Response checking. Let the user know if there is an error.
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

    public static async putServerEdit(token: string, server: IServer)
    {
        return fetch(
            "/api/Servers/PutServer/",
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
                body: JSON.stringify({
                    server: {
                        ServerId: server.serverId,
                        TimeoutSeconds: server.timeoutSeconds,
                        TimeoutRoleId: server.timeoutRoleId,
                        BotManagerRoleId: server.botManagerRoleId,
                    },
                    token: token
                })
            }
        ).then(response =>
        {
            if (response.status === 204) {
                return true;
            }
            else {
                return false;
            }

        })
            .catch((error) =>
            {
                console.error('Error:', error);
                return false;
            });
    }


    public static constructUrlsForServerIcon(id: string, hash: string): string
    {
        return `https://cdn.discordapp.com/icons/${id}/${hash}.${hash.substr(0, 2) === "a_" ? "gif" : "png"}?size=64`;
    }
    public static checkTimeoutValidity(seconds: number): IError | undefined
    {
        let error: IError = { message: [] };
        if (isNaN(seconds)) {
            error.message.push("Timeout must be a number");
            return error;
        }
        if (seconds < 0) {
            error.message.push("Timeout cannot be negative");
        }
        if (error.message.length === 0) {
            return;
        }
        else {
            return error;
        }
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