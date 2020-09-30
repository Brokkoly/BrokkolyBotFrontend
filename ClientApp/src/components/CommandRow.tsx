import * as React from 'react';
import { useState } from 'react';
import { toast } from "react-toastify";
import { Commands, ICommand } from '../backend/Commands';
import { ErrorLevels, Errors } from '../backend/Error';
import '../css/CommandRow.css';
import '../css/Home.css';
import { ICommandRowFunctions } from './ServerSettings';
import { Helpers } from '../helpers';

interface CommandRowProps
{
    command: ICommand;
    index: number;
    commandRowFunctions: ICommandRowFunctions;
    userCanEdit: boolean;
    restrictedCommands: string[];
}
export const CommandRow: React.FunctionComponent<CommandRowProps> = ({ command, index, commandRowFunctions, userCanEdit, restrictedCommands }) =>
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


    function handleChangeValue(event: any)
    {
        let value = event.target.value as string;
        commandRowFunctions.updateCommand({ index: index, newEntryValue: value });
        setHasBeenUpdated(true);
    }

    function handleSubmit(event: React.FormEvent)
    {
        event.preventDefault();
        commandRowFunctions.acceptCommand(index, handleSubmitCallback);
    }
    function handleSubmitCallback(success: boolean)
    {
        if (success) {
            setHasBeenUpdated(false);
        }
        else {
            toast('An error ocurred while saving the command. Please Try again.');

        }
    }

    function handleCancel(event: any)
    {
        event.preventDefault();
        commandRowFunctions.cancelCommand(index);
        setHasBeenUpdated(false);
    }
    function handleDelete(event: any)
    {
        event.preventDefault();
        commandRowFunctions.cancelCommand(index);
    }

    return (
        <div className="flexColumn">
            <form onSubmit={handleSubmit}>
                <div className="flexRow _flexWrap">
                    <span className="_commandPrefix">!</span>
                    {/*<ValidatedInput error={commandError} type="text" className={"_formInput _commandInput "} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />*/}
                    <input title={commandErrors.toErrorMessage() || undefined} type="text" className={"_formInput _commandInput " + commandErrors.getCssForError()} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />
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