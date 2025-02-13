// import { Media } from "./media.js";
import { useLogger } from "./cmps/LoggerProvider.jsx"
import { Media } from "./Classes/Media.js"


export async function uploadToDb(){

    const medias = JSON.parse(localStorage.getItem("Medias"))
    for (const media of medias){
        await addMediaToDB(media)
    }
}



async function addMediaToDB(mediaData){
    try{
        const media = new Media();

        const elStatus = document.querySelector(`.id-${mediaData["#"]}`)
        elStatus.innerHTML = "●"
        elStatus.classList.add("inprogress")

        if (await media.create(mediaData)){
            if(await media.addToDB())
            {
                elStatus.classList.add("pass")
                return true
            }
        }

        elStatus.classList.add("fail")        
        return false
    }
    catch (err) {
        console.log(`Unknown error adding ${mediaData.name}`, err)
        const elStatus = document.querySelector(`.id-${mediaData["#"]}`)
        elStatus.classList.add("fail")
        return false
    }
}


function sendToLog(logId, text) {
    window.dispatchEvent(new CustomEvent("externalData", { detail: {logId:logId, text:text} }));
}



export function readExcel(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0]; // Read first sheet
        const sheet = workbook.Sheets[sheetName];

        // Get the full range of the sheet
        const range = XLSX.utils.decode_range(sheet["!ref"]);

        // Set starting row (F4 is row index 3) and column range (F to AE)
        const startRow = 2; // Zero-based index
        const startCol = XLSX.utils.decode_col("F");
        const endCol = XLSX.utils.decode_col("AE");
        const endRow = range.e.r; // Get last row dynamically

        // Extract headers (first row in range)
        const headers = [];
        for (let col = startCol; col <= endCol; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: startRow, c: col });
            const headerValue = sheet[cellAddress] ? sheet[cellAddress].v.toString().toLowerCase() : `column${col}`;
            headers.push(headerValue);
        }

        // Extract data rows and convert to JSON
        const jsonData = [];
        for (let row = startRow + 1; row <= endRow; row++) {
            let rowData = {};
            for (let col = startCol; col <= endCol; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                rowData[headers[col - startCol]] = sheet[cellAddress] ? sheet[cellAddress].v : null;
            }
            jsonData.push(rowData);
        }

        // Display JSON data
        const filtered = jsonData.filter((item)=>item["media name"]!==null)
        localStorage.setItem("Medias", JSON.stringify(filtered));
        writeTable();
    };

    reader.readAsArrayBuffer(file);
}

function writeTable() {
    const jsonData = JSON.parse(localStorage.getItem("Medias"));

    let table = document.getElementById("excelTable");
    jsonData.map(row => {
        let tr = document.createElement("tr");
        tr.setAttribute("class", "table-row");
        
        let td = document.createElement("td");
        td.className = "media-row"; 
        td.textContent = row["#"];
        tr.appendChild(td);

        td = document.createElement("td");
        td.className = "media-name";

        const link = document.createElement("a");
        link.href = "javascript:void(0);"; // Prevent default anchor behavior
        link.textContent = row["media name"];
        link.addEventListener("click", () => {
            const targetDiv = document.getElementById("id" + row["#"]);
            if (targetDiv) {
                targetDiv.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        td.appendChild(link);
        tr.appendChild(td);

        td = document.createElement("td");
        td.className = `id-${row['#']}`;
        tr.appendChild(td);

        table.appendChild(tr);
    });
}

export async function GetFabricPrintInstructionList() {
    console.log("Getting Fabric Print Instructions");

    try {
        const response = await fetch(localStorage.getItem("ServerURL") + "/api/v1/FabricPrintInstruction/GetFabricPrintInstructionList", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ criteria: {} })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Store "items" in localStorage
        if (data.items) {
            console.log("Fabric Print Instructinos Loaded To Local")
            localStorage.setItem("FabricPrintInstructionList", JSON.stringify(data.items));
        } else {
            console.warn("No 'items' key found in response.");
        }

        return data.items; // Return the parsed data if needed

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

