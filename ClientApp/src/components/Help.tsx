import React, { Component } from "react";


export const HelpSection: React.FunctionComponent = () =>
{
    return (
        <div className="textColor _aboutSection">
            <h3>Commands</h3>
            <p>
                Commands are the bread and butter of BrokkolyBot. Simply type !commandName and the bot will respond with a random message you've associated with commandName. Head over to "My Servers" to check out the existing commands on your servers.
            </p>
            <h3>!Help</h3>
            <p>
                !help will get you a dm from the bot, letting you know all of the commands as well as all of the commands the server has available.
            </p>
            <h3>Extracting Emojis</h3>
            <p>
                !extractemoji will get the url to emojis later in your message. You can also pass a link to a discord message and the bot will extract the emojis in that message. Finally you can get the images for emojis when on mobile.
            </p>
            <h3>Cooldowns</h3>
            <p>
                Managers can set a cooldown for the server. The bot can only respond to messages once per cooldown period.
            </p>
            <h3>Managers and Manager-Only Commands</h3>
            <p>
                If you have the Manage Guild permission on discord, or you have the bot's manager role on your server, you can add commands to the bot on the server or on this website. Managers can also use the manager-only commands listed below:
            </p>
            <h3>!Add</h3>
            <p>
                !Add &ltcommandName&gt &ltMessage&gt will add a new response for commandName. If a command has multiple messages associated with it, !commandName will retrieve a random message from the group.
                Restrictions:
                <ul>
                    <li>The commandName must be longer than 3 characters and cannot be longer than 20 characters. It can only contain letters.</li>
                    <li>The commandName cannot be add, extractemoji, timeout, removetimeout or help</li>
                    <li>The message cannot be empty and cannot be longer than 500 characters.</li>
                    <li>The message cannot mention a user, a role, @everyone or @here.</li>
                    <li>The message cannot be the same as an existing message associated with commandName.</li>
                </ul>
            </p>
            <h3>!Timeout</h3>
            <p>
                !Timeout @User &ltimeInSeconds&gt will assign a role that prevents the user from sending messages in any channels for the provided time. After the time has elapsed, the bot will automatically remove the role. The bot will create a role for this purpose, using its nickname on the server (eg: "Brokkoly Bot's Timeout Role"). This role's name can be modified freely.
            </p>
            <h3>!RemoveTimeout</h3>
            <p>
                !RemoveTimeout @User will remove the timeout role from a user before their sentence is up.
            </p>
        </div>
    );
}