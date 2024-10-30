import express from "express";
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());  // Add this line to parse JSON bodies

// Set your Google Sheets spreadsheet ID and sheet name here
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GCP_TYPE,
    project_id: process.env.GCP_PROJECT_ID,
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle multiline private key
    client_email: process.env.GCP_CLIENT_EMAIL,
    client_id: process.env.GCP_CLIENT_ID,
    auth_uri: process.env.GCP_AUTH_URI,
    token_uri: process.env.GCP_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

app.get('/mwenda', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
    });
    res.status(200).json(response.data.values);
  } catch (error) {
    console.error("Error accessing Google Sheets:", error);
    res.status(500).send("Error retrieving data from Google Sheets");
  }
});




//post request
app.post('/mwenda', async (req, res) => {
    try {
        const { values } = req.body;
        const response = sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1:Z1000`,
            valueInputOption: 'RAW',
            resource: {
                values, // <-- Remove extra array wrapping here
            },
        });
        res.status(201).send(response.data);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });


    //update request
    app.put('/mwenda', async (req, res) => {
        try {
            const { values } = req.body;
            if (!values || values.length === 0) {
              return res.status(400).send('No values provided');
            }
            
            const range = `${sheetName}!A${row}:Z${row}`; // Dynamically use sheet name and row number
            const response = await sheets.spreadsheets.values.update({
              spreadsheetId,
              range,
              valueInputOption: 'RAW',
              resource: {
                values: [values],
              },
            });
            res.status(200).send(response.data);
          } catch (error) {
            res.status(500).send(error.message);
          }
        });

        
//delete row request
app.delete('/mwenda', async (req, res) => {
    try {
        const range = `${sheetName}!A${row}:Z${row}`; // Dynamically use sheet name and row number
        const response = await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range,
        });
        res.status(200).send(response.data);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });



    //search row or column request
    app.get('/mwenda', async (req, res) => {
        const { column, value } = req.query;

  try {
    if (!column || !value) {
      return res.status(400).send('Column and value parameters are required');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`, // Fetch the first 1000 rows (adjust as needed)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).send('No data found');
    }

    const headers = rows[0];
    const columnIndex = headers.indexOf(column.charAt(0).toUpperCase() + column.slice(1).toLowerCase()); // Case-insensitive match

    if (columnIndex === -1) {
      return res.status(400).send('Invalid column name');
    }

    const filteredRows = rows.filter((row, index) => index !== 0 && row[columnIndex] === value); // Skip header row

    if (filteredRows.length === 0) {
      return res.status(404).send('No matching rows found');
    }

    res.status(200).json(filteredRows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
