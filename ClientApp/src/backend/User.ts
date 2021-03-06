﻿export interface IUser
{
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    verified: boolean;
    flags: number;
    premium_type: number;
    public_flags: number;
}
export interface IGuild
{
    id: string;
    name: string;
    icon: string;
    owner: boolean;
    permissions: number;
    permissions_new: number;
}

export class User
{
    public displayName: string = "Not Logged In";
    public avatarUrl: string = "";
    public accessToken: string = "";

    constructor(accessToken: string, displayName: string, avatarUrl: string)
    {
        this.accessToken = accessToken;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }
    public static async getUserFromToken(token: string): Promise<User>
    {
        if (token) {
            const user = await User.getUserInfo(token);
            return new User(token, User.getDisplayName(user), User.getAvatarUrl(user))
        }
        else {
            return new User("", "", "");
        }
    }
    public static getDisplayName(user: IUser): string
    {
        return `${user.username}#${user.discriminator}`;
    }
    public static getAvatarUrl(user: IUser): string
    {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.substr(0, 2) === "a_" ? "gif" : "png"}?size=128`;
    }

    public static async getUserInfo(token: string)
    {
        const response = fetch(`https://discord.com/api/users/@me`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'content-type': 'application/json'
                },

            }
        ).then(res =>
        {
            return res.json();
        });
        return response;
    }
}





