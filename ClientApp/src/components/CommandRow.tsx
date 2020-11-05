import * as React from 'react';
import { useState } from 'react';
import { Commands, ICommand } from '../backend/Commands';
import { ErrorLevels, Errors } from '../backend/Error';
import '../css/CommandRow.css';
import '../css/Home.css';
import '../css/Settings.css';
import { Helpers } from '../helpers';
import { ICommandRowFunctions } from './ServerSettings';

interface CommandRowProps
{
    command: ICommand;
    index: number;
    commandRowFunctions: ICommandRowFunctions;
    userCanEdit: boolean;
    restrictedCommands: string[];
    commandPrefix: string;
}
export const CommandRow: React.FunctionComponent<CommandRowProps> = ({ command, index, commandRowFunctions, userCanEdit, restrictedCommands, commandPrefix }) =>
{
    const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
    const [commandErrors, setCommandErrors] = useState<Errors>(new Errors());
    const [valueErrors, setValueErrors] = useState<Errors>(new Errors());
    const [disableAccept, setDisableAccept] = useState(false);

    React.useEffect(() =>
    {
        if (commandErrors.getHighestErrorLevel() > ErrorLevels.Warning || valueErrors.getHighestErrorLevel() > ErrorLevels.Warning) {
            setDisableAccept(true);
        }
        else {

            setDisableAccept(false);
        }
    }, [commandErrors, valueErrors])

    React.useEffect(() =>
    {
        if (!hasBeenUpdated) {
            setCommandErrors(new Errors());
            return;
        }
        setCommandErrors(Commands.checkCommandValidity(command.commandString, restrictedCommands));
    }, [command.commandString, restrictedCommands, hasBeenUpdated])
    React.useEffect(() =>
    {
        if (!hasBeenUpdated) {
            setValueErrors(new Errors());
            return;
        }
        setValueErrors(Commands.checkValueValidity(command.entryValue));
    }, [command.entryValue, hasBeenUpdated])

    /**
     * Handler for the command's changes
     * @param event the event that caused the change
     */
    function handleChangeCommand(event: any)
    {
        let value = event.target.value;
        value = value.toLowerCase();
        if (command.commandString === value) {
            //We don't need to update because the user just changed the case of a value
            return;
        }
        commandRowFunctions.updateCommand({ index: index, newCommandString: value });

        setHasBeenUpdated(true);
    }

    /**
     * Handler for the command's value
     * @param event the event that caused the change
     */
    function handleChangeValue(event: any)
    {
        let value = event.target.value as string;
        commandRowFunctions.updateCommand({ index: index, newEntryValue: value });
        setHasBeenUpdated(true);
    }

    /**
     * Handler for the mod only checkbox
     * @param event the event that caused the change
     */
    function handleChangeModOnly(event: any)
    {
        let checked = event.target.checked as boolean;
        commandRowFunctions.updateCommand({ index: index, newModOnly: checked ? 1 : 0 })
        setHasBeenUpdated(true)
    }

    /**
     * Handler for the form's submit. Lets the list know to save this command's changes
     * @param event need to prevent the default behavior
     */
    function handleSubmit(event: React.FormEvent)
    {
        event.preventDefault();
        commandRowFunctions.acceptCommand(index, handleSubmitCallback);
    }
    /**
     * Callback if the edit was successful. Resets hasBeenUpdated
     */
    function handleSubmitCallback()
    {
        setHasBeenUpdated(false);
    }

    /**
     * Handler for the cancel button. Tells the list to cancel changes to this command. Resets hasBeenUpdated
     * @param event the button's event.
     */
    function handleCancel(event: any)
    {
        event.preventDefault();
        commandRowFunctions.cancelCommand(index);
        setHasBeenUpdated(false);
    }

    /**
     * Handler for the delete button. Tells the list to delete this command.
     * @param event the button's event.
     */
    function handleDelete(event: any)
    {
        event.preventDefault();
        commandRowFunctions.deleteCommand(index);
    }

    return (
        <div className="flexColumn">
            <form onSubmit={handleSubmit}>
                <div className="flexRow _flexWrap">
                    <span className="_commandPrefix">{commandPrefix}</span>
                    {/*<ValidatedInput error={commandError} type="text" className={"_formInput _commandInput "} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />*/}

                    <input title={commandErrors.toErrorMessage() || undefined} type="text" className={"_formInput _commandInput " + commandErrors.getCssForError()} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />
                    <label className="_inputText _checkboxLabel">
                        {"Mods Only"}
                        <input type="checkbox" className={"_formInput _commandInput "} checked={command.modOnly === 1} onChange={handleChangeModOnly} disabled={!userCanEdit} />
                    </label>
                </div>
                <div className="betweenDiv5" />
                <div className="flexRow valueDiv" >
                    <textarea title={valueErrors.toErrorMessage() || undefined} className={"_formInput _valueInput " + valueErrors.getCssForError()} value={command.entryValue} onChange={handleChangeValue} disabled={!userCanEdit} />
                </div>
                <div className="betweenDiv5" />
                <div className="_buttonDiv">
                    <button onClick={handleDelete} className={"_formButton _deleteButton " + Helpers.nodispIf((!userCanEdit) || (command.id < 0))}>Delete</button>
                    <button onClick={handleCancel} className={"_formButton _cancelButton " + Helpers.nodispIf(!hasBeenUpdated)}>Revert</button>
                    <input type="submit" value="Accept" className={"_formButton _acceptButton " + Helpers.nodispIf(!hasBeenUpdated)} disabled={disableAccept} />
                </div>
                <div className="betweenDiv20" />

            </form>
        </div >
    );
}

////TODO: figure this out or delete it.
//export const ValidatedInput: React.FunctionComponent<{ error: IError | undefined } & InputProps> = ({ error, ...props }) =>
//{
//    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

//    React.useEffect(() =>
//    {
//        let m = "";
//        if (error && error.message.length > 0) {
//            for (let s of error.message) {
//                m = m + s + "\n";
//            }
//        }
//        setErrorMessage(m);

//    }, [error, error?.message])

//    return (
//        errorMessage ?
//            <input className={props?.className + " " + (errorMessage ? "_formError" : "")} title={errorMessage} {...() =>
//            {
//                let { className, ...rest } = props;
//                return rest;
//            }} />
//            :
//            <input {...props} />
//    )
//}