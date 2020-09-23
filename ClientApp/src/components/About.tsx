import React, { Component } from "react";
import "../css/Home.css";

export const AboutSection: React.FunctionComponent = () =>
{
    return (
        <div className="textColor _aboutSection">
            <h3>About The Bot</h3>

            <p>
                Brokkoly Bot is a Discord bot made to make life slightly easier on your server. At its core it is a quote bot made for retrieval of random hot takes or memorable quotes from the server's past. Instead of finding a link that people ask for on a daily basis, just use !command and the bot will send the preset response with the link.
            </p>
            <p>
                The bot is built in Python with a PostgreSQL backend. The hosting and automatic deployment is done on Heroku. Check out the bot's code <a href="https://github.com/Brokkoly/BrokkolyBot">here.</a>
            </p>
            <h3>About This Website</h3>
            <p>
                This website came along because I needed a good way for users to see what commands the bot has for their server, and having users edit settings through a text interface is not a good experience.
            </p>
            <p>
                This website's client is built using Typescript and React. The web server is built using Asp.Net Core, which provides the apis used by the client in addition to connecting to the same PostgreSQL database used by the bot. The website is hosted on Azure. Check out the website's code <a href="https://github.com/Brokkoly/BrokkolyBotFrontend">here.</a>
            </p>
            <h3>Other Information</h3>
            <p>
                Having trouble with the bot or this website? Leave an issue on the appropriate github repository, or send me an email <a href="mailto:brokkolybot@gmail.com">here.</a>
            </p>


        </div>

    );
}