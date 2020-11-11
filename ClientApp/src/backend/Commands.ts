﻿import { group } from "console";
import { ICommandGroup } from "../components/CommandGroup";
import { CommandValidationError, Errors, IError, ValueValidationError } from "./Error";
import { Servers } from "./Servers";

export class Commands
{
    /**
     * Loads the bot's restricted commands
     * @returns a promise of a list of restricted commands
     */
    public static async getRestrictedCommands(): Promise<string[]>
    {
        return Servers.getRestrictedCommands().then(data =>
            data.map((restrictedCommand: IRestrictedCommand) => restrictedCommand.command));
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

    public static async fetchCommandsAsMap(serverId: string): Promise<Map<string, ICommandGroup>>
    {
        let fetchUrl = '/api/Commands/GetCommandsForServerDict?serverId=' + serverId;
        return fetch(fetchUrl)
            .then(response =>
            {
                return response.json();
            })
            .then(data =>
            {
                var retMap = new Map<string, ICommandGroup>();
                for (let key in data) {
                    retMap.set(key, data[key]);
                }
                return retMap;
            });

    }

    public static async fetchResponseGroups(serverId: string): Promise<IResponseGroup[]>
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
                    retList.push(new ResponseGroup(data[key].command, data[key].responses));
                }
                return retList;
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

    /**
     * Checks if the command string is valid
     * @param command the commandValue string to check
     * @param restrictedCommands a list of commands that are not allowed
     * @returns an Errors object with the errors accumulated during the check.
     */
    public static checkCommandValidity(command: string, restrictedCommands: string[]): Errors
    {
        let errors: IError[] = [];
        if (command.length < 3) {
            errors.push(new CommandValidationError("Command must be at least 3 characters."));
        }
        else if (command.length > 20) {
            errors.push(new CommandValidationError("Command cannot be longer than 20 characters."));
        }
        if (restrictedCommands.findIndex(s => s === command) !== -1) {
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
        if (response.length > 500) {
            errors.push(new ValueValidationError("Value length cannot be more than 500"));
        }
        if (response.match("<@[&!]?[0-9]+>")) {
            errors.push(new ValueValidationError("You're not allowed to mention people or roles"));
        }
        return new Errors(errors);
    }



    public static findResponseIndex(args: IFindResponseIndexArgs, groupListToSearch: ResponseGroup[]): number
    {
        if (!args.command && args.responseGroupIndex === undefined) {
            return -1;
        }
        let groupIndex = args.responseGroupIndex ?? this.findResponseGroupIndex(args.command!, groupListToSearch);

        if (groupIndex === -1) {
            return -1;
        }
        return groupListToSearch[groupIndex].responses.findIndex(response => response.id === args.id);
    }

    public static findResponseGroupIndex(command: string, groupListToSearch: ResponseGroup[]): number
    {
        return groupListToSearch.findIndex(grp => grp.originalCommand === command);
    }

    public static deepCopyResponseList(groups: IResponseGroup[]): IResponseGroup[]
    {
        let retGrpLst: IResponseGroup[] = [];
        groups.forEach(group =>
        {
            retGrpLst.push(group.copy());
        });
        return retGrpLst;
    }


    public static handleResponseUpdate(args: IUpdateResponseProps, groupsToUpdate: IResponseGroup[], tempId: number): IResponseGroup[]
    {
        let groupIndex = Commands.findResponseGroupIndex(args.command, groupsToUpdate);
        let responseIndex = Commands.findResponseIndex({ id: args.id, responseGroupIndex: groupIndex }, groupsToUpdate);
        let len = groupsToUpdate[groupIndex].responses.length;
        let retGrpLst = Commands.deepCopyResponseList(groupsToUpdate);

        if (responseIndex === len - 1 && groupsToUpdate[groupIndex].responses[responseIndex].response !== "") {
            retGrpLst[groupIndex].responses.push({ id: tempId, modOnly: 0, response: "" });
        }
        if (args.newModOnlyValue !== undefined) {
            retGrpLst[groupIndex].responses[responseIndex].modOnly = args.newModOnlyValue;
        }
        else if (args.newResponse !== undefined) {
            retGrpLst[groupIndex].responses[responseIndex].response = args.newResponse;
        }

        return retGrpLst;
    }

    public static handleResponseGroupUpdate(args: IUpdateResponseGroupProps)
    {

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

export interface IResponse
{
    id: number;
    modOnly: number;
    response: string;
    errors?: IError[];
}

export interface IUpdateResponseProps
{
    command: string;
    id: number;
    newResponse?: string;
    newModOnlyValue?: number;
}

export class Response
{
    id: number;
    modOnly = 0;
    response = "";
    constructor(id: number, response: string, modOnly?: number)
    {
        this.id = id;
        this.response = response;
        if (modOnly !== undefined) {
            this.modOnly = modOnly;
        }
    }
}

export interface IFindResponseIndexArgs
{
    id: number;
    command?: string;
    responseGroupIndex?: number;
}

export interface IUpdateResponseGroupProps
{
    command: string;
    newCommand?: string;
    newResponse?: string;
    newResponses?: IResponse[];
    newModOnly?: number; //todo: delete if unnecessary
    deleted?: boolean;
}


export interface IResponseGroup
{
    command: string;
    originalCommand: string;
    responses: IResponse[];
    expanded: boolean;
    deleted: boolean;
    copy(): IResponseGroup;
}

export class ResponseGroup implements IResponseGroup
{
    expanded: boolean = false;
    originalCommand = ""
    responses: IResponse[] = [];
    command = "";
    deleted = false;

    constructor(command: string, responses: IResponse[])
    {
        this.command = command;
        this.originalCommand = command;
        this.responses = responses;
    }

    copy(): IResponseGroup
    {
        let retGrp = new ResponseGroup(this.command, []);
        retGrp.expanded = this.expanded;
        retGrp.deleted = this.deleted;
        this.responses.forEach(rsp =>
        {
            retGrp.responses.push({ ...rsp });
        });
        return retGrp;
    }
}