import * as React from 'react';
import { useState } from 'react';
import { ICommand } from '../backend/Commands';
import { Helpers } from '../helpers';
import '../css/Home.css';
import '../css/CommandRow.css';

interface CommandRowProps
{
    command: ICommand;
    index: number;
    handleUpdateCallback: Function;
    handleAcceptCallback: Function;
    handleCancelCallback: Function;
    handleDeleteCallback: Function;
    userCanEdit: boolean;
}
export const CommandRow: React.FunctionComponent<CommandRowProps> = ({ command, index, handleUpdateCallback, handleAcceptCallback, handleCancelCallback, handleDeleteCallback, userCanEdit }) =>
{
    const [hasBeenUpdated, setHasBeenUpdated] = useState(false);

    function handleChangeCommand(event: any)
    {
        let value = event.target.value;
        value = value.toLowerCase();
        if (command.commandString === value) {
            //We don't need to update because the user just changed the case of a value
            return;
        }
        handleUpdateCallback(index, value, undefined);
        setHasBeenUpdated(true);
    }


    function handleChangeValue(event: any)
    {
        let value = event.target.value as string;
        handleUpdateCallback(index, undefined, value);
        setHasBeenUpdated(true);
    }

    function handleSubmit(event: React.FormEvent)
    {
        event.preventDefault();
        handleAcceptCallback(index, handleSubmitCallback);
    }
    function handleSubmitCallback(success: boolean)
    {
        if (success) {
            setHasBeenUpdated(false);
        }
    }

    function handleCancel(event: any)
    {
        event.preventDefault();
        handleCancelCallback(index);
        setHasBeenUpdated(false);
    }
    function handleDelete(event: any)
    {
        event.preventDefault();
        handleDeleteCallback(index);
    }

    return (
        <div className="flexColumn">
            <form onSubmit={handleSubmit}>
                <div className="flexRow">
                    <span className="_commandPrefix">!</span>
                    <input type="text" className="_formInput _commandInput" value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />
                    <div className="_buttonDiv">
                        <input type="submit" value="Accept" className={"_formButton _acceptButton " + Helpers.nodispIf(!hasBeenUpdated)} disabled={!userCanEdit} />
                        <button onClick={handleCancel} className={"_formButton _cancelButton " + Helpers.nodispIf(!hasBeenUpdated)}>Cancel</button>
                        <button onClick={handleDelete} className={"_formButton _deleteButton " + Helpers.nodispIf((!userCanEdit) || (command.id < 0))}>Delete</button>
                    </div>
                </div>
                <div className="betweenDiv5" />
                <div className="flexRow valueDiv" >
                    <textarea className="_formInput _valueInput" value={command.entryValue} onChange={handleChangeValue} disabled={!userCanEdit} />
                </div>
                <div className="betweenDiv20" />
            </form>
        </div >
    );
}