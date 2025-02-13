import {useLogger} from "./LoggerProvider.jsx"
const { createContext, useContext, useState,useEffect } = React

export function LogBox({ logId }) {
    const { logs, addLogLine } = useLogger();
    const logLines = logs[logId] || [];
    const [isOpen,setIsOpen] = useState(true)
    
    useEffect (()=> {
        
    },[isOpen])

    function toggleLog(element) {
        setIsOpen(!isOpen)
    }

    return (
        <div className = {`log-box ${isOpen ? "open" : ""} `} >
            <div className = "log-title" onClick={toggleLog}>{logId}</div>
                {logLines.map((line, index) => (              
                    <div className = {`log-detail line ${line.level}`} key={index}>{line.message}</div>
                ))}
        </div>
    );
}
