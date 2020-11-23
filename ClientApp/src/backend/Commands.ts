import { CommandValidationError, Errors, IError, ValueValidationError } from "./Error";
import { IResponseGroup, IResponseGroupList, ResponseGroup, ResponseGroupList, Response} from "./ResponseGroup";

export class Commands
{
    static restrictedCommands: string[] = [
        'add'
        , 'help'
        , 'estop'
        , 'cooldown'
        , 'timeout'
        , 'removetimeout'
        , 'extractemoji'
        , 'maintenance'
        , 'twitchadd'
        , 'twitchremove'
        , 'addmod'];
    /**
     * Loads the bot's restricted commands
     * @returns a promise of a list of restricted commands
     */
    public static async getRestrictedCommands(): Promise<string[]>
    {
        return Commands.restrictedCommands;
    }

    /**
     * Gets a list of commands for a server
     * @param serverId
     */
    public static async fetchCommands(serverId: string): Promise<ICommand[]>
    {
        let fetchUrl = '/api/Commands/GetCommandsForServer?serverId=' + serverId;
        const result = await fetch(fetchUrl);
        const text = await result.text();
        var commands = await JSON.parse(text.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));
        return commands;
    }

    public static async fetchResponseGroups(serverId: string): Promise<IResponseGroupList>
    {
        let fetchUrl = '/api/Commands/GetCommandGroupsForServer?serverId=' + serverId;
        return fetch(fetchUrl)
            .then(response =>
            {
                return response.json();
            })
            .then(data =>
            {
                var retList: IResponseGroup[] = [];
                for (let key in data) {
                    retList.push(new ResponseGroup(data[key].id, data[key].command,
                        data[key].responses.map((resp: any) =>
                        {
                            return new Response(resp);
                        })));
                }
                return new ResponseGroupList({ responseGroups: retList });
            });
    }

    /**
     * Sends a put command for the particular command.
     * @param token the user's access token, for validation
     * @param command the command to save to the database
     * @returns true if the status was good, otherwise false
     */
    public static async saveCommandEdit(token: string, command: ICommand): Promise<boolean>
    {
        let fetchUrl = '/api/Commands/PutCommand/'
        return fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
                body: JSON.stringify({
                    command: {
                        Id: command.id,
                        ServerId: command.serverId,
                        CommandString: command.commandString,
                        EntryValue: command.entryValue,
                        ModOnly: command.modOnly
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

    /**
     * Sends a new command to the server
     * @param token the user's access token
     * @param command The command to save to the database
     * @returns the command's new id in the database
     */
    public static async postCommand(token: string, command: ICommand): Promise<number>
    {
        let fetchUrl = '/api/Commands/PostCommand';
        return fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({
                    command: {
                        ServerId: command.serverId,
                        CommandString: command.commandString,
                        EntryValue: command.entryValue,
                        ModOnly: command.modOnly
                    },
                    token: token
                })
            }
        ).then(response =>
        {
            if (response.status === 201) {
                return response.json();
            }
            else {
                return undefined;
            }
        }).then(data =>
        {
            if (data?.id) {
                return data.id;
            }
            else {
                return -1;
            }
        });
    }

    /**
     * Deletes a command from the database
     * @param token the user's access token
     * @param id the id of the command to delete
     * @returns Promise<true if the deletion was successful, otherwise false>
     */
    public static async deleteFromList(token: string, id: number): Promise<boolean>
    {
        let fetchUrl = '/api/Commands/DeleteCommand';
        const response = await fetch(fetchUrl
            , {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    id: id
                })
            }
        ).then(
            response => response.json()
        );
        if (response?.id) {
            return true;
        }
        else {
            return false;
        }
    }

    public static async putNewCommands(token: string, listToPut: ICommand[]): Promise<Map<number, number>>
    {
        let fetchUrl = `/api/Commands/PutResponses?token=${token}`;
        let bodyJSON = JSON.stringify(
            {
                commands:
                    listToPut.map(command =>
                    {
                        return {
                            id: command.id,
                            serverId: command.serverId,
                            commandString: command.commandString,
                            entryValue: command.entryValue,
                            modOnly: command.modOnly
                        }
                    })
            });

        return fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
                body: bodyJSON
            }).then(response => response.json())
            .then(data =>
            {
                let retMap = new Map<number, number>();
                for (let key in data) {

                    retMap.set(Number.parseInt(key), data[key]);
                }
                return retMap;
            });
    }
    public static async postCommands(token: string, listToPost: ICommand[]): Promise<boolean>
    {
        let fetchUrl = `/api/Commands/PostResponses?token=${token}`;
        let bodyJSON = JSON.stringify(
            {
                commands:
                    listToPost.map(command =>
                    {
                        return {
                            id: command.id,
                            serverId: command.serverId,
                            commandString: command.commandString,
                            entryValue: command.entryValue,
                            modOnly: command.modOnly
                        }
                    })
            });

        return fetch(
            fetchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: bodyJSON
            }).then(response =>
            {
                if (response.status === 200) {
                    return true;
                }
                return false;
            });
    }

    public static async deleteCommands(token: string, idsToDelete: number[]): Promise<Map<number, boolean>>
    {
        let fetchUrl = `/api/Commands/DeleteResponses?token=${token}`;
        idsToDelete.forEach(id =>
        {
            fetchUrl = fetchUrl + `&ids=${id}`;
        });
        return fetch(
            fetchUrl,
            {
                headers: {
                    //'Content-Type': 'application/json',
                },
                method: 'DELETE',
            }).then(response => response.json())
            .then(data =>
            {
                let retMap = new Map<number, boolean>();
                for (let key in data) {

                    retMap.set(Number.parseInt(key), data[key]);
                }
                return retMap;
            });
    }


    //body: JSON.stringify({
    //    command: {
    //        ServerId: command.serverId,
    //        CommandString: command.commandString,
    //        EntryValue: command.entryValue,
    //        ModOnly: command.modOnly
    //    },
    //    token: token
    //})

    /**
     * Checks if the command string is valid
     * @param command the commandValue string to check
     * @param restrictedCommands a list of commands that are not allowed
     * @returns an Errors object with the errors accumulated during the check.
     */
    public static checkCommandValidity(command: string): Errors
    {
        let errors: IError[] = [];
        if (command.length < 3) {
            errors.push(new CommandValidationError("Command must be at least 3 characters."));
        }
        else if (command.length > 20) {
            errors.push(new CommandValidationError("Command cannot be longer than 20 characters."));
        }
        if (Commands.restrictedCommands.findIndex(s => s === command) !== -1) {
            errors.push(new CommandValidationError(`${command} is restricted and cannot be used as a command`));
        }
        if (command.match("[^a-zA-Z]+")) {
            errors.push(new CommandValidationError("Command can only be made up of letters"));
        }
        return new Errors(errors);
    }

    /**
     * Checks if the entry value is valid
     * @param response the value to check
     * @returns an Errors object with the errors accumulated during the check.
     */
    public static checkResponseValidity(response: string): Errors
    {
        let errors: IError[] = [];
        if (response.length === 0) {
            errors.push(new ValueValidationError("Value must not have a length of 0"));
        }
        if (response.length > 1000) {
            errors.push(new ValueValidationError("Value length cannot be more than 1000"));
        }
        if (response.match("<@[&!]?[0-9]+>")) {
            errors.push(new ValueValidationError("You're not allowed to mention people or roles"));
        }

        return new Errors(errors);
    }
}

export interface ICommand
{
    id: number;
    serverId: string;
    commandString: string;
    entryValue: string;
    modOnly?: number;
    updated?: boolean;
}
export interface ICommandWithIndex extends ICommand
{
    index: number;
}
export interface IRestrictedCommand
{
    id: number;
    command: string;
}


