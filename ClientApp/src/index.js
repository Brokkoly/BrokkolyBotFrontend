import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import * as dotenv from 'dotenv';
import { CookiesProvider } from 'react-cookie';
const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');
dotenv.config();

ReactDOM.render(
    <CookiesProvider>

        <Router basename={baseUrl}>
            <App />
        </Router>
    </CookiesProvider>

    , rootElement);

registerServiceWorker();

