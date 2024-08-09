const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');
const PDFDocument = require('pdfkit');

let db;

function createDbConnection() {
    return new Promise((resolve, reject) => {
        console.log('Creating database connection...');
        // Use a shared network folder path
        const sharedFolderPath = '\\ism\hr\IT\portalHR\database';
        const dbPath = path.join(sharedFolderPath, 'hr_portal.db');

        // Ensure the shared folder exists
        if (!fs.existsSync(sharedFolderPath)) {
            fs.mkdirSync(sharedFolderPath, { recursive: true });
        }

        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
            } else {
                console.log('Connected to the HR portal database.');
                db.run("PRAGMA encoding = 'UTF-8'", (pragmaErr) => {
                    if (pragmaErr) {
                        console.error('Error setting UTF-8 encoding', pragmaErr);
                        reject(pragmaErr);
                    } else {
                        createTables()
                            .then(() => resolve(db))
                            .catch(reject);
                    }
                });
            }
        });
    });
}

function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT
            )`);
            // Create SAP table
            db.run(`CREATE TABLE IF NOT EXISTS sap_employees (
                sap_employee_id INTEGER PRIMARY KEY,
                sap_name TEXT,
                sap_title TEXT,
                sap_gender TEXT,
                sap_birth_date DATE,
                sap_citizenship TEXT,
                sap_personal_id TEXT,
                sap_relationship_status TEXT,
                sap_status TEXT,
                sap_company TEXT,
                sap_hospital TEXT,
                sap_employee_group TEXT,
                sap_employee_subgroup TEXT,
                sap_department TEXT,
                sap_role TEXT,
                sap_job_title TEXT,
                sap_address TEXT,
                sap_city TEXT,
                sap_level INTEGER,
                sap_email TEXT,
                sap_phone TEXT,
                sap_employment_start DATE,
                sap_manager_name TEXT,
                sap_job_percentage REAL
            )`);

            // Create Hilan table
            db.run(`CREATE TABLE IF NOT EXISTS hilan_employees (
                hilan_employee_id INTEGER PRIMARY KEY,
                hilan_last_name TEXT,
                hilan_first_name TEXT,
                hilan_personal_id TEXT,
                hilan_birth_date DATE,
                hilan_city TEXT,
                hilan_address TEXT,
                hilan_email TEXT,
                hilan_citizenship TEXT,
                hilan_relationship_status TEXT,
                hilan_gender TEXT,
                hilan_phone TEXT,
                hilan_status TEXT,
                hilan_hospital TEXT,
                hilan_department TEXT,
                hilan_title TEXT,
                hilan_job_title TEXT,
                hilan_company TEXT,
                hilan_manager_name TEXT,
                hilan_level TEXT,
                hilan_job_percentage REAL,
                hilan_employment_start DATE,
                hilan_group TEXT,
                hilan_role TEXT
            )`);

            // Create Hilan Attendance table
            db.run(`CREATE TABLE IF NOT EXISTS hilan_attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hilan_employee_id INTEGER,
                date TEXT,
                start_time TEXT,
                end_time TEXT,
                attendance_type TEXT,
                FOREIGN KEY (hilan_employee_id) REFERENCES hilan_employees(hilan_employee_id)
            )`, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('Tables created successfully');
                    resolve();
                }
            });

            // Updated Hilan Interface table
            db.run(`CREATE TABLE IF NOT EXISTS hilan_interface (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                EventID INTEGER,
                Status TEXT,
                Date TEXT,
                EmployeeID INTEGER,
                SendCode INTEGER,
                SubEvent INTEGER,
                EventName TEXT,
                LastName TEXT,
                FirstName TEXT,
                CorrectedValue TEXT,
                Error TEXT,
                Note TEXT,
                UNIQUE(EventID, Status, Date, EmployeeID)
            )`, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('Tables created successfully');
                    resolve();
                }
            });

            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('Error enabling foreign key support:', err);
                    reject(err);
                } else {
                    console.log('Foreign key support enabled');
                }
            });
        });
    });
}

async function searchSAPEmployees(query, page = 1, pageSize = 10, sortField = 'sap_name', sortOrder = 'ASC') {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * pageSize;
        const sql = `
            SELECT * FROM sap_employees 
            WHERE sap_name LIKE ? OR sap_employee_id LIKE ? 
            ORDER BY ${sortField} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        const countSql = `
            SELECT COUNT(*) as total 
            FROM sap_employees 
            WHERE sap_name LIKE ? OR sap_employee_id LIKE ?
        `;
        const params = [`%${query}%`, `%${query}%`];

        db.get(countSql, params, (err, countRow) => {
            if (err) {
                reject(err);
                return;
            }

            db.all(sql, [...params, pageSize, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        employees: rows,
                        total: countRow.total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(countRow.total / pageSize)
                    });
                }
            });
        });
    });
}

