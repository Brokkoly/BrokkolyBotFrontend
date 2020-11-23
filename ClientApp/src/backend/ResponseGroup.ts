import { Commands } from "./Commands";
import { CommandValidationError, ErrorLevels, Errors, ValueValidationError } from "./Error";


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


export interface IResponseGroupListProps
{
    responseGroups: IResponseGroup[];
}

export interface IResponseGroupList extends IResponseGroupListProps
{
    findResponseIndex(args: IFindResponseIndexArgs): number;
    findResponseGroupIndex(id: number): number
    findResponseGroup(id: number): IResponseGroup | undefined;
    copy(): IResponseGroupList;
    handleResponseUpdate(args: IUpdateResponseProps, tempId: number): void
    handleResponseGroupUpdate(args: IUpdateResponseGroupProps, tempId: number, userCanManage: boolean): void;
    validate(idToValidate?: number): void;
    expandAllGroups(expanded: boolean): void;
}

/**
 * Wrapper for a list of response groups. Implements functions that were previously not part of the class definition
 * */
export class ResponseGroupList implements IResponseGroupList
{
    responseGroups: IResponseGroup[];

    constructor(oldRGL: IResponseGroupListProps)
    {
        this.responseGroups = [...oldRGL.responseGroups];
    }


    expandAllGroups(expanded: boolean): void
    {
        this.responseGroups.forEach(grp =>
        {
            let newRG = grp.copy();
            newRG.setExpanded(expanded);
        });
    }


    validate(idToValidate?: number): void
    {
        if (idToValidate === undefined) {
            //Do validation on everything?
        }
        else {
            let groupToValidate = this.responseGroups[this.findResponseGroupIndex(idToValidate)];
            this.responseGroups.forEach(grp =>
            {
                if (grp.id === idToValidate) {
                    return;
                }
                else {
                    if (groupToValidate.command === grp.command) {
                        groupToValidate.commandErrors.addErrors(new CommandValidationError("This command already exists", ErrorLevels.Critical));
                    }
                }
            })
        }
    }

    findResponseIndex(args: IFindResponseIndexArgs): number
    {
        //TODO: call a method on the individual group.
        let groupIndex = this.findResponseGroupIndex(args.groupId);

        if (groupIndex === -1) {
            return -1;
        }
        return this.responseGroups[groupIndex].findResponse({ id: args.id }).index;
    }

    findResponseGroupIndex(id: number): number
    {
        return this.responseGroups.findIndex(grp => grp.id === id);
    }

    findResponseGroup(id: number): IResponseGroup | undefined
    {
        return this.responseGroups.find(grp => grp.id === id);
    }

    copy(): IResponseGroupList
    {
        return new ResponseGroupList(this);
    }

    handleResponseUpdate(args: IUpdateResponseProps, tempId: number): void
    {
        let groupIndex = this.findResponseGroupIndex(args.groupId);
        let responseIndex = this.responseGroups[groupIndex].findResponse({ id: args.id }).index;
        let len = this.responseGroups[groupIndex].responses.length;
        this.responseGroups = [...this.responseGroups];
        let groupToUpdate = this.responseGroups[groupIndex];
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
    }

    handleResponseGroupUpdate(args: IUpdateResponseGroupProps, tempId: number, userCanManage: boolean): void
    {
        this.responseGroups = [...this.responseGroups];
        let groupToUpdate = this.responseGroups.find(grp => grp.id === args.id);
        if (!groupToUpdate) {
            return;
        }
        if (args.newExpandStatus !== undefined) {
            groupToUpdate.setExpanded(args.newExpandStatus);
        }
        if (userCanManage) {

            if (args.newCommand !== undefined) {
                groupToUpdate.updateCommand(args.newCommand);
                this.validate(groupToUpdate.id);
            }
            if (args.newEditModeStatus !== undefined) {
                groupToUpdate.setEditMode(args.newEditModeStatus);
            }
            if (groupToUpdate.inEditMode && groupToUpdate.expanded && groupToUpdate.needsEmptyEntry()) {
                groupToUpdate.insertNewResponseAtEnd(tempId);
            }
            if (this.responseGroups[this.responseGroups.length - 1].command !== "") {
                let newRespGroup = new ResponseGroup(tempId - 1, "", [], true);
                newRespGroup.insertNewResponseAtEnd(tempId - 2);
                this.responseGroups.push(newRespGroup);
            }
        }
    }


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