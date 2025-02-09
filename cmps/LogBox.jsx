import {useLogger} from "./LoggerProvider.jsx"
const { createContext, useContext, useState,useEffect } = React

export function LogBox({ logId }) {
    const { logs, addLogLine } = useLogger();
    const logLines = logs[logId] || [];
    const [isOpen,setIsOpen] = useState(true)
    
    useEffect (()=> {
        
    },[isOpen])

    function toggleLog(element) {
        console.log("123")
        setIsOpen(!isOpen)
    }

    return (
        <div className = {`log-box ${isOpen ? "open" : ""} `} >
            <div className = "log-title" onClick={toggleLog}>{logId}</div>
                {logLines.map((line, index) => (
                    <div className = "log-detail" key={index}>{line.message}</div>
                ))}
        </div>
    );
}
