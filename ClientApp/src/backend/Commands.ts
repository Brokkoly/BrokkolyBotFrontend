import { promises } from "dns";
import { CommandValidationError, Errors, IError, ValueValidationError } from "./Error";
import { Servers } from "./Servers";

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
                    retList.push(new ResponseGroup(data[key].id, data[key].command,
                        data[key].responses.map((resp: any) =>
                        {
                            return new Response(resp);
                        })));
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



    public static findResponseIndex(args: IFindResponseIndexArgs, groupListToSearch: ResponseGroup[]): number
    {
        let groupIndex = this.findResponseGroupIndex(args.groupId, groupListToSearch);

        if (groupIndex === -1) {
            return -1;
        }
        return groupListToSearch[groupIndex].findResponse({ id: args.id }).index;
    }

    public static findResponseGroupIndex(id: number, groupListToSearch: ResponseGroup[]): number
    {
        return groupListToSearch.findIndex(grp => grp.id === id);
    }

    public static copyResponseGroupList(groups: IResponseGroup[]): IResponseGroup[]
    {
        return [...groups];
    }


    public static handleResponseUpdate(args: IUpdateResponseProps, groupsToUpdate: IResponseGroup[], tempId: number): IResponseGroup[]
    {
        let groupIndex = Commands.findResponseGroupIndex(args.groupId, groupsToUpdate);
        let responseIndex = groupsToUpdate[groupIndex].findResponse({ id: args.id }).index;
        let len = groupsToUpdate[groupIndex].responses.length;
        let retGrpLst = [...groupsToUpdate];
        let groupToUpdate = groupsToUpdate[groupIndex];
        let responseToUpdate = groupToUpdate.responses[responseIndex];

        if (args.newModOnlyValue !== undefined) {
            responseToUpdate.modOnly = args.newModOnlyValue;
            responseToUpdate.edited = true;
        }
        if (args.newResponse !== undefined) {
            responseToUpdate.response = args.newResponse;
            responseToUpdate.edited = true;
            responseToUpdate.validate(groupToUpdate.responses);
        }
        if (args.deleted !== undefined) {
            responseToUpdate.deleted = args.deleted;
        }
        if (responseIndex === len - 1 && groupToUpdate.responses[responseIndex].response !== "") {
            groupToUpdate.insertNewResponseAtEnd(tempId);
        }

        return retGrpLst;
    }

    /**
     * Updates the entire response group
     * @param args
     * @param groupsToUpdate
     * @param tempId
     * @param userCanManage
     */
    public static handleResponseGroupUpdate(args: IUpdateResponseGroupProps, groupsToUpdate: IResponseGroup[], tempId: number, userCanManage: boolean)
    {
        let newGroups = [...groupsToUpdate];
        let groupToUpdate = newGroups.find(grp => grp.id === args.id);
        if (!groupToUpdate) {
            return groupsToUpdate;
        }
        if (args.newExpandStatus !== undefined) {
            groupToUpdate.setExpanded(args.newExpandStatus);
        }
        if (userCanManage) {

            if (args.newCommand !== undefined) {
                groupToUpdate.updateCommand(args.newCommand);
            }
            if (args.newEditModeStatus !== undefined) {
                groupToUpdate.setEditMode(args.newEditModeStatus);
            }
            if (groupToUpdate.inEditMode && groupToUpdate.expanded && groupToUpdate.needsEmptyEntry()) {
                groupToUpdate.insertNewResponseAtEnd(tempId);
            }
            if (newGroups[newGroups.length - 1].command !== "") {
                let newRespGroup = new ResponseGroup(tempId - 1, "", [], true);
                newRespGroup.insertNewResponseAtEnd(tempId - 2);
                newGroups.push(newRespGroup);
            }
        }


        return newGroups;
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


export interface IUpdateResponseActionProps
{
    id: number;
    newResponse?: string;
    newModOnlyValue?: number;
    deleted?: boolean;
}
export interface IUpdateResponseProps extends IUpdateResponseActionProps
{
    groupId: number;
}


export interface IResponseConstructorArgs
{
    id: number;
    modOnly?: number;
    response: string;
}

export interface IResponse extends IResponseConstructorArgs
{
    id: number;
    modOnly: number;
    response: string;
    deleted: boolean;
    edited: boolean;
    errors: Errors;
    copy(): IResponse;
    update(args: IUpdateResponseProps): void
    validate(otherResponses: IResponse[]): Errors;

}

export class Response implements IResponse
{
    id: number;
    modOnly = 0;
    response = "";
    errors: Errors;
    deleted: boolean;
    edited: boolean;
    constructor(args: IResponseConstructorArgs)
    {
        this.id = args.id;
        this.response = args.response;
        this.modOnly = args.modOnly || 0;
        this.errors = new Errors();
        this.deleted = false;
        this.edited = false;
    }

    validate(allResponses: IResponse[]): Errors
    {
        this.errors = Commands.checkResponseValidity(this.response);

        if (allResponses.find(resp => resp.id !== this.id && resp.response === this.response)) {
            this.errors.addErrors(new ValueValidationError("Duplicate responses are not allowed"));
        }
        return this.errors;
    }



    update(args: IUpdateResponseProps)
    {
        if (args.newResponse !== undefined) {
            this.response = args.newResponse;
        }
        if (args.newModOnlyValue !== undefined) {
            this.modOnly = args.newModOnlyValue;
        }
    }

    copy(): IResponse
    {
        let retResponse = new Response({ id: this.id, response: this.response, modOnly: this.modOnly });
        retResponse.errors = this.errors;
        retResponse.deleted = this.deleted;
        retResponse.edited = this.edited;
        return retResponse;
    }
}

export interface IFindResponseIndexArgs
{
    id: number;
    groupId: number;
}

export interface IUpdateResponseGroupProps
{
    id: number;
    newCommand?: string;
    deleted?: boolean;
    newEditModeStatus?: boolean;
    newExpandStatus?: boolean;
    revert?: boolean;
}


export interface IResponseGroup
{
    id: number;
    command: string;
    originalCommand: string;
    responses: IResponse[];
    expanded: boolean;
    deleted: boolean;
    inEditMode: boolean;
    commandErrors: Errors;
    groupErrors: Errors[];


    copy(): IResponseGroup;
    findResponse(args: IFindResponseArgs): IResponseReturn;
    needsEmptyEntry(): boolean;
    insertNewResponseAtEnd(tempId: number): void;
    setExpanded(expanded: boolean): void;
    setEditMode(editMode: boolean): void;
    getCommandValidity(): Errors;
    checkCommandValidity(): Errors;
    getGroupValidity(): Errors[];
    checkGroupValidity(): Errors[];
    updateCommand(newCommand: string): void;
    checkHighestErrorLevel(): number;
}

export interface IResponseReturn
{
    response?: IResponse;
    index: number;
}

export interface IFindResponseArgs
{
    response?: string;
    id?: number;
}

export class ResponseGroup implements IResponseGroup
{
    id: number;
    expanded: boolean;
    inEditMode: boolean;
    originalCommand = ""
    responses: IResponse[] = [];
    command = "";
    deleted = false;
    commandErrors: Errors;
    groupErrors: Errors[];

    constructor(id: number, command: string, responses: IResponse[], newEmptyGroup?: boolean)
    {
        this.id = id;
        this.command = command;
        this.originalCommand = command;
        this.responses = responses || [];
        this.commandErrors = new Errors();
        this.groupErrors = this.checkGroupValidity();
        if (newEmptyGroup) {
            this.inEditMode = true;
            this.expanded = true;
        }
        else {

            this.expanded = false;
            this.inEditMode = false;
        }

    }

    findResponse(args: IFindResponseArgs): IResponseReturn
    {
        let index = -1;
        let retResponse: IResponse | undefined = undefined;
        if (args.id !== undefined) {
            index = this.responses.findIndex(response => response.id === args.id);
        }
        if (args.response !== undefined) {
            index = this.responses.findIndex(response => response.id === args.id);
        }
        if (index !== -1) {
            retResponse = this.responses[index];
        }
        return { index: index, response: retResponse };
    }

    getCommandValidity(): Errors
    {
        return this.commandErrors;
    }

    checkCommandValidity(): Errors
    {
        this.commandErrors = Commands.checkCommandValidity(this.command);
        return this.commandErrors;
    }

    getGroupValidity(): Errors[]
    {
        return this.groupErrors;
    }

    checkGroupValidity(markLastEmptyTempInvalid: boolean = false): Errors[]
    {
        if (this.responses === undefined) {
            return [];
        }
        let retErrors: Errors[] = new Array(this.responses.length);
        this.responses.forEach((resp, index) =>
        {
            if (!markLastEmptyTempInvalid && index === this.responses.length - 1 && resp.id < 0 && resp.response === "") {
                return;
            }
            retErrors[index] = (resp as Response).validate(this.responses);
        })
        this.groupErrors = retErrors;
        return retErrors;
    }

    checkHighestErrorLevel(): number
    {
        let highestErrorLevel = 0;
        this.checkGroupValidity(false).forEach(errors =>
        {
            let level = errors.getHighestErrorLevel();
            if (level > highestErrorLevel) {
                highestErrorLevel = level;
            }

        });
        let level = this.checkCommandValidity().getHighestErrorLevel();
        if (level > highestErrorLevel) {
            highestErrorLevel = level;
        }
        return highestErrorLevel;
    }

    /**
     * Checks if the last response is empty or if it is does not have a temporary id
     */
    needsEmptyEntry(): boolean
    {
        return this.responses.length === 0 || (this.responses[this.responses.length - 1].response !== "") || (this.responses[this.responses.length - 1].id >= 0);
    }

    setExpanded(expanded: boolean)
    {
        this.expanded = expanded;
    }

    setEditMode(editMode: boolean)
    {
        this.inEditMode = editMode;
    }

    /**
     * Adds a new command to the end of the responses array
     * @param tempId the temporary id to assign to the response
     */
    insertNewResponseAtEnd(tempId: number): void
    {
        this.responses.push(new Response({ id: tempId, response: "", modOnly: 0 }));
    }

    updateCommand(newCommand: string): void
    {
        this.command = newCommand;
        this.checkCommandValidity();
    }

    copy(): IResponseGroup
    {
        let retGrp = new ResponseGroup(this.id, this.command, []);
        retGrp.expanded = this.expanded;
        retGrp.deleted = this.deleted;
        retGrp.originalCommand = this.originalCommand
        retGrp.commandErrors = this.commandErrors;
        retGrp.groupErrors = this.groupErrors;
        retGrp.inEditMode = this.inEditMode;
        this.responses.forEach(rsp =>
        {
            retGrp.responses.push(rsp.copy());
        });

        return retGrp;
    }
}