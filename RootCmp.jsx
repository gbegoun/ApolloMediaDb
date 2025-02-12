
const { useEffect } = React

import { LoggerProvider } from "./cmps/LoggerProvider.jsx";
import { LoggerDisplay } from "./cmps/LoggerDisplay.jsx";
import { MediaList } from "./cmps/MediaList.jsx"

import {readExcel, uploadToDb, GetFabricPrintInstructionList} from "./script.js"
import {getMediaBlanks} from "./service.js"

export function App() {

    const fileInput = document.querySelector(".fileInput");
    GetFabricPrintInstructionList()
    getMediaBlanks()

    
    useEffect(() => {
        localStorage.setItem("ServerURL","http://bd-simulator09:55559")
        localStorage.removeItem("Medias")
        localStorage.removeItem("FabricPrintInstructionList")
        
        

        const fileInput = document.querySelector(".fileInput");
        const uploadButton  = document.getElementById("insert-button")
        if (fileInput) {
            fileInput.addEventListener("change", readExcel);
            uploadButton.addEventListener("click", uploadToDb);
        }
        return () => {
            if (fileInput) fileInput.removeEventListener("change", readExcel);
            uploadButton.removeEventListener("click", uploadToDb)
        };
    }, []);

    return (
        <section className="main-layout">
            <h2>Excel To MediaDb</h2>
            <section className="file-dialog">
                <input type="file" className="fileInput"/>
            </section>

            <section className="buttons">
                <button id="insert-button">Add To Database</button>
            </section>
            
            <MediaList/>
            {/* <section className="log-container">
            </section> */}
            <LoggerProvider>
                <LoggerDisplay/>
            </LoggerProvider>
        </section>
    )
}