async function searchHilanEmployees(query, page = 1, pageSize = 10, sortField = 'hilan_last_name', sortOrder = 'ASC') {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * pageSize;
        const sql = `
            SELECT * FROM hilan_employees 
            WHERE hilan_last_name LIKE ? OR hilan_first_name LIKE ? OR hilan_employee_id LIKE ? 
            ORDER BY ${sortField} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        const countSql = `
            SELECT COUNT(*) as total 
            FROM hilan_employees 
            WHERE hilan_last_name LIKE ? OR hilan_first_name LIKE ? OR hilan_employee_id LIKE ?
        `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        db.get(countSql, params, (err, countRow) => {
            if (err) {
                reject(err);
                return;
            }

            db.all(sql, [...params, pageSize, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        employees: rows,
                        total: countRow.total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(countRow.total / pageSize)
                    });
                }
            });
        });
    });
}

async function getEmployeeDetails(system, employeeId) {
    return new Promise((resolve, reject) => {
        const tableName = system === 'sap' ? 'sap_employees' : 'hilan_employees';
        const idField = system === 'sap' ? 'sap_employee_id' : 'hilan_employee_id';
        
        const sql = `SELECT * FROM ${tableName} WHERE ${idField} = ?`;
        
        db.get(sql, [employeeId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

async function getHilanAttendance(employeeId, startDate, endDate) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching attendance for employee ${employeeId} from ${startDate} to ${endDate}`);
        
        // Convert start and end dates to the format in the database (milliseconds)
        const dbStartDate = new Date(startDate).getTime();
        const dbEndDate = new Date(endDate).getTime();
        
        const sql = `
            SELECT 
                id,
                hilan_employee_id,
                CAST(date AS INTEGER) / 1000 as unix_date,
                datetime(CAST(date AS INTEGER) / 1000, 'unixepoch') as formatted_date,
                time(CAST(start_time AS INTEGER) / 1000, 'unixepoch') as formatted_start_time,
                time(CAST(end_time AS INTEGER) / 1000, 'unixepoch') as formatted_end_time,
                attendance_type
            FROM hilan_attendance 
            WHERE hilan_employee_id = ? AND CAST(date AS INTEGER) BETWEEN ? AND ?
            ORDER BY date
        `;
        
        console.log('Executing SQL:', sql);
        console.log('Parameters:', [employeeId, dbStartDate, dbEndDate]);
        
        db.all(sql, [employeeId, dbStartDate, dbEndDate], (err, rows) => {
            if (err) {
                console.error('Database error in getHilanAttendance:', err);
                reject(new Error(`Database error: ${err.message}`));
            } else {
                console.log(`Fetched ${rows.length} attendance records`);
                console.log('Fetched records:', rows);
                
                // Convert the dates to a more standard format for the frontend
                const formattedRows = rows.map(row => ({
                    ...row,
                    date: new Date(row.unix_date * 1000).toISOString().split('T')[0],
                    start_time: row.formatted_start_time,
                    end_time: row.formatted_end_time
                }));
                
                resolve({ success: true, attendance: formattedRows });
            }
        });
    });
}

async function loadExcelFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = worksheet.getRow(1).getCell(colNumber).value;
                rowData[header] = cell.value;
            });
            rows.push(rowData);
        }
    });

    console.log('First row from Excel:', rows[0]); // Log the first row
    console.log('Total rows read from Excel:', rows.length);
    
    return rows;
}

async function loadExcelAndUpdateDatabase(filePath, progressCallback) {
    try {
        console.log('Loading Excel file:', filePath);
        const data = await loadExcelFile(filePath);
        console.log('Excel data loaded, rows:', data.length);
        const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
        let tableName;

        if (fileName.includes('sap')) {
            tableName = 'sap_employees';
        } else if (fileName.includes('hilan') && !fileName.includes('interface')) {
            tableName = 'hilan_employees';
        } else if (fileName.includes('attendance')) {
            tableName = 'hilan_attendance';
        } else if (fileName.includes('hilaninterface')) {
            tableName = 'hilan_interface';
        } else {
            throw new Error('Invalid file name. Must contain "sap", "hilan", "attendance", or "hilaninterface".');
        }

        console.log('Determined table name:', tableName);

        if (tableName === 'hilan_interface') {
            await updateHilanInterfaceDatabase(data, progressCallback);
        } else {
            await updateDatabase(data, tableName, progressCallback);
        }
        
        console.log('Database update completed');
        return { success: true, message: `Data loaded successfully into ${tableName}` };
    } catch (error) {
        console.error('Error loading Excel and updating database:', error);
        return { success: false, message: error.message };
    }
}

