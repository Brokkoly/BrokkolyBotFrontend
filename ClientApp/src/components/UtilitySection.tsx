import * as React from 'react';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import '../css/Settings.css';
import '../css/Home.css';
import '../css/CommandRow.css';
class UtilitySection extends React.Component
{
    //static displayName = Home.name;

    public render()
    {
        //const { cookies } = this.props;
        if (typeof window !== undefined) {
            var baseUrl = window.location.protocol + '//' + window.location.host;
        }
        else {
            baseUrl = "https://localhost:44320"
        }
        const discordAuthLink = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=225369871393882113&scope=identify%20guilds&redirect_uri=${baseUrl}`;
        return (
            <div className="textColor _aboutSection flexColumn">
                <SpongebobTextConverter />
                <ToastContainer
                    position="bottom-right"
                    autoClose={5000}
                    hideProgressBar
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        );
    }
}

export const SpongebobTextConverter: React.FunctionComponent = () =>
{
    const [spongebobInput, setSpongebobInput] = useState("");
    const [spongebobResult, setSpongebobResult] = useState("");

    function handleInputChange(e: any)
    {
        setSpongebobInput(e.target.value);
    }
    function convertToSpongebob(input: string, lowerFirst: boolean)
    {
        let output = "";
        let upperOrLowerFirst = lowerFirst ? 0 : 1;
        for (let i = 0; i < input.length; i++) {
            if (!input[i].match("[a-zA-Z]")) {
                output += input[i];
                continue;
            }
            switch (i % 2) {

                case upperOrLowerFirst:
                    output += input[i].toLowerCase();
                    break;
                default:
                    output += input[i].toUpperCase();
            }
        }
        return output;
    }
    function handleConvertUpper(e: any)
    {
        e.preventDefault();
        setSpongebobResult(convertToSpongebob(spongebobInput, false));
    }
    function handleConvertLower(e: any)
    {
        e.preventDefault();
        setSpongebobResult(convertToSpongebob(spongebobInput, true));
    }

    return (
        <>
            sPoNgEbOb tExT CoNvErTeR
            <form>
                <div className="flexRow valueDiv">
                    <label className="_inputText flexRow" style={{ flexGrow: 1, alignItems: "center", height: "auto" }}>
                        <span style={{ marginRight: "4px" }}>{"Input: "}</span>
                        <textarea
                            value={spongebobInput} className={"_formInput _valueInput"}
                            onChange={handleInputChange}
                            style={{ minWidth: "400px" }} />
                    </label></div>
                <div className="_buttonDiv flexRow" style={{ width: "auto" }} >
                    <button
                        onClick={handleConvertLower}
                        value="cOnVeRt Lowercase First"
                        className={"_formButton _acceptButton "}
                        style={{ borderRadius: "10%"}}
                    >cOnVeRt lOwErCaSe fIrSt</button>
                    <button
                        onClick={handleConvertUpper}
                        value="cOnVeRt Uppercase First"
                        className={"_formButton _acceptButton "}
                        style={{ borderRadius: "10%" }}
                    >CoNvErT UpPeRcAsE FiRsT</button>
                </div>
                <div className="betweenDiv5"/>
                <div className="flexRow valueDiv">
                    <label className="_inputText flexRow" style={{ flexGrow: 1, alignItems: "center", height: "auto" }}>
                        <span style={{ marginRight: "4px" }}>{"oUtPuT: "}</span>
                        <textarea
                            disabled={true}
                            value={spongebobResult}
                            className={"_formInput _valueInput"}
                            style={{ minWidth: "400px" }} />
                    </label></div>
            </form>
        </>
    )
}


export default UtilitySection;