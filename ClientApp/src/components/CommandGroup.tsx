import * as React from 'react';
import { useState } from 'react';
import { Commands, ICommand, IResponse, IResponseGroup } from '../backend/Commands';
import { Helpers } from '../helpers';
import { ICommandRowFunctions, IExpandGroupArgs } from './ServerSettings';
import ModOnly from "../Images/modOnly.png";

export interface ICommandGroup
{
    command: string;
    commands: ICommand[];
    expanded: boolean;
}

interface ICommandGroupProps
{
    commandGroup: ICommandGroup;
    prefix: string;
    commandGroupFunctions: ICommandGroupFunctions;
}

interface ICommandGroupFunctions
{
    expandGroup(args: IExpandGroupArgs): void;

}

interface IResponseGroupFunctions extends ICommandGroupFunctions
{

}



export const CommandGroup: React.FunctionComponent<ICommandGroupProps> = ({ commandGroup, prefix, commandGroupFunctions }) =>
{
    const [inEditMode, setInEditMode] = useState(false);

    function handleExpandClicked(e: any)
    {
        e.preventDefault();
        commandGroupFunctions?.expandGroup({ expanded: !(commandGroup.expanded || false), command: commandGroup.command });
    }

    return (
        <>
            <button type="button" className="_collapsible _commandPrefix" onClick={handleExpandClicked}>{prefix + commandGroup.command} </button>
            <div className={"_flexColumn " + Helpers.stringIf("_collapsed", !Boolean(commandGroup.expanded))}>
                <ul className="_commandList">
                    {commandGroup.commands.map((cmd: ICommand, index) =>
                    {
                        return (
                            <>
                                {index !== 0 ? <div style={{ borderTop: "solid black 1px" }} /> : null}
                                <ResponseRow key={cmd.id} command={cmd} inEditMode={inEditMode} commandGroupFunctions={commandGroupFunctions} />
                            </>
                        )
                    }
                    )}
                </ul>
            </div>
        </>
    );
};


export const ResponseRow: React.FunctionComponent<{
    command: ICommand, inEditMode: boolean, commandGroupFunctions: ICommandGroupFunctions
}> = ({ command, inEditMode, commandGroupFunctions }) =>
    {
        return (
            <div className="_flexRow _responseRow">
                <ResponseRowButtons commandGroupFunctions={commandGroupFunctions} inEditMode={inEditMode} command={command} />
                <span className="_inputText">
                    {command.entryValue}
                </span>
                {/*Edit mode goes here*/}
            </div >)
    }



export const ResponseRowButtons: React.FunctionComponent<{
    commandGroupFunctions: ICommandGroupFunctions, inEditMode: boolean, command: ICommand
}> = ({ commandGroupFunctions, inEditMode, command }) =>
    {
        return (
            <>
                <button className={"_modOnlyButton " + Helpers.stringIf("_notModOnly ", !command.modOnly)}><img className="_modOnlyIcon" src={ModOnly} alt="Mod Only" />
                </button>

            </>
        );
    }


export const CommandGroupList: React.FunctionComponent<{ commandMap: Map<string, ICommandGroup>, commandPrefix: string, commandGroupFunctions: ICommandGroupFunctions }> = ({ commandMap, commandPrefix, commandGroupFunctions }) =>
{
    function handleExpandAll(e: any)
    {
        e.preventDefault();
        commandGroupFunctions.expandGroup({
            expanded: true, commands: Array.from(commandMap.keys())
        });
    }

    function getListItems()
    {
        var keys: string[] = Array.from(commandMap.keys());
        return keys.map(command =>
        {
            var commandGroup = commandMap.get(command);
            if (commandGroup) {
                return <CommandGroup key={command} commandGroup={commandGroup} prefix={commandPrefix} commandGroupFunctions={commandGroupFunctions} />
            }
            return null
        });
    }
    return (
        <div>
            <button className={""} onClick={handleExpandAll}>Expand All</button>
            <ul className="_commandList">
                {getListItems()}

            </ul>
        </div>
    );
};


//export const CommandListGrouped: React.FunctionComponent<{ commandList: ICommand[] }> = ({ commandList }) =>
//{
//    const [commandMap, setCommandMap] = useState<Map<string, ICommand[]>>(new Map<string, ICommand[]>());

//}

export const ResponseGroup: React.FunctionComponent<{
    responseGroup: IResponseGroup,
    callbackFunctions?: IResponseGroupFunctions,
    commandPrefix: string
}> = ({ responseGroup, callbackFunctions, commandPrefix }) =>
    {
        return (<></>);
    }


export const ResponseGroupList: React.FunctionComponent<{
    responseGroupList: IResponseGroup[],
    callbackFunctions?: IResponseGroupFunctions,
    commandPrefix: string
}> = ({ responseGroupList, callbackFunctions, commandPrefix }) =>
    {
        return (
            <ul>
                {responseGroupList.map(group =>
                {
                    <ResponseGroup key={group.originalCommand} responseGroup={group} commandPrefix={commandPrefix} callbackFunctions={callbackFunctions} />
                })
                }
            </ul>
        );
    }