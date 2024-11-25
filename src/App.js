import React, { useState } from "react";
import Navbar from "./components/Navbar";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "./App.css"; // Importing the CSS file

const App = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(""); //  display
  const [isProcessing, setIsProcessing] = useState(false); //  spinner

  // Updated thresholds 
  const thresholds = {
    HMV: 14 * 60,
    LODER: 12 * 60,
    PC: 18 * 60,
    "HYDRA BOBCAT JCB": 12 * 60,
    LMV: 8 * 60, 
  };

  // File upload handler
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
      setFile(selectedFile);
      setFileName(selectedFile.name); // Update file name
    } else {
      alert("Please upload a valid Excel file (.xlsx)");
      event.target.value = ""; // Reset the input
    }
  };

  // File processing logic
  const processFile = async () => {
    if (!file) {
      alert("Please upload a file first!");
      return;
    }

    setIsProcessing(true); // Start spinner
    const workbook = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const fileBuffer = event.target.result;
        await workbook.xlsx.load(fileBuffer);

        const [worksheet1] = workbook.worksheets;
        const resultWorkbook = new ExcelJS.Workbook();

        const vehicleTypesSet = new Set();
        const allRows = [];

        worksheet1.eachRow((row, rowIndex) => {
          if (rowIndex === 1) return; // Skip header row

          const date = row.getCell(1).value;
          const vehicleDisplayNumber = row.getCell(3).value;
          const vehicleType = row.getCell(4).value;
          const totalEngineTime = row.getCell(17).value;
          const totalEngineTimeMin = row.getCell(18).value;

          const normalizedVehicleType = vehicleType?.trim().toUpperCase();
          const engineTimeInMinutes = totalEngineTimeMin;

          let utilized = 0;
          if (normalizedVehicleType === "LODER" && engineTimeInMinutes > thresholds.LODER) {
            utilized = 1;
          } else if (
            normalizedVehicleType !== "LODER" &&
            normalizedVehicleType in thresholds &&
            engineTimeInMinutes > thresholds[normalizedVehicleType]
          ) {
            utilized = 1;
          }

          const unutilized = utilized === 1 ? 0 : 1;

          allRows.push({
            date,
            vehicleDisplayNumber,
            vehicleType,
            totalEngineTime,
            totalEngineTimeMin,
            utilized,
            unutilized,
          });

          if (normalizedVehicleType) {
            vehicleTypesSet.add(normalizedVehicleType);
          }
        });

        vehicleTypesSet.forEach((type) => {
          const sheet = resultWorkbook.addWorksheet(type);

          // Dynamic threshold hours for headers
          const thresholdHours = thresholds[type] / 60;
          const utilizedHeader = `Utilized >${thresholdHours}Hr`;

          const headers = [
            "Date",
            "SL NO",
            "Vehicle Display Number",
            "Vehicle Type",
            "Total Engine Time",
            "Total Engine Time (min)",
            utilizedHeader, // Dynamic header
            "Unutilized",
            "% Utilized",
            "% Unutilized",
          ];

          const headerRow = sheet.addRow(headers);
          headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 13 };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF00" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          });

          sheet.getRow(1).height = 30;

          let utilizedSum = 0;
          let unutilizedSum = 0;
          let slNo = 1;

          allRows
            .filter((row) => row.vehicleType?.trim().toUpperCase() === type)
            .forEach((filteredRow) => {
              sheet.addRow([
                filteredRow.date,
                slNo++,
                filteredRow.vehicleDisplayNumber,
                filteredRow.vehicleType,
                filteredRow.totalEngineTime,
                filteredRow.totalEngineTimeMin,
                filteredRow.utilized,
                filteredRow.unutilized,
                "",
                "",
              ]);
              utilizedSum += filteredRow.utilized;
              unutilizedSum += filteredRow.unutilized;
            });

          const totalRows = sheet.rowCount - 1;
          const utilizedPercentage = ((utilizedSum / totalRows) * 100).toFixed(2);
          const unutilizedPercentage = ((unutilizedSum / totalRows) * 100).toFixed(2);

          sheet.mergeCells(3, 9, totalRows + 1, 9);
          sheet.mergeCells(3, 10, totalRows + 1, 10);

          const firstDataRow = sheet.getRow(3);
          firstDataRow.getCell(9).value = `${utilizedPercentage}%`;
          firstDataRow.getCell(10).value = `${unutilizedPercentage}%`;

          firstDataRow.getCell(9).alignment = { vertical: "middle", horizontal: "center" };
          firstDataRow.getCell(10).alignment = { vertical: "middle", horizontal: "center" };

          const sumRow = sheet.addRow(["", "", "", "SUM", "", "", utilizedSum, unutilizedSum, "", ""]);
          sumRow.getCell(7).font = { bold: true };
          sumRow.getCell(8).font = { bold: true };
        });

        const resultBuffer = await resultWorkbook.xlsx.writeBuffer();
        saveAs(new Blob([resultBuffer]), "segregated_report_with_utilization_summary.xlsx");
      } catch (error) {
        alert("Error processing file!");
        console.error(error);
      } finally {
        setIsProcessing(false); // Stop spinner
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 className="header">Vehicle Utilization Report Tool</h1>
        <div className="fileButtonWrapper">
          <div className="fileInputWrapper">
            <label htmlFor="fileInput" className="fileInputLabel">
              Upload File
            </label>
            <input type="file" id="fileInput" onChange={handleFileUpload} />
          </div>
          <button onClick={processFile} className="button" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Process File"}
          </button>
        </div>
        {fileName && <div className="fileNameDisplay">Selected File: {fileName}</div>}
        {isProcessing && (
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>Processing your file, please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
