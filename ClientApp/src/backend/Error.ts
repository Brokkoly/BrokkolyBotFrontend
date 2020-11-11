export interface IError
{
    message: string;
    errorLevel: number;
    getMessageWithLevel(): string;
}


export enum ErrorLevels
{
    None = 0,
    Warning = 1,
    Critical = 2,
}

export class Error implements IError
{
    message: string;
    errorLevel: number;

    constructor(message: string, level?: number)
    {
        this.message = message || "An error has occurred";
        this.errorLevel = level || ErrorLevels.Critical;
    }

    getMessageWithLevel(): string
    {
        let retval = "";
        switch (this.errorLevel) {
            case ErrorLevels.Warning:
                retval += "Warning: ";
                break;
            case ErrorLevels.Critical:
                retval += "Critical: ";
                break;
            default:
                retval += "Error: ";
        }
        return retval + this.message;
    }
}



export class Errors
{
    errors: IError[] = [];
    constructor(input?: IError | IError[])
    {
        if (input) {
            if (input.constructor === Array) {
                this.errors = input;
            }
            else {
                this.errors.push(input as IError);
            }
        }
    }

    getHighestErrorLevel(): number
    {
        let highest = 0;
        for (let e of this.errors) {
            highest = highest < e.errorLevel ? e.errorLevel : highest;
        }
        return highest;
    }

    toErrorMessage(): string
    {
        let message = "";
        for (let i = 0; i < this.errors.length; i++) {
            message += `${i === 0 ? "" : "\n"}${this.errors[i].getMessageWithLevel()}`;
        }
        return message;
    }
    getCssForError(): string
    {
        switch (this.getHighestErrorLevel()) {
            case (ErrorLevels.Critical):
                return "_formCritical ";
            case (ErrorLevels.Warning):
                return "_formWarning ";
            default:
                return " ";
        }
    }
}


export class TimeoutValidationError extends Error implements IError { }
export class CommandValidationError extends Error implements IError { }
export class ValueValidationError extends Error implements IError { }
export class PrefixValidationError extends Error implements IError { }