async function updateDatabase(data, tableName) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const columns = Object.keys(data[0]);
            const placeholders = columns.map(() => '?').join(',');

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO ${tableName} (${columns.join(',')})
                VALUES (${placeholders})
            `);

            data.forEach(row => {
                const values = columns.map(col => row[col]);
                stmt.run(values);
            });

            stmt.finalize();

            db.run('COMMIT', err => {
                if (err) {
                    console.error('Error updating database:', err);
                    db.run('ROLLBACK');
                    reject(err);
                } else {
                    console.log(`Database updated successfully for ${tableName}`);
                    resolve();
                }
            });
        });
    });
}

async function generateReport(dataSource, filters, columns) {
    return new Promise((resolve, reject) => {
        const table = dataSource === 'sap' ? 'sap_employees' : 'hilan_employees';
        let sql = `SELECT ${columns.map(col => {
            if (col.toLowerCase().includes('date')) {
                return `strftime('%Y-%m-%d', ${col}) as ${col}`;
            }
            return col;
        }).join(', ')} FROM ${table}`;
        const whereConditions = [];
        const params = [];

        Object.entries(filters).forEach(([field, { value, operation }]) => {
            if (value && value.length > 0) {
                const placeholders = value.map(() => '?').join(', ');
                if (operation === 'exclude') {
                    whereConditions.push(`${field} NOT IN (${placeholders})`);
                } else {
                    whereConditions.push(`${field} IN (${placeholders})`);
                }
                params.push(...value);
            }
        });

        if (whereConditions.length > 0) {
            sql += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        console.log('SQL Query:', sql);
        console.log('Parameters:', params);

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('SQL Error:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function exportReport(data, format, filePath) {
    try {
        if (format === 'csv') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');
            
            // Add headers
            worksheet.addRow(Object.keys(data[0]));
            
            // Add data
            data.forEach(row => {
                worksheet.addRow(Object.values(row));
            });

            // Write file with UTF-8 BOM
            const buffer = await workbook.csv.writeBuffer();
            fs.writeFileSync(filePath, '\ufeff' + buffer.toString(), { encoding: 'utf8' });
        } else if (format === 'pdf') {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);
            
            doc.pipe(stream);
            
            // Use a Unicode-compatible font
            doc.font('Helvetica');
            
            // Add headers
            const headers = Object.keys(data[0]);
            doc.fontSize(12).text(headers.join(', '), { underline: true });
            doc.moveDown();
            
            // Add data
            doc.fontSize(10);
            data.forEach(row => {
                doc.text(Object.values(row).join(', '));
                doc.moveDown(0.5);
            });
            
            doc.end();
            
            await new Promise((resolve) => stream.on('finish', resolve));
        } else {
            throw new Error('Unsupported export format');
        }

        return filePath;
    } catch (error) {
        console.error('Error exporting report:', error);
        throw error;
    }
}

async function getUniqueColumnValues(dataSource, column) {
    return new Promise((resolve, reject) => {
        const table = dataSource === 'sap' ? 'sap_employees' : 'hilan_employees';
        const sql = `SELECT DISTINCT ${column} FROM ${table} ORDER BY ${column}`;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows.map(row => row[column]));
            }
        });
    });
}

function checkHilanAttendanceRecords() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) as count FROM hilan_attendance`;
        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('Error checking hilan_attendance records:', err);
                reject(err);
            } else {
                console.log(`Total hilan_attendance records: ${row.count}`);
                resolve(row.count);
            }
        });
    });
}

async function loadHilanInterfaceExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                rowData[worksheet.getRow(1).getCell(colNumber).value] = cell.value;
            });
            rows.push(rowData);
        }
    });

    return rows;
}

