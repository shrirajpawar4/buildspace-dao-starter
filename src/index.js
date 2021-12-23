import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App.jsx";

//import thirdweb
import { ThirdwebWeb3Provider } from "@3rdweb/hooks";

//include what chains will support
const supportedChainIds = [4];

//include what type of wallet want to support
const connectors = {
  injected: {},
};

// Render the App component to the DOM
ReactDOM.render(
  <React.StrictMode>
  <ThirdwebWeb3Provider
  connectors={connectors}
  supportedChainIds={supportedChainIds}
  >
  <div className="landing">
    <App />
  </div>
  </ThirdwebWeb3Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
