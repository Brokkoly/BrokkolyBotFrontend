﻿import * as React from 'react';
import { useState } from 'react';
import { Commands, ICommand } from '../backend/Commands';

import { Helpers } from '../helpers';
import { ICommandRowFunctions, IExpandGroupArgs } from './ServerSettings';
import ModOnly from "../Images/modOnly.png";
import { IResponse, IResponseGroup, IResponseGroupList, IUpdateResponseActionProps, IUpdateResponseGroupProps, IUpdateResponseProps } from '../backend/ResponseGroup';

interface IResponseGroupFunctions
{
    expandGroup(groupId: number, expanded: boolean): void;
    expandAllGroups(expanded: boolean): void;
    handleResponseUpdate(args: IUpdateResponseProps): void;
    handleResponseGroupUpdate(args: IUpdateResponseGroupProps): void;
    handleResponseGroupAccept(groupId: number): void;
}


export const ResponseRow: React.FunctionComponent<{
    response: IResponse,
    inEditMode: boolean,
    handleChangeResponse(args: IUpdateResponseActionProps): void,
}>
    = ({ response, inEditMode, handleChangeResponse }) =>
    {
        function onResponseChange(e: any)
        {
            handleChangeResponse({ id: response.id, newResponse: e.target.value });
        }
        return (
            <div className="_flexRow _responseRow">
                {
                    inEditMode && !response.deleted ?
                        <textarea
                            title={response.errors.toErrorMessage() || undefined}
                            className={"_formInput _valueInput _responseText " + response.errors.getCssForError()}
                            value={response.response}
                            onChange={onResponseChange}
                        />
                        :
                        <span className={"_responseText " + Helpers.stringIf("_deletedText ", response.deleted)}>
                            {response.response}
                        </span>
                }
                <ResponseRowButtons handleChangeResponse={handleChangeResponse} inEditMode={inEditMode} response={response} />
            </div >)
    }



export const ResponseRowButtons: React.FunctionComponent<{
    inEditMode: boolean,
    response: IResponse,
    handleChangeResponse(args: IUpdateResponseActionProps): void,

}> = ({ inEditMode, response, handleChangeResponse }) =>
    {
        function handleChangeModOnly(e: any)
        {
            e.preventDefault();
            handleChangeResponse({ id: response.id, newModOnlyValue: response.modOnly === 0 ? 1 : 0 });
        }
        function handleDeleteClicked(e: any)
        {
            e.preventDefault();
            handleChangeResponse({ id: response.id, deleted: true });
        }
        function handleUnDeleteClicked(e: any)
        {
            e.preventDefault();
            handleChangeResponse({ id: response.id, deleted: false });
        }
        return (
            <div className="_flexRow _responseRowButtons">
                <button className={"_modOnlyButton " + Helpers.stringIf("_notModOnly ", !response.modOnly)} onClick={handleChangeModOnly} disabled={!inEditMode || response.deleted}>
                    <img className="_modOnlyIcon" src={ModOnly} title="Mod Only" alt="Mod Only" />
                </button>
                <button type="button"
                    className={"_formButton " + (response.deleted ? "_cancelButton " : "_deleteButton ")}
                    onClick={response.deleted ? handleUnDeleteClicked : handleDeleteClicked}>
                    {response.deleted ? "Undo" : "Delete"}
                </button>

            </div>
        );
    }


