import { ErrorLevels, Errors, IError, PrefixValidationError, TimeoutValidationError } from "./Error";

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
                twitchChannelId: srv.twitchChannelId,
                commandPrefix: srv.commandPrefix,
                twitchLiveRoleId: srv.twitchLiveRoleId
            }
        });
        return serversTransformed;
    }

    public static async getGuildInfo(token: string, serverId: string): Promise<IServerInfo>
    {
        const result = await fetch(
            `/api/Discord/GetServerInfo?token=${token}&serverId=${serverId}`
        );
        const text = await result.text();
        const serverInfo = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        const rolesTransformed: IRole[] = serverInfo.myRoles.map((rle: any) => 
        {
            return {
                id: rle.id,
                name: rle.name,
                color: rle.color,
                position: rle.postition,
            }
        });
        const channelsTransformed: IChannel[] = serverInfo.myChannels.map((channel: any) =>
        {
            return {
                id: channel.id,
                name: channel.name,
            }
        });
        return { roles: rolesTransformed, channels: channelsTransformed };
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
                        TwitchChannel: server.twitchChannelId,
                        CommandPrefix: server.commandPrefix,
                        TwitchLiveRoleId: server.twitchLiveRoleId
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

    public static checkTimeoutValidity(seconds: number): Errors
    {
        let errors: IError[] = [];
        if (isNaN(seconds)) {
            errors.push(new TimeoutValidationError("Timeout must be a number", ErrorLevels.Critical));
        }
        else {
            //We don't want to be comparing nan to numbers
            if (seconds < 0) {
                errors.push(new TimeoutValidationError("Timeout cannot be negative", ErrorLevels.Critical));
            }
        }
        return new Errors(errors);
    }

    public static checkCommandPrefixValidity(prefix: string): Errors
    {
        let errors: IError[] = [];
        if (!prefix) {
            return new Errors(errors);
        }
        else {
            if (prefix.length > 2) {
                errors.push(new PrefixValidationError("Prefixes cannot be longer than 2 characters", ErrorLevels.Critical));
            }
            for (let i = 0; i < prefix.length; i++) {
                let code = prefix.charCodeAt(i);
                if (code > 126 || code < 33) {
                    errors.push(new PrefixValidationError(`"${prefix[i]}" is not a valid prefix character`, ErrorLevels.Critical));
                }
                if (/^[0-9A-Za-z]/.test(prefix[i])) {
                    errors.push(new PrefixValidationError(`"${prefix[i]}" is a number or letter, and may cause unexpected responses from the bot`, ErrorLevels.Warning));
                }
            }
        }
        return new Errors(errors);
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
    //roles: IRole[];
    //channels: IChannel[];
    commandPrefix: string;
    twitchChannelId: string;
    twitchLiveRoleId: string;
}
export interface IRole
{
    id: string;
    name: string;
    color: number;
    position: number;
}
export interface IChannel
{
    id: string;
    name: string;
}
export interface IServerInfo
{
    roles: IRole[];
    channels: IChannel[];
}