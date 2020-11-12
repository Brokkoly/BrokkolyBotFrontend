import React, { CSSProperties, useEffect, useState } from "react";
import { Next } from "react-bootstrap/lib/Pagination";
import { toast } from "react-toastify";
import { Commands, ICommand, IResponseGroup, ResponseGroup, IUpdateResponseProps, IUpdateResponseGroupProps } from "../backend/Commands";
import { ErrorLevels, Errors } from "../backend/Error";
import { IChannel, IRole, IServer, IServerInfo, Servers } from "../backend/Servers";
import '../css/CommandRow.css';
import '../css/Settings.css';
import { Helpers } from "../helpers";
import { ResponseGroupList } from "./CommandGroup";
import { CommandRow } from "./CommandRow";
import { IServerFunctions, LoadingMessage } from "./ServerList";

interface IServerSettingsProps
{
    token: string;
    serverIndex: number;
    server: IServer;
    restrictedCommands: string[];
    serverFunctions: IServerFunctions;

}
interface IUpdateCommandProps
{
    index: number;
    newCommandString?: string;
    newEntryValue?: string;
    newModOnly?: number;
}

export interface ICommandRowFunctions
{
    updateCommand(args: IUpdateCommandProps): void;
    cancelCommand(index: number): void;
    deleteCommand(index: number): void;
    acceptCommand(index: number, editCallback: Function): void;
}
export interface IExpandGroupArgs
{
    expanded: boolean;
    commands?: string[];
    command?: string;
}