async function updateHilanInterfaceDatabase(data, progressCallback) {
    console.log('First row to be processed:', data[0]);
    console.log('Total rows to be processed:', data.length);

    const batchSize = 1000;
    const totalBatches = Math.ceil(data.length / batchSize);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const processRow = (row) => {
                return new Promise((rowResolve, rowReject) => {
                    const checkSql = `
                        SELECT id FROM hilan_interface
                        WHERE EventID = ? AND Status = ? AND Date = ? AND EmployeeID = ?
                    `;

                    db.get(checkSql, [row.EventID, row.Status, row.Date, row.EmployeeID], (err, existingRow) => {
                        if (err) {
                            rowReject(err);
                            return;
                        }

                        const sql = existingRow ? `
                            UPDATE hilan_interface SET
                            SendCode = ?, SubEvent = ?, EventName = ?, LastName = ?, 
                            FirstName = ?, CorrectedValue = ?, Error = ?, Note = ?
                            WHERE id = ?
                        ` : `
                            INSERT INTO hilan_interface 
                            (EventID, Status, Date, EmployeeID, SendCode, SubEvent, EventName, LastName, FirstName, CorrectedValue, Error, Note)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        const values = existingRow ?
                            [row.SendCode, row.SubEvent, row.EventName, row.LastName, row.FirstName, 
                             row.CorrectedValue, row.Error, row.Note, existingRow.id] :
                            [row.EventID, row.Status, row.Date, row.EmployeeID, row.SendCode, row.SubEvent, 
                             row.EventName, row.LastName, row.FirstName, row.CorrectedValue, row.Error, row.Note];

                        db.run(sql, values, (err) => {
                            if (err) {
                                console.error('Error processing row:', err, row);
                                rowReject(err);
                            } else {
                                rowResolve();
                            }
                        });
                    });
                });
            };

            const processBatch = async (batch, batchIndex) => {
                for (const row of batch) {
                    await processRow(row);
                }
                if (progressCallback) {
                    progressCallback((batchIndex + 1) / totalBatches);
                }
            };

            const processAllBatches = async () => {
                for (let i = 0; i < totalBatches; i++) {
                    const batch = data.slice(i * batchSize, (i + 1) * batchSize);
                    await processBatch(batch, i);
                }
            };

            processAllBatches()
                .then(() => {
                    db.run('COMMIT', err => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            db.run('ROLLBACK');
                            reject(err);
                        } else {
                            console.log('Hilan Interface database updated successfully');
                            resolve();
                        }
                    });
                })
                .catch(err => {
                    console.error('Error processing batches:', err);
                    db.run('ROLLBACK');
                    reject(err);
                });
        });
    });
}

async function getHilanInterfaceData({ page = 1, pageSize = 100, filters = {} }) {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * pageSize;
        let sql = 'SELECT * FROM hilan_interface';
        let countSql = 'SELECT COUNT(*) as total FROM hilan_interface';
        const whereConditions = [];
        const params = [];

        if (filters.eventId) {
            whereConditions.push('EventID = ?');
            params.push(filters.eventId);
        }
        if (filters.employeeId) {
            whereConditions.push('EmployeeID = ?');
            params.push(filters.employeeId);
        }
        if (filters.status && filters.status !== 'הכל') {
            whereConditions.push('Status = ?');
            params.push(filters.status);
        }
        if (filters.startDate) {
            whereConditions.push('Date >= ?');
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            whereConditions.push('Date <= ?');
            params.push(filters.endDate);
        }

        if (whereConditions.length > 0) {
            const whereClause = whereConditions.join(' AND ');
            sql += ` WHERE ${whereClause}`;
            countSql += ` WHERE ${whereClause}`;
        }

        sql += ' ORDER BY Date DESC LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        console.log('Executing SQL:', sql); // Debug log
        console.log('Parameters:', params); // Debug log

        db.get(countSql, params.slice(0, -2), (err, countRow) => {
            if (err) {
                console.error('Error getting count:', err);
                reject(err);
                return;
            }

            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching data:', err);
                    reject(err);
                } else {
                    console.log('Fetched rows:', rows); // Debug log
                    resolve({
                        data: rows,
                        total: countRow.total,
                        page,
                        pageSize,
                        totalPages: Math.ceil(countRow.total / pageSize)
                    });
                }
            });
        });
    });
}

async function updateHilanInterfaceRecord(id, updatedData) {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE hilan_interface
            SET Status = ?, Note = ?
            WHERE id = ?
        `;
        db.run(sql, [updatedData.Status, updatedData.Note, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

async function compareEmployeeData(employeeId, currentSystem, otherSystem) {
    return new Promise((resolve, reject) => {
        const currentTable = currentSystem === 'sap' ? 'sap_employees' : 'hilan_employees';
        const otherTable = otherSystem === 'sap' ? 'sap_employees' : 'hilan_employees';
        const currentIdField = `${currentSystem}_employee_id`;
        const otherIdField = `${otherSystem}_employee_id`;

        const sql = `
            SELECT * FROM ${otherTable}
            WHERE ${otherIdField} = (
                SELECT ${currentIdField} FROM ${currentTable}
                WHERE ${currentIdField} = ?
            )
        `;

        db.get(sql, [employeeId], (err, row) => {
            if (err) {
                reject(err);
            } else if (!row) {
                reject(new Error(`No matching employee found in ${otherSystem}`));
            } else {
                resolve(row);
            }
        });
    });
}

// Export all the functions
module.exports = {
    createDbConnection,
    searchSAPEmployees,
    searchHilanEmployees,
    getEmployeeDetails,
    loadExcelAndUpdateDatabase,
    getHilanAttendance,
    generateReport,
    exportReport,
    getUniqueColumnValues,
    loadHilanInterfaceExcel,  // Make sure this is included
    updateHilanInterfaceDatabase,
    getHilanInterfaceData,
    updateHilanInterfaceRecord,
    compareEmployeeData
};