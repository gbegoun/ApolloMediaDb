
const { useEffect, useState } = React

import { LoggerProvider } from "./cmps/LoggerProvider.jsx";
import { LoggerDisplay } from "./cmps/LoggerDisplay.jsx";
import { MediaList } from "./cmps/MediaList.jsx"

import {readExcel, uploadToDb, GetAllFabricPrintInstructions } from "./script.js"
import {getMediaBlanks} from "./service.js"

export function App() {
    const server_address = "http://bd-simulator09"

    const fileInput = document.querySelector(".fileInput");
    GetAllFabricPrintInstructions()
    getMediaBlanks()
    checkServerStatus()

    useEffect(() => {
        localStorage.setItem("ServerURL",server_address + ":55559")
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

    async function checkServerStatus() {
        try {
            const response = await fetch(server_address, { method: "HEAD", mode: "no-cors" });
            console.log(`Connected To ${server_address}`)
        } catch (error) {
            console.log(`No Connection to ${checkServerStatus}`)
        }
    }

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
            <LoggerProvider>
                <LoggerDisplay/>
            </LoggerProvider>
        </section>
    )
}