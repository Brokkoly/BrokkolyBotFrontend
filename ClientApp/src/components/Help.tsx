import React, { Component } from "react";


export const HelpSection: React.FunctionComponent = () =>
{
    return (
        <div className="textColor _aboutSection">
            <h3>Commands</h3>
            <p className="_textIndent">
                Commands are the bread and butter of BrokkolyBot. Simply type !commandName and the bot will respond with a random message you've associated with commandName. Head over to "My Servers" to check out the existing commands on your servers. If a command has multiple messages associated with it, !commandName will retrieve a random message from the group.
            </p>
            <h3>!Help</h3>
            <p className="_textIndent">
                !help will get you a dm from the bot, letting you know all of the commands as well as all of the commands the server has available.
            </p>
            <h3>!ExtractEmoji</h3>
            <p className="_textIndent">
                !extractemoji will get the url to emojis in your message. You can also pass a link to a discord message and the bot will extract the emojis in that message. Finally you can get the images for emojis when on mobile.
            </p>
            <h3>Cooldowns</h3>
            <p className="_textIndent">
                Managers can set a cooldown for the server. The bot can only respond to messages once per cooldown period.
            </p>
            <h3>Managers and Manager-Only Commands</h3>
            <p className="_textIndent">
                If you have the Manage Guild permission on discord, or you have the bot's manager role on your server, you can add commands to the bot on the server or on this website. Managers can also use the manager-only commands listed below:
            </p>
            <h3>!twitchadd (Coming Soon)</h3>
            <p className="_textIndent">
                Soon BrokkolyBot will be able to notify you when somebody goes live on twitch. You will be able to subscribe to streams, and you can even specify users in the server to associate with a stream. Then you can elevate them to a visible role indicating that they are live now!
            </p>
            <h3>!Add</h3>
            <p className="_textIndent">
                !Add &lt;commandName&gt; &lt;Message&gt; will add a new response for commandName.
                <br />
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
            <p className="_textIndent">
                !Timeout @User &lt;timeInSeconds&gt; will assign a role that prevents the user from sending messages in any channels for the provided time. After the time has elapsed, the bot will automatically remove the role. The bot will create a role for this purpose, using its nickname on the server (eg: "BrokkolyBot's Timeout Role"). This role's name can be modified freely.
            </p>
            <h3>!RemoveTimeout</h3>
            <p className="_textIndent">
                !RemoveTimeout @User will remove the timeout role from a user before their sentence is up.
            </p>
        </div>
    );
}