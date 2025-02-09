
import { MediaList } from "./cmps/MediaList.jsx"
const { useEffect } = React
import {readExcel, uploadToDb, GetFabricPrintInstructionList} from "./script.js"

export function App() {

    const fileInput = document.querySelector(".fileInput");
    
    useEffect(() => {
        localStorage.setItem("ServerURL","http://0.0.0.0:55559")
        localStorage.removeItem("Medias")
        localStorage.removeItem("FabricPrintInstructionList")

        GetFabricPrintInstructionList()

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
                <input type="file" className="fileInput" name="123"/>
            </section>

            <section className="buttons">
                <button id="insert-button">Add To Database</button>
            </section>
            
            <MediaList/>
            <section className="log-container">
            </section>
        </section>
    )
}
