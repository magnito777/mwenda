import express from "express";
import { google } from 'googleapis';
import dotenv from 'dotenv';
import ejs from 'ejs';

dotenv.config();

const app = express();
app.use(express.json()); // Parse JSON bodies

app.use(express.urlencoded({ extended: true })); // For URL-encoded form submissions
app.set('view engine', 'ejs');

// Set Google Sheets ID and sheet name from environment variables
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


// Use body-parser middleware to parse form data




















// Route to render form page
app.get('/form', (req, res) => {
  res.render('form'); // Render index.ejs form page
});


app.post('/submit', async (req, res) => {
  try {
    // Map request body fields to Google Sheets values array
    const values = [
      [
        req.body["patientnumber"], // Patient Number
        req.body["study-number"],   // Study Number
        req.body["xraynumber"],     // X-ray Number
        req.body["age"],            // Age
        req.body["sex"],            // Sex
        req.body["residence"],      // Area of Residence
        req.body["occupation"],     // Occupation
        req.body["education_level"],// Level of Education
        req.body["district"],       // District
        req.body["village"],        // Village
        req.body["road"],           // Road
        req.body["crash_date"],     // Crash Date
        req.body["crash_day"],      // Crash Day
        req.body["crash_time"],     // Crash Time
        req.body["referral"],       // Referral (Yes/No)
        req.body["referring_hospital"], // Referring Hospital
        req.body["evacuation_mode"], // Mode of Evacuation
        req.body["has_fracture"],    // Fracture (Yes/No)
        req.body["fracture_type"],   // Fracture Type (Single/Multiple)
        req.body["fracture_nature"], // Fracture Nature (Closed/Open)
        req.body["fractured_bone"],  // Fracture Site
        req.body["gustilo_classification"], // Fracture Classification
        req.body["head_injury_gcs"], // Head Injury GCS
        req.body["iss_score"],       // ISS Score
        req.body["diagnosis"],       // Diagnosis
      ],
    ];

    // Append data to Google Sheets
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:AJ1000`,
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.status(201).send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});



















// Get data
app.get('/', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:AJ1000`,
    });
    res.status(200).json(response.data.values);
  } catch (error) {
    console.error("Error accessing Google Sheets:", error);
    res.status(500).send("Error retrieving data from Google Sheets");
  }
});

// Post request to append data
app.post('/', async (req, res) => {
  try {
    const { values } = req.body;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:AJ1000`,
      range : `${sheetName}!A1:A1000`,
      valueInputOption: 'RAW',
      resource: { values },
    });
    res.status(201).send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});



// Put request to update data
app.put('/', async (req, res) => {
  try {
    const { values, row } = req.body;
    if (!values || !row) return res.status(400).send('Values and row number are required');

    const range = `${sheetName}!A${row}:AJ${row}`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });
    res.status(200).send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete request to clear data
app.delete('/', async (req, res) => {
  try {
    const { row } = req.body;
    if (!row) return res.status(400).send('Row number is required');

    const range = `${sheetName}!A${row}:AJ${row}`;
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
    res.status(200).send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Search request to find data
app.get('/search', async (req, res) => {
  const { column, value } = req.query;

  try {
    if (!column || !value) return res.status(400).send('Column and value are required');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:AJ1000`,
    });

    const rows = response.data.values;
    if (!rows) return res.status(404).send('No data found');

    const headers = rows[0];
    const columnIndex = headers.indexOf(column.charAt(0).toUpperCase() + column.slice(1).toLowerCase());

    if (columnIndex === -1) return res.status(400).send('Invalid column name');

    const filteredRows = rows.filter((row, index) => index !== 0 && row[columnIndex] === value);
    if (filteredRows.length === 0) return res.status(404).send('No matching rows found');

    res.status(200).json(filteredRows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Export app for Vercel
export default app;
