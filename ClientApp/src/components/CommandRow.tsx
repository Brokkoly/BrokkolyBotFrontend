import * as React from 'react';
import { useState } from 'react';
import { InputProps } from 'reactstrap';
import { Commands, ICommand } from '../backend/Commands';
import { IError } from '../backend/Error';
import '../css/CommandRow.css';
import '../css/Home.css';
import { Helpers } from '../helpers';
import { toast } from "react-toastify";

interface CommandRowProps
{
    command: ICommand;
    index: number;
    handleUpdateCallback: Function;
    handleAcceptCallback: Function;
    handleCancelCallback: Function;
    handleDeleteCallback: Function;
    userCanEdit: boolean;
    restrictedCommands: string[];
}
export const CommandRow: React.FunctionComponent<CommandRowProps> = ({ command, index, handleUpdateCallback, handleAcceptCallback, handleCancelCallback, handleDeleteCallback, userCanEdit, restrictedCommands }) =>
{
    //TODO: maybe pass down the function to check validity
    const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
    const [commandError, setCommandError] = useState<IError | undefined>(undefined);
    const [valueError, setValueError] = useState<IError | undefined>(undefined);
    const [disableAccept, setDisableAccept] = useState(false);

    React.useEffect(() =>
    {
        if (commandError || valueError) {
            setDisableAccept(true);
        }
        else {

            setDisableAccept(false);
        }
    }, [commandError, valueError])

    React.useEffect(() =>
    {
        if (!hasBeenUpdated) {
            setCommandError(undefined);
            return;
        }
        setCommandError(Commands.checkCommandValidity(command.commandString, restrictedCommands));
    }, [command.commandString, restrictedCommands, hasBeenUpdated])
    React.useEffect(() =>
    {
        if (!hasBeenUpdated) {
            setValueError(undefined);
            return;
        }
        setValueError(Commands.checkValueValidity(command.entryValue));
    }, [command.entryValue, hasBeenUpdated])

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
        else {
            toast('An error ocurred. Please Try again.');

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
                <div className="flexRow _flexWrap">
                    <span className="_commandPrefix">!</span>
                    {/*<ValidatedInput error={commandError} type="text" className={"_formInput _commandInput "} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />*/}
                    <input title={Helpers.stringIf(String(commandError?.message.map(s => s + "\n")), Boolean(commandError))} type="text" className={"_formInput _commandInput " + Helpers.stringIf("_formError", Boolean(commandError))} value={command.commandString} onChange={handleChangeCommand} disabled={!userCanEdit} />
                </div>
                <div className="betweenDiv5" />
                <div className="flexRow valueDiv" >
                    <textarea title={Helpers.stringIf(String(valueError?.message.map(s => s + "\n")), Boolean(valueError))} className={"_formInput _valueInput " + Helpers.stringIf("_formError", Boolean(valueError))} value={command.entryValue} onChange={handleChangeValue} disabled={!userCanEdit} />
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

//TODO: figure this out or delete it.
export const ValidatedInput: React.FunctionComponent<{ error: IError | undefined } & InputProps> = ({ error, ...props }) =>
{
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

    React.useEffect(() =>
    {
        let m = "";
        if (error && error.message.length > 0) {
            for (let s of error.message) {
                m = m + s + "\n";
            }
        }
        setErrorMessage(m);

    }, [error, error?.message])

    return (
        errorMessage ?
            <input className={props?.className + " " + (errorMessage ? "_formError" : "")} title={errorMessage} {...() =>
            {
                let { className, ...rest } = props;
                return rest;
            }} />
            :
            <input {...props} />
    )
}