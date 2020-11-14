import React, { CSSProperties, useEffect, useState } from "react";
import { Next } from "react-bootstrap/lib/Pagination";
import { toast } from "react-toastify";
import { InputGroupText } from "reactstrap";
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
    const [responseGroupList, setResponseGroupList] = useState<IResponseGroup[]>([]);
    const [originalGroups, setOriginalGroups] = useState<Map<number, IResponseGroup>>(new Map<number, IResponseGroup>());

    const [serverRoles, setServerRoles] = useState<IRole[]>([]);
    const [serverChannels, setServerChannels] = useState<IChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextTempId, setNextTempId] = useState(-2);

    useEffect(
        () =>
        {
            async function fetchData(serverId: string)
            {
                let newResponseGroupTask = Commands.fetchResponseGroups(serverId);
                let getGuildInfoTask = Servers.getGuildInfo(token, serverId);
                
                let newResponseGroupList = await newResponseGroupTask;
                if (server.userCanManage) {
                    let nextId = nextTempId;
                    let nextRespId = nextTempId - 1;
                    setNextTempId(nextTempId - 2);
                    let newRespGroup = new ResponseGroup(nextId, "", [], true);
                    newRespGroup.insertNewResponseAtEnd(nextRespId);
                    newResponseGroupList.push(newRespGroup);

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

    async function handleResponseGroupAccept(groupId: number)
    {
        let groupToAccept = responseGroupList.find(grp => grp.id === groupId);
        if (groupToAccept === undefined) {
            return;
        }
        if (groupToAccept.checkHighestErrorLevel() >= ErrorLevels.Critical ) {
            toast("Could not accept. Please fix validation errors and try again");
            return;
        }

        groupToAccept = groupToAccept.copy();

        let newResponsesList = [...groupToAccept.responses];
        let newResponses: ICommand[] = [];
        let deletedResponseIds: number[] = [];
        let editedResponses: ICommand[] = [];
        groupToAccept.responses.forEach((resp, index) =>
        {
            if (resp.id < 0) {
                //Created
                if (resp.deleted || resp.response === "") {
                    //don't keep it around;
                    newResponsesList = newResponsesList.filter(obj => obj !== resp);
                }
                else {
                    newResponses.push(
                        {
                            id: resp.id,
                            serverId: server.serverId,
                            commandString: groupToAccept!.command,
                            entryValue: resp.response,
                            modOnly: resp.modOnly,
                            updated: resp.edited,
                        }
                    );
                }
            }
            else if (resp.deleted) {
                deletedResponseIds.push(resp.id);
            }
            else if (resp.edited) {
                editedResponses.push(
                    {
                        id: resp.id,
                        serverId: server.serverId,
                        commandString: groupToAccept!.command,
                        entryValue: resp.response,
                        modOnly: resp.modOnly,
                        updated: resp.edited,
                    }
                );
            }
        });
        let putTask = Commands.putNewCommands(token, newResponses);
        let deleteTask = Commands.deleteCommands(token, deletedResponseIds);
        let postTask = Commands.postCommands(token, editedResponses);

        let newIdMap = await putTask;
        let deletedMap = await deleteTask;
        newIdMap.forEach((newId, oldId) =>
        {
            let respToEdit = newResponsesList.find(resp => resp.id === oldId);
            if (respToEdit) {
                respToEdit.id = newId;
            }
        });
        newResponsesList = newResponsesList.filter(resp =>
        {
            return !(deletedMap.has(resp.id) && deletedMap.get(resp.id));
        });
        if (!(await postTask)) {

        }
        groupToAccept.responses = newResponsesList;
        groupToAccept.setEditMode(false);
        groupToAccept.originalCommand = groupToAccept.command;


        setResponseGroupList(rgl =>
        {
            let newRGL = [...rgl];
            let index = newRGL.findIndex(grp => grp.id === groupToAccept!.id);
            newRGL[index] = groupToAccept!;
            return newRGL;
        });


    }


    async function handleResponseGroupUpdate(args: IUpdateResponseGroupProps)
    {
        let tempId = nextTempId;
        setNextTempId(nextTempId - 3);
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
                    let newRGL = [...rgl];
                    let index = Commands.findResponseGroupIndex(args.id, newRGL);
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
                return Commands.handleResponseGroupUpdate(args, rgl, tempId, server.userCanManage);
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

    /**
     * Sorts a list of ICommands. Returns the sorted list
     * Sorts new unsaved commands at the bottom, by id.
     * Saved commands are sorted alphabetically by commandString, then on their ids (aka creation time)
     * @param list the list to sort
     * @returns the sorted list.
     */
    function sortListOfResponseGroups(list: IResponseGroup[]): IResponseGroup[]
    {
        let newList = [...list];

        newList.sort((a, b) =>
        {

            if (a.id < 0 && b.id >= 0) {
                return 1;
            } else if (b.id < 0 && a.id >= 0) {
                return -1;
            }
            if (a.command === b.command) {
                return a.id - b.id;
            } else {
                return a.originalCommand > b.originalCommand ? 1 : -1;
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

            <ResponseGroupList responseGroupList={responseGroupList}
                commandPrefix={server.commandPrefix || "!"}
                userCanEdit={server.userCanManage}
                callbackFunctions={
                    {
                        expandGroup: expandGroup,
                        expandAllGroups: expandAllGroups,
                        handleResponseUpdate: handleResponseUpdate,
                        handleResponseGroupUpdate: handleResponseGroupUpdate,
                        handleResponseGroupAccept: handleResponseGroupAccept
                    }
                }
            />


        </LoadingMessage >
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
