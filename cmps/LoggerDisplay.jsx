import {LogBox} from "./LogBox.jsx"
import { useLogger } from "./LoggerProvider.jsx";
const { createContext, useContext, useState,useEffect } = React


export function LoggerDisplay() {

    const { logs } = useLogger();

    const addLogBox = (logId) => 
    {
        setLogIds = setLogIds([...logIds,logId])
    }

    return (
        <div className="log-container">
            {Object.keys(logs).map((logId) => (
                <LogBox key={logId} logId={logId} />
            ))}
        </div>
    );
}