export const ResponseGroup: React.FunctionComponent<{
    responseGroup: IResponseGroup,
    callbackFunctions: IResponseGroupFunctions,
    commandPrefix: string
}> = ({ responseGroup, callbackFunctions, commandPrefix }) =>
    {

        function handleExpandClicked(e: any)
        {
            e.preventDefault();
            callbackFunctions.expandGroup(responseGroup.id, !responseGroup.expanded);
            callbackFunctions.handleResponseGroupUpdate({ id: responseGroup.id, newExpandStatus: !responseGroup.expanded });
        }
        function handleEditClicked(e: any)
        {
            e.stopPropagation();
            callbackFunctions.handleResponseGroupUpdate({
                id: responseGroup.id,
                newEditModeStatus: !responseGroup.inEditMode,
                newExpandStatus: responseGroup.inEditMode ? undefined : true
            });
        }
        function handleRevertClicked(e: any)
        {
            e.stopPropagation();
            callbackFunctions.handleResponseGroupUpdate({ id: responseGroup.id, revert: true });
        }
        function handleAcceptClicked(e: any)
        {
            e.stopPropagation();
            callbackFunctions.handleResponseGroupAccept(responseGroup.id);
        }
        function handleDeleteClicked(e: any)
        {
            e.stopPropagation();
            callbackFunctions.handleResponseGroupUpdate({
                id: responseGroup.id,

            })
        }
        function handleCommandAreaClicked(e: any)
        {
            e.stopPropagation();
        }
        function handleChangeCommand(e: any)
        {
            callbackFunctions.handleResponseGroupUpdate({
                id: responseGroup.id,
                newCommand: e.target.value.toLowerCase()
            });
        }
        function handleChangeResponse(args: IUpdateResponseActionProps)
        {
            if (!responseGroup.inEditMode) {
                callbackFunctions.handleResponseGroupUpdate({
                    id: responseGroup.id,
                    newEditModeStatus: true,
                    newExpandStatus: true,
                });
            }
            callbackFunctions.handleResponseUpdate({ ...args, groupId: responseGroup.id });
        }

        return (
            <form className="_maxWidth">
                <div className="_collapsible _commandPrefix" onClick={handleExpandClicked}>
                    <div>
                        {
                            (responseGroup.inEditMode ?

                                (<>

                                    <span className="_commandPrefix">{commandPrefix}</span>
                                    <input
                                        title={responseGroup.commandErrors.toErrorMessage() || undefined}
                                        type="text"
                                        className={"_formInput _commandInput " + responseGroup.commandErrors.getCssForError()}
                                        value={responseGroup.command}
                                        placeholder="Enter Command Here"
                                        onChange={handleChangeCommand}
                                        onClick={handleCommandAreaClicked}
                                    />
                                </>) : <span className={"_commandPrefix " + Helpers.stringIf("_deletedText ", responseGroup.deleted)}>{(commandPrefix + responseGroup.command)}</span>
                            )
                        }
                    </div>
                    <div>
                        <button type="button"
                            className="_formButton _deleteButton"
                            onClick={handleDeleteClicked}>
                            Delete
                    </button>
                        <button type="button"
                            className={"_formButton _cancelButton " + Helpers.nodispIf(!responseGroup.inEditMode)}
                            onClick={handleRevertClicked}
                        >
                            Revert
                    </button>
                        <button type="button"
                            className="_formButton _acceptButton"
                            onClick={responseGroup.inEditMode ? handleAcceptClicked : handleEditClicked}
                        >
                            {
                                responseGroup.inEditMode ? "Accept" : "Edit"
                            }
                        </button>
                    </div>
                </div>
                <div className={"_flexColumn " + Helpers.stringIf("_collapsed", !Boolean(responseGroup.expanded))}>
                    <ul className="_commandList">
                        {
                            responseGroup.responses.map((resp: IResponse, index) =>
                            {
                                return (
                                    <>
                                        {index !== 0 ? <div style={{ borderTop: "solid black 1px" }} /> : null}
                                        <ResponseRow key={resp.id} response={resp} inEditMode={responseGroup.inEditMode} handleChangeResponse={handleChangeResponse} />
                                        {

                                        }
                                    </>
                                )
                            })
                        }

                    </ul>
                </div>
            </form>
        );
    }

export const ResponseLine: React.FunctionComponent<{
    response: IResponse,
    callbackFunctions?: IResponseGroupFunctions,
    inEditMode: boolean
}> = ({ response, callbackFunctions, inEditMode }) =>
    {
        return (<>Resp
        </>);
    }


export const ResponseGroupListComponent: React.FunctionComponent<{
    responseGroupList: IResponseGroupList,
    callbackFunctions: IResponseGroupFunctions,
    commandPrefix: string,
    userCanEdit: boolean,
}> = ({ responseGroupList, callbackFunctions, commandPrefix }) =>
    {
        return (
            <ul className="_commandList">
                {responseGroupList.responseGroups.map(group => (
                    <ResponseGroup
                        key={group.originalCommand}
                        responseGroup={group}
                        commandPrefix={commandPrefix}
                        callbackFunctions={callbackFunctions}
                    />
                ))}
            </ul>
        );
    }