export const ServerSettings: React.FunctionComponent<IServerSettingsProps> = ({
    server,
    token,
    restrictedCommands,
    serverFunctions,
    serverIndex
}) =>
{
    const [commandList, setCommandList] = useState<ICommand[]>([]);
    const [responseGroupList, setResponseGroupList] = useState<IResponseGroup[]>([]);
    const [originalGroups, setOriginalGroups] = useState<Map<number, IResponseGroup>>(new Map<number, IResponseGroup>());

    const [oldCommands, setOldCommands] = useState<Map<number, ICommand>>(
        new Map<number, ICommand>()
    );
    const [serverRoles, setServerRoles] = useState<IRole[]>([]);
    const [serverChannels, setServerChannels] = useState<IChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextTempId, setNextTempId] = useState(-2);
    const [showCommandGroups, setShowCommandGroups] = useState<boolean>(true);

    useEffect(
        () =>
        {
            async function fetchData(serverId: string)
            {
                let newCommandListTask = Commands.fetchCommands(serverId);
                let newResponseGroupTask = Commands.fetchResponseGroups(serverId);
                let getGuildInfoTask = Servers.getGuildInfo(token, serverId);
                let newCommandList = await newCommandListTask;
                if (server.userCanManage) {
                    newCommandList.push({
                        id: -1,
                        commandString: "",
                        entryValue: "",
                        serverId: server.serverId,
                        modOnly: 0
                    });
                }
                setCommandList(sortListOfCommands(newCommandList));
                let newResponseGroupList = await newResponseGroupTask;
                if (server.userCanManage) {
                    newResponseGroupList.forEach(async (grp) =>
                    {
                        let temp = nextTempId;
                        grp.insertNewResponseAtEnd(temp);
                        setNextTempId(tmp => tmp++);
                    });
                }
                setResponseGroupList(newResponseGroupList);
                const serverInfo: IServerInfo = await getGuildInfoTask;
                setServerRoles(serverInfo.roles);
                setServerChannels(serverInfo.channels);
                setLoading(false);
            }
            setLoading(true);
            fetchData(server.serverId);
        },
        [server.serverId, server.userCanManage, token]
    );


    /**
     * Handles updates to a command. If the command has not yet been modified, 
     * saves its old value to oldCommands in case changes need to be reverted.
     * updates the state with whichever value in args is not undefined
     * @param args
     */
    async function handleCommandUpdate(
        args: IUpdateCommandProps
    )
    {
        let index = args.index;
        let id = commandList[index].id;
        if (index === commandList.length - 1 && needEmptyCommand()) {
            addEmptyCommandToEndOfCommandList();
        }
        if (!oldCommands.has(id)) {
            let original = {
                ...commandList[index]
            };
            await setOldCommands(oldCommands =>
            {
                let newOldCommands = new Map(oldCommands);
                newOldCommands.set(id, original);
                return newOldCommands;
            });
        }
        setCommandList(commandList =>
        {
            let newList = [...commandList];
            if (args.newCommandString !== undefined) {
                newList[index].commandString = args.newCommandString;
            } else if (args.newEntryValue !== undefined) {
                newList[index].entryValue = args.newEntryValue;
            }
            else if (args.newModOnly !== undefined) {
                newList[index].modOnly = args.newModOnly;
            }

            if (oldCommands.has(id)) {
                var oldCommand: ICommand | undefined = oldCommands.get(id);
                if (oldCommand && areCommandsEqual(oldCommand, newList[index])) {
                    newList[index].updated = false;
                }
                else {
                    newList[index].updated = true;
                }
            }

            return newList;
        });
    }

    //async function handleCommandUpdateMap(args: IUpdateCommandPropsMap)
    //{
    //    let index = args.index;
    //    let oldCommandString = args.oldCommandString;
    //    //Check if the old 




    //    if (args.newCommandString !== undefined && args.oldCommandString !== undefined) {
    //        //changing the command string for everything.
    //        setCommandMap(oldCommands =>
    //        {
    //            let newCommandMap = new Map(oldCommands);
    //            if (!newCommandMap.has(args.newCommandString!) && newCommandMap.has(args.oldCommandString!)) {
    //                let oldGroup: ICommandGroup = newCommandMap.get(args.newCommandString!)!;
    //                //Create a new group
    //                newCommandMap.set(args.newCommandString!, { command: args.newCommandString!, commands: [], expanded: oldGroup.expanded });
    //            }



    //            return newCommandMap;
    //        })
    //    }
    //    if (index !== undefined) {
    //        //modifying a single command
    //    }
    //}

    async function handleResponseGroupUpdate(args: IUpdateResponseGroupProps)
    {
        let tempId = nextTempId;
        if (args.revert) {
            if (originalGroups.has(args.id)) {
                let original = originalGroups.get(args.id);
                await setOriginalGroups(origGrp =>
                {
                    let newOrigGroups = new Map(origGrp);
                    newOrigGroups.delete(args.id);
                    return newOrigGroups;
                });
                setResponseGroupList(rgl =>
                {
                    let newRGL = Commands.deepCopyResponseList(rgl);
                    let index = Commands.findResponseGroupIndex(args.id, newRGL
                    );
                    if (index !== -1) {
                        let oldExpandStatus = newRGL[index].expanded;
                        newRGL[index] = original!;
                        newRGL[index].setExpanded(oldExpandStatus);
                    }
                    return newRGL;
                });
            }
        }
        else {

            setNextTempId(nti =>
            {
                return nti--;
            });
            await setOriginalGroups(origGrp =>
            {
                let groupIndex = Commands.findResponseGroupIndex(args.id, responseGroupList);
                if (!origGrp.has(args.id)) {
                    //update original groups state
                    let newOrigGroups = new Map(origGrp);
                    let original = responseGroupList[groupIndex].copy();
                    newOrigGroups.set(args.id, original);
                    return newOrigGroups;
                }
                else {
                    return origGrp;
                }
            });
            setResponseGroupList(rgl =>
            {
                return Commands.handleResponseGroupUpdate(args, rgl, tempId);
            });
        }

    }

    async function handleResponseUpdate(args: IUpdateResponseProps)
    {
        let tempId = nextTempId;
        setNextTempId(nti =>
        {
            return nti--;
        });
        await setOriginalGroups(origGrp =>
        {
            let groupIndex = Commands.findResponseGroupIndex(args.groupId, responseGroupList);
            if (!origGrp.has(args.groupId)) {
                //update original groups state
                let newOrigGroups = new Map(origGrp);
                let original = responseGroupList[groupIndex].copy();
                newOrigGroups.set(args.groupId, original);
                return newOrigGroups;
            }
            else {
                return origGrp;
            }
        });
        setResponseGroupList(rgl =>
        {
            return Commands.handleResponseUpdate(args, rgl, tempId);
        });
    }


    function areCommandsEqual(cmd1: ICommand, cmd2: ICommand): boolean
    {
        if (cmd1.commandString === cmd2.commandString &&
            cmd1.entryValue === cmd2.entryValue &&
            cmd1.modOnly === cmd2.modOnly) {
            return true;
        }
        return false
    }

    /**
     * Add an empty command to the end of commandList
     * */
    function addEmptyCommandToEndOfCommandList(): void
    {
        setCommandList(commandList =>
        {
            let newList = [...commandList];
            newList.push({
                id: nextTempId,
                commandString: "",
                entryValue: "",
                serverId: server.serverId,
                modOnly: 0
            });
            setNextTempId(n => n - 1);
            return newList;
        });
    }

    /**
     * Sorts a list of ICommands. Returns the sorted list
     * Sorts new unsaved commands at the bottom, by id.
     * Saved commands are sorted alphabetically by commandString, then on their ids (aka creation time)
     * @param list the list to sort
     * @returns the sorted list.
     */
    function sortListOfCommands(list: ICommand[]): ICommand[]
    {
        let newList = [...list];
        newList.sort((a, b) =>
        {
            if (a.id < 0 && b.id >= 0) {
                return 1;
            } else if (b.id < 0 && a.id >= 0) {
                return -1;
            }
            if (a.commandString === b.commandString) {
                return a.id - b.id;
            } else {
                return a.commandString > b.commandString ? 1 : -1;
            }
        });
        return newList;
    }


    function expandAllGroups(expanded: boolean)
    {
        setResponseGroupList(rgl =>
        {
            let newRGL: IResponseGroup[] = [];
            rgl.forEach(rg =>
            {
                let newRG = rg.copy();
                newRG.setExpanded(expanded);
                newRGL.push(newRG);

            }
            );
            return newRGL;
        });
    }

    function expandGroup(groupId: number, expanded: boolean)
    {
        setResponseGroupList(rgl =>
        {
            let newRGL: IResponseGroup[] = [];
            rgl.forEach((rg) =>
            {
                let newRG = rg.copy();
                if (newRG.id === groupId) {
                    newRG.setExpanded(expanded);

                }
                newRGL.push(newRG);
            });
            return newRGL;
        });
    }

    /**
     * Checks if commandList needs a new empty command at the end of the list
     * @returns True if a new command is needed
     */
    function needEmptyCommand(): boolean
    {
        if (commandList.length === 0 || (
            commandList[commandList.length - 1].commandString === "" &&
            commandList[commandList.length - 1].entryValue === "")
        ) {
            return true;
        }
        return false;
    }

    /**
     * Checks that commands are valid and saves them
     * @param index the index of the command being edited
     * @param editCallback the callback from the component for the command
     */
    async function acceptCommand(index: number, editCallback: Function)
    {
        if (Commands.checkCommandValidity(commandList[index].commandString).getHighestErrorLevel() < ErrorLevels.Warning
            && Commands.checkResponseValidity(commandList[index].entryValue).getHighestErrorLevel() < ErrorLevels.Warning
            && isNotDuplicatedInList(index)) {

            if (commandList[index].id >= 0) {
                await Commands.saveCommandEdit(token, commandList[index]).then((success: boolean) =>
                {
                    if (success) {
                        acceptCommandEditSuccessCallback(index);
                        editCallback();
                    }
                    else {
                        toast('An error ocurred while saving the command. Please Try again.');
                    }
                });

            } else {
                let oldId = commandList[index].id;
                Commands.postCommand(token, commandList[index]).then((newId: number) =>
                {
                    if (newId >= 0) {
                        acceptCommandPostSuccessCallback(index, newId, oldId);
                        editCallback();
                    }
                    else {
                        toast('An error ocurred while saving the command. Please Try again.');
                    }
                })
            }
        }
    }

    /**
     * Handles the result of a successful POST of a new command by setting its id 
     * @param index index of the command in commandList
     * @param newId the new actual database id.
     * @param oldId the negative temporary id.
     */
    function acceptCommandPostSuccessCallback(index: number, newId: number, oldId: number)
    {
        if (newId >= 0) {
            setCommandList(commandList =>
            {
                let newList = [...commandList];
                newList[index].id = newId;
                sortListOfCommands(newList);

                return newList;
            });
            deleteFromOldCommands(oldId);
        }
    }

    /**
     * Sort the command list and deletes the command from the old commands map.
     * @param index index of the command
     */
    function acceptCommandEditSuccessCallback(index: number)
    {
        let id = commandList[index].id;
        setCommandList(commandList =>
        {
            let newList = [...commandList];
            sortListOfCommands(newList);
            return newList;
        });
        deleteFromOldCommands(id);
    }

    /**
     * Delete a command from the old commands map
     * @param id the id of the command
     */
    function deleteFromOldCommands(id: number)
    {
        if (oldCommands.has(id)) {
            setOldCommands(oldCommands =>
            {
                let newOldCommands = new Map(oldCommands);
                newOldCommands.delete(id);
                return newOldCommands;
            });
        }
    }

    /**
     * Cancel changes being made to the command
     * @param index index of the command
     */
    function cancelCommand(index: number)
    {
        let id = commandList[index].id;
        if (oldCommands.has(id)) {
            setCommandList(commandList =>
            {
                let newList = [...commandList];

                if (id < 0) {
                    newList.splice(index, 1);
                } else {
                    //not undefined because we checked above
                    let oldCommand = { ...oldCommands.get(id)! };
                    newList[index] = oldCommand;
                }
                return newList;
            });
            setOldCommands(oldCommands =>
            {
                let newOldCommands = new Map(oldCommands);
                newOldCommands.delete(id);
                return newOldCommands;
            });
        }
    }

    /**
     * Deletes a command from the commandList, oldCommands, and has the web server delete it.
     * @param index the index of the command in commandList
     */
    async function deleteCommand(index: number)
    {
        await Commands.deleteFromList(token, commandList[index].id).then(success =>
        {
            if (success) {
                let id = commandList[index].id;
                if (oldCommands.has(id)) {
                    setOldCommands(oldCommands =>
                    {
                        let newOldCommands = new Map(oldCommands);
                        newOldCommands.delete(id);
                        return newOldCommands;
                    });
                }
                setCommandList(commandList =>
                {
                    //not undefined because we checked above
                    let newList = [...commandList];
                    newList.splice(index, 1);
                    return newList;
                });
            }
            else {
                toast("An error ocurred while deleting the command. Please try again");
            }
        });
    }

    /**
     * Checks to make sure that there is not an identical command in the list.
     * @param index the index of the command to check
     * @returns False if the command is duplicated in the list, true otherwise
     */
    function isNotDuplicatedInList(index: number): boolean
    {
        //TODO: abstract these away
        let testCommand = commandList[index];
        for (let i = 0; i < commandList.length; i++) {
            if (i === index) {
                continue;
            }
            if (
                testCommand.commandString === commandList[i].commandString &&
                testCommand.entryValue === commandList[i].entryValue
            ) {
                //TODO: more verbose
                return false;
            }
        }
        return true;
    }

    function toggleCommandGroup(e: any)
    {
        let checked = e.target.checked as boolean;
        setShowCommandGroups(checked);
    }

    return (
        <LoadingMessage loading={loading}>

            <div className="_inputText" style={{ maxWidth: "900px", justifyContent: "center" }}>
                <h3>
                    {server.name}
                </h3>
            </div>
            <OtherSettingsForm
                server={server}
                serverIndex={serverIndex}
                serverRoles={serverRoles}
                serverChannels={serverChannels}
                serverFunctions={serverFunctions}
            />
            <div className="betweenDiv20" />
            <form>
                <label className="_inputText _checkboxLabel">
                    {"Show Command Group"}
                    <input type="checkbox" className={"_formInput _commandInput "} checked={showCommandGroups} onChange={toggleCommandGroup} />
                </label>
            </form>
            {showCommandGroups ?
                <ResponseGroupList responseGroupList={responseGroupList}
                    commandPrefix={server.commandPrefix || "!"}
                    userCanEdit={server.userCanManage}
                    callbackFunctions={
                        {
                            expandGroup: expandGroup,
                            expandAllGroups: expandAllGroups,
                            handleResponseUpdate: handleResponseUpdate,
                            handleResponseGroupUpdate: handleResponseGroupUpdate,

                        }
                    }
                /> :
                <CommandList
                    commands={commandList}
                    commandRowFunctions={{ updateCommand: handleCommandUpdate, acceptCommand: acceptCommand, cancelCommand: cancelCommand, deleteCommand: deleteCommand }}
                    userCanEdit={server.userCanManage}
                    restrictedCommands={restrictedCommands}
                    commandPrefix={server.commandPrefix || "!"}
                />}

        </LoadingMessage >
    );
};

interface CommandListProps
{
    commands: ICommand[];
    commandRowFunctions: ICommandRowFunctions;
    userCanEdit: boolean;
    restrictedCommands: string[];
    commandPrefix: string;
}

export const CommandList: React.FunctionComponent<CommandListProps> = ({
    commands,
    commandRowFunctions,
    userCanEdit,
    restrictedCommands,
    commandPrefix,
}) =>
{
    return (
        <div>
            <ul className="_commandList">
                {commands.map((cmd, index) => (
                    <CommandRow
                        key={cmd.id}
                        index={index}
                        command={cmd}
                        commandRowFunctions={commandRowFunctions}
                        userCanEdit={userCanEdit}
                        restrictedCommands={restrictedCommands}
                        commandPrefix={commandPrefix}
                    />
                ))}
            </ul>
        </div>
    );
};


export const OtherSettingsForm: React.FunctionComponent<{
    server: IServer;
    serverIndex: number;
    serverFunctions: IServerFunctions;
    serverRoles: IRole[];
    serverChannels: IChannel[];
}> = ({
    server,
    serverFunctions,
    serverIndex,
    serverRoles,
    serverChannels,
}) =>
    {
        const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
        const [secondsErrors, setSecondsErrors] = useState<Errors>(new Errors());
        const [prefixErrors, setPrefixErrors] = useState<Errors>(new Errors());
        const [disableAccept, setDisableAccept] = useState(false);

        /**
         * Handler for changes in the timeout's value
         * @param event the form event that caused the change
         */
        function handleNumberChange(event: any)
        {
            let actualNumber = event.target.value;
            if (isNaN(actualNumber)) {
                actualNumber = Number(actualNumber.replace(/\D/g, ''));
            }
            serverFunctions.handleServerChange({ index: serverIndex, newTimeoutValue: actualNumber });
            setHasBeenUpdated(true);
        }

        /**
         * Handler for a change in the botManagerRoleId
         * @param event the form event that caused the change
         */
        function handleRoleChange(event: any)
        {
            serverFunctions.handleServerChange({ index: serverIndex, newBotManagerRoleId: event.target.value });
            setHasBeenUpdated(true);
        }
        function handleTwitchLiveRoleChange(event: any)
        {
            serverFunctions.handleServerChange({ index: serverIndex, newTwitchLiveRoleId: event.target.value });
            setHasBeenUpdated(true);
        }

        /**
         * Handler for a change in the twitchChannel
         * @param event the form event that caused the change
         */
        function handleTwitchChannelChange(event: any)
        {
            serverFunctions.handleServerChange({ index: serverIndex, newTwitchChannelId: event.target.value });
            setHasBeenUpdated(true);
        }
        /**
         * Handler for a change in the command prefix.
         * @param event the form event that caused the change
         */
        function handlePrefixChange(event: any)
        {
            serverFunctions.handleServerChange({ index: serverIndex, newCommandPrefix: event.target.value });
            setHasBeenUpdated(true);
        }

        useEffect(
            () =>
            {
                if (!hasBeenUpdated) {
                    setSecondsErrors(new Errors());
                    return;
                }
                setSecondsErrors(secErr =>
                {
                    return Servers.checkTimeoutValidity(server.timeoutSeconds);
                });
            },
            [server.timeoutSeconds, hasBeenUpdated]
        );

        useEffect(
            () =>
            {
                if (secondsErrors.getHighestErrorLevel() >= ErrorLevels.Critical || prefixErrors.getHighestErrorLevel() >= ErrorLevels.Critical) {
                    setDisableAccept(true);
                } else {
                    setDisableAccept(false);
                }
            },
            [secondsErrors, prefixErrors]
        );

        useEffect(() => { }, [serverRoles]);

        useEffect(() =>
        {
            if (!hasBeenUpdated) {
                setPrefixErrors(new Errors());
                return;
            }
            setPrefixErrors(preErr =>
            {
                let prefixErr = Servers.checkCommandPrefixValidity(server.commandPrefix);
                return prefixErr;
            });
        }, [server.commandPrefix, hasBeenUpdated]
        );

        /**
        * Handler for the cancel button. Tells the list to cancel changes to this command. Resets hasBeenUpdated
        * @param event the button's event.
        */
        function handleCancel(event: any)
        {
            event.preventDefault();
            serverFunctions.handleServerCancel(serverIndex);
            setHasBeenUpdated(false);
        }
        /**
        * Handler for the form's submit. Lets the list know to save this server's changes
        * Resets hasBeenUpdated
        * @param event need to prevent the default behavior
        */
        function handleAccept(event: any)
        {
            event.preventDefault();
            serverFunctions.handleServerAccept(serverIndex);
            setHasBeenUpdated(false);
        }

        function constructStyleFromNumber(color: number): CSSProperties | undefined
        {
            return { color: color.toString(16) };
        }


        return (
            <div>
                <form onSubmit={handleAccept}>
                    <div className="flexColumn" >
                        <div className="flexRow">
                            <label className="_inputText">
                                Cooldown (s):
                            <input type="text" value={server.timeoutSeconds} title={secondsErrors.toErrorMessage()} className={"_formInput _commandInput " + secondsErrors.getCssForError()} onChange={handleNumberChange} disabled={!server.userCanManage} />
                            </label>
                        </div>
                        {/*TODO: info hover icon that says what exactly these do*/}
                        <div className="flexRow ">
                            <label className="_labelText">
                                {"Select the role that can manage the bot: "}
                                <select
                                    className="_formInput _roleSelect"
                                    value={server.botManagerRoleId || ""}
                                    onChange={handleRoleChange}
                                    disabled={!server.userCanManage}
                                >
                                    <option className="_roleOption" key={"0"} value={""}>
                                        None
            </option>
                                    {serverRoles.map((rle: IRole) => (
                                        <option
                                            className="_roleOption"
                                            style={constructStyleFromNumber(rle.color)}
                                            key={rle.id}
                                            value={rle.id}
                                        >
                                            {rle.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flexRow">
                            <label className="_inputText">
                                {"Select the channel where twitch updates should be posted:  "}
                                <select
                                    className="_formInput _roleSelect"
                                    value={server.twitchChannelId || ""}
                                    onChange={handleTwitchChannelChange}
                                    disabled={!server.userCanManage}
                                >
                                    <option className="_roleOption " key={"0"} value={""}>
                                        None
                                    </option>
                                    {serverChannels.map((channel: IChannel) => (
                                        <option
                                            className="_roleOption"
                                            key={channel.id}
                                            value={channel.id}
                                        >
                                            {channel.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flexRow ">
                            <label className="_inputText">
                                {"Select the role for users currently broadcasting on twitch: "}
                                <select
                                    className="_formInput _roleSelect"
                                    value={server.twitchLiveRoleId || ""}
                                    onChange={handleTwitchLiveRoleChange}
                                    disabled={!server.userCanManage}
                                >
                                    <option className="_roleOption" key={"0"} value={""}>
                                        None
            </option>
                                    {serverRoles.map((rle: IRole) => (
                                        <option
                                            className="_roleOption"
                                            style={constructStyleFromNumber(rle.color)}
                                            key={rle.id}
                                            value={rle.id}
                                        >
                                            {rle.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flexRow">
                            <label className="_inputText">
                                {"Command Prefix: "}
                                <input type="text" value={server.commandPrefix || ""} title={prefixErrors.toErrorMessage()} className={"_formInput _commandInput " + prefixErrors.getCssForError()} onChange={handlePrefixChange} disabled={!server.userCanManage} placeholder="!" />

                            </label>
                        </div>
                        <div className="flexRow">

                            <button
                                onClick={handleCancel}
                                className={
                                    "_formButton _cancelButton " + Helpers.nodispIf(!hasBeenUpdated)
                                }
                            >Revert</button>
                            <input
                                type="submit"
                                value="Accept"
                                className={
                                    "_formButton _acceptButton " + Helpers.nodispIf(!hasBeenUpdated)
                                }
                                disabled={disableAccept}
                            />
                        </div>
                    </div>
                </form>
            </div >
        );
    };
